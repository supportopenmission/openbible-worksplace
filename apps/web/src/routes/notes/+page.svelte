<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import PageHeader from '$lib/features/navigation/PageHeader.svelte';
	import NotesList from '$lib/features/notes/NotesList.svelte';
	import { createNote } from '$lib/features/notes/notes-repository';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	const workspace = getWorkspaceState();

	let creatingNote = $state(false);

	function handleOpen(noteId: string) {
		void goto(resolve(`/notes/${noteId}`));
	}

	async function handleCreateNote() {
		if (!workspace?.storage || creatingNote) return;
		creatingNote = true;
		try {
			const note = await createNote(workspace.storage);
			await goto(resolve(`/notes/${note.id}`));
		} finally {
			creatingNote = false;
		}
	}
</script>

<svelte:head>
	<title>Notas | OpenBible</title>
	<meta name="description" content="Liste, crie e edite notas no seu workspace OpenBible." />
</svelte:head>

{#if workspace?.storage}
	<div class="notes-page-title">
		<PageHeader title="Notas">
			{#snippet actions()}
				<Button type="button" size="sm" onclick={handleCreateNote} disabled={creatingNote}>
					<Plus size={15} strokeWidth={1.75} aria-hidden="true" />
					Nova nota
				</Button>
			{/snippet}
		</PageHeader>
	</div>
	<NotesList storage={workspace.storage} onOpen={handleOpen} />
{:else}
	<div class="notes-error" role="alert">
		<p>Workspace indisponível. Configure o armazenamento para usar notas.</p>
		{#if workspace?.error}
			<p class="detail">{workspace.error}</p>
		{/if}
	</div>
{/if}

<style>
	.notes-page-title {
		display: none;
		width: 100%;
		max-width: min(100%, 1120px);
		margin: 0 auto;
		padding: 20px clamp(18px, 5vw, 72px) 0;
	}

	@media (max-width: 767px) {
		.notes-page-title {
			display: block;
		}
	}

	.notes-error {
		width: 100%;
		max-width: min(100%, 1120px);
		margin: 0 auto;
		padding: 32px clamp(18px, 5vw, 72px);
	}

	.notes-error p {
		margin: 0;
		color: var(--destructive);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.detail {
		margin-top: 8px !important;
		color: var(--muted-foreground) !important;
	}
</style>
