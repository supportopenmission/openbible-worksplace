<script lang="ts">
	import '../app.css';
	import WorkspaceProvider from '$lib/features/workspace/WorkspaceProvider.svelte';
	import AppFrame from '$lib/features/workspace/AppFrame.svelte';
	import { configureOpenBibleServiceWorker } from '$lib/pwa/service-worker-registration';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	onMount(() => {
		if (!('serviceWorker' in navigator)) return;

		void configureOpenBibleServiceWorker({
			development: dev,
			serviceWorker: navigator.serviceWorker,
			cacheStorage: 'caches' in globalThis ? globalThis.caches : undefined
		}).catch((error: unknown) => {
			console.warn('Não foi possível sincronizar o modo offline do OpenBible.', error);
		});
	});
</script>

<WorkspaceProvider>
	<AppFrame>
		{@render children()}
	</AppFrame>
</WorkspaceProvider>
