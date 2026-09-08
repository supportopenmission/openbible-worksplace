<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getSyncServerBaseUrl,
		getDefaultSyncServerBaseUrl,
		setSyncServerBaseUrl,
		isCustomSyncServerConfigured
	} from './auth-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Server, Check, RotateCcw, AlertCircle } from '@lucide/svelte';

	interface Props {
		onchange?: () => void;
	}

	let { onchange }: Props = $props();

	let serverUrl = $state('');
	let defaultUrl = $state('');
	let isCustom = $state(false);
	let saving = $state(false);
	let message = $state('');
	let error = $state('');
	let isExpanded = $state(false);

	function refreshState() {
		serverUrl = getSyncServerBaseUrl();
		defaultUrl = getDefaultSyncServerBaseUrl();
		isCustom = isCustomSyncServerConfigured();
	}

	onMount(() => {
		refreshState();
	});

	async function handleSave(event: SubmitEvent) {
		event.preventDefault();
		message = '';
		error = '';

		const trimmed = serverUrl.trim();
		if (!trimmed) {
			error = 'Informe a URL do servidor de sincronização.';
			return;
		}

		try {
			const parsed = new URL(trimmed);
			if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
				error = 'A URL deve utilizar HTTP ou HTTPS.';
				return;
			}
		} catch {
			error = 'Formato de URL inválido. Ex: https://sync.meudominio.com';
			return;
		}

		saving = true;
		try {
			setSyncServerBaseUrl(trimmed);
			refreshState();
			message = 'Servidor de sincronização atualizado com sucesso!';
			onchange?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Falha ao salvar configuração do servidor.';
		} finally {
			saving = false;
		}
	}

	function handleReset() {
		setSyncServerBaseUrl(null);
		refreshState();
		message = 'Servidor restaurado para o padrão!';
		error = '';
		onchange?.();
	}
</script>

<div class="server-config-card">
	<button
		type="button"
		class="server-header-toggle"
		aria-expanded={isExpanded}
		onclick={() => (isExpanded = !isExpanded)}
	>
		<div class="server-title-group">
			<Server size={16} aria-hidden="true" />
			<span class="server-title">Servidor de Sincronização (Self-hosted)</span>
		</div>
		<div class="server-badge-group">
			{#if isCustom}
				<span class="badge custom">Personalizado</span>
			{:else}
				<span class="badge default">Padrão</span>
			{/if}
			<span class="toggle-icon" aria-hidden="true">{isExpanded ? '−' : '+'}</span>
		</div>
	</button>

	{#if isExpanded}
		<form class="server-body" onsubmit={handleSave}>
			<p class="server-desc">
				Você pode apontar o OpenBible para a sua própria instância do servidor de sincronização.
				O valor padrão pode ser definido via variável de ambiente <code>PUBLIC_SYNC_SERVER_URL</code>.
			</p>

			{#if message}
				<div class="server-alert success" role="status">
					<Check size={14} aria-hidden="true" />
					<span>{message}</span>
				</div>
			{/if}

			{#if error}
				<div class="server-alert error" role="alert">
					<AlertCircle size={14} aria-hidden="true" />
					<span>{error}</span>
				</div>
			{/if}

			<div class="form-group">
				<label for="sync-server-url" class="form-label">
					URL do Servidor
					{#if defaultUrl}
						<span class="label-hint">(padrão: {defaultUrl})</span>
					{/if}
				</label>
				<input
					id="sync-server-url"
					type="url"
					class="form-input"
					placeholder="http://localhost:8787"
					bind:value={serverUrl}
					required
				/>
			</div>

			<div class="server-actions">
				{#if isCustom}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={handleReset}
						disabled={saving}
					>
						<RotateCcw size={13} aria-hidden="true" />
						<span>Restaurar padrão</span>
					</Button>
				{/if}
				<Button type="submit" size="sm" disabled={saving}>
					<Check size={13} aria-hidden="true" />
					<span>{saving ? 'Salvando...' : 'Salvar servidor'}</span>
				</Button>
			</div>
		</form>
	{/if}
</div>

<style>
	.server-config-card {
		border: 1px solid var(--border, #e5e7eb);
		background: var(--background, #ffffff);
		border-radius: 8px;
		overflow: hidden;
		max-width: 540px;
		width: 100%;
		font-family: inherit;
	}

	.server-header-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: var(--muted, #f9fafb);
		border: none;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: background 0.15s ease;
	}

	.server-header-toggle:hover {
		background: var(--accent, #f3f4f6);
	}

	.server-title-group {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--foreground, #111827);
	}

	.server-title {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.server-badge-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.badge {
		font-size: 0.6875rem;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: 9999px;
	}

	.badge.default {
		background: var(--secondary, #f3f4f6);
		color: var(--muted-foreground, #6b7280);
		border: 1px solid var(--border, #e5e7eb);
	}

	.badge.custom {
		background: #eff6ff;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
	}

	.toggle-icon {
		font-size: 1rem;
		font-weight: 600;
		color: var(--muted-foreground, #6b7280);
		width: 16px;
		text-align: center;
	}

	.server-body {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		border-top: 1px solid var(--border, #e5e7eb);
	}

	.server-desc {
		font-size: 0.75rem;
		color: var(--muted-foreground, #6b7280);
		line-height: 1.4;
		margin: 0;
	}

	.server-desc code {
		font-family: var(--font-mono, monospace);
		background: var(--muted, #f3f4f6);
		padding: 1px 4px;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.server-alert {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.8125rem;
		line-height: 1.4;
	}

	.server-alert.success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #15803d;
	}

	.server-alert.error {
		background: var(--destructive-subtle, #fef2f2);
		border: 1px solid var(--destructive-border, #fecaca);
		color: var(--destructive, #b91c1c);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--foreground, #111827);
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.label-hint {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--muted-foreground, #6b7280);
	}

	.form-input {
		height: 36px;
		padding: 0 12px;
		border-radius: 6px;
		border: 1px solid var(--input, #d1d5db);
		background: var(--background, #ffffff);
		color: var(--foreground, #111827);
		font-size: 0.875rem;
		font-family: var(--font-mono, monospace);
		outline: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.form-input:focus-visible {
		border-color: var(--foreground, #111827);
		box-shadow: 0 0 0 1px var(--foreground, #111827);
	}

	.server-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 4px;
	}
</style>
