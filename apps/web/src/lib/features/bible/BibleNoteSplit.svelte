<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { ArrowLeft, MoreHorizontal, Trash2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import MilkdownNoteEditor from '$lib/features/notes/MilkdownNoteEditor.svelte';
	import NoteCardList from '$lib/features/notes/NoteCardList.svelte';
	import type { Note } from '$lib/features/notes/note-types';
	import {
		readNoteToolbarEnabled,
		saveNoteToolbarEnabled
	} from '$lib/features/notes/note-editor-layout';
	import type { WorkspaceStorage } from '$lib/storage/types';

	const SPLIT_RATIO_KEY = 'openbible:reader-split-ratio';
	const MIN_READER_RATIO = 0.32;
	const MAX_READER_RATIO = 0.68;
	const DEFAULT_READER_RATIO = 0.52;

	let {
		note,
		storage,
		listNotes = null,
		hideListDelete = true,
		toolbar = null,
		onClose,
		onBackToList,
		onSaved,
		onDelete,
		onSelectListNote,
		onTabChange,
		children
	}: {
		note: Note | null;
		storage: WorkspaceStorage | null;
		listNotes?: Note[] | null;
		hideListDelete?: boolean;
		toolbar?: Snippet | null;
		onClose: () => void;
		onBackToList?: () => void;
		onSaved?: (note: Note) => void;
		onDelete?: (note: Note) => void;
		onSelectListNote?: (note: Note) => void;
		onTabChange?: (tab: 'bible' | 'note') => void;
		children: Snippet;
	} = $props();

	const isMobile = new IsMobile();
	const showListPane = $derived(listNotes != null && listNotes.length > 0 && note == null);
	const showEditorPane = $derived(note != null && storage != null);
	const showSplit = $derived(showListPane || showEditorPane);
	const showBackToList = $derived(
		showEditorPane && listNotes != null && listNotes.length > 0 && onBackToList != null
	);

	let readerRatio = $state(DEFAULT_READER_RATIO);
	let activeMobileTab = $state<'bible' | 'note'>('note');
	let toolbarEnabled = $state(readNoteToolbarEnabled());
	let splitShell = $state<HTMLElement | null>(null);
	let resizing = $state(false);

	const readerRatioPercent = $derived(Math.round(readerRatio * 100));

	onMount(() => {
		try {
			const saved = localStorage.getItem(SPLIT_RATIO_KEY);
			if (saved == null) return;
			const parsed = Number.parseFloat(saved);
			if (Number.isFinite(parsed)) {
				readerRatio = clamp(parsed, MIN_READER_RATIO, MAX_READER_RATIO);
			}
		} catch {
			/* storage indisponível */
		}
	});

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function persistRatio() {
		try {
			localStorage.setItem(SPLIT_RATIO_KEY, String(readerRatio));
		} catch {
			/* storage indisponível */
		}
	}

	function setRatioFromClientX(clientX: number) {
		if (!splitShell) return;
		const rect = splitShell.getBoundingClientRect();
		if (rect.width <= 0) return;
		readerRatio = clamp((clientX - rect.left) / rect.width, MIN_READER_RATIO, MAX_READER_RATIO);
	}

	function handleResizerPointerDown(event: PointerEvent) {
		if (event.button !== 0) return;
		event.preventDefault();
		const handle = event.currentTarget;
		if (!(handle instanceof HTMLElement)) return;
		resizing = true;
		handle.setPointerCapture(event.pointerId);
		setRatioFromClientX(event.clientX);
	}

	function handleResizerPointerMove(event: PointerEvent) {
		if (!resizing) return;
		setRatioFromClientX(event.clientX);
	}

	function finishResize(event: PointerEvent) {
		if (!resizing) return;
		resizing = false;
		const handle = event.currentTarget;
		if (handle instanceof HTMLElement && handle.hasPointerCapture(event.pointerId)) {
			handle.releasePointerCapture(event.pointerId);
		}
		persistRatio();
	}

	function resetRatio() {
		readerRatio = DEFAULT_READER_RATIO;
		persistRatio();
	}

	function handleResizerKeydown(event: KeyboardEvent) {
		const step = event.shiftKey ? 0.05 : 0.02;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			readerRatio = clamp(readerRatio - step, MIN_READER_RATIO, MAX_READER_RATIO);
			persistRatio();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			readerRatio = clamp(readerRatio + step, MIN_READER_RATIO, MAX_READER_RATIO);
			persistRatio();
		}
	}

	function handleListNoteOpen(noteId: string) {
		const selected = listNotes?.find((item) => item.id === noteId);
		if (selected) {
			onSelectListNote?.(selected);
		}
	}

	function setToolbarEnabled(enabled: boolean) {
		toolbarEnabled = enabled;
		saveNoteToolbarEnabled(enabled);
	}
