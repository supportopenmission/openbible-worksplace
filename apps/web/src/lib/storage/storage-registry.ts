import {
	readStoragePreference,
	rememberStoragePreference,
	resolveStorageKind
} from './environment';
import { open } from '@tauri-apps/plugin-dialog';
import {
	chooseLocalWorkspaceStorage,
	createLocalStorageFromHandle,
	loadLocalWorkspaceHandle,
	queryLocalHandlePermission,
	requestLocalHandlePermission
} from './local-storage';
import { createOpfsStorage, openOpfsLogicalRoot } from './opfs-storage';
import {
	createTauriStorage,
	ensureNativeWorkspace,
	initializeNativeWorkspace,
	readNativeWorkspacePath,
	rememberNativeWorkspacePath
} from './tauri-storage';
import { TauriCommandError } from './tauri-bridge';
import { loadWorkspaceConfig } from './workspace';
import { chooseNativeWorkspace } from './workspace-choice';
import { bindWorkspaceStorage } from './workspace-content-storage';
import {
	attachCatalogMethods,
	capabilitiesForKind,
	readManifest,
	type StorageCapabilities,
	type WorkspaceCatalogEntry
} from './workspace-catalog';
import type { StorageKind, WorkspaceStorage } from './types';

export type StorageCapability = keyof StorageCapabilities;

export class StorageCapabilityError extends Error {
	readonly code = 'CAPABILITY_UNAVAILABLE' as const;
	readonly capability: StorageCapability;
	readonly kind: StorageKind;
	constructor(kind: StorageKind, capability: StorageCapability) {
		super(`Backend ${kind} não suporta ${capability}; estado explícito, sem fallback.`);
		this.name = 'StorageCapabilityError';
		this.capability = capability;
		this.kind = kind;
	}
}

/** Capabilities declaradas por backend; UI e casos de uso não assumem ausência. */
export function getStorageCapabilities(kind: StorageKind): StorageCapabilities {
	return capabilitiesForKind(kind);
}

/** Lança erro explícito quando a capability está ausente; nunca faz fallback. */
export function requireCapability(kind: StorageKind, capability: StorageCapability): void {
	if (!getStorageCapabilities(kind)[capability]) {
		throw new StorageCapabilityError(kind, capability);
	}
}

/** Seleção centralizada de adapter; evita condicionais de plataforma espalhadas. */
export function describeAdapter(kind: StorageKind): {
	kind: StorageKind;
	backend: StorageCapabilities['backend'];
	capabilities: StorageCapabilities;
} {
	const capabilities = getStorageCapabilities(kind);
	return { kind, backend: capabilities.backend, capabilities };
}

function withCatalog(storage: WorkspaceStorage, workspaceId?: string): WorkspaceStorage {
	if (workspaceId) bindWorkspaceStorage(storage, workspaceId);
	attachCatalogMethods(storage);
	const mutable = storage as WorkspaceStorage & { capabilities?: StorageCapabilities };
	if (!mutable.capabilities) {
		mutable.capabilities = getStorageCapabilities(storage.kind);
	}
	return storage;
}

export async function createConfiguredStorage(): Promise<WorkspaceStorage | null> {
	if (resolveStorageKind() === 'native') {
		const record = await ensureNativeWorkspace({ status: 'registered' });
		await initializeNativeWorkspace();
		return withCatalog(
			createTauriStorage({ workspaceId: record.workspaceId, label: record.name }),
			record.workspaceId
		);
	}
	if (resolveStorageKind() === 'opfs') return withCatalog(await createOpfsStorage());

	const handle = await loadLocalWorkspaceHandle();
	if (handle) return withCatalog(createLocalStorageFromHandle(handle));
	if (readStoragePreference() !== 'opfs') return null;

	const storage = await createOpfsStorage();
	return (await loadWorkspaceConfig(storage)) ? withCatalog(storage) : null;
}

export async function chooseWorkspaceStorage(
	kind: ReturnType<typeof resolveStorageKind> = resolveStorageKind()
): Promise<WorkspaceStorage> {
	if (kind === 'native') {
		requireCapability('native', 'selectFolder');
		const path = await open({ directory: true, multiple: false });
		if (typeof path !== 'string') {
			throw new DOMException('A seleção da pasta foi cancelada.', 'AbortError');
		}
		const choice = chooseNativeWorkspace(path);
		await initializeNativeWorkspace({ path: choice.path });
		rememberNativeWorkspacePath(choice.path);
		return withCatalog(createTauriStorage());
	}
	if (kind === 'opfs') {
		requireCapability('opfs', 'createLogicalRoot');
		return withCatalog(await createOpfsStorage());
	}
	requireCapability('local', 'selectFolder');
	const storage = await chooseLocalWorkspaceStorage();
	rememberStoragePreference('local');
	return withCatalog(storage);
}

