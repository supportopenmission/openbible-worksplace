<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	export interface PeerConflictSummary {
		documentId: string;
		workspaceId: string;
		backend: 'sqlite' | 'indexeddb';
		localPath: string;
		externalPath: string;
		status: 'needs-review';
		localVersionRecoverable: true;
		externalVersionRecoverable: true;
		overwrite: false;
	}

	interface PeerConflictPanelProps {
		conflict?: PeerConflictSummary | null;
		onKeepLocal?: () => void | Promise<void>;
		onReviewExternal?: () => void | Promise<void>;
	}

	const props: PeerConflictPanelProps = $props();
	const conflict = $derived(props.conflict ?? null);
	const onKeepLocal = $derived(props.onKeepLocal);
	const onReviewExternal = $derived(props.onReviewExternal);

	const backendLabel = $derived(
		conflict?.backend === 'sqlite' ? 'app.sqlite' : 'IndexedDB · openbible-workspace'
	);
</script>

{#if conflict}
	<section class="conflict-panel" aria-labelledby="peer-conflict-title">
		<div class="panel-heading">
			<div>
				<p class="panel-eyebrow">Revisão de sincronização</p>
				<h2 id="peer-conflict-title">Conflito precisa de uma decisão</h2>
			</div>
			<span class="conflict-state">Não aplicado</span>
		</div>

		<p class="panel-description">
			A alteração externa diverge do registro local. Nada será sobrescrito até uma ação explícita;
			as duas versões continuam recuperáveis.
		</p>

		<div class="conflict-summary" role="alert">
			<strong>Documento {conflict.documentId}</strong>
			<span>Backend operacional: {backendLabel}</span>
			<span>Workspace: <code>{conflict.workspaceId}</code></span>
		</div>

		<div class="versions" aria-label="Versões recuperáveis">
			<div class="version">
				<h3>Versão local</h3>
				<code>{conflict.localPath}</code>
				<p>Registro persistido preservado no backend operacional.</p>
			</div>
			<div class="version">
				<h3>Edição externa</h3>
				<code>{conflict.externalPath}</code>
				<p>Cópia de recovery preservada para inspeção antes do merge.</p>
			</div>
		</div>

		<div class="panel-actions">
			<Button type="button" variant="outline" onclick={onKeepLocal}>Manter versão local</Button>
			<Button type="button" onclick={onReviewExternal}>Revisar versão externa</Button>
		</div>
	</section>
{:else}
	<p class="empty-state" role="status">Nenhum conflito pendente neste workspace.</p>
{/if}

<style>
	.conflict-panel,
	.empty-state {
		border-block: 1px solid var(--border);
		padding: 18px 0;
		color: var(--foreground);
	}

	.conflict-panel {
		display: grid;
		gap: 16px;
	}

	.panel-heading,
	.panel-actions {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.panel-eyebrow,
	.panel-description,
	.version p,
	.conflict-summary,
	.empty-state {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.panel-eyebrow {
		margin-bottom: 4px;
		font-weight: 600;
	}

	h2,
	h3 {
		margin: 0;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	h2 {
		font-size: 1.1rem;
	}

	h3 {
		font-size: 0.9rem;
	}

	.conflict-state {
		flex: 0 0 auto;
		border: 1px solid var(--destructive);
		padding: 5px 8px;
		color: var(--destructive);
		font-size: 0.72rem;
		font-weight: 600;
	}

	.conflict-summary {
		display: grid;
		gap: 3px;
		border-inline-start: 2px solid var(--destructive);
		padding: 9px 12px;
		color: var(--foreground);
	}

	.conflict-summary span {
		color: var(--muted-foreground);
	}

	.versions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1px;
		background: var(--border);
	}

	.version {
		display: grid;
		align-content: start;
		gap: 7px;
		background: var(--background);
		padding: 14px;
	}

	.version code,
	.conflict-summary code {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.75rem;
		word-break: break-word;
	}

	.version p {
		font-size: 0.76rem;
	}

	.panel-actions {
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.empty-state {
		padding-block: 14px;
	}

	@media (max-width: 640px) {
		.panel-heading,
		.panel-actions {
			align-items: stretch;
			flex-direction: column;
		}

		.panel-actions :global(button) {
			width: 100%;
		}

		.versions {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.conflict-panel,
		.version {
			transition: none;
		}
	}
</style>
