<script lang="ts">
	import { onMount } from 'svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import {
		fetchUserCloudWorkspaces,
		isWorkspaceInLocalCatalog,
		linkAndDownloadCloudWorkspace,
		type CloudWorkspaceItem
	} from './cloud-workspace-service';
	import { syncWorkspaceWithAccount } from './sync-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		FolderSync,
		RefreshCw,
		Cloud,
		AlertCircle,
		CheckCircle2,
		Link2
	} from '@lucide/svelte';

	const workspaceState = getWorkspaceState();

	let workspaces = $state<CloudWorkspaceItem[]>([]);
	let loading = $state(false);
	let error = $state('');
	let successMessage = $state('');
	let processingId = $state<string | null>(null);

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
		} catch (err) {
			error = err instanceof Error ? err.message : 'Falha na sincronização do workspace.';
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
	{:else if loading && workspaces.length === 0}
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
									{#if isActive}
										<span class="badge badge-active" title="Workspace atualmente ativo e em uso">Ativo</span>
									{:else if isLocal}
										<span class="badge badge-local" title="Já baixado neste aparelho">Neste aparelho</span>
									{/if}
								</div>
								<span class="ws-id">{ws.workspaceId}</span>
							</td>
							<td class="cell-date hide-mobile">
								{formatDate(ws.updatedAt)}
							</td>
							<td class="cell-action">
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
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
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

	.cell-action {
		text-align: right;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.hide-mobile {
			display: none;
		}

		.workspaces-table th,
		.workspaces-table td {
			padding: 8px 10px;
		}
	}
</style>
