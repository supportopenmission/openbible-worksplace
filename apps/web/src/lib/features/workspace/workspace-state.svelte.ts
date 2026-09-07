import { getContext, setContext } from 'svelte';
import { applyTheme } from '$lib/theme/theme';
import {
	chooseWorkspaceStorage,
	openWorkspaceStorage,
	WorkspaceOpenError
} from '$lib/storage/storage-registry';
import { requestPersistentStorage } from '$lib/storage/persistent-storage';
import {
	DEFAULT_PREFERENCES,
	loadWorkspacePreferences,
	patchWorkspacePreferences,
	writeCachedPreferences
} from '$lib/storage/preferences';
import { bootstrapWorkspace } from '$lib/storage/session';
import {
	getActiveWorkspace,
	getCatalogEntry,
	migrateLegacyWorkspace,
	touchLastOpened
} from '$lib/storage/workspace-catalog';
import {
	AutosaveFailedError,
	getWorkspaceLifecycle,
	type FlushHandler,
	type SwitchResult
} from '$lib/storage/workspace-lifecycle';
import type {
	WorkspaceConfig,
	WorkspacePermission,
	WorkspacePreferences,
	WorkspaceSnapshot,
	WorkspaceStatus,
	WorkspaceStorage
} from '$lib/storage/types';
import type { WorkspaceCatalogEntry } from '$lib/storage/workspace-catalog';
import type { WorkspaceOpenFailureReason } from '$lib/storage/storage-registry';
import { loadWorkspaceConfig, prepareWorkspace } from '$lib/storage/workspace';
import { bindWorkspaceStorage } from '$lib/storage/workspace-content-storage';

export type WorkspaceUiStatus = 'loading' | WorkspaceStatus;

const WORKSPACE_KEY = Symbol.for('openbible-workspace');

export interface WorkspaceActivatedDetail {
	workspaceId: string;
	generation: number;
}

export interface WorkspaceDataContext {
	workspaceId: string;
	generation: number;
	backend: 'sqlite' | 'indexeddb';
}

/**
 * Reinicializa caches consumidores pelo ID/geração ativos.
 * Prefere o evento tipado `WorkspaceActivated` a resets manuais duplicados;
 * cada consumidor resolve a raiz pelo contexto ativo, nunca por singleton.
 * A importação é tardia para evitar custo no boot quando não há troca.
 */
export async function resetWorkspaceConsumers(): Promise<void> {
	try {
		const { resetMemoryNoteVerseIndex } = await import('$lib/features/notes/note-verse-index');
		resetMemoryNoteVerseIndex();
	} catch {
		// Reset é melhor esforço; a fonte permanece na raiz ativa.
	}
}

function publishWorkspaceActivation(detail: WorkspaceActivatedDetail): void {
	try {
		window.dispatchEvent(new CustomEvent('openbible:workspace-activated', { detail }));
	} catch {
		// Ambiente sem window (testes node) mantém o contrato sem evento.
	}
}

/**
 * Assina ativações com guarda de geração: resultados stale são ignorados
 * sem tocar o estado do consumidor.
 */
export function onWorkspaceActivated(
	handler: (detail: WorkspaceActivatedDetail) => void
): () => void {
	let seenGeneration = -1;
	const listener = (event: Event) => {
		const detail = (event as CustomEvent<WorkspaceActivatedDetail>).detail;
		if (!detail || typeof detail.workspaceId !== 'string') return;
		if (detail.generation <= seenGeneration) return;
		seenGeneration = detail.generation;
		handler(detail);
	};
	try {
		window.addEventListener('openbible:workspace-activated', listener);
	} catch {
		// Sem window (testes node): sem assinatura, sem erro.
	}
	return () => {
		try {
			window.removeEventListener('openbible:workspace-activated', listener);
		} catch {
			// Ignora teardown sem window.
		}
	};
}

