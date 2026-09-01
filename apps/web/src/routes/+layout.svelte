<script lang="ts">
	import '../app.css';
	import WorkspaceProvider from '$lib/features/workspace/WorkspaceProvider.svelte';
	import AppFrame from '$lib/features/workspace/AppFrame.svelte';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		if ('serviceWorker' in navigator) {
			void navigator.serviceWorker.register('/service-worker.js');
		}
	});
</script>

<WorkspaceProvider>
	<AppFrame>
		{@render children()}
	</AppFrame>
</WorkspaceProvider>
