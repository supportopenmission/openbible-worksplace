<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import NotesSecondarySidebar from '$lib/features/notes/NotesSecondarySidebar.svelte';
	import { notesState } from '$lib/features/notes/notes-state.svelte';
	import { createNote } from '$lib/features/notes/notes-repository';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	let { children }: { children: Snippet } = $props();

	const workspace = getWorkspaceState();
	const activeNoteId = $derived(page.params.id || null);

	onMount(() => {
		if (workspace?.storage) {
			void notesState.loadNotes(workspace.storage);
		}
	});

	$effect(() => {
		const storage = workspace?.storage;
		if (storage && notesState.notes.length === 0 && !notesState.loading) {
			void notesState.loadNotes(storage);
		}
	});

	function handleSelectNote(id: string) {
		void goto(resolve(`/notes/${id}`));
	}

	async function handleCreateNote() {
		if (!workspace?.storage) return;
		try {
			const note = await createNote(workspace.storage);
			notesState.addNote(note);
			await goto(resolve(`/notes/${note.id}`));
		} catch (err) {
			console.error('Falha ao criar nota:', err);
		}
	}
</script>

{#if workspace?.storage}
	<div class="notes-dual-pane" class:has-active-note={!!activeNoteId}>
		<div class="secondary-sidebar-wrap">
			<NotesSecondarySidebar
				storage={workspace.storage}
				{activeNoteId}
				onSelect={handleSelectNote}
				onCreate={handleCreateNote}
			/>
		</div>
		<div class="note-main-wrap">
			{@render children()}
		</div>
	</div>
{:else}
	<div class="notes-no-storage">
		<p>Armazenamento indisponível.</p>
	</div>
{/if}

<style>
	.notes-dual-pane {
		display: flex;
		width: 100%;
		height: 100%;
		min-height: 0;
		flex: 1;
		overflow: hidden;
		background: var(--background);
	}

	.secondary-sidebar-wrap {
		width: 320px;
		min-width: 280px;
		max-width: 360px;
		height: 100%;
		flex-shrink: 0;
		border-right: 1px solid var(--border);
		background: var(--background);
		overflow: hidden;
	}

	.note-main-wrap {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		background: var(--background);
	}

	.notes-no-storage {
		padding: 32px;
		color: var(--muted-foreground);
		text-align: center;
	}

	@media (max-width: 767px) {
		.notes-dual-pane {
			flex-direction: column;
		}

		.secondary-sidebar-wrap {
			width: 100%;
			max-width: none;
			min-width: 0;
			border-right: none;
		}

		.notes-dual-pane.has-active-note .secondary-sidebar-wrap {
			display: none;
		}

		.notes-dual-pane:not(.has-active-note) .note-main-wrap {
			display: none;
		}
	}
</style>