export class WorkspaceState {
	status = $state<WorkspaceUiStatus>('loading');
	storage = $state<WorkspaceStorage | null>(null);
	config = $state<WorkspaceConfig | null>(null);
	preferences = $state<WorkspacePreferences>(DEFAULT_PREFERENCES);
	persisted = $state<boolean | null>(null);
	permission = $state<WorkspacePermission | null>(null);
	error = $state('');
	private bootFlight: Promise<void> | null = null;
	/** Causa de indisponibilidade da entrada ativa no boot (AC-007); sem fallback silencioso. */
	recoveryReason = $state<WorkspaceOpenFailureReason | null>(null);
	recoveryWorkspaceId = $state<string | null>(null);
	recoveryWorkspaceName = $state<string | null>(null);

	get showShell() {
		return this.status === 'ready';
	}

	/** Identidade ativa por janela; toda operação resolve por este ID (PR-003). */
	get workspaceId(): string | null {
		return getActiveWorkspace().workspaceId;
	}

	/** Geração monotônica; invalida operações assíncronas antigas (PR-007). */
	get generation(): number {
		return getActiveWorkspace().generation;
	}

	/** Contexto mínimo obrigatório para repositórios e consumidores de dados. */
	get dataContext(): WorkspaceDataContext | null {
		const workspaceId = this.workspaceId;
		const entry = workspaceId ? getCatalogEntry(workspaceId) : null;
		if (!workspaceId || !entry) return null;
		return { workspaceId, generation: this.generation, backend: entry.backend };
	}

	requireDataContext(): WorkspaceDataContext {
		const context = this.dataContext;
		if (!context) throw new Error('workspace_id_required');
		return context;
	}

	/** Editores/índices registram flushes para a barreira de autosave (PR-006). */
	registerFlushHandler(handler: FlushHandler): () => void {
		return getWorkspaceLifecycle().registerFlushHandler(handler);
	}

	/**
	 * Troca segura: conclui autosave antes de abrir o destino; falha mantém
	 * o ativo anterior com retry/descarte explícito. Emite `WorkspaceActivated`.
	 */
	async flushAndSwitch(
		targetWorkspaceId: string,
		options: { discard?: boolean } = {}
	): Promise<SwitchResult> {
		const entry = getCatalogEntry(targetWorkspaceId);
		if (entry) return this.activateEntry(entry, options);
		const result = await getWorkspaceLifecycle().flushAndSwitch(targetWorkspaceId, options);
		// Isolamento: nenhum dado do workspace anterior reaparece no destino.
		await resetWorkspaceConsumers();
		publishWorkspaceActivation(result);
		return result;
	}

	async retrySwitch(targetWorkspaceId: string): Promise<SwitchResult> {
		return this.flushAndSwitch(targetWorkspaceId);
	}

	async discardAndSwitch(targetWorkspaceId: string): Promise<SwitchResult> {
		return this.flushAndSwitch(targetWorkspaceId, { discard: true });
	}

	/**
	 * Ativação completa de uma entrada do catálogo: barreira de autosave,
	 * montagem da raiz de destino e troca de ponteiro+storage juntos. Falha
	 * em qualquer etapa mantém o contexto anterior e relata a causa sem
	 * fallback silencioso.
	 */
	async activateEntry(
		entry: WorkspaceCatalogEntry,
		options: { discard?: boolean } = {}
	): Promise<SwitchResult> {
		const lifecycle = getWorkspaceLifecycle();
		const previousActive = getActiveWorkspace().workspaceId;
		const baseGeneration = getActiveWorkspace().generation;
		if (!options.discard) {
			try {
				await lifecycle.flushActive();
			} catch (error) {
				throw new AutosaveFailedError(previousActive, error);
			}
		}
		// A ativação vem de uma ação explícita da pessoa (seletor/gestão), então
		// a API de pasta pode solicitar novamente a permissão durante o gesto.
		const storage = await openWorkspaceStorage(entry, { requestPermission: true });
		// Carrega e valida toda a configuração antes de mover o ponteiro. Assim,
		// uma falha de leitura não deixa a janela apontando para uma raiz que o
		// estado reativo ainda não conseguiu montar.
		const configured = await this.readConfiguredStorage(storage, entry.workspaceId);
		const result = lifecycle.commitActivation(entry.workspaceId, baseGeneration);
		this.applyConfiguredStorage(storage, configured);
		await resetWorkspaceConsumers();
		publishWorkspaceActivation(result);
		touchLastOpened(entry.workspaceId);
		return result;
	}

