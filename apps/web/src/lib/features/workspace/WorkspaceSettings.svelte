<script lang="ts">
	import { resolve } from '$app/paths';
	import { detectStorageKind } from '$lib/storage/environment';
	import RemoteBibleImport from '$lib/features/bible-remote/RemoteBibleImport.svelte';
	import { getWorkspaceState } from './workspace-state.svelte';

	const workspace = getWorkspaceState();

	let { embedded = false }: { embedded?: boolean } = $props();

	let busy = $state(false);
	let persistMessage = $state('');

	let kind = $derived(workspace?.storage?.kind ?? detectStorageKind());
	let importLabel = $derived(
		workspace?.config?.bibleImportStatus === 'complete'
			? 'Bíblias prontas'
			: workspace?.config?.bibleImportStatus === 'partial'
				? 'Importação parcial'
				: 'Bíblias pendentes'
	);

	let persistLabel = $derived(
		workspace?.persisted === true
			? 'Este navegador pediu para manter os dados deste site.'
			: workspace?.persisted === false
				? 'O armazenamento ainda pode ser limpo pelo navegador.'
				: 'Este navegador não informa se o armazenamento é persistente.'
	);

	async function persistOrigin() {
		if (!workspace || busy) return;
		busy = true;
		persistMessage = '';
		try {
			await workspace.persistOrigin();
			persistMessage = workspace.persisted
				? 'O navegador vai tentar preservar os arquivos deste site.'
				: 'O navegador não confirmou a persistência. Os arquivos continuam neste dispositivo, mas podem ser limpos em falta de espaço.';
		} finally {
			busy = false;
		}
	}

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
</script>

{#if workspace?.status === 'ready' || workspace?.status === 'permission-needed'}
	<section class="workspace-settings" class:embedded aria-labelledby="workspace-settings-heading">
		{#if !embedded}
			<div class="section-heading">
				<p class="eyebrow">Workspace</p>
				<h2 id="workspace-settings-heading">Onde seus arquivos ficam</h2>
				<p class="intro">
					Markdown, JSON e SQLite permanecem no armazenamento escolhido. As preferências também ficam
					em <code>.openbible/preferences.json</code>.
				</p>
			</div>
		{:else}
			<h2 id="workspace-settings-heading" class="sr-only">Armazenamento do workspace</h2>
			<p class="panel-lead">
				Seus arquivos e preferências ficam em <code>.openbible/preferences.json</code> dentro do
				workspace escolhido.
			</p>
		{/if}

		<dl class="facts">
			<div>
				<dt>Tipo</dt>
				<dd>{kind === 'local' ? 'Pasta do computador' : 'OPFS do navegador'}</dd>
			</div>
			<div>
				<dt>Nome</dt>
				<dd>{workspace.config?.label ?? workspace.storage?.label ?? 'Workspace'}</dd>
			</div>
			<div>
				<dt>Bíblias</dt>
				<dd>{importLabel}</dd>
			</div>
			<div>
				<dt>Persistência do navegador</dt>
				<dd>{persistLabel}</dd>
			</div>
		</dl>

		<div class="actions">
			<a class="secondary" href={`${resolve('/')}?import=bible`}>Importar Bíblias</a>
			{#if workspace.storage?.kind === 'local'}
				<button class="secondary" type="button" onclick={reconnectFolder} disabled={busy}>
					Escolher pasta
				</button>
			{/if}
			{#if workspace.persisted !== true}
				<button class="primary" type="button" onclick={persistOrigin} disabled={busy}>
					Manter dados neste dispositivo
				</button>
			{/if}
		</div>
		{#if persistMessage}
			<p class="feedback" aria-live="polite">{persistMessage}</p>
		{/if}
		{#if workspace.error}
			<p class="error" role="alert">{workspace.error}</p>
		{/if}

		<div class="remote-block">
			<RemoteBibleImport storage={workspace.storage} variant="config" />
		</div>
	</section>
{/if}

<style>
	.workspace-settings {
		max-width: 680px;
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

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
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
	.secondary {
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

	.primary:focus-visible,
	.secondary:focus-visible {
		outline: 3px solid color-mix(in oklch, var(--ring) 35%, transparent);
		outline-offset: 2px;
	}

	.primary:disabled,
	.secondary:disabled {
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

	.remote-block {
		margin-top: 28px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
	}

	@media (max-width: 560px) {
		.actions {
			flex-direction: column;
		}

		.primary,
		.secondary {
			width: 100%;
		}
	}
</style>
