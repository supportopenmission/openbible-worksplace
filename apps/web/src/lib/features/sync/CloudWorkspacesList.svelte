<script lang="ts">
	import { onMount } from 'svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import {
		fetchUserCloudWorkspaces,
		isWorkspaceInLocalCatalog,
		linkAndDownloadCloudWorkspace,
		renameCloudWorkspace,
		deleteCloudWorkspace,
		type CloudWorkspaceItem
	} from './cloud-workspace-service';
	import { syncWorkspaceWithAccount } from './sync-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import {
		FolderSync,
		RefreshCw,
		Cloud,
		AlertCircle,
		CheckCircle2,
		Link2,
		Pencil,
		Trash2,
		Sparkles
	} from '@lucide/svelte';

	const workspaceState = getWorkspaceState();
	const isMobile = new IsMobile();

	let workspaces = $state<CloudWorkspaceItem[]>([]);
	let loading = $state(false);
	let error = $state('');
	let successMessage = $state('');
	let processingId = $state<string | null>(null);
	let renameTarget = $state<CloudWorkspaceItem | null>(null);
	let renameName = $state('');
	let renameError = $state('');
	let renameSubmitting = $state(false);

	const hasUnlinkedCloudWorkspaces = $derived(
		workspaces.length > 0 &&
		!workspaces.some((w) => w.workspaceId === workspaceState?.workspaceId)
	);

	async function fetchWorkspaces() {
		loading = true;
		error = '';

		try {
			workspaces = await fetchUserCloudWorkspaces();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Falha na conexão com o servidor de sincronização.';
		} finally {
			loading = false;
		}
	}

	function formatDate(isoString: string): string {
		try {
			const date = new Date(isoString);
			return new Intl.DateTimeFormat('pt-BR', {
				dateStyle: 'short',
				timeStyle: 'short'
			}).format(date);
		} catch {
			return isoString;
		}
	}

	async function handleLinkWorkspace(ws: CloudWorkspaceItem) {
		if (!workspaceState) return;
		processingId = ws.workspaceId;
		error = '';
		successMessage = '';

		try {
			const result = await linkAndDownloadCloudWorkspace(workspaceState, ws);
			if (result.success) {
				successMessage = `Workspace "${ws.name}" vinculado e sincronizado com sucesso neste aparelho!`;
				await fetchWorkspaces();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erro ao vincular workspace da nuvem.';
		} finally {
			processingId = null;
		}
	}

	async function handleOpenAndSync(ws: CloudWorkspaceItem) {
		if (!workspaceState) return;
		processingId = ws.workspaceId;
		error = '';
		successMessage = '';

		try {
			await workspaceState.flushAndSwitch(ws.workspaceId);
			if (workspaceState.storage) {
				await syncWorkspaceWithAccount({ storage: workspaceState.storage });
			}
			successMessage = `Workspace "${ws.name}" aberto e sincronizado!`;
			await fetchWorkspaces();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erro ao abrir e sincronizar workspace.';
		} finally {
			processingId = null;
		}
	}

	async function handleSyncActive(ws: CloudWorkspaceItem) {
		if (!workspaceState?.storage) return;
		processingId = ws.workspaceId;
		error = '';
		successMessage = '';

		try {
			const res = await syncWorkspaceWithAccount({ storage: workspaceState.storage });
			if (res.conflicts > 0) {
				successMessage = `Sincronizado! ${res.conflicts} conflito(s) preservados localmente para revisão.`;
			} else {
				successMessage = `Workspace "${ws.name}" sincronizado com sucesso (${res.pulled} alteraçõe(s) recebidas, ${res.accepted} enviadas).`;
			}
			await fetchWorkspaces();
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('openbible:workspace-content-changed', {
						detail: { workspaceId: ws.workspaceId }
					})
				);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Falha na sincronização do workspace.';
		} finally {
			processingId = null;
		}
	}

	function handleStartRename(ws: CloudWorkspaceItem) {
		renameTarget = ws;
		renameName = ws.name;
		renameError = '';
	}

	async function handleSaveRename() {
		if (!renameTarget) return;
		const trimmed = renameName.trim();
		if (!trimmed) {
			renameError = 'O nome do workspace não pode ser vazio.';
			return;
		}
		if (trimmed === renameTarget.name) {
			renameTarget = null;
			return;
		}

		renameSubmitting = true;
		renameError = '';
		error = '';
		successMessage = '';

		try {
			await renameCloudWorkspace(renameTarget.workspaceId, trimmed);
			successMessage = `Workspace renomeado para "${trimmed}".`;
			renameTarget = null;
			await fetchWorkspaces();
		} catch (err) {
			renameError = err instanceof Error ? err.message : 'Falha ao renomear workspace.';
		} finally {
			renameSubmitting = false;
		}
	}

	async function handleDeleteWorkspace(ws: CloudWorkspaceItem) {
		const confirmed = window.confirm(
			`Deseja realmente remover o workspace "${ws.name}" da nuvem?\n\nAs notas salvas localmente neste aparelho NÃO serão excluídas, mas o workspace deixará de sincronizar na nuvem.`
		);
		if (!confirmed) return;

		processingId = ws.workspaceId;
		error = '';
		successMessage = '';

		try {
			await deleteCloudWorkspace(ws.workspaceId);
			successMessage = `Workspace "${ws.name}" removido da nuvem com sucesso.`;
			await fetchWorkspaces();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Falha ao remover workspace da nuvem.';
		} finally {
			processingId = null;
		}
	}

	onMount(() => {
		void fetchWorkspaces();

		const listener = () => {
			void fetchWorkspaces();
		};
		window.addEventListener('openbible:workspace-content-changed', listener);
		window.addEventListener('openbible:workspace-activated', listener);

		return () => {
			window.removeEventListener('openbible:workspace-content-changed', listener);
			window.removeEventListener('openbible:workspace-activated', listener);
		};
	});