	apply(snapshot: WorkspaceSnapshot) {
		this.status = snapshot.status;
		this.storage = snapshot.storage;
		this.config = snapshot.config;
		this.preferences = snapshot.preferences;
		this.persisted = snapshot.persisted;
		this.permission = snapshot.permission;
		this.error = snapshot.error;
		applyTheme(snapshot.preferences.theme);
	}

	async boot(options: { requestPermission?: boolean; requestPersist?: boolean } = {}) {
		if (this.bootFlight) return this.bootFlight;
		if (this.status === 'ready' && !options.requestPermission) return;
		this.bootFlight = this.runBoot(options);
		try {
			await this.bootFlight;
		} finally {
			this.bootFlight = null;
		}
	}

	private async runBoot(options: { requestPermission?: boolean; requestPersist?: boolean }) {
		this.error = '';
		this.recoveryReason = null;
		this.recoveryWorkspaceId = null;
		this.recoveryWorkspaceName = null;
		const activeId = getActiveWorkspace().workspaceId;
		const entry = activeId ? getCatalogEntry(activeId) : null;
		if (entry) {
			try {
				const storage = await openWorkspaceStorage(entry, {
					requestPermission: options.requestPermission
				});
				const configured = await this.readConfiguredStorage(storage, entry.workspaceId);
				this.applyConfiguredStorage(storage, configured);
				touchLastOpened(entry.workspaceId);
			} catch (error) {
				this.applyOpenFailure(entry, error);
			}
			return;
		}

		// Sem ponteiro/catalog entry, abre o armazenamento legado uma vez e o
		// promove imediatamente para o catálogo. Assim a primeira raiz também
		// passa a ser a fonte usada na próxima recarga completa da página.
		const snapshot = await bootstrapWorkspace({
			requestPermission: options.requestPermission,
			requestPersist: options.requestPersist ?? true
		});
		if (snapshot.status === 'ready' && snapshot.storage) {
			const previousId = getActiveWorkspace().workspaceId;
			let migration: Awaited<ReturnType<typeof migrateLegacyWorkspace>>;
			try {
				migration = await migrateLegacyWorkspace(snapshot.storage);
			} catch (error) {
				this.applyMigrationFailure(snapshot, error);
				return;
			}
			if (migration) bindWorkspaceStorage(snapshot.storage, migration.manifest.workspaceId);
			this.apply(snapshot);
			if (migration) {
				touchLastOpened(migration.manifest.workspaceId);
				if (previousId !== migration.manifest.workspaceId) {
					await resetWorkspaceConsumers();
					publishWorkspaceActivation({
						workspaceId: migration.manifest.workspaceId,
						generation: getActiveWorkspace().generation
					});
				}
			}
			return;
		}
		if (snapshot.status === 'permission-needed') {
			this.apply(snapshot);
			return;
		}
		this.apply(snapshot);
	}

	async grantPermission() {
		await this.boot({ requestPermission: true, requestPersist: true });
		if (this.status === 'permission-needed') {
			this.error = 'A permissão continua necessária para abrir a pasta escolhida.';
		}
	}

	async persistOrigin() {
		this.persisted = await requestPersistentStorage();
	}

	async reconnectFolder() {
		const storage = await chooseWorkspaceStorage(this.storage?.kind);
		await prepareWorkspace(storage);
		await this.markConfigured(storage);
	}

