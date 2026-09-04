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
	import { createNote } from '$lib/features/notes/notes-repository';
	import { NOTE_EDITOR_WIDTHS, type NoteEditorWidth } from '$lib/features/notes/note-editor-layout';
	import { notePageChrome } from '$lib/features/notes/note-page-chrome.svelte';
	import NetworkStatus from '$lib/features/navigation/NetworkStatus.svelte';
	import PermissionRecovery from './PermissionRecovery.svelte';
	import { getWorkspaceState } from './workspace-state.svelte';

	let { children }: { children: Snippet } = $props();

	const workspace = getWorkspaceState();
	let sidebarOpen = $state(false);
	let creatingNote = $state(false);

	const isNotesList = $derived(page.url.pathname === '/notes');
	const isHighlightsList = $derived(page.url.pathname === '/highlights');
	const isNoteEditor = $derived(
		page.url.pathname.startsWith('/notes/') && page.url.pathname !== '/notes'
	);
	const headerTitle = $derived(
		isNoteEditor ? 'Nota' : isNotesList ? 'Notas' : isHighlightsList ? 'Destaques' : ''
	);

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
	<main class="boot-state" aria-live="polite">
		<p class="eyebrow">OpenBible</p>
		<p>Abrindo seu workspace...</p>
	</main>
{:else if workspace?.status === 'permission-needed'}
	<PermissionRecovery />
{:else if workspace?.showShell}
	<Sidebar.Provider bind:open={sidebarOpen} class="app-sidebar-provider">
		<AppSidebar currentPath={page.url.pathname} />
		<Sidebar.Inset class="shell-content">
			<header class="desktop-header">
				<div class="header-context">
					<Sidebar.Trigger aria-label="Alternar sidebar" title="Alternar sidebar" />
					{#if notePageChrome.active}
						<nav class="header-breadcrumb" aria-label="Breadcrumb">
							<a href={resolve('/notes')}>Notas</a>
							<span aria-hidden="true">/</span>
							<span class="breadcrumb-current" aria-current="page">{notePageChrome.title}</span>
						</nav>
					{:else if headerTitle}
						<span class="route-title">{headerTitle}</span>
					{/if}
				</div>
				<div class="header-actions">
					{#if notePageChrome.active}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label="Opções da nota"
										title="Opções da nota"
									>
										<MoreHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="note-options-menu">
								<DropdownMenu.Label>Largura do editor</DropdownMenu.Label>
								<DropdownMenu.RadioGroup
									value={notePageChrome.width}
									onValueChange={(value) => value && setNoteWidth(value as NoteEditorWidth)}
								>
									{#each Object.entries(NOTE_EDITOR_WIDTHS) as [id, option] (id)}
										<DropdownMenu.RadioItem value={id}>
											<span class="width-option">
												<span>{option.label}</span>
												<span class="width-option-desc">{option.description}</span>
											</span>
										</DropdownMenu.RadioItem>
									{/each}
								</DropdownMenu.RadioGroup>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{:else if isNotesList}
						<Button type="button" size="sm" onclick={handleCreateNote} disabled={creatingNote}>
							<Plus size={15} strokeWidth={1.75} aria-hidden="true" />
							Nova nota
						</Button>
					{/if}
				</div>
			</header>
			<NetworkStatus />
			<div class="shell-main">
				{@render children()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
{:else}
	{@render children()}
{/if}

<style>
	.boot-state {
		max-width: 640px;
		min-height: 100dvh;
		margin: 0 auto;
		padding: 64px 24px;
	}

	.eyebrow,
	.boot-state p:last-child {
		color: var(--muted-foreground);
	}

	.eyebrow {
		margin: 0 0 10px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	:global(.app-sidebar-provider) {
		min-height: 100dvh;
		height: 100dvh;
		overflow: hidden;
		background: var(--background);
	}

	:global(.shell-content) {
		min-width: 0;
		height: 100%;
		min-height: 0;
		overflow: hidden;
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
	}
</style>