</script>

<div class="cloud-workspaces">
	<div class="header-row">
		<div class="title-group">
			<Cloud size={18} aria-hidden="true" />
			<h3 class="title">Workspaces na Nuvem</h3>
		</div>
		<Button
			variant="outline"
			size="sm"
			disabled={loading || processingId !== null}
			onclick={fetchWorkspaces}
			aria-label="Atualizar lista de workspaces"
		>
			<RefreshCw size={14} class={loading ? 'animate-spin' : ''} aria-hidden="true" />
			<span>Atualizar</span>
		</Button>
	</div>

	<p class="subtitle">
		Acesse suas notas em qualquer aparelho. Vários dispositivos podem estar conectados ao mesmo workspace com sincronização concorrente segura.
	</p>

	{#if successMessage}
		<div class="success-banner" role="status">
			<CheckCircle2 size={15} aria-hidden="true" />
			<span>{successMessage}</span>
		</div>
	{/if}

	{#if error}
		<div class="error-banner" role="alert">
			<AlertCircle size={15} aria-hidden="true" />
			<span>{error}</span>
		</div>
	{/if}

	{#if hasUnlinkedCloudWorkspaces}
		<div class="unlinked-alert-banner" role="region" aria-label="Aviso de workspace na nuvem">
			<div class="alert-banner-header">
				<Sparkles size={16} class="sparkle-highlight" aria-hidden="true" />
				<strong>Workspace na nuvem disponível</strong>
			</div>
			{#if workspaces.length === 1}
				<p class="alert-banner-text">
					Encontramos o workspace <strong>"{workspaces[0].name}"</strong> salvo na sua conta. Deseja vincular este aparelho a ele para carregar suas notas?
				</p>
				<div class="alert-banner-actions">
					<Button
						size="sm"
						disabled={processingId !== null}
						onclick={() => handleLinkWorkspace(workspaces[0])}
					>
						{#if processingId === workspaces[0].workspaceId}
							<RefreshCw size={13} class="animate-spin mr-1" aria-hidden="true" />
							<span>Baixando notas…</span>
						{:else}
							<Link2 size={13} class="mr-1" aria-hidden="true" />
							<span>Vincular e carregar notas</span>
						{/if}
					</Button>
				</div>
			{:else}
				<p class="alert-banner-text">
					Sua conta possui {workspaces.length} workspaces na nuvem. Clique em "Vincular a este aparelho" em um deles na tabela abaixo para carregar suas notas.
				</p>
			{/if}
		</div>
	{/if}

	{#if loading && workspaces.length === 0}
		<div class="loading-state" role="status">
			<span>Carregando workspaces remotos...</span>
		</div>
	{:else if workspaces.length === 0}
		<div class="empty-state">
			<FolderSync size={28} class="empty-icon" aria-hidden="true" />
			<p class="empty-title">Nenhum workspace na nuvem ainda</p>
			<p class="empty-desc">
				Ao clicar em "Sincronizar agora" abaixo, o workspace deste aparelho será registrado na sua conta e estará disponível para seus outros aparelhos.
			</p>
		</div>
	{:else}
		<div class="workspaces-table-wrapper">
			<table class="workspaces-table">
				<thead>
					<tr>
						<th scope="col">Workspace</th>
						<th scope="col" class="hide-mobile">Última alteração</th>
						<th scope="col" class="col-action">Ação</th>
					</tr>
				</thead>
				<tbody>
					{#each workspaces as ws (ws.workspaceId)}
						{@const isActive = workspaceState?.workspaceId === ws.workspaceId}
						{@const isLocal = isWorkspaceInLocalCatalog(ws.workspaceId)}
						{@const isBusy = processingId === ws.workspaceId}
						<tr>
							<td class="cell-primary">
								<div class="ws-name-row">
									<span class="ws-name">{ws.name}</span>
									<button
										type="button"
										class="icon-action-btn rename-btn"
										title="Renomear workspace"
										aria-label={`Renomear workspace ${ws.name}`}
										disabled={isBusy}
										onclick={() => handleStartRename(ws)}
									>
										<Pencil size={12} aria-hidden="true" />
									</button>
									{#if isActive}
										<span class="badge badge-active" title="Workspace atualmente ativo e em uso">Ativo</span>
									{:else if isLocal}
										<span class="badge badge-local" title="Já baixado neste aparelho">Neste aparelho</span>
									{/if}
								</div>
								<span class="ws-id">{ws.workspaceId}</span>
								<span class="ws-mobile-date">Última alteração: {formatDate(ws.updatedAt)}</span>
							</td>
							<td class="cell-date hide-mobile">
								{formatDate(ws.updatedAt)}
							</td>
							<td class="cell-action">
								<div class="actions-group">
									{#if isActive}
										<Button
											variant="outline"
											size="sm"
											disabled={isBusy}
											onclick={() => handleSyncActive(ws)}
										>
											{#if isBusy}
												<RefreshCw size={13} class="animate-spin mr-1" aria-hidden="true" />
												<span>Sincronizando…</span>
											{:else}
												<RefreshCw size={13} class="mr-1" aria-hidden="true" />
												<span>Sincronizar</span>
											{/if}
										</Button>
									{:else if isLocal}
										<Button
											variant="secondary"
											size="sm"
											disabled={isBusy}
											onclick={() => handleOpenAndSync(ws)}
										>
											{#if isBusy}
												<RefreshCw size={13} class="animate-spin mr-1" aria-hidden="true" />
												<span>Abrindo…</span>
											{:else}
												<span>Abrir e sincronizar</span>
											{/if}
										</Button>
									{:else}
										<Button
											variant="default"
											size="sm"
											disabled={isBusy}
											onclick={() => handleLinkWorkspace(ws)}
										>
											{#if isBusy}
												<RefreshCw size={13} class="animate-spin mr-1" aria-hidden="true" />
												<span>Baixando…</span>
											{:else}
												<Link2 size={13} class="mr-1" aria-hidden="true" />
												<span>Vincular a este aparelho</span>
											{/if}
										</Button>
									{/if}

									<button
										type="button"
										class="icon-action-btn delete-btn"
										title="Remover workspace da nuvem"
										disabled={isBusy}
										onclick={() => handleDeleteWorkspace(ws)}
									>
										<Trash2 size={14} aria-hidden="true" />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#snippet renameModalBody()}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				void handleSaveRename();
			}}
			class="rename-modal-form"
		>
			<div class="rename-field">
				<label for="rename-cloud-ws-input" class="rename-label">Nome do workspace</label>
				<Input
					id="rename-cloud-ws-input"
					type="text"
					bind:value={renameName}
					disabled={renameSubmitting}
					placeholder="Ex.: Meu Estudo Bíblico"
					required
				/>
				{#if renameError}
					<p class="rename-error" role="alert">{renameError}</p>
				{/if}
				<p class="rename-hint">
					O nome será atualizado na nuvem e refletido em todos os aparelhos sincronizados.
				</p>
			</div>

			<div class="rename-actions">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={renameSubmitting}
					onclick={() => {
						renameTarget = null;
					}}
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					size="sm"
					disabled={renameSubmitting || !renameName.trim()}
				>
					{renameSubmitting ? 'Salvando…' : 'Salvar nome'}
				</Button>
			</div>
		</form>
	{/snippet}

	{#if renameTarget}
		{#if isMobile.current}
			<Drawer.Root
				open={true}
				onOpenChange={(open) => {
					if (!open) renameTarget = null;
				}}
			>
				<Drawer.Content class="p-4">
					<Drawer.Header class="text-left px-0">
						<Drawer.Title>Renomear workspace</Drawer.Title>
						<Drawer.Description>
							Altere o nome deste workspace para identificá-lo em seus aparelhos.
						</Drawer.Description>
					</Drawer.Header>
					<div class="py-2">
						{@render renameModalBody()}
					</div>
				</Drawer.Content>
			</Drawer.Root>
		{:else}
			<Dialog.Root
				open={true}
				onOpenChange={(open) => {
					if (!open) renameTarget = null;
				}}
			>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Title>Renomear workspace</Dialog.Title>
					<Dialog.Description>
						Altere o nome deste workspace para identificá-lo em seus aparelhos.
					</Dialog.Description>
					{@render renameModalBody()}
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	{/if}
</div>

<style>
	.cloud-workspaces {
		border: 1px solid var(--border, #e5e7eb);
		background: var(--background, #ffffff);
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: 100%;
		font-family: inherit;
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.title-group {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--foreground, #111827);
	}

	.title {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0;
	}

	.subtitle {
		font-size: 0.8125rem;
		color: var(--muted-foreground, #6b7280);
		margin: -6px 0 0;
		line-height: 1.45;
	}

	.success-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.8125rem;
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
		border: 1px solid color-mix(in oklch, var(--foreground) 18%, transparent);
		color: var(--foreground);
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.8125rem;
		background: var(--destructive-subtle, #fef2f2);
		border: 1px solid var(--destructive-border, #fecaca);
		color: var(--destructive, #b91c1c);
	}

	.loading-state {
		font-size: 0.8125rem;
		color: var(--muted-foreground, #6b7280);
		padding: 16px 0;
		text-align: center;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 24px 16px;
		gap: 6px;
		border: 1px dashed var(--border, #e5e7eb);
		border-radius: 6px;
		background: var(--muted, #f9fafb);
	}

	:global(.empty-icon) {
		color: var(--muted-foreground, #9ca3af);
		margin-bottom: 4px;
	}

	.empty-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--foreground, #111827);
		margin: 0;
	}

	.empty-desc {
		font-size: 0.75rem;
		color: var(--muted-foreground, #6b7280);
		max-width: 420px;
		margin: 0;
		line-height: 1.45;
	}

	.workspaces-table-wrapper {
		border: 1px solid var(--border, #e5e7eb);
		border-radius: 6px;
		overflow: hidden;
	}

	.workspaces-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
		text-align: left;
	}

	.workspaces-table th {
		background: var(--muted, #f9fafb);
		padding: 8px 12px;
		font-weight: 600;
		color: var(--foreground, #374151);
		border-bottom: 1px solid var(--border, #e5e7eb);
	}

	.workspaces-table td {
		padding: 10px 12px;
		border-bottom: 1px solid var(--border, #f3f4f6);
		vertical-align: middle;
	}

	.workspaces-table tr:last-child td {
		border-bottom: none;
	}

	.cell-primary {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.ws-name-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.ws-name {
		font-weight: 550;
		color: var(--foreground, #111827);
	}

	.ws-id {
		font-family: var(--font-mono, monospace);
		font-size: 0.6875rem;
		color: var(--muted-foreground, #6b7280);
	}

	.ws-mobile-date {
		display: none;
		font-size: 0.6875rem;
		color: var(--muted-foreground, #6b7280);
	}

	.badge {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 1px 6px;
		border-radius: 999px;
		line-height: 1.3;
	}

	.badge-active {
		background: color-mix(in oklch, var(--foreground) 10%, transparent);
		color: var(--foreground);
		border: 1px solid color-mix(in oklch, var(--foreground) 20%, transparent);
	}

	.badge-local {
		background: var(--muted, #f3f4f6);
		color: var(--muted-foreground, #4b5563);
		border: 1px solid var(--border, #e5e7eb);
	}

	.cell-date {
		color: var(--muted-foreground, #6b7280);
		white-space: nowrap;
	}

	.col-action {
		text-align: right;
	}

	.actions-group {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
	}

	.unlinked-alert-banner {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px;
		border-radius: 8px;
		background: color-mix(in oklch, var(--foreground) 4%, transparent);
		border: 1px solid color-mix(in oklch, var(--foreground) 16%, transparent);
	}

	.alert-banner-header {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.875rem;
		color: var(--foreground);
	}

	:global(.sparkle-highlight) {
		color: #d97706;
	}

	.alert-banner-text {
		font-size: 0.8125rem;
		color: var(--muted-foreground);
		margin: 0;
		line-height: 1.45;
	}

	.alert-banner-text strong {
		color: var(--foreground);
	}

	.alert-banner-actions {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}

	.rename-modal-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.rename-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.rename-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--foreground);
	}

	.rename-hint {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		margin: 0;
	}

	.rename-error {
		font-size: 0.75rem;
		color: var(--destructive);
		margin: 0;
	}

	.rename-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 4px;
	}

	.icon-action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 5px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--muted-foreground);
		cursor: pointer;
		transition: color 0.15s ease, background-color 0.15s ease;
	}

	.icon-action-btn:hover:not(:disabled) {
		color: var(--foreground);
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
	}

	.icon-action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.delete-btn {
		color: var(--muted-foreground);
	}

	.delete-btn:hover:not(:disabled) {
		color: var(--destructive);
		background: var(--destructive-subtle);
	}

	@media (max-width: 640px) {
		.hide-mobile {
			display: none;
		}

		.ws-mobile-date {
			display: block;
			margin-top: 2px;
		}

		.workspaces-table th,
		.workspaces-table td {
			padding: 8px 10px;
		}
	}
</style>
