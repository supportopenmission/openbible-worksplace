<script lang="ts">
	import { FolderOpen } from '@lucide/svelte';
	import { getWorkspaceState } from './workspace-state.svelte';

	const workspace = getWorkspaceState();

	let busy = $state(false);

	async function allowAccess() {
		if (!workspace || busy) return;
		busy = true;
		try {
			await workspace.grantPermission();
		} finally {
			busy = false;
		}
	}

	async function chooseFolder() {
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
</script>

<main class="permission-page">
	<p class="eyebrow">Acesso ao workspace</p>
	<h1>Permitir acesso à sua pasta</h1>
	<p class="lead">
		O OpenBible encontrou o workspace neste navegador, mas precisa da permissão de leitura e escrita
		para abrir os arquivos.
	</p>
	<div class="actions">
		<button class="primary" type="button" onclick={allowAccess} disabled={busy}>
			<FolderOpen size={16} strokeWidth={1.8} />
			{busy ? 'Solicitando acesso...' : 'Permitir acesso'}
		</button>
		<button class="secondary" type="button" onclick={chooseFolder} disabled={busy}>
			Escolher pasta novamente
		</button>
	</div>
	{#if workspace?.error}
		<p class="error" role="alert">{workspace.error}</p>
	{/if}
</main>

<style>
	.permission-page {
		max-width: 640px;
		margin: 0 auto;
		padding: max(64px, env(safe-area-inset-top)) 24px 48px;
	}

	.eyebrow {
		margin: 0 0 12px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 6vw, 3.25rem);
		font-weight: 600;
		letter-spacing: -0.05em;
		line-height: 1.05;
	}

	.lead {
		max-width: 520px;
		margin: 16px 0 0;
		color: var(--muted-foreground);
		line-height: 1.6;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 32px;
	}

	.primary,
	.secondary {
		display: inline-flex;
		min-height: 46px;
		align-items: center;
		gap: 8px;
		border-radius: var(--radius);
		padding: 0 16px;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 600;
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

	.primary:focus-visible,
	.secondary:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}

	.primary:disabled,
	.secondary:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.error {
		margin-top: 16px;
		color: var(--destructive);
		font-size: 0.88rem;
	}

	@media (max-width: 480px) {
		.actions {
			flex-direction: column;
		}

		.primary,
		.secondary {
			width: 100%;
			justify-content: center;
		}
	}
</style>
