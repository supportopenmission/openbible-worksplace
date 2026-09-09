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
				Leve suas notas e destaques para outro dispositivo ou restaure uma cópia sem substituir o
				espaço de estudo atual antes da confirmação.
				</p>
			</div>
		{:else}
			<h2 id="workspace-backups-heading" class="config-panel-heading">Backup e restauração</h2>
			<p class="panel-lead">
				Crie uma cópia dos seus dados ou restaure uma cópia em um novo espaço de estudo. Nada é
				substituído sem sua confirmação.
			</p>
			<details class="technical-details">
				<summary>Ver detalhes técnicos</summary>
				<p>Este dispositivo usa {backendLabel()} para guardar os dados localmente.</p>
			</details>
		{/if}

		<section class="backup-actions" aria-labelledby="backup-actions-heading">
			<div>
				<p class="eyebrow">Ações deste espaço de estudo</p>
				<h3 id="backup-actions-heading">Levar ou restaurar seus dados</h3>
				<p class="switch-hint">
					Bíblias importadas são opcionais e ficam separadas das suas notas e destaques por padrão.
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
					Configure um espaço de estudo antes de criar uma cópia.
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

	.config-panel-heading {
		margin: 0 0 8px;
		font-size: clamp(1.25rem, 3vw, 1.65rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.15;
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

	.technical-details {
		margin-top: 12px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		line-height: 1.5;
	}

	.technical-details summary {
		font-weight: 600;
		cursor: pointer;
	}

	.technical-details p {
		margin: 8px 0 0;
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

	@media (max-width: 767px) {
		.config-panel-heading {
			display: none;
		}
	}
</style>
