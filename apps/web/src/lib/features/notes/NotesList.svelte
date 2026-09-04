<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import NoteCardList from './NoteCardList.svelte';
	import { listNotes, createNote, trashNote } from './notes-repository';
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
	let deleteTarget = $state<Note | null>(null);
	let deleting = $state(false);
	let creating = $state(false);

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

	function openDeleteDialog(note: Note, event: MouseEvent) {
		event.stopPropagation();
		deleteTarget = note;
	}

	async function handleCreateNote() {
		if (creating) return;
		creating = true;
		try {
			const note = await createNote(storage);
			onOpen(note.id);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Não foi possível criar a nota.';
			error = message;
			onError?.(message);
		} finally {
			creating = false;
		}
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
	<div class="notes-list-inner" class:notes-list-empty={!loading && !error && notes.length === 0}>
		{#if loading}
			<p class="state-message" role="status" aria-live="polite">Carregando notas…</p>
		{:else if error}
			<div class="state-panel error" role="alert">
				<p>{error}</p>
				<Button type="button" variant="outline" onclick={loadNotes}>Tentar novamente</Button>
			</div>
		{:else}
			<NoteCardList {notes} {onOpen} onDelete={openDeleteDialog} />
		{/if}
	</div>
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
		display: flex;
		width: 100%;
		flex: 1;
		flex-direction: column;
		padding: 8px clamp(18px, 5vw, 72px) 80px;
	}

	.notes-list-inner {
		display: flex;
		width: 100%;
		max-width: min(100%, 1120px);
		flex: 1;
		flex-direction: column;
		margin: 0 auto;
	}

	.notes-list-empty {
		display: flex;
		flex-direction: column;
		min-height: calc(100dvh - 160px);
	}

	.notes-list-empty > :global(.card-list) {
		flex: 1;
		height: 100%;
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

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 20px;
	}

	@media (max-width: 767px) {
		.notes-list {
			padding: 0 16px calc(96px + env(safe-area-inset-bottom));
		}
	}
</style>
