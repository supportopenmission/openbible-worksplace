<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import PageHeader from '$lib/features/navigation/PageHeader.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import { createNote, listNotes, trashNote } from './notes-repository';
	import { deleteNoteVerseRefs } from './note-verse-index';
	import type { Note } from './note-types';

	let {
		storage,
		onOpen,
		onError
	}: {
		storage: WorkspaceStorage;
		onOpen: (noteId: string) => void;
		onError?: (message: string) => void;
	} = $props();

	let notes = $state<Note[]>([]);
	let loading = $state(true);
	let error = $state('');
	let creating = $state(false);
	let deleteTarget = $state<Note | null>(null);
	let deleting = $state(false);

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

	async function loadNotes() {
		loading = true;
		error = '';
		try {
			notes = await listNotes(storage);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Não foi possível carregar as notas.';
			onError?.(error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadNotes();
	});

	async function handleCreate() {
		creating = true;
		try {
			const created = await createNote(storage);
			onOpen(created.id);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Não foi possível criar a nota.';
			error = message;
			onError?.(message);
		} finally {
			creating = false;
		}
	}

	function openDeleteDialog(note: Note, event: MouseEvent) {
		event.stopPropagation();
		deleteTarget = note;
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		deleting = true;
		try {
			await trashNote(storage, deleteTarget.id);
			await deleteNoteVerseRefs(deleteTarget.path);
			notes = notes.filter((note) => note.id !== deleteTarget!.id);
			deleteTarget = null;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Não foi possível apagar a nota.';
			error = message;
			onError?.(message);
		} finally {
			deleting = false;
		}
	}
</script>

<div class="notes-list">
	<PageHeader
		title="Notas"
		description="Crie e edite notas com blocos de versículo integrados ao seu workspace."
	>
		{#snippet actions()}
			<Button type="button" onclick={handleCreate} disabled={creating} aria-label="Nova nota">
				<Plus size={16} strokeWidth={1.75} aria-hidden="true" />
				Nova nota
			</Button>
		{/snippet}
	</PageHeader>

	{#if loading}
		<p class="state-message" role="status" aria-live="polite">Carregando notas…</p>
	{:else if error}
		<div class="state-panel error" role="alert">
			<p>{error}</p>
			<Button type="button" variant="outline" onclick={loadNotes}>Tentar novamente</Button>
		</div>
	{:else if notes.length === 0}
		<div class="state-panel empty" role="status">
			<p>Nenhuma nota ainda. Crie a primeira para começar.</p>
			<Button type="button" onclick={handleCreate} disabled={creating}>
				<Plus size={16} strokeWidth={1.75} aria-hidden="true" />
				Nova nota
			</Button>
		</div>
	{:else}
		<div class="table-wrap" role="region" aria-label="Lista de notas">
			<table class="notes-table">
				<thead>
					<tr>
						<th scope="col">ID</th>
						<th scope="col">Título</th>
						<th scope="col">Atualizada</th>
						<th scope="col"><span class="sr-only">Ações</span></th>
					</tr>
				</thead>
				<tbody>
					{#each notes as note (note.id)}
						<tr>
							<td>
								<button
									type="button"
									class="row-link"
									onclick={() => onOpen(note.id)}
									aria-label={`Abrir nota ${note.title || note.id}`}
								>
									<span class="mono">{note.id}</span>
								</button>
							</td>
							<td>
								<button
									type="button"
									class="row-link"
									onclick={() => onOpen(note.id)}
									aria-label={`Abrir nota ${note.title || note.id}`}
								>
									{note.title || 'Sem título'}
								</button>
							</td>
							<td>
								<button
									type="button"
									class="row-link"
									onclick={() => onOpen(note.id)}
									aria-label={`Abrir nota ${note.title || note.id}`}
								>
									{formatDate(note.updatedAt)}
								</button>
							</td>
							<td class="actions-cell">
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label={`Apagar nota ${note.title || note.id}`}
									onclick={(event) => openDeleteDialog(note, event)}
								>
									<Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Dialog.Root open={deleteTarget !== null} onOpenChange={(value) => !value && (deleteTarget = null)}>
	<Dialog.Content showCloseButton={true}>
		<Dialog.Title>Apagar nota</Dialog.Title>
		<Dialog.Description>
			{#if deleteTarget}
				Esta ação move <strong>{deleteTarget.title || deleteTarget.id}</strong> para a lixeira. Deseja
				continuar?
			{/if}
		</Dialog.Description>
		<div class="dialog-actions">
			<Button type="button" variant="outline" onclick={() => (deleteTarget = null)}>Cancelar</Button>
			<Button type="button" variant="destructive" onclick={confirmDelete} disabled={deleting}>
				Apagar
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.notes-list {
		max-width: 1120px;
		margin: 0 auto;
		padding: 8px clamp(20px, 5vw, 64px) 80px;
	}

	.state-message,
	.state-panel p {
		margin: 32px 0 0;
		color: var(--muted-foreground);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.state-panel {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
		margin-top: 32px;
		border-block: 1px solid var(--border);
		padding: 20px 0;
	}

	.state-panel.error p {
		margin: 0;
		color: var(--destructive);
	}

	.table-wrap {
		margin-top: 32px;
		overflow-x: auto;
	}

	.notes-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.notes-table th {
		border-bottom: 1px solid var(--border);
		padding: 10px 12px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-align: left;
		text-transform: uppercase;
	}

	.notes-table td {
		border-bottom: 1px solid color-mix(in oklch, var(--border) 70%, transparent);
		padding: 0;
		vertical-align: middle;
	}

	.row-link {
		display: block;
		width: 100%;
		border: none;
		background: transparent;
		padding: 14px 12px;
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}

	.row-link:hover {
		background: color-mix(in oklch, var(--foreground) 4%, transparent);
	}

	.row-link:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--muted-foreground);
	}

	.actions-cell {
		width: 48px;
		padding-inline: 8px;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 20px;
	}

	.sr-only {
		position: absolute;
		overflow: hidden;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
