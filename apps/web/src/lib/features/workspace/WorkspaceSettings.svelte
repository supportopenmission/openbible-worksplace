<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { detectStorageKind } from '$lib/storage/environment';
	import { saveLocalWorkspaceHandle } from '$lib/storage/local-storage';
	import {
		chooseWorkspaceStorage,
		openWorkspaceStorage,
		WorkspaceOpenError
	} from '$lib/storage/storage-registry';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import {
		rebuildWorkspaceIndex,
		WorkspaceIndexRebuildCancelledError
	} from '$lib/features/notes/index-rebuilder';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import {
		addExistingWorkspaceEntry,
		deleteManagedRootEntry,
		getActiveWorkspace,
		listCatalog,
		previewDeleteGuards,
		readManifest,
		removeWorkspaceEntry,
		restoreCatalogEntry,
		markCatalogEntryDetached,
		renameWorkspaceEntry,
		storageBackendLabel,
		storageKindLabel,
		touchLastOpened,
		upsertCatalogEntry,
		type DeleteGuardPreview,
		type WorkspaceCatalogEntry,
		type WorkspaceCatalogStatus,
		WorkspaceDeleteBlockedError
	} from '$lib/storage/workspace-catalog';
	import { getWorkspaceLifecycle } from '$lib/storage/workspace-lifecycle';
	import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';
	import { getWorkspaceState } from './workspace-state.svelte';

	const workspace = getWorkspaceState();
	const isMobile = new IsMobile();

	type WorkspaceSettingsView = 'storage' | 'workspaces';
	const {
		embedded = false,
		view = 'storage'
	}: { embedded?: boolean; view?: WorkspaceSettingsView } = $props();

	let busy = $state(false);
	let indexRebuilding = $state(false);
	let indexProgress = $state(0);
	let indexVersion = $state<number | null>(null);
	let indexMessage = $state('');
	let indexError = $state('');
	let indexController: AbortController | null = null;

	// Gestão de múltiplos workspaces (catálogo local; T022 promove as
	// confirmações para Dialog/AlertDialog e adiciona a exclusão fail-closed).
	let catalogEntries = $state<WorkspaceCatalogEntry[]>([]);
	let detachedCatalogEntries = $state<WorkspaceCatalogEntry[]>([]);
	let catalogActiveId = $state<string | null>(null);
	let catalogLoading = $state(true);
	let renameId = $state<string | null>(null);
	let renameValue = $state('');
	let renameError = $state('');
	let renameSaving = $state(false);
	let removeTarget = $state<WorkspaceCatalogEntry | null>(null);
	let removeBusy = $state(false);
	// Confirmação destrutiva (T022): dialogs distintos para remover e excluir.
	let deleteTarget = $state<WorkspaceCatalogEntry | null>(null);
	let deleteStorage = $state<WorkspaceStorage | null>(null);
	let deletePreview = $state<DeleteGuardPreview | null>(null);
	let deleteLoading = $state(false);
	let deleteConfirmName = $state('');
	let deleteBusy = $state(false);
	let deleteError = $state('');
	let manageBusy = $state(false);
	let manageMessage = $state('');
	let manageError = $state('');
	let collision = $state<{
		entryId: string;
		entryName: string;
		foundId: string;
		foundName: string;
		storage: WorkspaceStorage;
	} | null>(null);
	let vaultHeading = $state<HTMLHeadingElement | null>(null);

	function refreshCatalog() {
		try {
			const entries = listCatalog({ includeDetached: true });
			catalogEntries = entries.filter((entry) => entry.status !== 'detached');
			detachedCatalogEntries = entries.filter((entry) => entry.status === 'detached');
			catalogActiveId = getActiveWorkspace().workspaceId;
		} catch {
			catalogEntries = [];
		} finally {
			catalogLoading = false;
		}
	}

	function kindLabel(kind: StorageKind): string {
		return kind === 'native' ? 'Computador' : kind === 'local' ? 'Pasta escolhida' : 'Navegador';
	}

	function storageLocationLabel(kind: StorageKind): string {
		return kind === 'native'
			? 'Pasta do OpenBible no computador'
			: kind === 'local'
				? 'Pasta escolhida neste dispositivo'
				: 'Armazenamento interno do navegador';
	}

	function catalogStatusLabel(status: WorkspaceCatalogStatus): string {
		return {
			registered: 'preparado',
			opening: 'abrindo',
			ready: 'disponível',
			'permission-needed': 'aguarda permissão',
			unavailable: 'indisponível',
			locked: 'em uso em outra janela',
			invalid: 'precisa ser verificado',
			detached: 'fora da lista'
		}[status];
	}

	function lastOpenedLabel(value: string | null): string {
		if (!value) return 'ainda não aberto';
		try {
			return new Intl.DateTimeFormat('pt-BR', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(value));
		} catch {
			return value;
		}
	}

	function focusVaultHeading() {
		try {
			vaultHeading?.focus({ preventScroll: false });
		} catch {
			// Foco é melhor esforço; o anúncio live já comunica o resultado.
		}
	}

	function startRename(entry: WorkspaceCatalogEntry) {
		renameId = entry.workspaceId;
		renameValue = entry.nameCache;
		renameError = '';
	}

	function cancelRename() {
		renameId = null;
		renameValue = '';
		renameError = '';
	}

	async function saveRename(entry: WorkspaceCatalogEntry) {
		const trimmed = renameValue.trim();
		if (!trimmed) {
			renameError = 'Dê um nome ao espaço de estudo para salvar.';
			return;
		}
		const storage = workspace?.storage;
		if (!storage || entry.workspaceId !== catalogActiveId) {
			renameError = 'Abra este espaço de estudo para renomeá-lo.';
			return;
		}
		renameSaving = true;
		renameError = '';
		try {
			await renameWorkspaceEntry(storage, entry.workspaceId, trimmed);
			refreshCatalog();
			renameId = null;
			manageError = '';
			manageMessage = `Espaço de estudo renomeado para “${trimmed}”. A pasta não mudou.`;
			focusVaultHeading();
		} catch {
			renameError = 'Não foi possível salvar o nome. Tente novamente.';
		} finally {
			renameSaving = false;
		}
	}

	async function activateEntry(entry: WorkspaceCatalogEntry) {
		if (entry.workspaceId === catalogActiveId || manageBusy) return;
		manageBusy = true;
		manageError = '';
		try {
			if (workspace) await workspace.activateEntry(entry);
			else await getWorkspaceLifecycle().flushAndSwitch(entry.workspaceId);
			refreshCatalog();
			manageMessage = `Espaço de estudo “${entry.nameCache}” aberto.`;
			focusVaultHeading();
		} catch (failure) {
			const code =
				failure instanceof Error && 'code' in failure
					? String((failure as { code?: unknown }).code)
					: '';
			manageError =
				code === 'AUTOSAVE_FAILED'
					? 'Há alterações não salvas no espaço atual. Tente novamente ou descarte para trocar.'
					: code === 'permission' || code === 'needs-reconnect'
						? 'A pasta precisa ser localizada novamente. Use Localizar novamente para apontar a pasta certa.'
						: code === 'missing' || code === 'invalid' || code === 'locked'
							? 'Não foi possível abrir a pasta. O cadastro foi preservado.'
							: 'Não foi possível abrir o espaço de estudo. Se a pasta mudou de lugar, use Localizar novamente.';
		} finally {
			manageBusy = false;
		}
	}

	async function confirmRemove(entry: WorkspaceCatalogEntry) {
		removeBusy = true;
		manageError = '';
		try {
			const storage = workspace?.storage;
			const wasActive = entry.workspaceId === catalogActiveId;
			if (storage && wasActive) {
				await removeWorkspaceEntry(storage, entry.workspaceId);
			} else {
				markCatalogEntryDetached(entry.workspaceId);
			}
			removeTarget = null;
			if (wasActive && workspace) {
				workspace.storage = null;
				workspace.config = null;
				workspace.status = 'unconfigured';
				workspace.error = '';
			}
			refreshCatalog();
			const remaining = listCatalog();
			manageMessage =
				remaining.length === 0
					? `“${entry.nameCache}” saiu da lista; os arquivos permanecem na pasta. Crie ou adicione um espaço de estudo pelo seletor para continuar.`
					: `“${entry.nameCache}” saiu da lista; nenhum arquivo foi apagado e a pasta pode ser adicionada de novo.`;
			focusVaultHeading();
		} catch {
			manageError = 'Não foi possível remover da lista. Tente novamente.';
		} finally {
			removeBusy = false;
		}
	}

	function restoreEntry(entry: WorkspaceCatalogEntry) {
		if (manageBusy) return;
		const restored = restoreCatalogEntry(entry.workspaceId);
		if (!restored) {
			manageError = 'Não foi possível restaurar o espaço de estudo. Tente novamente.';
			return;
		}
		refreshCatalog();
		manageError = '';
		manageMessage = `“${restored.nameCache}” voltou à lista. Abra-o para verificar a pasta, se necessário.`;
		focusVaultHeading();
	}

	function openDeleteDialog(entry: WorkspaceCatalogEntry) {
		deleteTarget = entry;
		deleteStorage = null;
		deletePreview = null;
		deleteConfirmName = '';
		deleteError = '';
		deleteLoading = true;
		void resolveDeleteTarget(entry);
	}

	async function resolveDeleteTarget(entry: WorkspaceCatalogEntry) {
		try {
			let storage = workspace?.storage ?? null;
			if (!storage || entry.workspaceId !== catalogActiveId) {
				storage = await openWorkspaceStorage(entry);
			}
			if (!storage) throw new Error('storage_unavailable');
			deleteStorage = storage;
			deletePreview = await previewDeleteGuards(storage, entry.workspaceId);
		} catch (failure) {
			if (failure instanceof WorkspaceOpenError) {
				deletePreview = null;
				deleteError =
					failure.code === 'locked'
						? 'A pasta está sendo usada em outra janela. Feche-a para verificar a exclusão.'
						: failure.code === 'permission' || failure.code === 'needs-reconnect'
							? 'Sem acesso à pasta para verificar a exclusão. Localize-a novamente antes de excluir.'
							: 'A pasta está ausente ou não foi preparada pelo OpenBible; nada pode ser verificado nem apagado aqui.';
			} else {
				deleteError = 'Não foi possível verificar a pasta. Tente novamente.';
			}
		} finally {
			deleteLoading = false;
		}
	}

	async function confirmDelete() {
		if (!deleteTarget || !deleteStorage || deleteBusy) return;
		deleteBusy = true;
		deleteError = '';
		try {
			const wasActive = deleteTarget.workspaceId === catalogActiveId;
			const deletedName = deleteTarget.nameCache;
			await deleteManagedRootEntry(deleteStorage, deleteTarget.workspaceId);
			deleteTarget = null;
			refreshCatalog();
			const remaining = listCatalog();
			if (!wasActive || remaining.length === 0) {
				if (wasActive && workspace) {
					workspace.storage = null;
					workspace.config = null;
					workspace.status = 'unconfigured';
					workspace.error = '';
				}
				manageMessage =
					remaining.length === 0
						? `“${deletedName}” foi excluído com a pasta. Crie ou adicione um espaço de estudo pelo seletor para continuar.`
						: `“${deletedName}” foi excluído com a pasta, sem tocar nos outros espaços de estudo.`;
			} else if (workspace) {
				try {
					await workspace.activateEntry(remaining[0]);
					manageMessage = `“${deletedName}” foi excluído; “${remaining[0].nameCache}” está aberto.`;
				} catch {
					manageMessage = `“${deletedName}” foi excluído. Abra outro espaço de estudo na lista para continuar.`;
				}
				refreshCatalog();
			}
			focusVaultHeading();
		} catch (failure) {
			if (failure instanceof WorkspaceDeleteBlockedError) {
				deleteError =
					failure.reason === 'persistence_conflict'
						? failure.message
						: `${failure.message} Nenhuma opção de forçar está disponível.`;
			} else {
				deleteError =
					'A exclusão falhou no meio do caminho. Verifique a pasta antes de tentar de novo.';
			}
		} finally {
			deleteBusy = false;
		}
	}

	async function relocateEntry(entry: WorkspaceCatalogEntry) {
		if (manageBusy) return;
		manageBusy = true;
		manageError = '';
		manageMessage = '';
		try {
			const picked = await chooseWorkspaceStorage(entry.storageKind);
			const manifest = await readManifest(picked);
			if (!manifest) {
				manageError =
					'A pasta escolhida não está preparada para o OpenBible. Escolha a pasta de um espaço de estudo ou prepare uma nova pelo aplicativo.';
				return;
			}
			if (manifest.workspaceId === entry.workspaceId) {
				if (picked.kind === 'local' && picked.localHandle) {
					await saveLocalWorkspaceHandle(picked.localHandle, entry.workspaceId);
				}
				upsertCatalogEntry({
					...entry,
					nameCache: manifest.name,
					storageKind: picked.kind,
					lastOpenedAt: new Date().toISOString(),
					status: 'ready'
				});
				touchLastOpened(entry.workspaceId);
				refreshCatalog();
				manageMessage = `“${manifest.name}” localizado novamente e pronto para uso.`;
				focusVaultHeading();
				return;
			}
			collision = {
				entryId: entry.workspaceId,
				entryName: entry.nameCache,
				foundId: manifest.workspaceId,
				foundName: manifest.name,
				storage: picked
			};
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				manageMessage = 'A escolha da pasta foi cancelada; nada mudou.';
			} else if (error instanceof Error) {
				manageError = error.message;
			} else {
				manageError = 'Não foi possível localizar a pasta. Tente novamente.';
			}
		} finally {
			manageBusy = false;
		}
	}

	async function resolveCollision(mode: 'update' | 'copy') {
		if (!collision || manageBusy) return;
		manageBusy = true;
		manageError = '';
		try {
			const result = await addExistingWorkspaceEntry(collision.storage, {
				workspaceId: mode === 'update' ? collision.foundId : collision.entryId
			});
			refreshCatalog();
			manageMessage =
				result.action === 'copy'
					? `Cópia independente criada; “${collision.entryName}” segue intacto.`
					: `Localização de “${collision.foundName}” atualizada sem criar uma duplicata.`;
			collision = null;
			focusVaultHeading();
		} catch {
			manageError = 'Não foi possível resolver a pasta duplicada. Tente novamente.';
		} finally {
			manageBusy = false;
		}
	}

	onMount(() => {
		refreshCatalog();
		const listener = () => refreshCatalog();
		try {
			window.addEventListener('openbible:workspace-activated', listener);
		} catch {
			// Sem window em SSR: a lista carrega no cliente.
		}
		return () => {
			try {
				window.removeEventListener('openbible:workspace-activated', listener);
			} catch {
				// Ignora teardown sem window.
			}
		};
	});

	const kind = $derived(workspace?.storage?.kind ?? detectStorageKind());

	async function reconnectFolder() {
		if (!workspace || busy) return;
		busy = true;
		try {
			await workspace.reconnectFolder();
		} catch (error) {
			workspace.error =
				error instanceof DOMException && error.name === 'AbortError'
					? 'A escolha da pasta foi cancelada.'
					: error instanceof Error
						? error.message
						: 'Não foi possível acessar a pasta.';
		} finally {
			busy = false;
		}
	}

	async function rebuildWorkspaceContent() {
		const storage = workspace?.storage;
		if (!storage || indexRebuilding) return;
		indexRebuilding = true;
		indexProgress = 0;
		indexMessage = '';
		indexError = '';
		const controller = new AbortController();
		indexController = controller;
		try {
			const projection = await rebuildWorkspaceIndex(storage, {
				signal: controller.signal,
				onProgress: (processed, total) => {
					indexProgress = total === 0 ? 1 : processed / total;
				}
			});
			indexVersion = projection.projectionVersion;
			indexProgress = 1;
			indexMessage = `${projection.records.length} registro(s) organizados para pesquisa.`;
		} catch (error) {
			if (error instanceof WorkspaceIndexRebuildCancelledError) {
				indexMessage = 'Organização cancelada; seus dados permanecem intactos.';
			} else {
				indexError = 'Não foi possível organizar os dados para pesquisa. Tente novamente.';
			}
		} finally {
			indexRebuilding = false;
			indexController = null;
		}
	}

	function cancelWorkspaceContentRebuild() {
		indexController?.abort();
	}

	onDestroy(() => {
		indexController?.abort();
	});
