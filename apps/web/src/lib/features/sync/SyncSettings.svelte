<script lang="ts">
	import { onMount } from 'svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import SyncStatus from './SyncStatus.svelte';
	import type { SyncStatusKind } from './SyncStatus.svelte';
	import {
		configureHttpSync
	} from './sync-http-client';
	import { syncWorkspaceWithAccount } from './sync-client';

	const workspace = getWorkspaceState();

	let syncEnabled = $state(false);
	let saving = $state(false);
	let message = $state('');
	let error = $state('');

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

	async function saveSettings() {
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
		<Button type="button" onclick={saveSettings} disabled={saving}>
			{saving ? 'Sincronizando…' : 'Sincronizar agora'}
		</Button>
		{#if message}
			<p class="feedback success" role="status">{message}</p>
		{/if}
		{#if error}
			<p class="feedback error" role="alert">{error}</p>
		{/if}
	</div>
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

	@media (prefers-reduced-motion: reduce) {
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