	async markConfigured(storage: WorkspaceStorage) {
		const previousId = getActiveWorkspace().workspaceId;
		const migration = await migrateLegacyWorkspace(storage);
		if (migration) bindWorkspaceStorage(storage, migration.manifest.workspaceId);
		const configured = await this.readConfiguredStorage(storage, migration?.manifest.workspaceId);
		this.applyConfiguredStorage(storage, configured);
		if (migration) {
			touchLastOpened(migration.manifest.workspaceId);
			const active = getActiveWorkspace();
			if (previousId !== active.workspaceId) {
				await resetWorkspaceConsumers();
				publishWorkspaceActivation({
					workspaceId: active.workspaceId ?? migration.manifest.workspaceId,
					generation: active.generation
				});
			}
		}
	}

	private applyOpenFailure(entry: WorkspaceCatalogEntry, error: unknown): void {
		this.storage = null;
		this.config = null;
		this.status = 'unconfigured';
		this.permission = null;
		this.persisted = null;
		this.error = '';
		if (error instanceof WorkspaceOpenError) {
			this.recoveryReason = error.code;
			this.recoveryWorkspaceId = entry.workspaceId;
			this.recoveryWorkspaceName = entry.nameCache;
		} else {
			this.recoveryReason = null;
			this.recoveryWorkspaceId = null;
			this.recoveryWorkspaceName = null;
			this.error = error instanceof Error ? error.message : 'Não foi possível abrir o workspace.';
		}
	}

	private applyMigrationFailure(snapshot: WorkspaceSnapshot, error: unknown): void {
		this.apply({
			...snapshot,
			status: 'unconfigured',
			storage: null,
			config: null,
			error: ''
		});
		this.recoveryReason = 'migration';
		this.recoveryWorkspaceId = null;
		this.recoveryWorkspaceName = snapshot.config?.label ?? snapshot.storage?.label ?? null;
		this.error =
			error instanceof Error
				? error.message
				: 'A migração do workspace precisa ser retomada. A fonte original foi preservada.';
	}

	private async readConfiguredStorage(
		storage: WorkspaceStorage,
		expectedWorkspaceId?: string
	): Promise<{
		config: WorkspaceConfig | null;
		preferences: WorkspacePreferences;
		persisted: boolean;
	}> {
		const config = await loadWorkspaceConfig(storage);
		if (expectedWorkspaceId && !config) {
			throw new WorkspaceOpenError(
				expectedWorkspaceId,
				'invalid',
				'O workspace não possui uma configuração válida para esta raiz.'
			);
		}
		return {
			config,
			preferences: await loadWorkspacePreferences(storage),
			persisted: await requestPersistentStorage()
		};
	}

	private applyConfiguredStorage(
		storage: WorkspaceStorage,
		configured: {
			config: WorkspaceConfig | null;
			preferences: WorkspacePreferences;
			persisted: boolean;
		}
	): void {
		this.storage = storage;
		this.config = configured.config;
		this.preferences = configured.preferences;
		this.status = this.config ? 'ready' : 'unconfigured';
		this.permission = 'granted';
		this.error = '';
		applyTheme(this.preferences.theme);
		this.persisted = configured.persisted;
	}

	async updatePreferences(
		patch: Partial<Omit<WorkspacePreferences, 'version'>>
	): Promise<WorkspacePreferences> {
		const next =
			this.storage && this.status === 'ready'
				? await patchWorkspacePreferences(this.storage, patch)
				: { ...this.preferences, ...patch, version: 1 as const };

		if (!(this.storage && this.status === 'ready')) writeCachedPreferences(next);

		this.preferences = next;
		if (patch.theme) {
			applyTheme(next.theme);
			window.dispatchEvent(new CustomEvent('openbible:theme-changed', { detail: next.theme }));
		}
		if ('initialRoute' in patch) {
			window.dispatchEvent(
				new CustomEvent('openbible:home-route-changed', { detail: next.initialRoute })
			);
		}
		return next;
	}
}

export function setWorkspaceState(state: WorkspaceState): WorkspaceState {
	return setContext(WORKSPACE_KEY, state);
}

export function getWorkspaceState(): WorkspaceState | null {
	return getContext(WORKSPACE_KEY) ?? null;
}
