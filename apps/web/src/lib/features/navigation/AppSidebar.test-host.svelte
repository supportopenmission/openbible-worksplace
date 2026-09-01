<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from './AppSidebar.svelte';

	let { currentPath = '/', open = false }: { currentPath?: string; open?: boolean } = $props();
</script>

<Sidebar.Provider bind:open>
	<AppSidebar {currentPath} />
</Sidebar.Provider>
