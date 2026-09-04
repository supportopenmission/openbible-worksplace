<script lang="ts">
	import { Pencil, Pin, PinOff, Plus, Search, Trash2, X } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { notesState, getNoteSnippet, formatNoteDate } from './notes-state.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import type { Note } from './note-types';

	let {
		storage,
		activeNoteId,
		onSelect,
		onCreate
	}: {
		storage: WorkspaceStorage;
		activeNoteId: string | null;
		onSelect: (id: string) => void;
		onCreate: () => void;
	} = $props();

	let creating = $state(false);
	let renameDialogOpen = $state(false);
	let noteToRename = $state<Note | null>(null);
	let renameTitle = $state('');
	let renaming = $state(false);
	let deleteDialogOpen = $state(false);
	let noteToDelete = $state<Note | null>(null);
	let deleting = $state(false);

	async function handleCreate() {
		if (creating) return;
		creating = true;
		try {
			await onCreate();
		} finally {
			creating = false;
		}
	}

	function handleClearSearch() {
		notesState.searchQuery = '';
	}

	async function handleTogglePin(note: Note) {
		if (!storage) return;
		await notesState.togglePinNote(storage, note.id);
	}

	function openRenameDialog(note: Note) {
		noteToRename = note;
		renameTitle = note.title;
		renameDialogOpen = true;
	}

	async function confirmRename() {
		if (!storage || !noteToRename || !renameTitle.trim()) return;
		const id = noteToRename.id;
		renaming = true;
		try {
			await notesState.renameNote(storage, id, renameTitle.trim());
			renameDialogOpen = false;
		} finally {
			renaming = false;
			noteToRename = null;
		}
	}

	function openDeleteDialog(note: Note) {
		noteToDelete = note;
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!storage || !noteToDelete) return;
		const id = noteToDelete.id;
		deleting = true;
		try {
			await notesState.deleteNote(storage, id);
			deleteDialogOpen = false;
			if (activeNoteId === id) {
				await goto(resolve('/notes'));
			}
		} finally {
			deleting = false;
			noteToDelete = null;
		}
	}
</script>

