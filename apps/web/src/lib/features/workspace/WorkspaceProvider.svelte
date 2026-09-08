<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setWorkspaceState, WorkspaceState } from './workspace-state.svelte';
	import { ensureClientDataReset, reloadAfterClientReset } from '$lib/pwa/client-reset';

	let { children }: { children: Snippet } = $props();

	const workspace = setWorkspaceState(new WorkspaceState());

	onMount(() => {
		void ensureClientDataReset().then((resetPerformed) => {
			if (resetPerformed) {
				reloadAfterClientReset();
				return;
			}
			return workspace.boot();
		});
	});
</script>

{@render children()}
