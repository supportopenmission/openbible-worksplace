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
				dateStyle: 'short',
				timeStyle: 'short'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<div class="data-table" data-testid="notes-data-table" role="region" aria-label="Notas">
	<table>
		<caption class="sr-only">Notas salvas no workspace</caption>
		<thead>
			<tr>
				<th scope="col">ID</th>
				<th scope="col">Título</th>
				<th scope="col">Atualizada</th>
				<th scope="col" class="actions-heading"><span class="sr-only">Ações</span></th>
			</tr>
		</thead>
		<tbody>
			{#each notes as note (note.id)}
				<tr>
					<td>
						<button type="button" class="cell-link mono" onclick={() => onOpen(note.id)}>
							{note.id}
						</button>
					</td>
					<td>
						<button type="button" class="cell-link title" onclick={() => onOpen(note.id)}>
							{note.title || 'Sem título'}
						</button>
					</td>
					<td>
						<button type="button" class="cell-link date" onclick={() => onOpen(note.id)}>
							{formatDate(note.updatedAt)}
						</button>
					</td>
					<td class="row-actions">
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
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="4" class="empty-cell">Nenhuma nota ainda.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.data-table {
		width: 100%;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th {
		border-bottom: 1px solid var(--border);
		padding: 9px 12px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
		text-align: left;
	}

	td {
		border-bottom: 1px solid color-mix(in oklch, var(--border) 70%, transparent);
		padding: 0;
		vertical-align: baseline;
	}

	tbody tr:hover {
		background: color-mix(in oklch, var(--foreground) 3.5%, transparent);
	}

	.cell-link {
		display: block;
		width: 100%;
		min-height: 46px;
		border: 0;
		background: transparent;
		padding: 13px 12px;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.cell-link:focus-visible {
		position: relative;
		z-index: 1;
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	.mono {
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.76rem;
	}

	.title {
		font-weight: 500;
	}

	.date {
		color: var(--muted-foreground);
		font-variant-numeric: tabular-nums;
	}

	.actions-heading,
	.row-actions {
		width: 88px;
		text-align: right;
	}

	.row-actions {
		padding: 5px 8px;
		white-space: nowrap;
	}

	.empty-cell {
		padding: 28px 12px;
		color: var(--muted-foreground);
		text-align: center;
	}

	.sr-only {
		position: absolute;
		overflow: hidden;
		width: 1px;
		height: 1px;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}

	@media (max-width: 767px) {
		.data-table { display: none; }
	}
</style>