<aside class="secondary-sidebar" aria-label="Todas as notas">
	<header class="sidebar-header">
		<div class="header-left">
			<span class="desktop-trigger-wrap">
				<Sidebar.Trigger aria-label="Alternar menu principal" title="Alternar menu principal" />
			</span>
			<h2 class="sidebar-title">Todas as notas</h2>
			{#if notesState.notes.length > 0}
				<span class="note-count">{notesState.notes.length}</span>
			{/if}
		</div>
		<div class="header-right">
				<Button
					type="button"
					variant="default"
					size="icon-sm"
					aria-label="Nova nota"
					title="Nova nota"
					onclick={handleCreate}
					disabled={creating}
				>
					<Plus size={16} strokeWidth={2} aria-hidden="true" />
				</Button>
			</div>
		</header>

		<div class="search-bar-wrap">
			<div class="search-box">
				<Search size={14} strokeWidth={1.8} class="search-icon" aria-hidden="true" />
				<input
					type="text"
					placeholder="Buscar notas..."
					bind:value={notesState.searchQuery}
					aria-label="Buscar notas"
				/>
				{#if notesState.searchQuery}
					<button
						type="button"
						class="clear-search"
						onclick={handleClearSearch}
						aria-label="Limpar busca"
					>
						<X size={13} strokeWidth={2} aria-hidden="true" />
					</button>
				{/if}
			</div>
		</div>

	<div class="sidebar-notes" role="listbox" aria-label="Lista de notas">
		{#if notesState.loading && notesState.notes.length === 0}
			<div class="sidebar-state">
				<p>Carregando notas…</p>
			</div>
		{:else if notesState.error && notesState.notes.length === 0}
			<div class="sidebar-state error">
				<p>{notesState.error}</p>
				<Button type="button" variant="outline" size="sm" onclick={() => notesState.loadNotes(storage)}>
					Tentar novamente
				</Button>
			</div>
		{:else if notesState.filteredNotes.length === 0}
			<div class="sidebar-state empty">
				{#if notesState.searchQuery}
					<p class="empty-title">Nenhuma nota encontrada</p>
					<p class="empty-desc">Nenhum resultado para "{notesState.searchQuery}"</p>
				{:else}
					<p class="empty-title">Nenhuma nota ainda</p>
					<p class="empty-desc">Crie sua primeira nota para começar.</p>
					<Button type="button" size="sm" variant="outline" onclick={handleCreate} disabled={creating}>
						<Plus size={14} strokeWidth={1.75} aria-hidden="true" />
						Criar nota
					</Button>
				{/if}
			</div>
		{:else}
			{#each notesState.filteredNotes as note (note.id)}
				{@const isSelected = note.id === activeNoteId}
				<ContextMenu.Root>
					<ContextMenu.Trigger>
						{#snippet child({ props })}
							<button
								{...props}
								type="button"
								class="note-item"
								class:active={isSelected}
								class:pinned={note.pinned}
								role="option"
								aria-selected={isSelected}
								onclick={() => onSelect(note.id)}
							>
								<div class="note-item-header">
									<div class="note-item-title-wrap">
										{#if note.pinned}
											<Pin size={11} class="pin-icon" aria-label="Nota fixada" title="Nota fixada" />
										{/if}
										<span class="note-item-title">{note.title || 'Sem título'}</span>
									</div>
									<span class="note-item-date">{formatNoteDate(note.updatedAt)}</span>
								</div>
								<p class="note-item-snippet">{getNoteSnippet(note.content || note.body, note.title, note.description)}</p>
							</button>
						{/snippet}
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						<ContextMenu.Item onclick={() => handleTogglePin(note)}>
							{#if note.pinned}
								<PinOff size={14} class="mr-2" />
								<span>Desafixar do topo</span>
							{:else}
								<Pin size={14} class="mr-2" />
								<span>Fixar no topo</span>
							{/if}
						</ContextMenu.Item>
						<ContextMenu.Item onclick={() => openRenameDialog(note)}>
							<Pencil size={14} class="mr-2" />
							<span>Renomear</span>
						</ContextMenu.Item>
						<ContextMenu.Separator />
						<ContextMenu.Item variant="destructive" onclick={() => openDeleteDialog(note)}>
							<Trash2 size={14} class="mr-2" />
							<span>Apagar nota</span>
						</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			{/each}
		{/if}
	</div>
</aside>

<Dialog.Root bind:open={renameDialogOpen}>
	<Dialog.Content showCloseButton={true}>
		<Dialog.Title>Renomear nota</Dialog.Title>
		<Dialog.Description>Altere o título da nota.</Dialog.Description>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				void confirmRename();
			}}
		>
			<div class="dialog-field">
				<Input bind:value={renameTitle} placeholder="Título da nota" autofocus />
			</div>
			<div class="dialog-actions">
				<Button type="button" variant="outline" onclick={() => (renameDialogOpen = false)}>
					Cancelar
				</Button>
				<Button type="submit" disabled={renaming || !renameTitle.trim()}>
					{renaming ? 'Salvando…' : 'Salvar'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content showCloseButton={true}>
		<Dialog.Title>Apagar nota</Dialog.Title>
		<Dialog.Description>
			Tem certeza que deseja apagar a nota "{noteToDelete?.title || 'Sem título'}"?
		</Dialog.Description>
		<div class="dialog-actions">
			<Button type="button" variant="outline" onclick={() => (deleteDialogOpen = false)}>
				Cancelar
			</Button>
			<Button variant="destructive" onclick={confirmDelete} disabled={deleting}>
				{deleting ? 'Apagando…' : 'Apagar'}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.secondary-sidebar {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: var(--background);
		font-family: var(--font-sans);
		user-select: none;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
		min-height: 48px;
		max-height: 48px;
		padding: 0 12px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		box-sizing: border-box;
		background: var(--background);
	}

	.search-bar-wrap {
		padding: 8px 12px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		background: var(--background);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.sidebar-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: -0.015em;
		color: var(--foreground);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.note-count {
		padding: 1px 6px;
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--muted-foreground);
		background: var(--muted);
		border-radius: 9999px;
	}

	.header-right {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.search-box {
		display: flex;
		align-items: center;
		position: relative;
		width: 100%;
		background: color-mix(in srgb, var(--muted) 60%, transparent);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0 8px;
		transition: border-color 0.15s ease, background 0.15s ease;
	}

	.search-box:focus-within {
		border-color: var(--ring);
		background: var(--background);
	}

	.search-box :global(.search-icon) {
		color: var(--muted-foreground);
		flex-shrink: 0;
		margin-right: 6px;
	}

	.search-box input {
		width: 100%;
		min-height: 28px;
		border: 0;
		background: transparent;
		color: var(--foreground);
		font-family: inherit;
		font-size: 0.8125rem;
		outline: none;
	}

	.search-box input::placeholder {
		color: var(--muted-foreground);
	}

	.clear-search {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background: transparent;
		color: var(--muted-foreground);
		cursor: pointer;
		padding: 2px;
		border-radius: 4px;
	}

	.clear-search:hover {
		color: var(--foreground);
	}

	.sidebar-notes {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 6px 8px 32px;
	}

	.note-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
		border: 1px solid transparent;
		border-radius: 6px;
		background: transparent;
		padding: 9px 10px;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.12s ease, border-color 0.12s ease;
	}

	.note-item:hover {
		background: var(--accent);
	}

	.note-item.active {
		background: color-mix(in srgb, var(--foreground) 8%, var(--background));
		border-color: var(--border);
	}

	:global(.dark) .note-item.active {
		background: color-mix(in srgb, var(--foreground) 12%, var(--background));
		border-color: color-mix(in srgb, var(--border) 150%, transparent);
	}

	.note-item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
	}

	.note-item-title-wrap {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	:global(.pin-icon) {
		color: var(--muted-foreground);
		flex-shrink: 0;
		transform: rotate(45deg);
	}

	.note-item-title {
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--foreground);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.note-item-date {
		font-size: 0.6875rem;
		color: var(--muted-foreground);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.dialog-field {
		margin: 16px 0;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 16px;
	}

	.note-item-snippet {
		margin: 0;
		font-size: 0.775rem;
		line-height: 1.4;
		color: var(--muted-foreground);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-word;
	}

	.sidebar-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 32px 16px;
		text-align: center;
		color: var(--muted-foreground);
		font-size: 0.8125rem;
	}

	.sidebar-state.empty .empty-title {
		margin: 0;
		font-weight: 500;
		color: var(--foreground);
		font-size: 0.875rem;
	}

	.sidebar-state.empty .empty-desc {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	.sidebar-state.error p {
		margin: 0;
		color: var(--destructive);
	}

	@media (max-width: 767px) {
		.desktop-trigger-wrap {
			display: none !important;
		}

		.sidebar-header {
			height: auto;
			min-height: 0;
			max-height: none;
			padding: 20px 16px 12px;
			align-items: center;
		}

		.sidebar-title {
			font-size: clamp(1.75rem, 4vw, 2.25rem);
			letter-spacing: -0.04em;
			line-height: 1.1;
		}

		.header-left {
			gap: 10px;
		}

		.search-bar-wrap {
			padding: 8px 16px 12px;
		}

		.sidebar-notes {
			padding: 6px 16px 32px;
		}
	}
</style>
