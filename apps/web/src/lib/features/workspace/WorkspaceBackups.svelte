<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import BackupRestorePanel from './BackupRestorePanel.svelte';
	import { getWorkspaceState } from './workspace-state.svelte';

	const { embedded = false }: { embedded?: boolean } = $props();
	const workspace = getWorkspaceState();
	const storage = $derived(workspace?.storage ?? null);

	function backendLabel(): string {
		return storage?.kind === 'native' ? 'SQLite nativo no desktop Tauri' : 'IndexedDB no PWA';
	}

	function requestBackup(mode: 'create' | 'restore') {
		window.dispatchEvent(
			new CustomEvent('openbible:backup-requested', {
				detail: {
					mode,
					backend: storage?.kind === 'native' ? 'sqlite' : 'indexeddb'
				}
			})
		);
	}
</script>

{#if workspace?.status === 'ready' || workspace?.status === 'permission-needed'}
	<section class="workspace-backups" class:embedded aria-labelledby="workspace-backups-heading">
		{#if !embedded}
			<div class="section-heading">
				<p class="eyebrow">Backup</p>
				<h2 id="workspace-backups-heading">Backup e restauração</h2>
				<p class="intro">
					Leve o conteúdo autoral para outro dispositivo ou restaure uma cópia sem substituir o
					workspace atual antes da confirmação.
				</p>
			</div>
		{:else}
			<h2 id="workspace-backups-heading" class="sr-only">Backup e restauração</h2>
			<p class="panel-lead">
				Crie uma cópia portátil ou restaure um pacote em um workspace novo. O conteúdo permanece no
				backend do ambiente: {backendLabel()}.
			</p>
		{/if}

		<section class="backup-actions" aria-labelledby="backup-actions-heading">
			<div>
				<p class="eyebrow">Operações do workspace ativo</p>
				<h3 id="backup-actions-heading">Levar ou restaurar seus dados</h3>
				<p class="switch-hint">
					Bíblias SQLite/WASM são opcionais e ficam separadas do conteúdo autoral por padrão.
				</p>
			</div>
			<div class="actions backup-action-buttons" aria-label="Ações de backup">
				<Button
					variant="default"
					type="button"
					data-backup-action="create"
					onclick={() => requestBackup('create')}
					disabled={!storage}
				>
					Criar backup
				</Button>
				<Button
					variant="outline"
					type="button"
					data-backup-action="restore"
					onclick={() => requestBackup('restore')}
					disabled={!storage}
				>
					Restaurar backup
				</Button>
			</div>
			{#if !storage}
				<p class="feedback" role="status" aria-live="polite">
					Configure um workspace antes de iniciar um backup.
				</p>
			{/if}
		</section>

		<BackupRestorePanel {storage} />
	</section>
{/if}

<style>
	.workspace-backups {
		width: 100%;
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

	.backup-actions {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 14px 24px;
		align-items: end;
		margin-top: 24px;
		padding: 18px 0;
		border-block: 1px solid var(--border);
	}

	.backup-actions h3 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.backup-actions .eyebrow {
		margin-bottom: 6px;
	}

	.backup-action-buttons {
		margin-top: 0;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.switch-hint,
	.feedback {
		margin: 8px 0 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.55;
	}

	.backup-actions > .feedback {
		grid-column: 1 / -1;
	}

	@media (max-width: 560px) {
		.backup-actions {
			grid-template-columns: 1fr;
			align-items: start;
		}

		.backup-action-buttons {
			margin-top: 0;
			flex-direction: column;
		}

		.backup-action-buttons :global(button) {
			width: 100%;
		}
	}
</style>
