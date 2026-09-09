<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolveStorageKind } from '$lib/storage/environment';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/features/navigation/AppSidebar.svelte';
	import UpdateDialog from '$lib/features/config/UpdateDialog.svelte';
	import NetworkStatus from '$lib/features/navigation/NetworkStatus.svelte';
	import PermissionRecovery from './PermissionRecovery.svelte';
	import WorkspaceBootSplash from './WorkspaceBootSplash.svelte';
	import WorkspaceStartScreen from './WorkspaceStartScreen.svelte';
	import {
		WORKSPACE_STARTUP_SCREEN_EVENT,
		readWorkspaceStartupScreen
	} from './workspace-startup-preference';
	import { getWorkspaceState } from './workspace-state.svelte';

	let { children }: { children: Snippet } = $props();

	const workspace = getWorkspaceState();
	let sidebarOpen = $state(false);
	let startupScreenOpen = $state(false);

	onMount(() => {
		if (resolveStorageKind() === 'native') {
			startupScreenOpen = readWorkspaceStartupScreen();
		}

		const openStartupScreen = () => {
			startupScreenOpen = true;
		};
		window.addEventListener(WORKSPACE_STARTUP_SCREEN_EVENT, openStartupScreen);
		return () => window.removeEventListener(WORKSPACE_STARTUP_SCREEN_EVENT, openStartupScreen);
	});

	const isHighlightsList = $derived(page.url.pathname === '/highlights');
	const isBible = $derived(page.url.pathname === '/bible');
	const isConfig = $derived(page.url.pathname === '/config');
	const isNotes = $derived(page.url.pathname.startsWith('/notes'));
	const isBare = $derived(isBible || isNotes);
	const headerTitle = $derived(isHighlightsList ? 'Destaques' : isConfig ? 'Configurações' : '');
</script>

{#if workspace?.status === 'loading'}
	<WorkspaceBootSplash />
{:else if workspace?.status === 'permission-needed'}
	<PermissionRecovery />
{:else if workspace?.recoveryReason}
	<PermissionRecovery
		reason={workspace.recoveryReason}
		workspaceName={workspace.recoveryWorkspaceName}
		onResumeMigration={() => workspace.boot({ requestPermission: true, requestPersist: true })}
		onRestoreLegacy={() => workspace.reconnectFolder()}
	/>
{:else if workspace?.showShell && startupScreenOpen}
	<WorkspaceStartScreen onContinue={() => (startupScreenOpen = false)} />
{:else if workspace?.showShell}
	<Sidebar.Provider bind:open={sidebarOpen} class="app-sidebar-provider">
		<AppSidebar currentPath={page.url.pathname} />
		<Sidebar.Inset class={isBare ? 'shell-content shell-bare' : 'shell-content'}>
			{#if !isBare}
				<header class="desktop-header">
					<div class="header-context">
						<Sidebar.Trigger aria-label="Alternar sidebar" title="Alternar sidebar" />
						{#if headerTitle}
							<span class="route-title">{headerTitle}</span>
						{/if}
					</div>
					<div class="header-actions"></div>
				</header>
			{/if}
			<NetworkStatus />
			<div class="shell-main" class:note-editor-shell={isNotes}>
				{@render children()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
	<UpdateDialog />
{:else}
	{@render children()}
{/if}

<style>
	:global(.app-sidebar-provider) {
		overflow: hidden;
		background: var(--background);
	}

	@media (min-width: 768px) {
		:global(.app-sidebar-provider) {
			height: 100svh;
			min-height: 100svh;
		}
	}

	:global(.shell-content) {
		--shell-header-height: 48px;
		min-width: 0;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	:global(.shell-content.shell-bare) {
		--shell-header-height: 0px;
	}

	.shell-main {
		display: flex;
		width: 100%;
		min-width: 0;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.shell-main.note-editor-shell,
	.shell-main:has(:global(.with-note)) {
		overflow: hidden;
		height: 100%;
	}

	.desktop-header {
		display: flex;
		position: sticky;
		top: 0;
		z-index: 10;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: var(--shell-header-height);
		border-bottom: none;
		padding: 10px 16px;
		background: var(--background);
	}

	.header-context,
	.header-actions {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 10px;
	}

	:global(.note-options-menu) {
		min-width: 200px;
	}

	.route-title {
		overflow: hidden;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.desktop-header [data-slot='sidebar-trigger']) {
		color: var(--foreground);
	}

	@media (max-width: 767px) {
		.desktop-header {
			display: none;
		}

		.shell-main {
			padding-bottom: calc(84px + env(safe-area-inset-bottom));
			max-height: 100svh;
		}

		.shell-main.note-editor-shell,
		.shell-main:has(:global(.with-note)) {
			overflow: hidden;
			padding-bottom: 0;
		}
	}
</style>
