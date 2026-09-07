<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/features/navigation/AppSidebar.svelte';
	import UpdateDialog from '$lib/features/config/UpdateDialog.svelte';
	import NetworkStatus from '$lib/features/navigation/NetworkStatus.svelte';
	import PermissionRecovery from './PermissionRecovery.svelte';
	import WorkspaceBootSplash from './WorkspaceBootSplash.svelte';
	import WorkspaceSelector from './WorkspaceSelector.svelte';
	import {
		getActiveWorkspace,
		listCatalog,
		storageBackendLabel
	} from '$lib/storage/workspace-catalog';
	import { getWorkspaceState } from './workspace-state.svelte';

	let { children }: { children: Snippet } = $props();

	const workspace = getWorkspaceState();
	let sidebarOpen = $state(false);
	let workspaceDrawerOpen = $state(false);
	let mobileActiveName = $state('Workspace');
	let mobileActiveBackend = $state<'sqlite' | 'indexeddb' | null>(null);
	const mobileActiveInitial = $derived(mobileActiveName.trim().charAt(0).toUpperCase() || 'W');

	function refreshMobileActiveName() {
		try {
			const activeId = getActiveWorkspace().workspaceId;
			const entry = listCatalog().find((item) => item.workspaceId === activeId);
			mobileActiveName = entry?.nameCache ?? 'Escolher workspace';
			mobileActiveBackend = entry?.backend ?? null;
		} catch {
			mobileActiveName = 'Escolher workspace';
			mobileActiveBackend = null;
		}
	}

	function closeWorkspaceDrawer() {
		workspaceDrawerOpen = false;
	}

	function handleMobileManage() {
		closeWorkspaceDrawer();
		void goto(resolve('/config'));
	}

	onMount(() => {
		refreshMobileActiveName();
		const listener = () => refreshMobileActiveName();
		try {
			window.addEventListener('openbible:workspace-activated', listener);
		} catch {
			// Sem window em SSR: nome padrão permanece.
		}
		return () => {
			try {
				window.removeEventListener('openbible:workspace-activated', listener);
			} catch {
				// Ignora teardown sem window.
			}
		};
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
			<div class="mobile-workspace-bar">
				<Drawer.Root bind:open={workspaceDrawerOpen}>
					<Drawer.Trigger
						type="button"
						class="mobile-workspace-trigger"
						aria-label={`Trocar de workspace, ativo: ${mobileActiveName}${mobileActiveBackend ? `, ${storageBackendLabel(mobileActiveBackend)}` : ''}`}
						aria-haspopup="dialog"
						title={mobileActiveName}
						onclick={refreshMobileActiveName}
					>
						<span class="mobile-workspace-avatar" aria-hidden="true">{mobileActiveInitial}</span>
						<span class="mobile-workspace-copy">
							<span class="mobile-workspace-name">{mobileActiveName}</span>
							{#if mobileActiveBackend}
								<span class="mobile-workspace-backend"
									>{storageBackendLabel(mobileActiveBackend)}</span
								>
							{/if}
						</span>
					</Drawer.Trigger>
					<Drawer.Content class="workspace-drawer">
						<Drawer.Header>
							<Drawer.Title>Workspaces</Drawer.Title>
							<Drawer.Description
								>Troque, crie, adicione ou gerencie raízes locais.</Drawer.Description
							>
						</Drawer.Header>
						<div class="workspace-drawer-body">
							<WorkspaceSelector
								variant="mobile"
								manageLabel="Gerenciar workspaces"
								onManage={handleMobileManage}
								onAction={closeWorkspaceDrawer}
							/>
						</div>
					</Drawer.Content>
				</Drawer.Root>
			</div>
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

	.mobile-workspace-bar {
		display: none;
	}

	@media (max-width: 767px) {
		.desktop-header {
			display: none;
		}

		.mobile-workspace-bar {
			display: block;
			position: sticky;
			top: 0;
			z-index: 20;
			border-bottom: 1px solid var(--border);
			background: var(--background);
			padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 8px;
		}

		.mobile-workspace-bar :global(.mobile-workspace-trigger) {
			display: flex;
			width: 100%;
			min-height: 44px;
			align-items: center;
			gap: 8px;
			border: 1px solid var(--border);
			border-radius: 10px;
			padding: 8px 12px;
			background: var(--background);
			color: var(--foreground);
			font-size: 0.85rem;
			font-weight: 550;
		}

		.mobile-workspace-avatar {
			display: inline-flex;
			flex: 0 0 auto;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			border: 1px solid var(--border);
			border-radius: 7px;
			background: var(--muted);
			color: var(--foreground);
			font-size: 0.7rem;
			font-weight: 650;
			line-height: 1;
		}

		.mobile-workspace-bar :global(.mobile-workspace-trigger:focus-visible) {
			outline: 2px solid var(--ring);
			outline-offset: 1px;
		}

		.mobile-workspace-name {
			overflow: hidden;
			min-width: 0;
			flex: 1;
			text-align: start;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.mobile-workspace-copy {
			display: flex;
			min-width: 0;
			flex: 1;
			flex-direction: column;
			align-items: flex-start;
			gap: 1px;
		}

		.mobile-workspace-backend {
			color: var(--muted-foreground);
			font-family: var(--font-mono);
			font-size: 0.65rem;
			font-weight: 400;
			line-height: 1.25;
		}

		:global(.workspace-drawer) {
			max-height: 90dvh;
		}

		.workspace-drawer-body {
			overflow-y: auto;
			padding: 0 16px calc(16px + env(safe-area-inset-bottom, 0px));
		}

		.shell-main {
			padding-bottom: calc(84px + env(safe-area-inset-bottom));
		}

		.shell-main.note-editor-shell,
		.shell-main:has(:global(.with-note)) {
			overflow: hidden;
			padding-bottom: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mobile-workspace-bar :global(.mobile-workspace-trigger) {
			transition: none;
		}
	}
</style>
