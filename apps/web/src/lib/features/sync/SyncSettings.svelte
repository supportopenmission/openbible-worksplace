<script lang="ts">
	import { onMount } from 'svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import SyncStatus from './SyncStatus.svelte';
	import type { SyncStatusKind } from './SyncStatus.svelte';
	import {
		configureHttpSync,
		getHttpSyncDeviceId,
		syncWorkspaceHttp,
		validateHttpSyncEndpoint
	} from './sync-http-client';

	const workspace = getWorkspaceState();

	let syncEnabled = $state(false);
	let endpoint = $state('');
	let token = $state('');
	let deviceId = $state('');
	let scope = $state('Notas e destaques deste workspace');
	let peerId = $state('');
	let pairedPeer = $state('');
	let saving = $state(false);
	let pairing = $state(false);
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
			localStorage.setItem(
				key,
				JSON.stringify({ enabled: syncEnabled, endpoint, scope, pairedPeer })
			);
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
				endpoint?: string;
				scope?: string;
				pairedPeer?: string;
			} | null;
			if (!value) return;
			syncEnabled = value.enabled === true;
			endpoint = typeof value.endpoint === 'string' ? value.endpoint : '';
			scope = typeof value.scope === 'string' ? value.scope : scope;
			pairedPeer = typeof value.pairedPeer === 'string' ? value.pairedPeer : '';
			deviceId = getHttpSyncDeviceId();
		} catch {
			// Invalid local settings are ignored and can be replaced by a new save.
		}
	});

	function validateEndpoint(): boolean {
		if (!syncEnabled) return true;
		if (!endpoint.trim()) {
			error = 'Informe o endpoint HTTPS seguro do workspace.';
			return false;
		}
		if (!validateHttpSyncEndpoint(endpoint.trim())) {
			error = 'Use um endpoint HTTPS; HTTP só é aceito em localhost para desenvolvimento.';
			return false;
		}
		if (!token.trim()) {
			error = 'Informe o token de acesso. Ele fica somente nesta sessão.';
			return false;
		}
		return true;
	}

	async function saveSettings() {
		message = '';
		error = '';
		if (!validateEndpoint()) return;
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
			deviceId ||= getHttpSyncDeviceId();
			configureHttpSync(workspace.workspaceId, {
				endpoint: endpoint.trim(),
				token: token.trim(),
				deviceId
			});
			const result = await syncWorkspaceHttp(workspace.storage, {
				endpoint: endpoint.trim(),
				token: token.trim(),
				deviceId
			});
			lastSuccessAt = new Date().toISOString();
			lastErrorCode = result.conflicts > 0 ? 'sync_conflict' : null;
			if (result.conflicts > 0) {
				syncStatus = 'error';
				message = `${result.conflicts} conflito(s) foram preservados para revisão; as notas locais continuam disponíveis.`;
			} else {
				syncStatus = 'synced';
				message = 'Sincronização concluída. As notas continuam disponíveis localmente.';
			}
			persistSettings();
		} catch (caught) {
			syncStatus = 'error';
			lastErrorCode = caught instanceof Error ? caught.message : 'sync_connection_failed';
			message = 'A conexão remota falhou; as alterações locais continuam disponíveis.';
		} finally {
			saving = false;
		}
	}

	async function pairDevice() {
		message = '';
		error = '';
		const normalized = peerId.trim();
		if (!normalized) {
			error = 'Informe um identificador para vincular o dispositivo.';
			return;
		}
		pairing = true;
		try {
			await Promise.resolve();
			pairedPeer = normalized;
			peerId = '';
			persistSettings();
			message = `Dispositivo “${normalized}” vinculado somente a este workspace.`;
		} finally {
			pairing = false;
		}
	}

	function revokeDevice() {
		if (!pairedPeer) return;
		message = `Dispositivo “${pairedPeer}” revogado. Cópias locais não são apagadas.`;
		pairedPeer = '';
		persistSettings();
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

	<div class="sync-section">
		<div class="sync-section-heading">
			<h3>Escopo</h3>
			<p>O escopo fica preso ao workspace ativo e não inclui paths, handles ou o banco bruto.</p>
		</div>
		<label class="field">
			<span>Documentos elegíveis</span>
			<input bind:value={scope} aria-describedby="sync-scope-help" />
			<small id="sync-scope-help">Por enquanto, notas e destaques deste workspace.</small>
		</label>
	</div>

	<div class="sync-section">
		<div class="sync-section-heading">
			<h3>Transporte</h3>
			<p>
				O primeiro transporte remoto usa uma API HTTPS incremental. O serviço pode observar ou reter
				o estado sincronizado; esta versão não oferece E2EE.
			</p>
		</div>
		<label class="toggle-row">
			<input type="checkbox" bind:checked={syncEnabled} />
			<span>
				<strong>Permitir sincronização remota</strong>
				<small>Desative para continuar em modo local sem chamadas de rede.</small>
			</span>
		</label>
		<label class="field">
			<span>Endpoint HTTPS da API</span>
			<input
				bind:value={endpoint}
				type="url"
				placeholder="https://sync.exemplo.workers.dev"
				disabled={!syncEnabled}
				aria-describedby="sync-endpoint-help"
			/>
			<small id="sync-endpoint-help">Use HTTPS em produção; HTTP só funciona em localhost.</small>
		</label>
		<label class="field">
			<span>Token da API</span>
			<input
				bind:value={token}
				type="password"
				placeholder="Token do workspace"
				disabled={!syncEnabled}
				aria-describedby="sync-token-help"
			/>
			<small id="sync-token-help"
				>O token não é salvo no localStorage, IndexedDB, SQLite ou exportações.</small
			>
		</label>
	</div>

	<div class="sync-section">
		<div class="sync-section-heading">
			<h3>Dispositivos autorizados</h3>
			<p>O vínculo é limitado ao workspace atual. Revogar não apaga cópias já entregues.</p>
		</div>
		{#if pairedPeer}
			<div class="peer-row">
				<div>
					<strong class="technical-value">{pairedPeer}</strong>
					<small>Autorizado neste workspace</small>
				</div>
				<Button type="button" variant="outline" size="sm" onclick={revokeDevice}>Revogar</Button>
			</div>
		{:else}
			<div class="pair-row">
				<label class="field">
					<span>ID do dispositivo</span>
					<input bind:value={peerId} placeholder="ex.: notebook-estudo" />
				</label>
				<Button type="button" size="sm" onclick={pairDevice} disabled={pairing}>
					{pairing ? 'Vinculando…' : 'Vincular dispositivo'}
				</Button>
			</div>
		{/if}
	</div>

	<div class="sync-actions">
		<Button type="button" onclick={saveSettings} disabled={saving}>
			{saving ? 'Salvando…' : 'Salvar sincronização'}
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
	h3,
	p {
		margin: 0;
	}

	h2 {
		font-size: clamp(1.35rem, 2vw, 1.6rem);
		font-weight: 650;
		letter-spacing: -0.03em;
	}

	h3 {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.sync-description,
	.sync-section-heading p,
	.field small,
	.toggle-row small,
	.peer-row small {
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

	.sync-section {
		display: grid;
		grid-template-columns: minmax(160px, 0.7fr) minmax(0, 1.3fr);
		gap: 28px;
		border-bottom: 1px solid var(--border);
		padding: 22px 0;
	}

	.sync-section-heading {
		display: grid;
		align-content: start;
		gap: 7px;
	}

	.field {
		display: grid;
		max-width: 620px;
		gap: 7px;
	}

	.field > span,
	.toggle-row strong {
		font-size: 0.84rem;
		font-weight: 550;
	}

	.field input {
		min-height: 40px;
		border: 1px solid var(--input);
		border-radius: 6px;
		background: var(--background);
		padding: 8px 10px;
		color: var(--foreground);
		font: inherit;
		font-size: 0.86rem;
	}

	.field input:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.field input:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.toggle-row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		max-width: 620px;
		margin-bottom: 18px;
		cursor: pointer;
	}

	.toggle-row input {
		width: 18px;
		height: 18px;
		margin-top: 1px;
		accent-color: var(--foreground);
	}

	.toggle-row span,
	.peer-row > div {
		display: grid;
		gap: 3px;
	}

	.pair-row {
		display: flex;
		align-items: end;
		gap: 12px;
		max-width: 620px;
	}

	.pair-row .field {
		flex: 1;
	}

	.peer-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		max-width: 620px;
		border: 1px solid var(--border);
		padding: 12px;
	}

	.sync-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		padding-top: 22px;
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

		.sync-section {
			grid-template-columns: 1fr;
			gap: 14px;
			padding: 20px 0;
		}

		.sync-summary > div {
			padding: 12px 0;
		}

		.pair-row {
			align-items: stretch;
			flex-direction: column;
		}

		.pair-row :global(button) {
			align-self: flex-start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