</script>

{#snippet notePane(openNote: Note, openStorage: WorkspaceStorage)}
	<section class="note-pane note-pane-editor" aria-label="Nota">
		<div class="note-pane-header">
			<div class="note-pane-heading">
				{#if showBackToList}
					<Button variant="ghost" size="sm" class="back-to-list" onclick={() => onBackToList?.()}>
						<ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
						Todas as notas
					</Button>
				{/if}
				<p class="note-pane-title" title={openNote.title}>{openNote.title}</p>
			</div>
			<div class="note-pane-actions">
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
					<DropdownMenu.Content align="end">
						<DropdownMenu.CheckboxItem
							checked={toolbarEnabled}
							onCheckedChange={(checked) => setToolbarEnabled(checked === true)}
						>
							<span>Barra de formatação</span>
						</DropdownMenu.CheckboxItem>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							class="text-destructive focus:text-destructive"
							onclick={() => onDelete?.(openNote)}
						>
							<Trash2 size={14} aria-hidden="true" />
							<span>Apagar nota</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<Button variant="ghost" size="sm" class="note-pane-close" onclick={onClose}
					>Fechar nota</Button
				>
			</div>
		</div>
		<MilkdownNoteEditor note={openNote} storage={openStorage} {onSaved} {toolbarEnabled} />
	</section>
{/snippet}

{#snippet listPane(openNotes: Note[])}
	<section class="note-pane note-pane-list" aria-label="Notas do versículo">
		<div class="note-pane-header">
			<p class="note-pane-title">Notas do versículo</p>
			<Button variant="ghost" size="sm" onclick={onClose}>Fechar nota</Button>
		</div>
		<NoteCardList
			notes={openNotes}
			onOpen={handleListNoteOpen}
			onDelete={() => {}}
			hideDelete={hideListDelete}
		/>
	</section>
{/snippet}

{#if !showSplit}
	{@render children()}
{:else if isMobile.current}
	<div class="note-split-shell">
		<Tabs.Root
			bind:value={activeMobileTab}
			class="note-split-tabs"
			onValueChange={(value) => onTabChange?.(value as 'bible' | 'note')}
		>
			<Tabs.List class="note-split-tab-list">
				<Tabs.Trigger value="bible">Bíblia</Tabs.Trigger>
				<Tabs.Trigger value="note">Nota</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="bible">{@render toolbar?.()}{@render children()}</Tabs.Content>
			<Tabs.Content value="note">
				{#if showEditorPane && note && storage}
					{@render notePane(note, storage)}
				{:else if showListPane && listNotes}
					{@render listPane(listNotes)}
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</div>
{:else}
	<div class="note-split-shell" bind:this={splitShell} class:resizing>
		<div class="note-split" style:--reader-split-ratio={readerRatio}>
			<div class="reader-pane">{@render toolbar?.()}{@render children()}</div>
			<div
				class="split-resizer"
				role="slider"
				aria-orientation="vertical"
				tabindex={0}
				aria-label="Redimensionar painéis entre Bíblia e nota"
				aria-valuemin={MIN_READER_RATIO * 100}
				aria-valuemax={MAX_READER_RATIO * 100}
				aria-valuenow={readerRatioPercent}
				onpointerdown={handleResizerPointerDown}
				onpointermove={handleResizerPointerMove}
				onpointerup={finishResize}
				onpointercancel={finishResize}
				ondblclick={resetRatio}
				onkeydown={handleResizerKeydown}
			></div>
			{#if showEditorPane && note && storage}
				{@render notePane(note, storage)}
			{:else if showListPane && listNotes}
				{@render listPane(listNotes)}
			{/if}
		</div>
	</div>
{/if}

<style>
	.note-split-shell {
		display: flex;
		min-height: 0;
		height: 100%;
		flex: 1;
		flex-direction: column;
		overflow: hidden;
	}

	.note-split {
		display: grid;
		width: 100%;
		min-height: 0;
		height: 100%;
		flex: 1;
		align-items: stretch;
		grid-template-columns:
			minmax(240px, calc(var(--reader-split-ratio, 0.52) * 100%)) 10px
			minmax(280px, 1fr);
		overflow: hidden;
	}

	.reader-pane {
		min-width: 0;
		min-height: 0;
		height: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-right: 16px;
	}

	.reader-pane :global(.reading-column) {
		max-width: none;
		margin: 0;
		padding-top: 24px;
	}

	.split-resizer {
		position: relative;
		align-self: stretch;
		min-height: 100%;
		border: none;
		padding: 0;
		background: transparent;
		touch-action: none;
		cursor: col-resize;
		user-select: none;
	}

	.split-resizer::after {
		/* A linha acompanha o respiro da página (8px em cima, 16px embaixo no split). */
		position: absolute;
		top: -8px;
		bottom: -16px;
		left: 50%;
		width: 1px;
		background: var(--border);
		content: '';
		transform: translateX(-50%);
	}

	.split-resizer:hover::after,
	.split-resizer:focus-visible::after,
	.note-split-shell.resizing .split-resizer::after {
		width: 2px;
		background: color-mix(in oklch, var(--foreground) 35%, var(--border));
	}

	.split-resizer:focus-visible {
		outline: none;
	}

	.note-pane {
		display: flex;
		min-width: 0;
		min-height: 0;
		height: 100%;
		flex: 1;
		flex-direction: column;
		gap: 0;
		padding-left: 16px;
		overflow: hidden;
	}

	.note-pane-editor {
		overflow: hidden;
		height: 100%;
	}

	.note-pane-editor :global(.note-editor-viewport) {
		display: flex;
		min-height: 0;
		height: 100%;
		flex: 1;
		flex-direction: column;
		overflow: hidden;
	}

	.note-pane-editor :global(.milkdown-editor) {
		display: flex;
		min-height: 0;
		height: 100%;
		flex: 1;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
	}

	.note-pane-editor :global(.note-container) {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		flex: 1;
		box-sizing: border-box;
	}

	.note-pane-editor :global(.milkdown-host) {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.note-pane-editor :global(.milkdown-host .milkdown) {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.note-pane-editor :global(.milkdown-host .ProseMirror) {
		flex: 1;
		min-height: 280px;
	}

	.note-pane-list {
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.note-pane-header {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		height: 48px;
		min-height: 48px;
		padding: 0 16px;
		border-bottom: 1px solid var(--border);
		background: var(--background);
	}

	.note-pane-heading {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 2px;
	}

	.note-pane-heading :global(.back-to-list) {
		align-self: flex-start;
		padding-inline: 6px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.note-pane-heading :global(.back-to-list:hover) {
		color: var(--foreground);
	}

	.note-pane-title {
		min-width: 0;
		margin: 0;
		overflow: hidden;
		font-size: 0.82rem;
		font-weight: 550;
		letter-spacing: -0.01em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.note-pane-close) {
		flex-shrink: 0;
		color: var(--muted-foreground);
	}

	.note-pane-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	:global(.note-split-tabs) {
		display: flex;
		width: 100%;
		min-width: 0;
		min-height: 0;
		flex: 1;
		flex-direction: column;
	}

	:global(.note-split-tabs [data-slot='tabs-list']) {
		flex-shrink: 0;
		width: 100%;
	}

	:global(.note-split-tab-list) {
		padding-top: 8px;
		padding-inline: 12px;
	}

	:global(.note-split-tabs [data-slot='tabs-content']) {
		min-height: 0;
		flex: 1;
		overflow-y: auto;
	}

	.note-pane-editor :global(.note-canvas) {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		padding-inline: 0;
	}

	.note-pane-editor :global(.note-canvas-inner),
	.note-pane-editor :global(.note-canvas .tipex-editor-wrap),
	.note-pane-editor :global(.note-canvas .tipex-editor-section) {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
	}

	.note-pane-editor :global(.note-canvas .ProseMirror) {
		min-height: 0;
		flex: 1;
		overflow-y: auto;
	}

	.note-pane-list :global(.card-list) {
		align-content: start;
		margin-top: 0;
		grid-auto-rows: max-content;
	}

	.note-pane-list :global(.note-card) {
		height: auto;
	}

	@media (max-width: 767px) {
		.note-pane {
			gap: 0;
			padding-left: 0;
		}

		.note-pane-header {
			padding-inline: 12px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.split-resizer::after {
			transition: none;
		}
	}
</style>
