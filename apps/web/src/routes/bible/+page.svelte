<script lang="ts">
	import { onMount } from 'svelte';
	import BibleReader from '$lib/features/bible/BibleReader.svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { createConfiguredStorage } from '$lib/storage/storage-registry';
	import type { WorkspaceStorage } from '$lib/storage/types';

	let {
		storageOverride = null
	}: {
		storageOverride?: WorkspaceStorage | null;
	} = $props();

	const workspace = getWorkspaceState();
	let loadedStorage = $state<WorkspaceStorage | null>(null);
	let loadedError = $state('');
	let storage = $derived(storageOverride ?? loadedStorage);
	let initialError = $derived(storageOverride ? '' : loadedError);

	onMount(async () => {
		if (storageOverride) return;
		if (workspace) {
			loadedStorage = workspace.storage;
			loadedError = workspace.error;
			return;
		}
		await retryStorage();
	});

	async function retryStorage() {
		loadedError = '';
		if (workspace) {
			await workspace.boot({ requestPersist: true });
			loadedStorage = workspace.storage;
			loadedError = workspace.error;
			return;
		}
		try {
			loadedStorage = await createConfiguredStorage();
		} catch (error) {
			loadedError =
				error instanceof Error ? error.message : 'Não foi possível acessar o workspace.';
		}
	}
</script>

<h1 class="sr-only">Bíblia</h1>
<BibleReader {storage} {initialError} onRetry={retryStorage} />

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
		white-space: nowrap;
	}
</style>
