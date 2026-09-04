<script lang="ts">
	import { ArrowUpRight, BookOpen, NotebookPen, ScrollText } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createNote } from '$lib/features/notes/notes-repository';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	const workspace = getWorkspaceState();

	let creatingNote = $state(false);
	let createError = $state('');

	async function handleCreateNote() {
		if (!workspace?.storage || creatingNote) return;
		creatingNote = true;
		createError = '';
		try {
			const note = await createNote(workspace.storage);
			await goto(resolve(`/notes/${note.id}`));
		} catch {
			createError = 'Não foi possível criar a nota. Tente novamente.';
		} finally {
			creatingNote = false;
		}
	}
</script>

<section class="quick-actions" aria-labelledby="quick-actions-heading">
	<h2 id="quick-actions-heading" class="actions-title">Ações rápidas</h2>
	<div class="actions-grid">
		<a class="action-link" href={resolve('/bible')}>
			<span class="action-icon" aria-hidden="true"><BookOpen size={20} strokeWidth={1.8} /></span>
			<span class="action-text">
				<span class="action-label">Ler a Bíblia <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" /></span>
				<span class="action-description">Abra o leitor e continue seu estudo.</span>
			</span>
		</a>
		<button class="action-link" type="button" onclick={handleCreateNote} disabled={creatingNote}>
			<span class="action-icon" aria-hidden="true"><NotebookPen size={20} strokeWidth={1.8} /></span>
			<span class="action-text">
				<span class="action-label">Nova nota</span>
				<span class="action-description">
					{creatingNote ? 'Criando nota...' : 'Registre uma descoberta ou oração.'}
				</span>
			</span>
		</button>
		<a class="action-link" href={resolve('/sermons')}>
			<span class="action-icon" aria-hidden="true"><ScrollText size={20} strokeWidth={1.8} /></span>
			<span class="action-text">
				<span class="action-label">Novo sermão <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" /></span>
				<span class="action-description">Organize a mensagem que você vai compartilhar.</span>
			</span>
		</a>
	</div>
	{#if createError}
		<p class="actions-error" role="alert">{createError}</p>
	{/if}
</section>

<style>
	.quick-actions {
		margin-top: 40px;
	}

	.actions-title {
		margin: 0 0 16px;
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}

	.action-link {
		display: flex;
		gap: 14px;
		align-items: flex-start;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 16px;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 160ms ease,
			border-color 160ms ease;
	}

	.action-link:hover:not(:disabled) {
		border-color: var(--foreground);
		background: var(--muted);
	}

	.action-link:focus-visible {
		outline: 3px solid color-mix(in oklch, var(--ring) 45%, transparent);
		outline-offset: 2px;
	}

	.action-link:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.action-icon {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		flex: 0 0 40px;
		border-radius: 10px;
		color: var(--primary);
	}

	.action-text {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 4px;
	}

	.action-label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.92rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.action-description {
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.actions-error {
		margin: 12px 0 0;
		color: var(--destructive);
		font-size: 0.82rem;
	}

	@media (max-width: 767px) {
		.actions-grid {
			display: flex;
			padding-bottom: 4px;
			overflow-x: auto;
			scroll-snap-type: x proximity;
			scrollbar-width: none;
		}

		.actions-grid::-webkit-scrollbar {
			display: none;
		}

		.action-link {
			flex: 0 0 72%;
			scroll-snap-align: start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.action-link {
			transition: none;
		}
	}
</style>