export async function chooseBrowserWorkspaceStorage(): Promise<WorkspaceStorage> {
	requireCapability('opfs', 'createLogicalRoot');
	const storage = await createOpfsStorage();
	rememberStoragePreference('opfs');
	return withCatalog(storage);
}

/** Reconexão explícita: exige capability; ausência vira erro, não fallback. */
export async function reconnectWorkspaceStorage(
	storage: WorkspaceStorage
): Promise<WorkspaceStorage> {
	requireCapability(storage.kind, 'reconnect');
	if (storage.kind === 'native') {
		const record = await ensureNativeWorkspace({
			workspaceId: storage.workspaceId,
			name: storage.label,
			status: 'ready'
		});
		await initializeNativeWorkspace();
		return withCatalog(
			createTauriStorage({ workspaceId: record.workspaceId, label: record.name }),
			record.workspaceId
		);
	}
	const handle = await loadLocalWorkspaceHandle();
	if (!handle) throw new StorageCapabilityError('local', 'reconnect');
	return withCatalog(createLocalStorageFromHandle(handle));
}

export type WorkspaceOpenFailureReason =
	| 'permission'
	| 'missing'
	| 'locked'
	| 'invalid'
	| 'needs-reconnect'
	| 'schema-unavailable'
	| 'migration'
	| 'persistence-unavailable';

export type WorkspaceOpenReasonCode =
	| 'PERMISSION_REQUIRED'
	| 'WORKSPACE_MISSING'
	| 'WORKSPACE_LOCKED'
	| 'SCHEMA_UNAVAILABLE'
	| 'MIGRATION_REQUIRED'
	| 'PERSISTENCE_UNAVAILABLE'
	| 'RECONNECT_REQUIRED';

function reasonCodeFor(code: WorkspaceOpenFailureReason): WorkspaceOpenReasonCode {
	switch (code) {
		case 'permission':
			return 'PERMISSION_REQUIRED';
		case 'missing':
			return 'WORKSPACE_MISSING';
		case 'locked':
			return 'WORKSPACE_LOCKED';
		case 'needs-reconnect':
			return 'RECONNECT_REQUIRED';
		case 'invalid':
			return 'SCHEMA_UNAVAILABLE';
		case 'schema-unavailable':
			return 'SCHEMA_UNAVAILABLE';
		case 'migration':
			return 'MIGRATION_REQUIRED';
		case 'persistence-unavailable':
			return 'PERSISTENCE_UNAVAILABLE';
	}
}

/** Falha recuperável ao montar a raiz de uma entrada do catálogo. */
export class WorkspaceOpenError extends Error {
	readonly code: WorkspaceOpenFailureReason;
	readonly reasonCode: WorkspaceOpenReasonCode;
	readonly recoverable = true as const;
	readonly workspaceId: string;
	constructor(
		workspaceId: string,
		code: WorkspaceOpenFailureReason,
		message: string,
		reasonCode = reasonCodeFor(code)
	) {
		super(message);
		this.name = 'WorkspaceOpenError';
		this.workspaceId = workspaceId;
		this.code = code;
		this.reasonCode = reasonCode;
	}
}

function isDirectoryHandle(value: unknown): value is FileSystemDirectoryHandle {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { getDirectoryHandle?: unknown }).getDirectoryHandle === 'function'
	);
}

/**
 * Monta o storage da entrada do catálogo a partir da referência local
 * (caminho nativo, handle autorizado ou ref OPFS). Nunca troca
 * silenciosamente de raiz: referência ausente, permissão revogada, pasta
 * movida, lock ou manifesto inválido viram erro tipado com a causa, e o
 * registro é sempre preservado para recuperação.
 */
