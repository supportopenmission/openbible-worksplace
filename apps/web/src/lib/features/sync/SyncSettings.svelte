<script lang="ts">
	import { onMount } from 'svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import SyncStatus from './SyncStatus.svelte';
	import type { SyncStatusKind } from './SyncStatus.svelte';
	import { configureHttpSync } from './sync-http-client';
	import { syncWorkspaceWithAccount } from './sync-client';
	import { getStoredAuthUser } from '../auth/auth-client';
	import {
		fetchUserCloudWorkspaces,
		linkAndDownloadCloudWorkspace,
		type CloudWorkspaceItem
	} from './cloud-workspace-service';
	import { RefreshCw, Link2, PlusCircle } from '@lucide/svelte';

	const workspace = getWorkspaceState();

	let syncEnabled = $state(false);
	let saving = $state(false);
	let message = $state('');
	let error = $state('');

	let linkDialogOpen = $state(false);
	let availableCloudWorkspaces = $state<CloudWorkspaceItem[]>([]);
	let linkingWorkspaceId = $state<string | null>(null);
	let importLocalNotes = $state(false);

	const backendLabel = $derived(
		workspace?.dataContext?.backend === 'sqlite' || workspace?.storage?.kind === 'native'
			? 'app.sqlite'
			: 'IndexedDB · openbible-workspace'
	);
	const workspaceLabel = $derived(workspace?.workspaceId ?? 'Workspace ativo');
	let syncStatus = $state<SyncStatusKind>('local');
	let lastSuccessAt = $state<string | null>(null);
	let lastErrorCode = $state<string | null>(null);

	function settingsKey(): string | null {
		const workspaceId = workspace?.workspaceId;
		return workspaceId ? `openbible:sync-settings:${workspaceId}` : null;
	}

	function persistSettings() {
		const key = settingsKey();
		if (!key) return;
		try {
			localStorage.setItem(key, JSON.stringify({ enabled: syncEnabled }));
		} catch {
			// A restricted browser keeps the setting in the current session only.
		}
	}

	onMount(() => {
		const key = settingsKey();
		if (!key) return;
		try {
			const value = JSON.parse(localStorage.getItem(key) ?? 'null') as {
				enabled?: boolean;
			} | null;
			if (!value) return;
			syncEnabled = value.enabled === true;
			if (syncEnabled) {
				syncStatus = 'synced';
			}
		} catch {
			// Invalid local settings are ignored and can be replaced by a new save.
		}
	});

	function handleToggleSync() {
		persistSettings();
		if (!syncEnabled) {
			if (workspace?.workspaceId) configureHttpSync(workspace.workspaceId, null);
			syncStatus = 'local';
			lastErrorCode = null;
			message = 'Sincronização remota desabilitada. As notas continuam somente neste dispositivo.';
		} else {
			message =
				'Sincronização remota habilitada. Clique em "Sincronizar agora" para sincronizar com o servidor.';
		}
	}

	async function saveSettings(forceNew = false) {
		message = '';
		error = '';
		saving = true;
		try {
			if (!syncEnabled) {
				if (workspace?.workspaceId) configureHttpSync(workspace.workspaceId, null);
				persistSettings();
				syncStatus = 'local';
				lastErrorCode = null;
				message = 'Sincronização desabilitada. As notas continuam somente neste dispositivo.';
				return;
			}
			if (!workspace?.storage) throw new Error('workspace_storage_unavailable');
			if (!workspace.workspaceId) throw new Error('workspace_id_required');

			const user = getStoredAuthUser();
			if (user && !forceNew) {
				try {
					const remoteWorkspaces = await fetchUserCloudWorkspaces();
					const alreadyLinked = remoteWorkspaces.some(
						(item) => item.workspaceId === workspace.workspaceId
					);
					if (!alreadyLinked && remoteWorkspaces.length > 0) {
						availableCloudWorkspaces = remoteWorkspaces;
						linkDialogOpen = true;
						saving = false;
						return;
					}
				} catch {
					// Segue para tentativa de sincronização normal caso a busca falhe
				}
			}

			await executeSync();
		} catch (caught) {
			syncStatus = 'error';
			lastErrorCode = caught instanceof Error ? caught.message : 'sync_connection_failed';
			message =
				lastErrorCode === 'unauthorized' ||
				(caught instanceof Error && caught.message.includes('401'))
					? 'Conecte sua conta para sincronizar este workspace com o servidor.'
					: 'A conexão com o servidor falhou; as alterações locais continuam salvas com segurança.';
		} finally {
			saving = false;
		}
	}

	async function executeSync() {
		if (!workspace?.storage) throw new Error('workspace_storage_unavailable');
		syncStatus = 'connecting';
		const result = await syncWorkspaceWithAccount({ storage: workspace.storage });
		lastSuccessAt = new Date().toISOString();
		lastErrorCode = result.conflicts > 0 ? 'sync_conflict' : null;
		if (result.conflicts > 0) {
			syncStatus = 'error';
			message = `${result.conflicts} conflito(s) foram preservados para revisão; as notas locais continuam disponíveis.`;
		} else {
			syncStatus = 'synced';
			message = 'Sincronização com o servidor concluída. As notas continuam disponíveis localmente.';
		}
		persistSettings();
	}

	async function handleChooseCloudWorkspace(cw: CloudWorkspaceItem) {
		if (!workspace) return;
		linkingWorkspaceId = cw.workspaceId;
		error = '';
		message = '';
		try {
			const res = await linkAndDownloadCloudWorkspace(workspace, cw, {
				importCurrentNotes: importLocalNotes
			});
			if (res.success) {
				linkDialogOpen = false;
				syncEnabled = true;
				syncStatus = 'synced';
				lastSuccessAt = new Date().toISOString();
				message = `Workspace "${cw.name}" vinculado com sucesso! As notas foram sincronizadas neste aparelho.`;
				persistSettings();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erro ao vincular workspace da nuvem.';
		} finally {
			linkingWorkspaceId = null;
		}
	}

	function handleSyncAsNew() {
		linkDialogOpen = false;
		void saveSettings(true);
	}
</script>

<section class="sync-settings" aria-labelledby="sync-settings-title">
	<div class="sync-heading">
		<div>
			<p class="sync-eyebrow">Storage / Workspace</p>
			<h2 id="sync-settings-title">Sincronização</h2>
			<p class="sync-description">
				Escolha se este workspace pode sincronizar documentos entre dispositivos. A rede é opcional;
				as notas continuam disponíveis localmente.
			</p>
		</div>
		<span
			class:active={syncEnabled}
			class="sync-state"
			aria-label={syncEnabled ? 'Sincronização ativa' : 'Sincronização local'}
		>
			{syncEnabled ? 'Ativa' : 'Somente local'}
		</span>
	</div>

	<div class="sync-summary" aria-label="Resumo do armazenamento">
		<div>
			<span>Backend das notas</span>
			<strong>{backendLabel}</strong>
		</div>
		<div>
			<span>Workspace</span>
			<strong class="technical-value">{workspaceLabel}</strong>
		</div>
	</div>

	<SyncStatus
		status={syncStatus}
		{lastSuccessAt}
		{lastErrorCode}
		onRetry={syncEnabled ? saveSettings : undefined}
	/>
	<label class="toggle-row">
		<input type="checkbox" bind:checked={syncEnabled} onchange={handleToggleSync} />
		<span>
			<strong>Permitir sincronização em nuvem</strong>
			<small>Desative para manter as notas deste workspace apenas neste dispositivo.</small>
		</span>
	</label>

	<div class="sync-actions">
		<Button type="button" onclick={() => saveSettings()} disabled={saving}>
			{saving ? 'Sincronizando…' : 'Sincronizar agora'}
		</Button>
		{#if message}
			<p class="feedback success" role="status">{message}</p>
		{/if}
		{#if error}
			<p class="feedback error" role="alert">{error}</p>
		{/if}
	</div>

	<Dialog.Root bind:open={linkDialogOpen}>
		<Dialog.Content class="cloud-link-dialog">
			<Dialog.Title>Vincular a um workspace na nuvem</Dialog.Title>
			<Dialog.Description>
				Sua conta possui {availableCloudWorkspaces.length} workspace(s) salvo(s) na nuvem. Você pode vincular este aparelho a um deles para puxar suas notas, ou sincronizar este workspace como um novo na nuvem.
			</Dialog.Description>

			<div class="cloud-workspaces-picker">
				{#each availableCloudWorkspaces as cw (cw.workspaceId)}
					{@const isLinking = linkingWorkspaceId === cw.workspaceId}
					<div class="cloud-picker-card">
						<div class="picker-info">
							<span class="picker-name">{cw.name}</span>
							<span class="picker-id">{cw.workspaceId}</span>
						</div>
						<Button
							size="sm"
							disabled={linkingWorkspaceId !== null}
							onclick={() => handleChooseCloudWorkspace(cw)}
						>
							{#if isLinking}
								<RefreshCw size={13} class="animate-spin mr-1" aria-hidden="true" />
								<span>Baixando…</span>
							{:else}
								<Link2 size={13} class="mr-1" aria-hidden="true" />
								<span>Vincular e puxar dados</span>
							{/if}
						</Button>
					</div>
				{/each}
			</div>

			<label class="merge-checkbox">
				<input type="checkbox" bind:checked={importLocalNotes} />
				<span>Copiar notas deste aparelho para o workspace vinculado</span>
			</label>

			<div class="dialog-separator">
				<span>ou</span>
			</div>

			<div class="dialog-actions-footer">
				<Button
					variant="outline"
					size="sm"
					disabled={linkingWorkspaceId !== null}
					onclick={handleSyncAsNew}
				>
					<PlusCircle size={14} class="mr-1" aria-hidden="true" />
					<span>Sincronizar como novo workspace na nuvem</span>
				</Button>
				<Button
					variant="ghost"
					size="sm"
					disabled={linkingWorkspaceId !== null}
					onclick={() => (linkDialogOpen = false)}
				>
					Cancelar
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</section>

<style>
	.sync-settings {
		display: grid;
		gap: 0;
		color: var(--foreground);
	}

	.sync-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 24px;
		padding: 12px 0 24px;
	}

	.sync-eyebrow {
		margin: 0 0 6px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	h2,
	p {
		margin: 0;
	}

	h2 {
		font-size: clamp(1.35rem, 2vw, 1.6rem);
		font-weight: 650;
		letter-spacing: -0.03em;
	}

	.sync-description,
	.toggle-row small {
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.sync-description {
		max-width: 58ch;
		margin-top: 8px;
	}

	.sync-state {
		flex-shrink: 0;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 5px 9px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.sync-state.active {
		border-color: var(--foreground);
		color: var(--foreground);
	}

	.sync-summary {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1px;
		border-block: 1px solid var(--border);
		background: var(--border);
	}

	.sync-summary > div {
		display: grid;
		gap: 5px;
		background: var(--background);
		padding: 14px 0;
	}

	.sync-summary span {
		color: var(--muted-foreground);
		font-size: 0.76rem;
	}

	.sync-summary strong {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.technical-value {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.78rem;
	}

	.toggle-row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		max-width: 620px;
		margin-top: 20px;
		margin-bottom: 8px;
		cursor: pointer;
	}

	.toggle-row strong {
		font-size: 0.84rem;
		font-weight: 550;
	}

	.toggle-row input {
		width: 18px;
		height: 18px;
		margin-top: 1px;
		accent-color: var(--foreground);
	}

	.toggle-row span {
		display: grid;
		gap: 3px;
	}

	.sync-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		padding-top: 20px;
	}

	.feedback {
		font-size: 0.82rem;
		line-height: 1.45;
	}

	.feedback.success {
		color: var(--foreground);
	}

	.feedback.error {
		color: var(--destructive);
	}

	@media (max-width: 640px) {
		.sync-heading {
			gap: 12px;
		}

		.sync-summary > div {
			padding: 12px 0;
		}
	}

	:global(.cloud-link-dialog) {
		max-width: 520px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.cloud-workspaces-picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 240px;
		overflow-y: auto;
		margin-top: 4px;
	}

	.cloud-picker-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--background);
	}

	.picker-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.picker-name {
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--foreground);
	}

	.picker-id {
		font-family: var(--font-mono, monospace);
		font-size: 0.68rem;
		color: var(--muted-foreground);
	}

	.merge-checkbox {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		font-size: 0.75rem;
		color: var(--muted-foreground);
		cursor: pointer;
		margin-top: 2px;
	}

	.merge-checkbox input {
		margin-top: 2px;
		accent-color: var(--foreground);
	}

	.dialog-separator {
		display: flex;
		align-items: center;
		text-align: center;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		text-transform: uppercase;
		margin: 4px 0;
	}

	.dialog-separator::before,
	.dialog-separator::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid var(--border);
	}

	.dialog-separator span {
		padding: 0 8px;
	}

	.dialog-actions-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
	}

	@media (prefers-reduced-motion: reduce) {
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
