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
		try {
			return new Intl.DateTimeFormat('pt-BR', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<div class="card-list" data-testid="notes-card-list" aria-label="Notas">
	{#each notes as note (note.id)}
		<article class="note-card">
			<button type="button" class="card-main" onclick={() => onOpen(note.id)}>
				<span class="card-title">{note.title || 'Sem título'}</span>
				<span class="card-meta">{formatDate(note.updatedAt)}</span>
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
	.card-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 12px;
		margin-top: 24px;
	}

	.note-card {
		display: flex;
		min-width: 0;
		flex-direction: column;
		justify-content: space-between;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: transparent;
		transition: background 160ms ease;
	}

	.note-card:hover {
		background: color-mix(in oklch, var(--foreground) 3.5%, transparent);
	}

	.card-main {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		justify-content: flex-start;
		gap: 8px;
		border: 0;
		background: transparent;
		padding: 14px 14px 10px;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.card-main:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
		border-radius: 10px 10px 0 0;
	}

	.card-title {
		display: -webkit-box;
		overflow: hidden;
		font-size: 0.925rem;
		font-weight: 550;
		line-height: 1.35;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.card-meta {
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
	}

	.card-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 2px;
		border-top: 1px solid color-mix(in oklch, var(--border) 70%, transparent);
		padding: 4px 6px 6px;
	}

	.empty {
		grid-column: 1 / -1;
		margin: 0;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 40px 20px;
		color: var(--muted-foreground);
		font-size: 0.875rem;
		text-align: center;
	}

	@media (max-width: 767px) {
		.card-list {
			grid-template-columns: 1fr;
			gap: 0;
			margin-top: 16px;
		}

		.note-card {
			flex-direction: row;
			align-items: center;
			border: 0;
			border-bottom: 1px solid var(--border);
			border-radius: 0;
		}

		.note-card:hover {
			background: color-mix(in oklch, var(--foreground) 3.5%, transparent);
		}

		.card-main {
			min-height: 68px;
			justify-content: center;
			padding: 12px 8px 12px 0;
		}

		.card-main:focus-visible {
			border-radius: 0;
		}

		.card-title {
			display: block;
			-webkit-line-clamp: unset;
			line-clamp: unset;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.card-actions {
			border-top: 0;
			padding: 0;
		}

		.empty {
			border: 0;
			border-bottom: 1px solid var(--border);
			border-radius: 0;
			padding: 28px 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.note-card {
			transition: none;
		}
	}
</style>
