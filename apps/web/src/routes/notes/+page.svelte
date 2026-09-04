<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import NotesEmptyState from '$lib/features/notes/NotesEmptyState.svelte';
	import { createNote } from '$lib/features/notes/notes-repository';
	import { notesState } from '$lib/features/notes/notes-state.svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	const workspace = getWorkspaceState();
	let creating = $state(false);

	async function handleCreate() {
		if (!workspace?.storage || creating) return;
		creating = true;
		try {
			const note = await createNote(workspace.storage);
			notesState.addNote(note);
			await goto(resolve(`/notes/${note.id}`));
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>Notas | OpenBible</title>
	<meta name="description" content="Suas notas no OpenBible." />
</svelte:head>

<div class="notes-empty-page">
	<header class="note-pane-header" aria-hidden="true"></header>
	<div class="notes-empty-wrapper">
		<NotesEmptyState onCreate={handleCreate} {creating} />
	</div>
</div>

<style>
	.notes-empty-page {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 0;
		background: var(--background);
	}

	.note-pane-header {
		display: flex;
		align-items: center;
		height: 48px;
		min-height: 48px;
		max-height: 48px;
		padding: 0 16px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		box-sizing: border-box;
		background: var(--background);
	}

	.notes-empty-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		min-height: 0;
		flex: 1;
	}
</style>
