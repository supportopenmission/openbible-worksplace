<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/features/navigation/AppSidebar.svelte';
	import { createNote } from '$lib/features/notes/notes-repository';
	import NetworkStatus from '$lib/features/navigation/NetworkStatus.svelte';
	import ThemeToggle from '$lib/features/navigation/ThemeToggle.svelte';
	import PermissionRecovery from './PermissionRecovery.svelte';
	import { getWorkspaceState } from './workspace-state.svelte';

	let { children }: { children: Snippet } = $props();

	const workspace = getWorkspaceState();
	let sidebarOpen = $state(false);
	let creatingNote = $state(false);

	const isNotesList = $derived(page.url.pathname === '/notes');
	const headerTitle = $derived(
		page.url.pathname.startsWith('/notes/') ? 'Nota' : isNotesList ? 'Notas' : ''
	);

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
					{#if headerTitle}
						<span class="route-title">{headerTitle}</span>
					{/if}
				</div>
				{#if isNotesList}
					<Button type="button" size="sm" onclick={handleCreateNote} disabled={creatingNote}>
						<Plus size={15} strokeWidth={1.75} aria-hidden="true" />
						Nova nota
					</Button>
				{/if}
			</header>
			<header class="mobile-header">
				<a class="mobile-brand" href={resolve('/')} aria-label="OpenBible, início">
					<span>{headerTitle || 'OpenBible'}</span>
				</a>
				<div class="mobile-actions">
					{#if isNotesList}
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Nova nota"
							onclick={handleCreateNote}
							disabled={creatingNote}
						>
							<Plus size={17} strokeWidth={1.75} aria-hidden="true" />
						</Button>
					{/if}
					<ThemeToggle />
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
		background: var(--background);
	}

	:global(.shell-content) {
		min-width: 0;
	}

	.shell-main {
		min-width: 0;
		flex: 1;
	}

	.desktop-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px solid var(--border);
		padding: 10px 16px;
		background: var(--background);
	}

	.header-context,
	.mobile-actions {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 10px;
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

	.mobile-header {
		display: none;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding: max(12px, env(safe-area-inset-top)) 16px 12px;
		background: var(--background);
	}

	.mobile-brand {
		display: inline-flex;
		min-width: 0;
		align-items: center;
		color: var(--foreground);
		font-size: 0.88rem;
		font-weight: 600;
		letter-spacing: -0.03em;
		text-decoration: none;
	}

	.mobile-brand:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	:global(.mobile-header .theme-toggle) {
		min-width: 34px;
		justify-content: center;
		padding: 7px;
	}

	:global(.mobile-header .theme-toggle span) {
		display: none;
	}

	@media (max-width: 767px) {
		.desktop-header {
			display: none;
		}

		.mobile-header {
			display: flex;
		}

		.shell-main {
			padding-bottom: calc(84px + env(safe-area-inset-bottom));
		}
	}
</style>