export async function openWorkspaceStorage(
	entry: WorkspaceCatalogEntry,
	options: { requestPermission?: boolean } = {}
): Promise<WorkspaceStorage> {
	const { workspaceId, storageKind } = entry;

	if (storageKind === 'native') {
		try {
			const record = await ensureNativeWorkspace({
				workspaceId,
				status: 'registered',
				createIfMissing: false
			});
			if (record.workspaceId !== workspaceId) {
				throw new WorkspaceOpenError(
					workspaceId,
					'invalid',
					'O registro nativo ativo não corresponde ao workspace solicitado.'
				);
			}
			await initializeNativeWorkspace();
			return withCatalog(
				createTauriStorage({ workspaceId: record.workspaceId, label: record.name }),
				workspaceId
			);
		} catch (error) {
			if (
				error instanceof TauriCommandError &&
				(error.code === 'database_unavailable' ||
					error.code === 'sqlite_invalid' ||
					error.code === 'persistence_conflict')
			) {
				throw new WorkspaceOpenError(
					workspaceId,
					'persistence-unavailable',
					'O banco local não está disponível. Tente novamente para recuperar o workspace.'
				);
			}
			if (error instanceof TauriCommandError && error.code === 'workspace_locked') {
				throw new WorkspaceOpenError(
					workspaceId,
					'locked',
					'A raiz está aberta em outra janela. Feche-a lá ou escolha outro workspace.'
				);
			}
			if (error instanceof TauriCommandError && error.code === 'permission_denied') {
				throw new WorkspaceOpenError(
					workspaceId,
					'permission',
					'Sem permissão para abrir a pasta do workspace.'
				);
			}
			if (error instanceof WorkspaceOpenError) throw error;
			throw new WorkspaceOpenError(
				workspaceId,
				'persistence-unavailable',
				'O banco local não está disponível. Tente novamente para recuperar o workspace.'
			);
		}
	}

	if (storageKind === 'opfs') {
		if (typeof entry.localRef === 'string') {
			let storage: WorkspaceStorage;
			try {
				storage = withCatalog(await openOpfsLogicalRoot(entry.localRef), entry.workspaceId);
			} catch {
				throw new WorkspaceOpenError(
					workspaceId,
					'missing',
					'A raiz lógica não foi encontrada neste navegador. O cadastro foi preservado.'
				);
			}
			const manifest = await readManifest(storage).catch(() => null);
			if (!manifest || manifest.workspaceId !== workspaceId) {
				throw new WorkspaceOpenError(
					workspaceId,
					'invalid',
					'A raiz lógica está sem manifesto válido. Nada foi sobrescrito.'
				);
			}
			return storage;
		}
		const storage = withCatalog(await createOpfsStorage(), entry.workspaceId);
		const manifest = await readManifest(storage).catch(() => null);
		if (!manifest) {
			throw new WorkspaceOpenError(
				workspaceId,
				'missing',
				'O armazenamento do navegador está vazio ou foi limpo. O cadastro foi preservado.'
			);
		}
		if (manifest.workspaceId !== workspaceId) {
			throw new WorkspaceOpenError(
				workspaceId,
				'invalid',
				`A raiz atual pertence a outro workspace (“${manifest.name}”). Nada foi sobrescrito.`
			);
		}
		return storage;
	}

	const handle = isDirectoryHandle(entry.localRef)
		? entry.localRef
		: await loadLocalWorkspaceHandle(workspaceId).catch(() => null);
	if (!handle) {
		throw new WorkspaceOpenError(
			workspaceId,
			'needs-reconnect',
			'Sem autorização guardada para a pasta. Autorize de novo ou localize a raiz.'
		);
	}
	let permission = await queryLocalHandlePermission(handle).catch(() => 'prompt' as const);
	if (permission === 'prompt' && options.requestPermission) {
		permission = await requestLocalHandlePermission(handle);
	}
	if (permission === 'denied' || permission === 'prompt') {
		throw new WorkspaceOpenError(
			workspaceId,
			'permission',
			'O navegador revogou o acesso à pasta. Permita de novo para continuar.'
		);
	}
	const storage = withCatalog(createLocalStorageFromHandle(handle), entry.workspaceId);
	const manifest = await readManifest(storage).catch(() => null);
	if (!manifest) {
		throw new WorkspaceOpenError(
			workspaceId,
			'invalid',
			'A pasta não tem um manifesto válido (.openbible/config.json v2). Nada foi sobrescrito.'
		);
	}
	if (manifest.workspaceId !== workspaceId) {
		throw new WorkspaceOpenError(
			workspaceId,
			'needs-reconnect',
			`A pasta autorizada pertence a outro workspace (“${manifest.name}”). Localize a raiz certa.`
		);
	}
	return storage;
}
