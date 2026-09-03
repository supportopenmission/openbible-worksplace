<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import NotesList from '$lib/features/notes/NotesList.svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	const workspace = getWorkspaceState();

	function handleOpen(noteId: string) {
		void goto(resolve(`/notes/${noteId}`));
	}
</script>

<svelte:head>
	<title>Notas | OpenBible</title>
	<meta name="description" content="Liste, crie e edite notas no seu workspace OpenBible." />
</svelte:head>

{#if workspace?.storage}
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
