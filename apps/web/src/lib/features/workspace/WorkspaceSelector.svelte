<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ChevronDown, FolderPlus, Plus, Settings2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { resolveStorageKind } from '$lib/storage/environment';
	import {
		chooseLocalWorkspaceStorage,
		saveLocalWorkspaceHandle
	} from '$lib/storage/local-storage';
	import { createOpfsLogicalRoot } from '$lib/storage/opfs-storage';
	import { chooseWorkspaceStorage } from '$lib/storage/storage-registry';
	import { readNativeWorkspacePath } from '$lib/storage/tauri-storage';
	import {
		addExistingWorkspaceEntry,
		generateWorkspaceId,
		getActiveWorkspace,
		getCatalogEntry,
		listCatalog,
		readManifest,
		upsertCatalogEntry,
		writeManifest,
		type WorkspaceCatalogEntry
	} from '$lib/storage/workspace-catalog';
	import { getWorkspaceLifecycle } from '$lib/storage/workspace-lifecycle';
	import { prepareWorkspace } from '$lib/storage/workspace';
	import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';
	import { getWorkspaceState } from './workspace-state.svelte';

	const isMobile = new IsMobile();

	// Capturado na inicialização como nos demais componentes: getContext fora
	// da init é inseguro (lança `lifecycle_outside_component`) e quebrava toda
	// ativação pelo seletor com erro genérico.
	const workspace = getWorkspaceState();

	let {
		manageLabel = 'Gerenciar espaços de estudo',
		variant = 'desktop',
		onManage,
		onCreate,
		onAdd,
		onAction
	}: {
		manageLabel?: string;
		variant?: 'desktop' | 'mobile';
		onManage?: () => void;
		onCreate?: () => void;
		onAdd?: () => void;
		onAction?: () => void;
	} = $props();

	let entries = $state<WorkspaceCatalogEntry[]>([]);
	let activeId = $state<string | null>(null);
	let loading = $state(true);
	let switchingId = $state<string | null>(null);
	let error = $state('');
	let announcement = $state('');

	function refresh() {
		try {
			entries = listCatalog();
			activeId = getActiveWorkspace().workspaceId;
		} catch {
			entries = [];
		} finally {
			loading = false;
		}
	}

	const activeEntry = $derived(entries.find((entry) => entry.workspaceId === activeId) ?? null);
	const activeName = $derived(activeEntry?.nameCache ?? 'Nenhum espaço de estudo');
	const activeBackend = $derived(activeEntry?.storageKind ?? null);

	function storageLocationLabel(kind: StorageKind): string {
		return kind === 'native' ? 'Computador' : kind === 'local' ? 'Pasta escolhida' : 'Navegador';
	}

	function statusLabel(status: WorkspaceCatalogEntry['status']): string {
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

	const activeBackendLabel = $derived(
		activeBackend ? storageLocationLabel(activeBackend) : 'Neste dispositivo'
	);

	function formatSelectorName(name: string): string {
		const trimmed = name.trim();
		if (!trimmed) return 'Espaço de estudo';
		if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
			return `${trimmed.slice(0, 8)}…`;
		}
		return trimmed;
	}

	const displayActiveName = $derived(
		loading ? 'Abrindo espaço de estudo…' : formatSelectorName(activeName)
	);

	function announce(message: string) {
		announcement = message;
	}

	async function selectWorkspace(id: string) {
		if (id === activeId || switchingId) return;
		error = '';
		switchingId = id;
		let target = entries.find((entry) => entry.workspaceId === id) ?? null;
		if (!target) {
			refresh();
			target = entries.find((entry) => entry.workspaceId === id) ?? null;
		}
		if (!target) {
			switchingId = null;
			error = 'Esse espaço de estudo não está mais cadastrado neste dispositivo.';
			announce(error);
			return;
		}
		announce(`Abrindo espaço de estudo ${target?.nameCache ?? ''}…`);
		try {
			if (workspace && target) await workspace.activateEntry(target);
			else if (workspace) await workspace.flushAndSwitch(id);
			else await getWorkspaceLifecycle().flushAndSwitch(id);
			refresh();
			const next = entries.find((entry) => entry.workspaceId === id);
			announce(`Espaço de estudo ${next?.nameCache ?? 'selecionado'} aberto.`);
			onAction?.();
			await goto(resolve('/'));
			// Os consumidores têm caches e editores próprios. Uma recarga completa
			// após a navegação para a home garante que toda a árvore da página resolve
			// a nova raiz desde o boot, sem deixar uma tela montada com dados anteriores.
			try {
				window.location.reload();
			} catch {
				// Em SSR/testes não existe navegação; o estado já foi atualizado acima.
			}
		} catch (failure) {
			const code =
				failure instanceof Error && 'code' in failure
					? String((failure as { code?: unknown }).code)
					: 'switch_failed';
			const detail =
				failure instanceof Error && failure.message && failure.message !== String(code)
					? failure.message
					: '';
			error =
				code === 'AUTOSAVE_FAILED'
					? 'Há alterações não salvas. Tente novamente ou descarte para trocar.'
					: code === 'SCHEMA_UNAVAILABLE' || code === 'database_unavailable'
						? 'O banco local do workspace não está disponível. Tente novamente ou abra outro workspace.'
						: code === 'PERSISTENCE_UNAVAILABLE'
							? 'O banco local não respondeu. Tente novamente ou abra outro workspace; nada foi trocado silenciosamente.'
							: code === 'MIGRATION_REQUIRED'
								? 'A migração do workspace precisa ser retomada em Configurações. A fonte original foi preservada.'
								: code === 'RECONNECT_REQUIRED'
									? 'A referência local precisa ser reconectada em Gerenciar workspaces.'
									: code === 'PERSISTENCE_CONFLICT'
										? 'A transação do workspace entrou em conflito. Nenhum dado foi apagado.'
										: code === 'permission' || code === 'needs-reconnect'
											? 'Sem acesso à raiz do workspace. O workspace atual permanece ativo; localize a raiz em Gerenciar workspaces.'
											: code === 'missing' || code === 'invalid' || code === 'locked'
												? 'Não foi possível montar a raiz do workspace. O cadastro foi preservado; veja Gerenciar workspaces.'
												: 'Não foi possível abrir o workspace. Tente novamente.';
			announce(detail && code !== 'AUTOSAVE_FAILED' ? `${error} Detalhe: ${detail}` : error);
		} finally {
			switchingId = null;
		}
	}

	function handleManage() {
		if (onManage) {
			onManage();
			return;
		}
		try {
			window.dispatchEvent(new CustomEvent('openbible:workspace-manage'));
		} catch {
			// Sem window (testes): ação tratada pelo consumidor via prop.
		}
		onAction?.();
	}

	// --- Dialogs de criar/adicionar (T020): Dialog no desktop, Drawer no
	// mobile, mesmo formulário e contrato de resultado. Criar prepara uma raiz
	// dedicada (gerenciada); adicionar registra uma pasta existente como ela
	// está (não gerenciada), com resolução de colisão de ID nos dois fluxos.
	let createOpen = $state(false);
	let createKind = $state<StorageKind>('opfs');
	let createName = $state('');
	let createError = $state('');
	let createSaving = $state(false);
	let createCollision = $state<{
		storage: WorkspaceStorage;
		manifestId: string;
		manifestName: string;
	} | null>(null);
	let createInput = $state<HTMLInputElement | null>(null);

	let addOpen = $state(false);
	let addKind = $state<StorageKind>('opfs');
	let addBusy = $state(false);
	let addError = $state('');
	let addCollision = $state<{
		storage: WorkspaceStorage;
		manifestId: string;
		manifestName: string;
	} | null>(null);

	function openCreate() {
		createKind = resolveStorageKind();
		createName = '';
		createError = '';
		createCollision = null;
		pendingActivation = null;
		createOpen = true;
	}

	function openAdd() {
		addKind = resolveStorageKind();
		addError = '';
		addCollision = null;
		pendingActivation = null;
		addOpen = true;
	}

	function closeCreate() {
		createOpen = false;
		createSaving = false;
		createCollision = null;
		pendingActivation = null;
	}

	function closeAdd() {
		addOpen = false;
		addBusy = false;
		addCollision = null;
		pendingActivation = null;
	}

	let pendingActivationFlow = $state<'create' | 'add'>('create');

	/**
	 * Ativação pendente: a raiz já foi preparada e cadastrada, mas a ativação
	 * falhou (ex.: autosave ou montagem). Retentar NÃO escolhe a pasta de
	 * novo — só repete a ativação — para nunca entrar em loop de picker.
	 */
	let pendingActivation = $state<{ workspaceId: string; workspaceName: string } | null>(null);

	async function retryPendingActivation() {
		const pending = pendingActivation;
		if (!pending) return;
		error = '';
		if (pendingActivationFlow === 'add') addError = '';
		else createError = '';
		await activateAndClose(pending.workspaceId, `Espaço de estudo ${pending.workspaceName} aberto.`);
		if (getActiveWorkspace().workspaceId === pending.workspaceId) {
			pendingActivation = null;
		} else if (error) {
			if (pendingActivationFlow === 'add') addError = error;
			else createError = error;
		}
	}

	/**
	 * Ativa e fecha os dialogs em caso de sucesso; em caso de falha, preserva
	 * o erro visível e arma a retomada sem novo picker.
	 */
	async function trackActivation(
		id: string,
		name: string,
		flow: 'create' | 'add',
		successMessage: string
	): Promise<void> {
		pendingActivationFlow = flow;
		await activateAndClose(id, successMessage);
		if (getActiveWorkspace().workspaceId !== id) {
			pendingActivation = { workspaceId: id, workspaceName: name };
			if (error) {
				if (flow === 'add') addError = error;
				else createError = error;
			}
		}
	}

	$effect(() => {
		if (createOpen) {
			void tick().then(() => {
				try {
					createInput?.focus();
				} catch {
					// Foco é melhor esforço.
				}
			});
		}
	});

	/** Raiz vazia para criação dedicada: sem arquivos e sem diretórios conhecidos. */
	async function isEmptyRoot(storage: WorkspaceStorage): Promise<boolean> {
		try {
			if ((await storage.listFiles('')).length > 0) return false;
		} catch {
			return true;
		}
		for (const dir of [
			'.openbible',
			'bibles',
			'notes',
			'sermons',
			'studies',
			'templates',
			'attachments',
			'trash'
		]) {
			try {
				await storage.listFiles(dir);
				return false;
			} catch {
				// Diretório ausente: segue a varredura.
			}
		}
		return true;
	}

	function localRefFor(storage: WorkspaceStorage): unknown {
		// Caminhos nativos e refs OPFS são strings e sobrevivem no catálogo;
		// handles do File System Access permanecem no IndexedDB local por ID.
		if (storage.kind === 'native') return readNativeWorkspacePath() ?? undefined;
		if (storage.kind === 'local') return storage.localHandle;
		return undefined;
	}

	async function activateAndClose(id: string, successMessage: string): Promise<boolean> {
		await selectWorkspace(id);
		if (getActiveWorkspace().workspaceId !== id) return false;
		announce(successMessage);
		closeCreate();
		closeAdd();
		return true;
	}

	async function submitCreate() {
		const trimmed = createName.trim();
		if (!trimmed) {
				createError = 'Dê um nome ao espaço de estudo para continuar.';
			return;
		}
		if (createSaving) return;
		createSaving = true;
		createError = '';
		try {
			if (createKind === 'opfs') {
				const id = generateWorkspaceId();
				const { storage, ref } = await createOpfsLogicalRoot(id);
				// Reserve the requested identity before preparation. Otherwise
				// `prepareWorkspace` would generate a second ID for the empty OPFS
				// root and the catalog entry would never match its manifest.
				await writeManifest(storage, {
					workspaceId: id,
					formatVersion: 2,
					name: trimmed,
					managedRoot: true,
					version: 1,
					storage: 'opfs',
					configuredAt: new Date().toISOString(),
					bibleImportStatus: 'pending',
					label: trimmed
				});
				await prepareWorkspace(storage);
				const manifest = await readManifest(storage);
				if (!manifest) throw new Error('manifest_not_written');
				await writeManifest(storage, {
					...manifest,
					name: trimmed,
					label: trimmed,
					managedRoot: true
				});
				upsertCatalogEntry({
					workspaceId: id,
					nameCache: trimmed,
					storageKind: 'opfs',
					localRef: ref,
					lastOpenedAt: new Date().toISOString(),
					status: 'ready'
				});
				await trackActivation(id, trimmed, 'create', `Espaço de estudo ${trimmed} criado e aberto.`);
				return;
			}
			const picked =
				createKind === 'native'
					? await chooseWorkspaceStorage('native')
					: await chooseLocalWorkspaceStorage();
			if (!(await isEmptyRoot(picked))) {
				const existing = await readManifest(picked);
				if (existing?.workspaceId) {
					createCollision = {
						storage: picked,
						manifestId: existing.workspaceId,
						manifestName: existing.name
					};
					return;
				}
				createError =
					'A pasta não está vazia. Escolha uma pasta vazia para criar, ou use Adicionar pasta existente.';
				return;
			}
			await prepareWorkspace(picked);
			const manifest = await readManifest(picked);
			if (!manifest) throw new Error('manifest_not_written');
			await writeManifest(picked, {
				...manifest,
				name: trimmed,
				label: trimmed,
				managedRoot: true
			});
			upsertCatalogEntry({
				workspaceId: manifest.workspaceId,
				nameCache: trimmed,
				storageKind: picked.kind,
				localRef: localRefFor(picked),
				lastOpenedAt: new Date().toISOString(),
				status: 'ready'
			});
			await trackActivation(
				manifest.workspaceId,
				trimmed,
				'create',
				`Espaço de estudo ${trimmed} criado e aberto.`
			);
		} catch (failure) {
			if (failure instanceof DOMException && failure.name === 'AbortError') {
				createError = 'A escolha da pasta foi cancelada; nada mudou.';
			} else if (
				failure instanceof Error &&
				'code' in failure &&
				(failure as { code?: unknown }).code === 'AUTOSAVE_FAILED'
			) {
				createError = 'Há alterações não salvas no espaço atual. Resolva-as e tente de novo.';
			} else if (failure instanceof Error) {
				createError = failure.message || 'Não foi possível criar o espaço de estudo. Tente novamente.';
			} else {
				createError = 'Não foi possível criar o espaço de estudo. Tente novamente.';
			}
		} finally {
			createSaving = false;
		}
	}

	async function resolveCreateCollision(mode: 'update' | 'copy') {
		if (!createCollision || createSaving) return;
		createSaving = true;
		createError = '';
		try {
			const { storage, manifestId, manifestName } = createCollision;
			if (mode === 'update') {
				await addExistingWorkspaceEntry(storage, { workspaceId: manifestId });
				createCollision = null;
				await trackActivation(
					manifestId,
					manifestName,
					'create',
					`Espaço de estudo ${manifestName} atualizado e aberto.`
				);
				return;
			}
			const manifest = await readManifest(storage);
			if (!manifest) throw new Error('manifest_not_found');
			const trimmed = createName.trim() || manifest.name;
			const copyId = generateWorkspaceId();
			if (storage.kind === 'local' && storage.localHandle) {
				await saveLocalWorkspaceHandle(storage.localHandle, copyId);
			}
			await writeManifest(storage, {
				...manifest,
				workspaceId: copyId,
				name: trimmed,
				label: trimmed,
				managedRoot: true
			});
			upsertCatalogEntry({
				workspaceId: copyId,
				nameCache: trimmed,
				storageKind: storage.kind,
				localRef: localRefFor(storage),
				lastOpenedAt: new Date().toISOString(),
				status: 'ready'
			});
			createCollision = null;
			await trackActivation(
				copyId,
				trimmed,
				'create',
				`Espaço de estudo ${trimmed} criado como cópia independente.`
			);
		} catch {
			createError = 'Não foi possível resolver a pasta duplicada. Tente novamente.';
		} finally {
			createSaving = false;
		}
	}

	async function submitAdd() {
		if (addBusy || addKind === 'opfs') return;
		addBusy = true;
		addError = '';
		try {
			const picked =
				addKind === 'native'
					? await chooseWorkspaceStorage('native')
					: await chooseLocalWorkspaceStorage();
			const manifest = await readManifest(picked);
			if (!manifest) {
				addError =
					'A pasta não está preparada para o OpenBible. Para uma pasta nova, use Criar espaço de estudo.';
				return;
			}
			if (getCatalogEntry(manifest.workspaceId)) {
				addCollision = {
					storage: picked,
					manifestId: manifest.workspaceId,
					manifestName: manifest.name
				};
				return;
			}
			await prepareWorkspace(picked);
			upsertCatalogEntry({
				workspaceId: manifest.workspaceId,
				nameCache: manifest.name,
				storageKind: picked.kind,
				localRef: localRefFor(picked),
				lastOpenedAt: new Date().toISOString(),
				status: 'ready'
			});
			const id = manifest.workspaceId;
			await trackActivation(
				id,
				manifest.name,
				'add',
				`Espaço de estudo ${manifest.name} adicionado e aberto.`
			);
		} catch (failure) {
			if (failure instanceof DOMException && failure.name === 'AbortError') {
				addError = 'A escolha da pasta foi cancelada; nada mudou.';
			} else if (
				failure instanceof Error &&
				'code' in failure &&
				(failure as { code?: unknown }).code === 'AUTOSAVE_FAILED'
			) {
				addError = 'Há alterações não salvas no workspace atual. Resolva-as e envie de novo.';
			} else {
				addError = 'Não foi possível adicionar a pasta. Tente novamente.';
			}
		} finally {
			addBusy = false;
		}
	}

	async function resolveAddCollision(mode: 'update' | 'copy') {
		if (!addCollision || addBusy) return;
		addBusy = true;
		addError = '';
		try {
			const { storage, manifestId, manifestName } = addCollision;
			if (mode === 'update') {
				await addExistingWorkspaceEntry(storage, { workspaceId: manifestId });
				addCollision = null;
				await trackActivation(
					manifestId,
					manifestName,
					'add',
					`Localização de ${manifestName} atualizada.`
				);
				return;
			}
			const manifest = await readManifest(storage);
			if (!manifest) throw new Error('manifest_not_found');
			const copyId = generateWorkspaceId();
			if (storage.kind === 'local' && storage.localHandle) {
				await saveLocalWorkspaceHandle(storage.localHandle, copyId);
			}
			await writeManifest(storage, { ...manifest, workspaceId: copyId });
			upsertCatalogEntry({
				workspaceId: copyId,
				nameCache: manifest.name,
				storageKind: storage.kind,
				localRef: localRefFor(storage),
				lastOpenedAt: new Date().toISOString(),
				status: 'ready'
			});
			addCollision = null;
			await trackActivation(
				copyId,
				manifest.name,
				'add',
				`Cópia independente de ${manifest.name} criada e ativa.`
			);
		} catch {
			addError = 'Não foi possível resolver a colisão de ID. Tente novamente.';
		} finally {
			addBusy = false;
		}
	}

	function handleCreate() {
		if (onCreate) {
			onCreate();
			return;
		}
		openCreate();
		// No mobile o formulário abre em um Drawer aninhado; manter este
		// componente montado evita que o drawer da lista destrua o formulário.
		if (variant !== 'mobile') onAction?.();
	}

	function handleAdd() {
		if (onAdd) {
			onAdd();
			return;
		}
		openAdd();
		// O drawer externo permanece montado enquanto o formulário aninhado abre.
		if (variant !== 'mobile') onAction?.();
	}

	onMount(() => {
		refresh();
		let off: (() => void) | undefined;
		try {
			off = undefined;
			const listener = () => refresh();
			window.addEventListener('openbible:workspace-activated', listener);
			off = () => window.removeEventListener('openbible:workspace-activated', listener);
		} catch {
			off = undefined;
		}
		return () => off?.();
	});
