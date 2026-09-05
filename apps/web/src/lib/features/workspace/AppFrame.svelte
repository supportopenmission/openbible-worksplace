<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { MoreHorizontal, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/features/navigation/AppSidebar.svelte';
	import UpdateDialog from '$lib/features/config/UpdateDialog.svelte';
	import { createNote } from '$lib/features/notes/notes-repository';
	import { NOTE_EDITOR_WIDTHS, type NoteEditorWidth } from '$lib/features/notes/note-editor-layout';
	import { notePageChrome } from '$lib/features/notes/note-page-chrome.svelte';
	import NetworkStatus from '$lib/features/navigation/NetworkStatus.svelte';
	import PermissionRecovery from './PermissionRecovery.svelte';
	import WorkspaceBootSplash from './WorkspaceBootSplash.svelte';
	import { getWorkspaceState } from './workspace-state.svelte';

	let { children }: { children: Snippet } = $props();

	const workspace = getWorkspaceState();
	let sidebarOpen = $state(false);
	let creatingNote = $state(false);

	const isNotesList = $derived(page.url.pathname === '/notes');
	const isHighlightsList = $derived(page.url.pathname === '/highlights');
	const isBible = $derived(page.url.pathname === '/bible');
	const isConfig = $derived(page.url.pathname === '/config');
	const isNotes = $derived(page.url.pathname.startsWith('/notes'));
	const isBare = $derived(isBible || isNotes);
	const headerTitle = $derived(isHighlightsList ? 'Destaques' : isConfig ? 'Configurações' : '');

	function setNoteWidth(width: NoteEditorWidth) {
		notePageChrome.setWidth(width);
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

{#if workspace?.status === 'loading'}
	<WorkspaceBootSplash />
{:else if workspace?.status === 'permission-needed'}
	<PermissionRecovery />
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
		min-height: 100dvh;
		height: 100dvh;
		overflow: hidden;
		background: var(--background);
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

	.desktop-header.header-overlay {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 40;
		background: transparent;
		pointer-events: none;
	}

	.header-overlay .header-context,
	.header-overlay .header-actions {
		pointer-events: auto;
	}

	:global(.desktop-header.header-overlay [data-slot='sidebar-trigger']) {
		background: color-mix(in oklch, var(--background) 80%, transparent);
	}

	.header-context,
	.header-actions {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 10px;
	}

	.header-breadcrumb {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 8px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
	}

	.header-breadcrumb a {
		color: var(--foreground);
		font-weight: 500;
		text-decoration: none;
	}

	.header-breadcrumb a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.breadcrumb-current {
		overflow: hidden;
		color: var(--muted-foreground);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.note-options-menu) {
		min-width: 200px;
	}

	.width-option {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.width-option-desc {
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.68rem;
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
		}

		.shell-main.note-editor-shell,
		.shell-main:has(:global(.with-note)) {
			overflow: hidden;
			padding-bottom: 0;
		}
	}
</style>
