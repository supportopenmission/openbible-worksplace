<script lang="ts">
	import { Pencil, Trash2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Note } from './note-types';

	let {
		notes,
		onOpen,
		onDelete
	}: {
		notes: Note[];
		onOpen: (noteId: string) => void;
		onDelete: (note: Note, event: MouseEvent) => void;
	} = $props();

	function formatDate(iso: string): string {
		if (!iso) return '—';
		return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(iso));
	}
</script>

<div class="card-list" data-testid="notes-card-list" aria-label="Notas">
	{#each notes as note (note.id)}
		<article class="note-card">
			<button type="button" class="card-main" onclick={() => onOpen(note.id)}>
				<span class="card-title">{note.title || 'Sem título'}</span>
				<span class="card-meta">
					<span class="mono">{note.id}</span>
					<span aria-hidden="true">·</span>
					<span>{formatDate(note.updatedAt)}</span>
				</span>
			</button>
			<div class="card-actions">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={`Editar nota ${note.title || note.id}`}
					onclick={() => onOpen(note.id)}
				>
					<Pencil size={15} strokeWidth={1.75} aria-hidden="true" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={`Apagar nota ${note.title || note.id}`}
					onclick={(event) => onDelete(note, event)}
				>
					<Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
				</Button>
			</div>
		</article>
	{:else}
		<p class="empty">Nenhuma nota ainda.</p>
	{/each}
</div>

<style>
	.card-list { display: none; }

	@media (max-width: 767px) {
		.card-list {
			display: grid;
			gap: 0;
		}

		.note-card {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
			border-bottom: 1px solid var(--border);
		}

		.card-main {
			display: flex;
			min-width: 0;
			min-height: 68px;
			flex-direction: column;
			justify-content: center;
			gap: 6px;
			border: 0;
			background: transparent;
			padding: 12px 8px 12px 0;
			color: inherit;
			font: inherit;
			text-align: left;
			cursor: pointer;
		}

		.card-main:focus-visible {
			outline: 2px solid var(--ring);
			outline-offset: -2px;
		}

		.card-title {
			overflow: hidden;
			font-size: 0.925rem;
			font-weight: 550;
			line-height: 1.35;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.card-meta {
			display: flex;
			min-width: 0;
			align-items: center;
			gap: 6px;
			color: var(--muted-foreground);
			font-size: 0.72rem;
		}

		.mono {
			overflow: hidden;
			font-family: var(--font-mono);
			text-overflow: ellipsis;
		}

		.card-actions {
			display: flex;
			align-items: center;
		}

		.empty {
			margin: 0;
			border-bottom: 1px solid var(--border);
			padding: 28px 0;
			color: var(--muted-foreground);
			font-size: 0.875rem;
			text-align: center;
		}
	}
</style>