</script>

<div class="workspace-selector" data-variant={variant} aria-busy={loading || undefined}>
	{#if variant === 'mobile'}
		<div class="mobile-list" role="menu" aria-label="Espaços de estudo" aria-busy={loading || undefined}>
			{#if loading}
				<p class="menu-status" role="status">Abrindo espaço de estudo…</p>
			{:else if entries.length === 0}
				<p class="menu-status" role="status">
					Nenhum espaço de estudo cadastrado. Crie um novo ou adicione uma pasta existente.
				</p>
			{:else}
				{#each entries as entry (entry.workspaceId)}
					<button
						type="button"
						class="mobile-item"
						role="menuitemradio"
						aria-checked={entry.workspaceId === activeId}
						aria-label={`${entry.nameCache}, ${storageLocationLabel(entry.storageKind)}${entry.workspaceId === activeId ? ', em uso' : ''}`}
						title={entry.nameCache}
						disabled={switchingId !== null}
						onclick={() => selectWorkspace(entry.workspaceId)}
					>
						<span class="workspace-item-name">{entry.nameCache}</span>
						<span class="workspace-item-backend">{storageLocationLabel(entry.storageKind)}</span>
						{#if entry.workspaceId === activeId}
							<span class="workspace-item-state">em uso</span>
						{:else if entry.status !== 'ready' && entry.status !== 'registered'}
							<span class="workspace-item-state">{statusLabel(entry.status)}</span>
						{/if}
						{#if switchingId === entry.workspaceId}
							<span class="workspace-item-state" role="status">abrindo…</span>
						{/if}
					</button>
				{/each}
			{/if}
			<div class="mobile-actions" role="group" aria-label="Ações do espaço de estudo">
				<button type="button" class="mobile-item mobile-action" onclick={handleCreate}>
					<Plus size={15} strokeWidth={2} aria-hidden="true" />
					<span>Criar espaço de estudo</span>
				</button>
				<button type="button" class="mobile-item mobile-action" onclick={handleAdd}>
					<FolderPlus size={15} strokeWidth={2} aria-hidden="true" />
					<span>Adicionar pasta existente</span>
				</button>
				<button type="button" class="mobile-item mobile-action" onclick={handleManage}>
					<Settings2 size={15} strokeWidth={2} aria-hidden="true" />
					<span>{manageLabel}</span>
				</button>
			</div>
		</div>
	{:else}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						type="button"
						variant="ghost"
						class="selector-trigger"
			aria-label={`Trocar de espaço de estudo, atual: ${activeName}, local: ${activeBackendLabel}`}
						title={activeName}
					>
						<span class="selector-avatar" aria-hidden="true">
							{activeName.trim().charAt(0).toUpperCase() || 'W'}
						</span>
						<span class="selector-copy">
							<span class="selector-name">{displayActiveName}</span>
							{#if !loading && activeBackend}
								<span class="selector-backend">{activeBackendLabel}</span>
							{/if}
						</span>
						<span class="selector-chevron" aria-hidden="true">
							<ChevronDown size={14} strokeWidth={1.8} />
						</span>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start" class="workspace-menu">
			<DropdownMenu.Label>Espaços de estudo</DropdownMenu.Label>
				{#if loading}
					<p class="menu-status" role="status">Abrindo espaço de estudo…</p>
				{:else if entries.length === 0}
					<p class="menu-status" role="status">
						Nenhum espaço de estudo cadastrado. Crie um novo ou adicione uma pasta existente.
					</p>
				{:else}
					<DropdownMenu.Group>
						{#each entries as entry (entry.workspaceId)}
							<DropdownMenu.Item
								class="workspace-item"
								aria-current={entry.workspaceId === activeId ? 'true' : undefined}
								aria-label={`${entry.nameCache}, ${storageLocationLabel(entry.storageKind)}${entry.workspaceId === activeId ? ', em uso' : ''}`}
								onclick={() => selectWorkspace(entry.workspaceId)}
							>
								<span class="workspace-item-copy">
									<span class="workspace-item-name">{entry.nameCache}</span>
									<span class="workspace-item-backend">{storageLocationLabel(entry.storageKind)}</span>
								</span>
								{#if entry.workspaceId === activeId}
									<span class="workspace-item-state">em uso</span>
								{:else if entry.status !== 'ready' && entry.status !== 'registered'}
								<span class="workspace-item-state">{statusLabel(entry.status)}</span>
								{/if}
								{#if switchingId === entry.workspaceId}
									<span class="workspace-item-state" role="status">abrindo…</span>
								{/if}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Group>
				{/if}
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="workspace-action" onclick={handleCreate}>
					<Plus size={14} strokeWidth={2} aria-hidden="true" />
					<span>Criar espaço de estudo</span>
				</DropdownMenu.Item>
				<DropdownMenu.Item class="workspace-action" onclick={handleAdd}>
					<FolderPlus size={14} strokeWidth={2} aria-hidden="true" />
					<span>Adicionar pasta existente</span>
				</DropdownMenu.Item>
				<DropdownMenu.Item class="workspace-action" onclick={handleManage}>
					<Settings2 size={14} strokeWidth={2} aria-hidden="true" />
					<span>{manageLabel}</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
	{#if error}
		<p class="selector-error" role="alert" aria-live="assertive">{error}</p>
	{/if}
	<p class="sr-only" role="status" aria-live="polite">{announcement}</p>
</div>

{#snippet createForm()}
	<form
		class="workspace-dialog-form"
		aria-busy={createSaving || undefined}
		onsubmit={(event) => {
			event.preventDefault();
			void submitCreate();
		}}
	>
		<div class="workspace-dialog-field">
			<label class="workspace-dialog-label" for="workspace-create-name">Nome do espaço de estudo</label>
			<input
				id="workspace-create-name"
				bind:this={createInput}
				class="workspace-dialog-input"
				type="text"
				bind:value={createName}
				autocomplete="off"
				maxlength={80}
				disabled={createSaving}
				aria-describedby="workspace-create-help"
			/>
			<p class="workspace-dialog-hint" id="workspace-create-help">
				{#if createKind === 'opfs'}
					Seus dados serão guardados de forma isolada neste navegador; nenhuma pasta do sistema será criada.
				{:else if createKind === 'native'}
					Escolha uma pasta vazia do computador para guardar este espaço de estudo.
				{:else}
					Escolha uma pasta vazia para guardar este espaço de estudo.
				{/if}
			</p>
		</div>
		{#if createCollision}
			<div class="workspace-dialog-collision" role="group" aria-label="Colisão de identidade">
				<p class="workspace-dialog-text">
					A pasta já pertence ao espaço de estudo “{createCollision.manifestName}”, que está cadastrado.
					Atualize a localização ou crie uma cópia independente.
				</p>
				<div class="workspace-dialog-row">
					<button
						type="button"
						class="workspace-dialog-secondary"
						onclick={() => void resolveCreateCollision('update')}
						disabled={createSaving}
					>
						Atualizar localização
					</button>
					<button
						type="button"
						class="workspace-dialog-secondary"
						onclick={() => void resolveCreateCollision('copy')}
						disabled={createSaving}
					>
						Criar cópia independente
					</button>
				</div>
			</div>
		{/if}
		{#if pendingActivation && pendingActivationFlow === 'create'}
			<div class="workspace-dialog-collision" role="group" aria-label="Ativação pendente">
				<p class="workspace-dialog-text">
					“{pendingActivation.workspaceName}” já está criado e cadastrado; só falta ativá-lo.
					Retentar não escolhe a pasta de novo.
				</p>
				<div class="workspace-dialog-row">
					<button
						type="button"
						class="workspace-dialog-primary"
						onclick={() => void retryPendingActivation()}
						disabled={createSaving}
					>
						Tentar ativar novamente
					</button>
				</div>
			</div>
		{/if}
		{#if createError}
			<p class="workspace-dialog-error" role="alert" aria-live="assertive">{createError}</p>
		{/if}
		<div class="workspace-dialog-row">
			<button
				type="button"
				class="workspace-dialog-secondary"
				onclick={closeCreate}
				disabled={createSaving}
			>
				Cancelar
			</button>
			<button
				type="submit"
				class="workspace-dialog-primary"
				disabled={createSaving || !createName.trim()}
			>
				{createSaving
					? 'Criando…'
					: createKind === 'opfs'
						? 'Criar espaço de estudo'
						: 'Escolher pasta e criar'}
			</button>
		</div>
	</form>
{/snippet}

{#snippet addForm()}
	<div class="workspace-dialog-form" aria-busy={addBusy || undefined}>
		{#if addKind === 'opfs'}
			<p class="workspace-dialog-text" role="status">
				Neste navegador, cada espaço de estudo fica separado. Crie um novo em vez de adicionar uma pasta.
			</p>
			<div class="workspace-dialog-row">
				<button
					type="button"
					class="workspace-dialog-secondary"
					onclick={closeAdd}
					disabled={addBusy}
				>
					Voltar
				</button>
				<button
					type="button"
					class="workspace-dialog-primary"
					onclick={() => {
						closeAdd();
						openCreate();
					}}
					disabled={addBusy}
				>
					Criar espaço de estudo
				</button>
			</div>
		{:else}
			<p class="workspace-dialog-text">
				Escolha a pasta de um espaço de estudo existente. O OpenBible verifica a pasta antes de adicioná-la;
				pastas comuns continuam sob seu controle.
			</p>
			{#if addCollision}
				<div class="workspace-dialog-collision" role="group" aria-label="Colisão de identidade">
					<p class="workspace-dialog-text">
					A pasta “{addCollision.manifestName}” já está cadastrada. Atualize a localização ou crie uma
					cópia independente.
					</p>
					<div class="workspace-dialog-row">
						<button
							type="button"
							class="workspace-dialog-secondary"
							onclick={() => void resolveAddCollision('update')}
							disabled={addBusy}
						>
							Atualizar localização
						</button>
						<button
							type="button"
							class="workspace-dialog-secondary"
							onclick={() => void resolveAddCollision('copy')}
							disabled={addBusy}
						>
							Criar cópia independente
						</button>
					</div>
				</div>
			{/if}
			{#if pendingActivation && pendingActivationFlow === 'add'}
				<div class="workspace-dialog-collision" role="group" aria-label="Ativação pendente">
					<p class="workspace-dialog-text">
						“{pendingActivation.workspaceName}” já está cadastrado; só falta abri-lo. Tentar novamente não
						escolhe a pasta de novo.
					</p>
					<div class="workspace-dialog-row">
						<button
							type="button"
							class="workspace-dialog-primary"
							onclick={() => void retryPendingActivation()}
							disabled={addBusy}
						>
							Tentar ativar novamente
						</button>
					</div>
				</div>
			{/if}
			{#if addError}
				<p class="workspace-dialog-error" role="alert" aria-live="assertive">{addError}</p>
			{/if}
			<div class="workspace-dialog-row">
				<button
					type="button"
					class="workspace-dialog-secondary"
					onclick={closeAdd}
					disabled={addBusy}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="workspace-dialog-primary"
					onclick={() => void submitAdd()}
					disabled={addBusy}
				>
					{addBusy ? 'Verificando…' : 'Escolher pasta'}
				</button>
			</div>
		{/if}
	</div>
{/snippet}

{#if createOpen}
	{#if isMobile.current}
		<Drawer.NestedRoot bind:open={createOpen}>
			<Drawer.Content class="workspace-dialog-drawer">
				<Drawer.Header>
					<Drawer.Title>Criar espaço de estudo</Drawer.Title>
					<Drawer.Description>Um espaço separado para suas notas, destaques e Bíblias.</Drawer.Description
					>
				</Drawer.Header>
				<div class="workspace-dialog-body">
					{@render createForm()}
				</div>
			</Drawer.Content>
		</Drawer.NestedRoot>
	{:else}
		<Dialog.Root bind:open={createOpen}>
			<Dialog.Content class="workspace-dialog" aria-describedby={undefined}>
				<Dialog.Title>Criar espaço de estudo</Dialog.Title>
				<Dialog.Description>Um espaço separado para suas notas, destaques e Bíblias.</Dialog.Description>
				{@render createForm()}
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{/if}

{#if addOpen}
	{#if isMobile.current}
		<Drawer.NestedRoot bind:open={addOpen}>
			<Drawer.Content class="workspace-dialog-drawer">
				<Drawer.Header>
					<Drawer.Title>Adicionar pasta existente</Drawer.Title>
					<Drawer.Description>Adicione uma pasta sem mover nenhum arquivo.</Drawer.Description>
				</Drawer.Header>
				<div class="workspace-dialog-body">
					{@render addForm()}
				</div>
			</Drawer.Content>
		</Drawer.NestedRoot>
	{:else}
		<Dialog.Root bind:open={addOpen}>
			<Dialog.Content class="workspace-dialog" aria-describedby={undefined}>
				<Dialog.Title>Adicionar pasta existente</Dialog.Title>
				<Dialog.Description>Adicione uma pasta sem mover nenhum arquivo.</Dialog.Description>
				{@render addForm()}
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{/if}

<style>
	.workspace-selector {
		width: 100%;
		min-width: 0;
	}

	.workspace-selector :global(.selector-trigger) {
		width: 100%;
		max-width: 100%;
		min-width: 0;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		min-height: 40px;
		border-radius: 8px;
		padding-inline: 10px;
		gap: 3px;
		font-size: 0.8rem;
		font-weight: 500;
		color: color-mix(in oklch, var(--sidebar-foreground) 80%, transparent);
	}

	.selector-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 7px;
		background: color-mix(in oklch, var(--sidebar-foreground) 10%, transparent);
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.selector-copy {
		display: flex;
		min-width: 0;
		overflow: hidden;
		flex: 1;
		flex-direction: column;
		align-items: flex-start;
		gap: 1px;
	}

	.selector-chevron {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		margin-inline-start: auto;
		color: var(--muted-foreground);
		transition: color 140ms ease, transform 140ms ease;
	}

	:global(.workspace-selector .selector-trigger[aria-expanded='true'] .selector-chevron) {
		color: var(--foreground);
		transform: rotate(180deg);
	}

	.selector-backend,
	.workspace-item-backend {
		display: block;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		min-width: 0;
		text-align: start;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 400;
		line-height: 1.25;
	}

	.workspace-selector :global(.selector-trigger:hover) {
		background: color-mix(in oklch, var(--sidebar-foreground) 6%, transparent);
		color: var(--sidebar-foreground);
	}

	.workspace-selector :global(.selector-trigger:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.mobile-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 100%;
		min-width: 0;
		max-height: min(60dvh, 480px);
		overflow-y: auto;
		padding: 4px 0 8px;
	}

	.mobile-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 44px;
		border: 0;
		border-radius: 10px;
		padding: 10px 12px;
		background: transparent;
		color: var(--foreground);
		font-size: 0.85rem;
		font-weight: 500;
		text-align: start;
	}

	.mobile-item:hover {
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
	}

	.mobile-item:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	.mobile-item:disabled {
		opacity: 0.6;
	}

	.mobile-item[aria-checked='true'] {
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
		font-weight: 600;
	}

	.mobile-actions {
		display: flex;
		flex-direction: column;
		gap: 2px;
		border-top: 1px solid var(--border);
		margin-top: 6px;
		padding-top: 8px;
	}

	.mobile-action {
		color: var(--foreground);
	}

	.selector-name {
		display: block;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		min-width: 0;
		flex: 1;
		text-align: start;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.75rem;
		font-weight: 550;
		letter-spacing: -0.02em;
		line-height: 1.35;
	}

	:global(.workspace-menu) {
		min-width: 280px;
		max-width: min(320px, calc(100vw - 32px));
	}

	:global(.workspace-item) {
		min-height: 44px;
		gap: 10px;
	}

	:global(.workspace-item[aria-current='true']) {
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
		font-weight: 600;
	}

	.workspace-item-copy {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 1px;
	}

	.workspace-item-name {
		overflow: hidden;
		min-width: 0;
		flex: 1;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.workspace-item-state {
		flex-shrink: 0;
		color: var(--muted-foreground);
		font-size: 0.7rem;
		font-weight: 500;
	}

	.workspace-item-backend {
		width: 100%;
		max-width: 100%;
		margin-inline-start: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.workspace-action) {
		gap: 8px;
	}

	.menu-status {
		margin: 0;
		padding: 8px 12px;
		color: var(--muted-foreground);
		font-size: 0.78rem;
		line-height: 1.45;
	}

	.selector-error {
		margin: 6px 2px 0;
		color: var(--destructive);
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	:global(.workspace-dialog) {
		max-height: min(90vh, 640px);
		overflow-y: auto;
	}

	:global(.workspace-dialog-drawer) {
		max-height: 90dvh;
		padding-inline: max(16px, env(safe-area-inset-left, 0px));
		padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
	}

	.workspace-dialog-body {
		overflow-y: auto;
		padding: 4px 16px 8px;
	}

	:global(.workspace-dialog-drawer > [data-slot='drawer-header']) {
		padding-inline: 16px;
	}

	.workspace-dialog-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 4px;
	}

	.workspace-dialog-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.workspace-dialog-label {
		font-size: 0.78rem;
		font-weight: 600;
	}

	.workspace-dialog-input {
		min-height: 44px;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0 12px;
		background: var(--background);
		color: var(--foreground);
		font: inherit;
		font-size: 0.9rem;
	}

	.workspace-dialog-input:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.workspace-dialog-hint {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
		line-height: 1.5;
	}

	.workspace-dialog-text {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.55;
	}

	.workspace-dialog-collision {
		display: flex;
		flex-direction: column;
		gap: 10px;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 12px;
	}

	.workspace-dialog-error {
		margin: 0;
		color: var(--destructive);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.workspace-dialog-row {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		margin-top: 4px;
	}

	.workspace-dialog-primary,
	.workspace-dialog-secondary {
		display: inline-flex;
		min-height: 44px;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		padding: 0 16px;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.workspace-dialog-primary {
		border: 1px solid var(--primary);
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.workspace-dialog-secondary {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--foreground);
	}

	.workspace-dialog-primary:focus-visible,
	.workspace-dialog-secondary:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.workspace-dialog-primary:disabled,
	.workspace-dialog-secondary:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	@media (prefers-reduced-motion: reduce) {
		.workspace-selector :global(.selector-trigger),
		.selector-chevron,
		.mobile-item {
			transition: none;
		}
	}
</style>
