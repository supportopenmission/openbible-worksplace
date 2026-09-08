<script lang="ts">
	import { onMount } from 'svelte';
	import { getSyncServerBaseUrl, getStoredAuthToken } from '../auth/auth-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import { FolderSync, RefreshCw, Cloud, AlertCircle } from '@lucide/svelte';

	interface CloudWorkspace {
		workspaceId: string;
		name: string;
		createdAt: string;
		updatedAt: string;
	}

	let workspaces = $state<CloudWorkspace[]>([]);
	let loading = $state(false);
	let error = $state('');

	async function fetchWorkspaces() {
		loading = true;
		error = '';

		try {
			const baseUrl = getSyncServerBaseUrl();
			const token = getStoredAuthToken();
			const response = await fetch(`${baseUrl}/v1/workspaces`, {
				headers: {
					'content-type': 'application/json',
					...(token ? { authorization: `Bearer ${token}` } : {})
				},
				credentials: 'include'
			});

			if (!response.ok) {
				if (response.status === 401) {
					error = 'Faça login para visualizar seus workspaces em nuvem.';
				} else {
					error = `Erro ao listar workspaces (${response.status}).`;
				}
				return;
			}

			const data = (await response.json()) as { workspaces: CloudWorkspace[] };
			workspaces = data.workspaces || [];
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

	onMount(() => {
		void fetchWorkspaces();
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
			disabled={loading}
			onclick={fetchWorkspaces}
			aria-label="Atualizar lista de workspaces"
		>
			<RefreshCw size={14} class={loading ? 'animate-spin' : ''} aria-hidden="true" />
			<span>Atualizar</span>
		</Button>
	</div>

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
				Ao salvar ou sincronizar suas notas neste dispositivo, seu workspace será registrado
				automaticamente em sua conta para sincronização com outros dispositivos.
			</p>
		</div>
	{:else}
		<div class="workspaces-table-wrapper">
			<table class="workspaces-table">
				<thead>
					<tr>
						<th scope="col">ID / Nome</th>
						<th scope="col">Última alteração</th>
					</tr>
				</thead>
				<tbody>
					{#each workspaces as ws (ws.workspaceId)}
						<tr>
							<td class="cell-primary">
								<span class="ws-name">{ws.name}</span>
								<span class="ws-id">{ws.workspaceId}</span>
							</td>
							<td class="cell-date">
								{formatDate(ws.updatedAt)}
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
		max-width: 540px;
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
		max-width: 360px;
		margin: 0;
		line-height: 1.4;
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
	}

	.workspaces-table tr:last-child td {
		border-bottom: none;
	}

	.cell-primary {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.ws-name {
		font-weight: 500;
		color: var(--foreground, #111827);
	}

	.ws-id {
		font-family: var(--font-mono, monospace);
		font-size: 0.6875rem;
		color: var(--muted-foreground, #6b7280);
	}

	.cell-date {
		color: var(--muted-foreground, #6b7280);
		white-space: nowrap;
		vertical-align: middle;
	}
</style>