</script>

{#if workspace?.status === 'ready' || workspace?.status === 'permission-needed'}
	<section class="workspace-settings" class:embedded aria-labelledby="workspace-settings-heading">
		{#if !embedded}
			<div class="section-heading">
				<p class="eyebrow">Dados</p>
				<h2 id="workspace-settings-heading">Onde seus dados ficam</h2>
				<p class="intro">
					Suas notas, destaques e preferências ficam neste dispositivo por padrão. Markdown e PDF
					são formatos de exportação; o conteúdo original continua separado por espaço de estudo.
				</p>
			</div>
		{:else}
			<h2 id="workspace-settings-heading" class="config-panel-heading">
				{view === 'workspaces' ? 'Gerenciar espaços de estudo' : 'Armazenamento dos dados'}
			</h2>
			<p class="panel-lead">
				{view === 'workspaces'
					? 'Crie, organize e reabra espaços de estudo neste dispositivo.'
					: 'Seus dados ficam neste dispositivo por padrão. Escolha uma pasta quando quiser manter uma cópia acessível fora do navegador.'}
			</p>
		{/if}

		{#if view === 'storage'}
			<div class="storage-location">
				<span class="fact-label">Local dos dados</span>
				<strong>{storageLocationLabel(kind)}</strong>
			</div>
			<details class="technical-details">
				<summary>Ver detalhes técnicos</summary>
				<dl class="facts">
					<div>
						<dt>Banco operacional</dt>
						<dd>{storageBackendLabel(kind === 'native' ? 'sqlite' : 'indexeddb')}</dd>
					</div>
				</dl>
			</details>

			<div class="actions">
				{#if workspace.storage?.kind === 'local' || workspace.storage?.kind === 'native'}
					<button class="secondary" type="button" onclick={reconnectFolder} disabled={busy}>
						Escolher pasta
					</button>
				{/if}
			</div>
			{#if workspace.error}
				<div class="error-block" role="alert">
					<p class="error">{workspace.error}</p>
					<button
						class="secondary"
						type="button"
						onclick={() => workspace.boot({ requestPermission: true })}
						disabled={busy}
					>
						Tentar novamente
					</button>
				</div>
			{/if}
			{#if kind === 'native' && workspace.config?.migrationState}
				<p class="feedback" aria-live="polite">
					Atualização do armazenamento: {workspace.config.migrationState === 'completed'
						? 'concluída'
						: workspace.config.migrationState === 'error'
							? 'precisa ser repetida'
							: 'não iniciada'}.
				</p>
			{/if}
		{/if}

		{#if view === 'workspaces'}
			{#if workspace.storage}
				<section class="index-recovery" aria-labelledby="workspace-index-heading">
					<div>
						<h3 id="workspace-index-heading">Reorganizar dados para pesquisa</h3>
						<p class="switch-hint">
							Organiza os destaques para a pesquisa; Bíblias importadas não são alteradas.
						</p>
					</div>
					<div class="actions index-actions">
						{#if indexRebuilding}
							<button class="secondary" type="button" onclick={cancelWorkspaceContentRebuild}>
								Cancelar organização
							</button>
						{:else}
							<button
								class="secondary"
								type="button"
								onclick={() => void rebuildWorkspaceContent()}
							>
								{indexError ? 'Tentar novamente' : 'Reorganizar para pesquisa'}
							</button>
						{/if}
					</div>
					{#if indexRebuilding}
						<div class="index-progress" aria-live="polite">
							<div class="progress-track" aria-hidden="true">
								<span style={`transform: scaleX(${indexProgress})`}></span>
							</div>
							<p class="feedback" role="status">
								Organizando dados para pesquisa: {Math.round(indexProgress * 100)}%
							</p>
						</div>
					{:else if indexError}
						<p class="error" role="alert">{indexError}</p>
					{:else if indexMessage}
						<p class="feedback" role="status">{indexMessage}</p>
					{:else if indexVersion}
						<p class="switch-hint">Pesquisa atualizada na versão v{indexVersion}.</p>
					{/if}
				</section>
			{/if}
			<div class="vault-block">
				<h3 class="switch-title" bind:this={vaultHeading} tabindex="-1">
					Espaços de estudo neste dispositivo
				</h3>
				<p class="switch-hint">
					Remover só tira da lista; excluir apaga a pasta.
				</p>
				{#if catalogLoading}
					<p class="feedback" role="status" aria-busy="true">Carregando espaços de estudo…</p>
				{:else if catalogEntries.length === 0}
					<p class="feedback" role="status">
						Nenhum espaço de estudo cadastrado. Crie um novo ou adicione uma pasta pelo seletor no
						topo da barra lateral.
					</p>
				{:else}
					<ul class="vault-list">
						{#each catalogEntries as entry (entry.workspaceId)}
							{@const isActive = entry.workspaceId === catalogActiveId}
							<li class="vault-row" aria-current={isActive ? 'true' : undefined}>
								<div class="vault-identity">
									<strong class="vault-name">{entry.nameCache}</strong>
									<span class="vault-meta">
										<span>{kindLabel(entry.storageKind)}</span>
										<span aria-hidden="true">·</span>
										<span>{isActive ? 'em uso' : catalogStatusLabel(entry.status)}</span>
									</span>
									<details class="vault-details">
										<summary>Detalhes técnicos</summary>
										<dl>
											<div>
												<dt>Identificador</dt>
												<dd><code>{entry.workspaceId}</code></dd>
											</div>
											<div>
												<dt>Armazenamento</dt>
												<dd>{storageKindLabel(entry.storageKind)}</dd>
											</div>
											<div>
												<dt>Banco operacional</dt>
												<dd>{storageBackendLabel(entry.backend)}</dd>
											</div>
											<div>
												<dt>Último acesso</dt>
												<dd>{lastOpenedLabel(entry.lastOpenedAt)}</dd>
											</div>
										</dl>
									</details>
								</div>
								<div class="vault-actions">
									<div
										class="actions workspace-row-actions"
										aria-label="Gerenciar este espaço de estudo"
									>
										{#if !isActive}
											<button
												class="secondary vault-button"
												type="button"
												onclick={() => activateEntry(entry)}
												disabled={busy || manageBusy}
											>
												Tornar ativo
											</button>
										{/if}
										{#if isActive && workspace?.storage}
											{#if renameId === entry.workspaceId}
												<button
													class="secondary vault-button"
													type="button"
													onclick={cancelRename}
													disabled={renameSaving}
												>
													Cancelar
												</button>
											{:else}
												<button
													class="secondary vault-button"
													type="button"
													onclick={() => startRename(entry)}
													disabled={busy || manageBusy}
												>
													Renomear
												</button>
											{/if}
										{/if}
										<button
											class="secondary vault-button"
											type="button"
											onclick={() => relocateEntry(entry)}
											disabled={busy || manageBusy}
										>
											Localizar novamente
										</button>
										<button
											class="secondary vault-button"
											type="button"
											onclick={() => (removeTarget = entry)}
											disabled={busy || manageBusy}
										>
											Remover da lista
										</button>
									</div>
									<div class="destructive-zone">
										<div>
											<h4>Exclusão permanente</h4>
											<p>Apaga a pasta inteira e não pode ser desfeito.</p>
										</div>
										<button
											class="danger vault-button"
											type="button"
											onclick={() => openDeleteDialog(entry)}
											disabled={busy || manageBusy}
										>
											Excluir espaço de estudo
										</button>
									</div>
								</div>
								{#if renameId === entry.workspaceId && isActive}
									<form
										class="rename-form"
										onsubmit={(event) => {
											event.preventDefault();
											void saveRename(entry);
										}}
									>
										<label class="rename-label" for={`rename-${entry.workspaceId}`}>
											Nome exibido
										</label>
										<input
											id={`rename-${entry.workspaceId}`}
											class="rename-input"
											type="text"
											bind:value={renameValue}
											autocomplete="off"
											maxlength={80}
											disabled={renameSaving}
											aria-describedby={`rename-help-${entry.workspaceId}`}
										/>
										<p class="switch-hint" id={`rename-help-${entry.workspaceId}`}>
											A pasta não muda; apenas o nome mostrado pelo OpenBible será alterado.
										</p>
										{#if renameError}
											<p class="error" role="alert">{renameError}</p>
										{/if}
										<div class="actions">
											<button
												class="primary vault-button"
												type="submit"
												disabled={renameSaving || !renameValue.trim()}
											>
												{renameSaving ? 'Salvando…' : 'Salvar nome'}
											</button>
										</div>
									</form>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
				{#if detachedCatalogEntries.length > 0}
					<div class="detached-block">
						<h4 class="switch-title">Fora da lista</h4>
						<p class="switch-hint">
							Esses espaços continuam preservados e podem voltar ao seletor. Restaurar não abre a
							pasta automaticamente.
						</p>
						<ul class="vault-list" aria-label="Espaços de estudo fora da lista">
							{#each detachedCatalogEntries as entry (entry.workspaceId)}
								<li class="vault-row vault-row-detached">
									<div class="vault-identity">
										<strong class="vault-name">{entry.nameCache}</strong>
										<span class="vault-meta">
											<span>{kindLabel(entry.storageKind)}</span>
											<span aria-hidden="true">·</span>
											<span>dados preservados</span>
										</span>
									</div>
									<div class="actions vault-actions">
										<button
											class="secondary vault-button"
											type="button"
											onclick={() => restoreEntry(entry)}
										>
											Restaurar na lista
										</button>
									</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if collision}
					<div class="collision-box" role="group" aria-label="Pasta já cadastrada">
						<p class="switch-confirm">
							A pasta escolhida (“{collision.foundName}”) já está cadastrada de outra forma.
							Atualize a localização para continuar usando este espaço ou crie uma cópia
							independente.
						</p>
						<div class="actions">
							<button
								class="primary vault-button"
								type="button"
								onclick={() => void resolveCollision('update')}
								disabled={manageBusy}
							>
								Atualizar localização
							</button>
							<button
								class="secondary vault-button"
								type="button"
								onclick={() => void resolveCollision('copy')}
								disabled={manageBusy}
							>
								Criar cópia independente
							</button>
							<button
								class="secondary vault-button"
								type="button"
								onclick={() => (collision = null)}
								disabled={manageBusy}
							>
								Cancelar
							</button>
						</div>
					</div>
				{/if}
				{#if manageMessage}
					<p class="feedback" aria-live="polite">{manageMessage}</p>
				{/if}
				{#if manageError}
					<p class="error" role="alert">{manageError}</p>
				{/if}

				{#snippet removeDialogBody()}
					<p class="vault-dialog-lead">
						{#if removeTarget}
							“{removeTarget.nameCache}” sai só da lista deste dispositivo. Nenhum arquivo ou pasta
							é apagado, e o mesmo espaço pode ser adicionado de novo depois.
						{/if}
					</p>
					<div class="actions vault-dialog-actions">
						<button
							class="secondary vault-button"
							type="button"
							onclick={() => (removeTarget = null)}
							disabled={removeBusy}
						>
							Manter
						</button>
						<button
							class="primary vault-button"
							type="button"
							onclick={() => removeTarget && void confirmRemove(removeTarget)}
							disabled={removeBusy}
						>
							{removeBusy ? 'Removendo…' : 'Remover da lista'}
						</button>
					</div>
				{/snippet}

				{#if removeTarget}
					{#if isMobile.current}
						<Drawer.Root
							open={true}
							onOpenChange={(value) => {
								if (!value) removeTarget = null;
							}}
						>
							<Drawer.Content class="vault-dialog-drawer">
								<Drawer.Header>
									<Drawer.Title>Remover da lista</Drawer.Title>
								</Drawer.Header>
								<div class="vault-dialog-body">
									{@render removeDialogBody()}
								</div>
							</Drawer.Content>
						</Drawer.Root>
					{:else}
						<Dialog.Root
							open={true}
							onOpenChange={(value) => {
								if (!value) removeTarget = null;
							}}
						>
							<Dialog.Content class="vault-dialog">
								<Dialog.Title>Remover da lista</Dialog.Title>
								<Dialog.Description>
									Ação não destrutiva: só este espaço sai da lista.
								</Dialog.Description>
								{@render removeDialogBody()}
							</Dialog.Content>
						</Dialog.Root>
					{/if}
				{/if}

				{#snippet deleteDialogBody()}
					<p class="vault-dialog-lead">
						{#if deleteTarget}
							Apaga a pasta inteira de “{deleteTarget.nameCache}” — arquivos e subpastas. Não há
							como desfazer.
						{/if}
					</p>
					{#if deleteLoading}
						<p class="feedback" role="status" aria-busy="true">
							Verificando se a pasta pode ser excluída com segurança…
						</p>
					{:else if deleteError && !deletePreview?.ok}
						<p class="error" role="alert" aria-live="assertive">{deleteError}</p>
						<p class="switch-hint">
							A exclusão está bloqueada e não há opção de forçar pelo OpenBible. Apague manualmente
							fora do app se tiver certeza do que está fazendo.
						</p>
					{:else if deletePreview && deleteTarget}
						<ul class="guard-list" aria-label="Verificações de segurança">
							<li data-ok={deletePreview.manifestValid}>
								{deletePreview.manifestValid ? '✓' : '✗'} Identidade do espaço confirmada
							</li>
							<li data-ok={deletePreview.managedRoot}>
								{deletePreview.managedRoot ? '✓' : '✗'} Pasta criada pelo OpenBible
							</li>
							<li data-ok={deletePreview.capability}>
								{deletePreview.capability ? '✓' : '✗'} Exclusão segura disponível
							</li>
							<li data-ok={!deletePreview.scanError && deletePreview.unknownFiles.length === 0}>
								{!deletePreview.scanError && deletePreview.unknownFiles.length === 0 ? '✓' : '✗'} Nenhum
								arquivo desconhecido encontrado
								{#if deletePreview.unknownFiles.length > 0}
									<span class="guard-detail">({deletePreview.unknownFiles.join(', ')})</span>
								{/if}
							</li>
							<li data-ok={true}>✓ Nenhuma outra janela está usando a pasta</li>
						</ul>
						{#if deletePreview.ok}
							<div class="workspace-dialog-field">
								<label class="rename-label" for="workspace-delete-confirm">
									Digite “{deleteTarget.nameCache}” para confirmar
								</label>
								<input
									id="workspace-delete-confirm"
									class="rename-input"
									type="text"
									bind:value={deleteConfirmName}
									autocomplete="off"
									disabled={deleteBusy}
								/>
							</div>
						{:else if deletePreview.blockMessage}
							<p class="error" role="alert" aria-live="assertive">{deletePreview.blockMessage}</p>
							<p class="switch-hint">
								A exclusão está bloqueada e não há opção de forçar pelo OpenBible.
							</p>
						{/if}
					{/if}
					{#if deleteError && deletePreview?.ok}
						<p class="error" role="alert" aria-live="assertive">{deleteError}</p>
					{/if}
					<div class="actions vault-dialog-actions">
						<button
							class="secondary vault-button"
							type="button"
							onclick={() => {
								if (!deleteBusy) {
									deleteTarget = null;
									deleteError = '';
								}
							}}
							disabled={deleteBusy}
						>
							Cancelar
						</button>
						{#if deletePreview?.ok && deleteTarget}
							<button
								class="danger vault-button"
								type="button"
								onclick={() => void confirmDelete()}
								disabled={deleteBusy || deleteConfirmName.trim() !== deleteTarget.nameCache}
							>
								{deleteBusy ? 'Excluindo…' : 'Excluir espaço de estudo'}
							</button>
						{/if}
					</div>
				{/snippet}

				{#if deleteTarget}
					{#if isMobile.current}
						<Drawer.Root
							open={true}
							onOpenChange={(value) => {
								if (!value && !deleteBusy) {
									deleteTarget = null;
									deleteError = '';
								}
							}}
						>
							<Drawer.Content class="vault-dialog-drawer">
								<Drawer.Header>
									<Drawer.Title>Excluir espaço de estudo</Drawer.Title>
								</Drawer.Header>
								<div class="vault-dialog-body">
									{@render deleteDialogBody()}
								</div>
							</Drawer.Content>
						</Drawer.Root>
					{:else}
						<Dialog.Root
							open={true}
							onOpenChange={(value) => {
								if (!value && !deleteBusy) {
									deleteTarget = null;
									deleteError = '';
								}
							}}
						>
							<Dialog.Content class="vault-dialog">
								<Dialog.Title>Excluir espaço de estudo</Dialog.Title>
								<Dialog.Description>
									Ação destrutiva e irreversível sobre a pasta escolhida.
								</Dialog.Description>
								{@render deleteDialogBody()}
							</Dialog.Content>
						</Dialog.Root>
					{/if}
				{/if}
			</div>
		{/if}
	</section>
{/if}

<style>
	.workspace-settings {
		width: 100%;
	}

	.workspace-settings:not(.embedded) {
		margin-bottom: 56px;
	}

	.panel-lead {
		max-width: 560px;
		margin: 0 0 4px;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.config-panel-heading {
		margin: 0 0 8px;
		font-size: clamp(1.25rem, 3vw, 1.65rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.eyebrow {
		margin: 0 0 12px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	h2 {
		margin: 0;
		font-size: clamp(1.25rem, 3vw, 1.65rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.intro {
		max-width: 560px;
		margin: 14px 0 0;
		color: var(--muted-foreground);
		font-size: 1rem;
		line-height: 1.6;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.86em;
	}

	.storage-location {
		display: grid;
		gap: 4px;
		margin-top: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border);
	}

	.fact-label {
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}

	.storage-location strong {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.technical-details {
		margin-top: 16px;
		border: 1px solid var(--border);
		padding: 10px 12px;
	}

	.technical-details summary,
	.vault-details summary {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.technical-details .facts {
		margin: 16px 0 2px;
	}

	.facts {
		display: grid;
		gap: 14px;
		margin: 24px 0 0;
	}

	.facts > div {
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border);
	}

	dt {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}

	dd {
		margin: 4px 0 0;
		font-size: 0.95rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 24px;
	}

	.primary,
	.secondary,
	.danger {
		display: inline-flex;
		min-height: 42px;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		padding: 0 16px;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	.primary {
		border: 1px solid var(--primary);
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.secondary {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--foreground);
	}

	.danger {
		border: 1px solid var(--destructive);
		background: transparent;
		color: var(--destructive);
	}

	.danger:hover:not(:disabled) {
		background: color-mix(in oklch, var(--destructive) 10%, transparent);
	}

	.primary:focus-visible,
	.secondary:focus-visible,
	.danger:focus-visible {
		outline: 3px solid color-mix(in oklch, var(--ring) 35%, transparent);
		outline-offset: 2px;
	}

	.primary:disabled,
	.secondary:disabled,
	.danger:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.feedback,
	.error {
		margin: 16px 0 0;
		font-size: 0.82rem;
		line-height: 1.5;
	}

	.feedback {
		color: var(--foreground);
	}

	.error {
		color: var(--destructive);
	}

	.index-recovery {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 14px 24px;
		align-items: end;
		margin-top: 24px;
		padding: 18px 0;
		border-block: 1px solid var(--border);
	}

	.index-recovery h3 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.index-actions {
		margin-top: 0;
	}

	.index-progress,
	.index-recovery > .error,
	.index-recovery > .feedback {
		grid-column: 1 / -1;
	}

	.progress-track {
		height: 3px;
		overflow: hidden;
		background: var(--muted);
	}

	.progress-track span {
		display: block;
		height: 100%;
		width: 100%;
		transform-origin: left center;
		background: var(--foreground);
		transition: transform 160ms ease;
	}

	.switch-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.switch-hint {
		margin: 8px 0 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.55;
	}

	.switch-confirm {
		margin: 12px 0 0;
		color: var(--foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.vault-block {
		margin-top: 28px;
		padding-top: 24px;
	}

	.detached-block {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid var(--border);
	}

	.vault-block .switch-title:focus {
		outline: none;
	}

	.vault-block .switch-title:focus-visible {
		outline: 3px solid color-mix(in oklch, var(--ring) 35%, transparent);
		outline-offset: 2px;
	}

	.vault-list {
		list-style: none;
		margin: 16px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.vault-row {
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 14px;
	}

	.vault-row[aria-current='true'] {
		border-color: color-mix(in oklch, var(--foreground) 30%, var(--border));
	}

	.vault-row-detached {
		background: color-mix(in oklch, var(--muted) 24%, transparent);
	}

	.vault-identity {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.vault-name {
		overflow: hidden;
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.vault-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 6px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}

	.vault-details {
		margin-top: 4px;
	}

	.vault-details dl {
		display: grid;
		gap: 8px;
		margin: 10px 0 0;
		border-top: 1px solid var(--border);
		padding-top: 10px;
	}

	.vault-details dl > div {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.vault-details dt,
	.vault-details dd {
		font-size: 0.72rem;
	}

	.vault-details dt {
		min-width: 110px;
	}

	.vault-details dd {
		margin: 0;
	}

	.vault-actions {
		margin-top: 12px;
	}

	.workspace-row-actions {
		margin-top: 0;
	}

	.destructive-zone {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		margin-top: 16px;
		border-top: 1px solid var(--border);
		padding-top: 14px;
	}

	.destructive-zone h4,
	.destructive-zone p {
		margin: 0;
	}

	.destructive-zone h4 {
		color: var(--destructive);
		font-size: 0.78rem;
		font-weight: 650;
	}

	.destructive-zone p {
		margin-top: 4px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		line-height: 1.45;
	}

	.destructive-zone .danger {
		flex-shrink: 0;
	}

	.vault-button {
		min-height: 40px;
	}

	.rename-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 12px;
		border-top: 1px solid var(--border);
		padding-top: 12px;
	}

	.rename-label {
		font-size: 0.78rem;
		font-weight: 600;
	}

	.rename-input {
		min-height: 42px;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0 12px;
		background: var(--background);
		color: var(--foreground);
		font: inherit;
		font-size: 0.85rem;
	}

	.rename-input:focus-visible {
		outline: 3px solid color-mix(in oklch, var(--ring) 35%, transparent);
		outline-offset: 1px;
	}

	.collision-box {
		border: 1px solid var(--border);
		border-radius: 12px;
		margin-top: 16px;
		padding: 14px;
	}

	:global(.vault-dialog) {
		max-height: min(90vh, 640px);
		overflow-y: auto;
	}

	:global(.vault-dialog-drawer) {
		max-height: 90dvh;
		padding-inline: max(16px, env(safe-area-inset-left, 0px));
		padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
	}

	:global(.vault-dialog-drawer > [data-slot='drawer-header']) {
		padding-inline: 16px;
	}

	.vault-dialog-body {
		overflow-y: auto;
		padding: 4px 16px 8px;
	}

	.vault-dialog-lead {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.55;
	}

	.vault-dialog-actions {
		margin-top: 20px;
		justify-content: flex-end;
	}

	.guard-list {
		list-style: none;
		margin: 16px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 0.82rem;
	}

	.guard-list li[data-ok='true'] {
		color: var(--foreground);
	}

	.guard-list li[data-ok='false'] {
		color: var(--destructive);
		font-weight: 600;
	}

	.guard-detail {
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}

	.workspace-dialog-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 16px;
	}

	@media (max-width: 560px) {
		.index-recovery {
			grid-template-columns: 1fr;
			align-items: start;
		}

		.index-actions {
			margin-top: 0;
		}

		.index-actions button {
			width: 100%;
		}

		.actions {
			flex-direction: column;
		}

		.primary,
		.secondary,
		.danger {
			width: 100%;
		}

		.destructive-zone {
			align-items: stretch;
			flex-direction: column;
			gap: 10px;
		}
	}

	@media (max-width: 767px) {
		.config-panel-heading {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.primary,
		.secondary,
		.danger {
			transition: none;
		}
	}
</style>
