<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setWorkspaceState, WorkspaceState } from './workspace-state.svelte';

	let { children }: { children: Snippet } = $props();

	const workspace = setWorkspaceState(new WorkspaceState());

	onMount(() => {
		void workspace.boot();
	});
</script>

{@render children()}
