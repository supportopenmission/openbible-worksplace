<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import { Tipex, defaultExtensions } from '@friendofsvelte/tipex';
	import '@friendofsvelte/tipex/styles/index.css';
	import type { Editor, EditorEvents } from '@tiptap/core';
	import { Highlight } from '@tiptap/extension-highlight';
	import { Placeholder } from '@tiptap/extension-placeholder';
	import { GripVertical } from '@lucide/svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import { createNoteEditorService, type SaveStatus } from './note-editor-service';
	import type { Note } from './note-types';
	import {
		filterSlashCommands,
		isDirectVerseSlash,
		parseSlashToken,
		type SlashCommand
	} from './slash-commands';
	import { NOTE_HIGHLIGHTS, type NoteHighlightColor } from './note-highlights';
	import {
		computeFloatingSurfacePosition,
		createNoteKeyboardExtension,
		moveTopLevelBlock,
		moveTopLevelBlockTo,
		type BlockDropSide
	} from './note-block-interactions';
	import {
		htmlBodyToMarkdown,
		markdownBodyToHtml,
		VerseBlockExtension,
		verseBlockFromFence
	} from './verse-block-extension';
	import VerseSelector, { type VerseSelectionResult } from './VerseSelector.svelte';
	import { NOTE_EDITOR_WIDTHS } from './note-editor-layout';
	import { notePageChrome } from './note-page-chrome.svelte';

	let {
		note,
		storage,
		onSaved
	}: {
		note: Note;
		storage: WorkspaceStorage;
		onSaved?: (note: Note) => void;
	} = $props();

	let editor = $state<Editor | undefined>();
	let saveStatus = $state<SaveStatus>('idle');
	let verseSelectorOpen = $state(false);
	let slashOpen = $state(false);
	let slashQuery = $state('/');
	let slashIndex = $state(0);
	let slashRange = $state<{ from: number; to: number } | null>(null);
	let slashPos = $state<{ top: number; left: number; width: number; maxHeight: number } | null>(
		null
	);
	let slashMenu = $state<HTMLDivElement>();
	let formatOpen = $state(false);
	let formatPos = $state<{ top: number; left: number; maxWidth: number } | null>(null);
	let formatBubble = $state<HTMLDivElement>();
	let formatAnchor = $state<{ left: number; right: number; top: number; bottom: number } | null>(
		null
	);
	let blockHandle = $state<{ pos: number; top: number; left: number } | null>(null);
	let draggedBlockPos = $state<number | null>(null);
	let dropTarget = $state<{
		pos: number;
		side: BlockDropSide;
		top: number;
		left: number;
		width: number;
	} | null>(null);
	let consumingSlash = false;

	const initialBody = untrack(() => markdownBodyToHtml(note.body));
	const extensions = [
		...defaultExtensions.filter((extension) => extension.name !== 'placeholder'),
		Placeholder.configure({
			placeholder: ({ node }) =>
				node.type.name === 'heading' ? 'Título' : "Digite '/' para inserir um bloco",
			showOnlyWhenEditable: true
		}),
		Highlight.configure({ multicolor: true, HTMLAttributes: { class: 'note-highlight' } }),
		VerseBlockExtension,
		createNoteKeyboardExtension(handleEditorKeydown)
	];

	const filteredCommands = $derived(filterSlashCommands(slashQuery));

	const editorService = createNoteEditorService({
		storage: untrack(() => storage),
		note: untrack(() => note),
		onStatusChange: (status) => {
			saveStatus = status;
		}
	});

	onDestroy(() => {
		editorService.dispose();
	});

	const saveLabel = $derived(
		saveStatus === 'saving'
			? 'Salvando'
			: saveStatus === 'saved'
				? 'Salvo'
				: saveStatus === 'error'
					? 'Erro ao salvar'
					: ''
	);

	function closeSlash() {
		slashOpen = false;
		slashRange = null;
	}

	function positionSlashMenu(position: number) {
		if (!editor || typeof window === 'undefined') return;
		const coords = editor.view.coordsAtPos(position);
		const viewportPadding = 12;
		const gap = 6;
		const width = Math.min(272, window.innerWidth - viewportPadding * 2);
		const below = Math.max(0, window.innerHeight - coords.bottom - gap - viewportPadding);
		const above = Math.max(0, coords.top - gap - viewportPadding);
		const placeAbove = below < 180 && above > below;
		const maxHeight = Math.max(120, Math.min(304, placeAbove ? above : below));
		const left = Math.min(
			Math.max(coords.left, viewportPadding),
			window.innerWidth - width - viewportPadding
		);
		const top = placeAbove
			? Math.max(viewportPadding, coords.top - gap - maxHeight)
			: Math.min(coords.bottom + gap, window.innerHeight - viewportPadding - maxHeight);

		slashPos = { top, left, width, maxHeight };
	}

	function keepActiveSlashItemVisible() {
		void tick().then(() => {
			slashMenu
				?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')
				?.scrollIntoView({ block: 'nearest' });
		});
	}

	function repositionOverlays() {
		if (!editor) return;
		if (slashOpen) positionSlashMenu(editor.state.selection.from);
		if (formatOpen) updateFormatBubblePosition();
		if (blockHandle) positionBlockHandle(blockHandle.pos);
	}

	function selectionAnchor() {
		if (!editor) return null;
		const { from, to } = editor.state.selection;
		const start = editor.view.coordsAtPos(from);
		const end = editor.view.coordsAtPos(to);
		return {
			left: Math.min(start.left, end.left),
			right: Math.max(start.right, end.right),
			top: Math.min(start.top, end.top),
			bottom: Math.max(start.bottom, end.bottom)
		};
	}

	function updateFormatBubblePosition() {
		if (typeof window === 'undefined') return;
		formatAnchor = selectionAnchor();
		if (!formatAnchor) return;
		formatPos ??= { top: 8, left: 8, maxWidth: Math.max(0, window.innerWidth - 16) };
		void tick().then(() => {
			if (!formatBubble || !formatAnchor || !formatOpen) return;
			const surface = formatBubble.getBoundingClientRect();
			const position = computeFloatingSurfacePosition({
				anchor: formatAnchor,
				surface,
				viewport: { width: window.innerWidth, height: window.innerHeight },
				padding: 8,
				gap: 6
			});
			formatPos = { top: position.top, left: position.left, maxWidth: position.maxWidth };
		});
	}

	function topLevelBlockPosition(position: number): number | null {
		if (!editor) return null;
		const resolved = editor.state.doc.resolve(
			Math.max(0, Math.min(position, editor.state.doc.content.size))
		);
		if (resolved.depth === 0) return null;
		return resolved.before(1);
	}

	function positionBlockHandle(position: number) {
		if (!editor || typeof window === 'undefined') return;
		const node = editor.state.doc.nodeAt(position);
		if (!node || (position === 0 && node.type.name === 'heading')) {
			blockHandle = null;
			return;
		}
		const dom = editor.view.nodeDOM(position);
		if (!(dom instanceof HTMLElement)) return;
		const rect = dom.getBoundingClientRect();
		blockHandle = {
			pos: position,
			top: rect.top + Math.max(0, (rect.height - 28) / 2),
			left: Math.max(8, rect.left - 34)
		};
	}

	function updateBlockHandleFromSelection() {
		if (!editor) return;
		const position =
			'node' in editor.state.selection
				? editor.state.selection.from
				: topLevelBlockPosition(editor.state.selection.from);
		if (position === null) return;
		positionBlockHandle(position);
	}

	function blockAtPoint(clientX: number, clientY: number): { pos: number; rect: DOMRect } | null {
		if (!editor) return null;
		const found = editor.view.posAtCoords({ left: clientX, top: clientY });
		if (!found) return null;
		const pos = topLevelBlockPosition(found.pos);
		if (pos === null) return null;
		const node = editor.state.doc.nodeAt(pos);
		if (!node || (pos === 0 && node.type.name === 'heading')) return null;
		const dom = editor.view.nodeDOM(pos);
		return dom instanceof HTMLElement ? { pos, rect: dom.getBoundingClientRect() } : null;
	}

	function handleCanvasPointerMove(event: PointerEvent) {
		if (draggedBlockPos !== null) return;
		const block = blockAtPoint(event.clientX, event.clientY);
		if (block) positionBlockHandle(block.pos);
	}

	function selectCurrentBlock() {
		if (!editor || !blockHandle) return;
		const alreadySelected =
			'node' in editor.state.selection && editor.state.selection.from === blockHandle.pos;
		if (!alreadySelected) editor.commands.setNodeSelection(blockHandle.pos);
		editor.view.dom.dataset.blockSelected = 'true';
	}

	function handleBlockKeydown(event: KeyboardEvent) {
		if (!editor || !blockHandle) return;
		if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
			event.preventDefault();
			const direction = event.key === 'ArrowUp' ? -1 : 1;
			if (moveTopLevelBlock(editor, blockHandle.pos, direction)) updateBlockHandleFromSelection();
		}
	}

	function handleBlockDragStart(event: DragEvent) {
		if (!blockHandle || !event.dataTransfer) return;
		selectCurrentBlock();
		draggedBlockPos = blockHandle.pos;
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', 'openbible-note-block');
	}

	function handleCanvasDragOver(event: DragEvent) {
		if (draggedBlockPos === null || !event.dataTransfer) return;
		const block = blockAtPoint(event.clientX, event.clientY);
		if (!block) return;
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = 'move';
		const side: BlockDropSide =
			event.clientY < block.rect.top + block.rect.height / 2 ? 'before' : 'after';
		dropTarget = {
			pos: block.pos,
			side,
			top: side === 'before' ? block.rect.top : block.rect.bottom,
			left: block.rect.left,
			width: block.rect.width
		};
	}

	function finishBlockDrag() {
		draggedBlockPos = null;
		dropTarget = null;
	}

	function handleCanvasDrop(event: DragEvent) {
		if (!editor || draggedBlockPos === null || !dropTarget) return finishBlockDrag();
		event.preventDefault();
		event.stopPropagation();
		moveTopLevelBlockTo(editor, draggedBlockPos, dropTarget.pos, dropTarget.side);
		finishBlockDrag();
		updateBlockHandleFromSelection();
	}

	function updateChrome() {
		if (!editor || consumingSlash) return;

		const { from, to, empty } = editor.state.selection;
		const textBefore = editor.state.doc.textBetween(Math.max(0, from - 40), from, '\n', '\n');
		const slash = parseSlashToken(textBefore);

		if (slash && !verseSelectorOpen) {
			if (isDirectVerseSlash(slash.token)) {
				consumingSlash = true;
				editor
					.chain()
					.focus()
					.deleteRange({ from: from - slash.length, to: from })
					.run();
				consumingSlash = false;
				closeSlash();
				verseSelectorOpen = true;
			} else {
				slashOpen = true;
				slashQuery = slash.token;
				slashIndex = 0;
				slashRange = { from: from - slash.length, to: from };
				positionSlashMenu(from);
			}
		} else {
			closeSlash();
		}

		const nodeSelected = 'node' in editor.state.selection;
		if (!nodeSelected && !empty && !slashOpen) {
			formatOpen = true;
			updateFormatBubblePosition();
		} else {
			formatOpen = false;
			formatAnchor = null;
		}

		if (nodeSelected) {
			editor.view.dom.dataset.blockSelected = 'true';
			updateBlockHandleFromSelection();
		} else {
			delete editor.view.dom.dataset.blockSelected;
			updateBlockHandleFromSelection();
		}
	}

	function handleCreate({ editor: created }: EditorEvents['create']) {
		created.on('selectionUpdate', updateChrome);
		created.on('update', updateChrome);
	}

	function handleUpdate() {
		if (!editor) return;
		const markdown = htmlBodyToMarkdown(editor.getHTML());
		editorService.scheduleSave(markdown);
	}

	function applySlashCommand(command: SlashCommand) {
		if (!editor || !slashRange) return;
		consumingSlash = true;
		const chain = editor.chain().focus().deleteRange(slashRange);
		switch (command.id) {
			case 'heading1':
				chain.setHeading({ level: 1 });
				break;
			case 'heading2':
				chain.setHeading({ level: 2 });
				break;
			case 'heading3':
				chain.setHeading({ level: 3 });
				break;
			case 'bullet':
				chain.toggleBulletList();
				break;
			case 'ordered':
				chain.toggleOrderedList();
				break;
			case 'task':
				chain.toggleTaskList();
				break;
			case 'quote':
				chain.toggleBlockquote();
				break;
			case 'code':
				chain.toggleCodeBlock();
				break;
			case 'highlight':
				chain.toggleHighlight();
				break;
			case 'verse':
				chain.run();
				consumingSlash = false;
				closeSlash();
				verseSelectorOpen = true;
				return;
		}
		chain.run();
		consumingSlash = false;
		closeSlash();
	}

	function handleSlashKeydown(key: string): boolean {
		if (!slashOpen) return false;
		if (key === 'ArrowDown') {
			slashIndex = (slashIndex + 1) % Math.max(filteredCommands.length, 1);
			keepActiveSlashItemVisible();
			return true;
		} else if (key === 'ArrowUp') {
			slashIndex =
				(slashIndex - 1 + Math.max(filteredCommands.length, 1)) %
				Math.max(filteredCommands.length, 1);
			keepActiveSlashItemVisible();
			return true;
		} else if (key === 'Enter') {
			const selected = filteredCommands[slashIndex];
			if (selected) applySlashCommand(selected);
			return true;
		} else if (key === 'Escape') {
			closeSlash();
			return true;
		}
		return false;
	}

	function handleEditorKeydown(key: string): boolean {
		return handleSlashKeydown(key);
	}

	function applyHighlight(color: NoteHighlightColor) {
		editor?.chain().focus().setHighlight({ color }).run();
	}

	function insertVerseBlock(result: VerseSelectionResult) {
		if (!editor) return;
		const block = verseBlockFromFence({
			attrs: {
				versionId: result.versionId,
				version: result.version ?? '',
				bookId: String(result.bookId),
				book: result.book ?? '',
				chapter: String(result.chapter),
				verseStart: String(result.verseStart),
				verseEnd: String(result.verseEnd)
			},
			body: result.snapshot
		});
		editor.chain().focus().insertContent(block).run();
	}

	async function handleVerseConfirm(result: VerseSelectionResult) {
		insertVerseBlock(result);
		if (!editor) return;
		const saved = await editorService.saveNow(htmlBodyToMarkdown(editor.getHTML()));
		if (saved) onSaved?.(saved);
	}
</script>

<svelte:window onresize={repositionOverlays} onscroll={repositionOverlays} />

<div
	class="note-canvas"
	data-testid="note-canvas"
	data-viewport-fill="true"
	data-editor-width={notePageChrome.width}
	role="region"
	aria-label="Editor da nota"
	style:--note-editor-max-width={NOTE_EDITOR_WIDTHS[notePageChrome.width].maxWidth}
	onpointermove={handleCanvasPointerMove}
	ondragovercapture={handleCanvasDragOver}
	ondropcapture={handleCanvasDrop}
>
	<div class="note-canvas-inner">
	<p class="save-status" aria-live="polite" aria-atomic="true">
		{#if saveLabel}
			<span class:status-error={saveStatus === 'error'}>{saveLabel}</span>
		{/if}
	</p>

	<Tipex
		body={initialBody}
		bind:tipex={editor}
		{extensions}
		!focal
		autofocus={false}
		controlComponent={null}
		class="note-tipex"
		oncreate={handleCreate}
		onupdate={handleUpdate}
	/>

	{#if formatOpen && formatPos && editor}
		<div
			bind:this={formatBubble}
			class="format-bubble"
			style:top="{formatPos.top}px"
			style:left="{formatPos.left}px"
			style:max-width="{formatPos.maxWidth}px"
			role="toolbar"
			aria-label="Formatação"
		>
			<button
				type="button"
				class:active={editor.isActive('bold')}
				aria-pressed={editor.isActive('bold')}
				onclick={() => editor?.chain().focus().toggleBold().run()}
			>
				Negrito
			</button>
			<button
				type="button"
				class:active={editor.isActive('italic')}
				aria-pressed={editor.isActive('italic')}
				onclick={() => editor?.chain().focus().toggleItalic().run()}
			>
				Itálico
			</button>
			<button
				type="button"
				class:active={editor.isActive('underline')}
				aria-pressed={editor.isActive('underline')}
				onclick={() => editor?.chain().focus().toggleUnderline().run()}
			>
				Sublinhado
			</button>
			<div class="highlight-colors" role="group" aria-label="Cor de destaque">
				{#each NOTE_HIGHLIGHTS as option (option.color)}
					<button
						type="button"
						class="color-swatch"
						class:active={editor.isActive('highlight', { color: option.color })}
						data-color={option.color}
						aria-label={`Cor de destaque: ${option.label}`}
						aria-pressed={editor.isActive('highlight', { color: option.color })}
						onclick={() => applyHighlight(option.color)}
					>
						<span class="sr-only">{option.label}</span>
					</button>
				{/each}
				<button
					type="button"
					class="clear-highlight"
					aria-label="Remover destaque"
					onclick={() => editor?.chain().focus().unsetHighlight().run()}
				>
					Sem cor
				</button>
			</div>
		</div>
	{/if}

	{#if blockHandle}
		<div
			class="block-handle"
			class:dragging={draggedBlockPos !== null}
			style:top="{blockHandle.top}px"
			style:left="{blockHandle.left}px"
		>
			<button
				type="button"
				draggable="true"
				aria-label="Selecionar e mover bloco"
				title="Selecionar e mover bloco"
				onpointerdown={selectCurrentBlock}
				onclick={selectCurrentBlock}
				onkeydown={handleBlockKeydown}
				ondragstart={handleBlockDragStart}
				ondragend={finishBlockDrag}
			>
				<GripVertical size={16} aria-hidden="true" />
			</button>
		</div>
	{/if}

	{#if dropTarget}
		<div
			class="block-drop-indicator"
			style:top="{dropTarget.top}px"
			style:left="{dropTarget.left}px"
			style:width="{dropTarget.width}px"
			aria-hidden="true"
		></div>
	{/if}

	{#if slashOpen && slashPos}
		<div
			bind:this={slashMenu}
			class="slash-menu"
			style:top="{slashPos.top}px"
			style:left="{slashPos.left}px"
			style:width="{slashPos.width}px"
			style:max-height="{slashPos.maxHeight}px"
		>
			<p class="slash-heading">Blocos básicos</p>
			<ul class="slash-options" role="listbox" aria-label="Blocos">
				{#each filteredCommands as command, index (command.id)}
					<li role="option" aria-selected={index === slashIndex}>
						<button
							type="button"
							class:active={index === slashIndex}
							onclick={() => applySlashCommand(command)}
						>
							<span class="slash-label">{command.label}</span>
							<span class="slash-desc">{command.description}</span>
						</button>
					</li>
				{/each}
				{#if filteredCommands.length === 0}
					<li class="slash-empty">Nenhum bloco encontrado</li>
				{/if}
			</ul>
			<div class="slash-footer">
				<span>Fechar menu</span>
				<kbd>esc</kbd>
			</div>
		</div>
	{/if}

	<VerseSelector bind:open={verseSelectorOpen} {storage} onConfirm={handleVerseConfirm} />
	</div>
</div>

<style>
	.note-canvas {
		width: 100%;
		min-height: calc(100dvh - 110px);
		padding: 0 clamp(18px, 5vw, 72px) 72px;
		font-family: var(--font-sans);
	}

	.note-canvas-inner {
		width: 100%;
		max-width: var(--note-editor-max-width, 760px);
		margin: 0 auto;
	}

	.save-status {
		min-height: 1.25rem;
		margin: 0 0 4px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-align: right;
	}

	.status-error {
		color: var(--destructive);
	}

	:global(.note-canvas .tipex-editor),
	:global(.note-canvas .note-tipex),
	:global(.note-canvas .tipex-editor-wrap),
	:global(.note-canvas .tipex-editor-section) {
		border: none !important;
		border-radius: 0 !important;
		box-shadow: none !important;
		background: transparent !important;
		backdrop-filter: none !important;
		outline: none !important;
		overflow: visible !important;
	}

	:global(.note-canvas .ProseMirror) {
		border: none !important;
		box-shadow: none !important;
		outline: none !important;
		padding: 0 !important;
		width: 100%;
		min-height: calc(100dvh - 180px);
		font-family: var(--font-sans);
		font-size: 1.05rem;
		line-height: 1.75;
		color: var(--foreground);
	}

	:global(.note-canvas .ProseMirror:focus),
	:global(.note-canvas .ProseMirror:focus-visible) {
		outline: none !important;
		box-shadow: none !important;
	}

	:global(.note-canvas .ProseMirror h1) {
		margin: 0 0 0.85rem;
		font-size: clamp(1.85rem, 4vw, 2.4rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1.15;
	}

	:global(.note-canvas .ProseMirror h2) {
		margin: 1.6rem 0 0.55rem;
		font-size: 1.35rem;
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	:global(.note-canvas .ProseMirror h3) {
		margin: 1.25rem 0 0.4rem;
		font-size: 1.12rem;
		font-weight: 600;
	}

	:global(.note-canvas .ProseMirror p) {
		margin: 0 0 0.7rem;
	}

	:global(.note-canvas .ProseMirror ul[data-type='taskList']) {
		margin: 0 0 1rem;
		padding: 0;
		border: none !important;
		background: transparent !important;
		list-style: none;
	}

	:global(.note-canvas .note-highlight),
	:global(.note-canvas mark) {
		background: color-mix(in oklch, var(--foreground) 12%, transparent);
		color: inherit;
		border-radius: 2px;
		padding: 0 0.12em;
	}

	:global(.note-canvas mark[data-color='yellow']) {
		background: color-mix(in oklch, #f5d90a 45%, transparent) !important;
	}

	:global(.note-canvas mark[data-color='green']) {
		background: color-mix(in oklch, #46a758 38%, transparent) !important;
	}

	:global(.note-canvas mark[data-color='blue']) {
		background: color-mix(in oklch, #0091ff 32%, transparent) !important;
	}

	:global(.note-canvas mark[data-color='pink']) {
		background: color-mix(in oklch, #d6409f 32%, transparent) !important;
	}

	:global(.note-canvas .verse-block-callout) {
		margin: 1.25rem 0;
		border: none;
		border-inline-start: 2px solid color-mix(in oklch, var(--foreground) 18%, transparent);
		background: color-mix(in oklch, var(--foreground) 3%, transparent);
		padding: 14px 16px 14px 18px;
	}

	:global(.note-canvas .verse-block-ref) {
		margin: 0 0 10px;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 500;
	}

	:global(.note-canvas .verse-snapshot) {
		margin: 0;
		font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
		font-size: 0.9rem;
		line-height: 1.65;
		white-space: pre-wrap;
		background: transparent !important;
	}

	.format-bubble,
	.slash-menu {
		position: fixed;
		z-index: 40;
		border: 1px solid var(--border);
		background: var(--background);
		box-shadow: none;
	}

	.format-bubble {
		display: flex;
		align-items: center;
		gap: 2px;
		border-radius: 8px;
		padding: 4px;
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior: contain;
		scrollbar-width: thin;
	}

	.block-handle {
		position: fixed;
		z-index: 39;
		width: 28px;
		height: 28px;
		cursor: grab;
		opacity: 0.58;
	}

	.block-handle:hover,
	.block-handle:focus-within,
	.block-handle.dragging {
		opacity: 1;
	}

	.block-handle.dragging {
		cursor: grabbing;
	}

	.block-handle button {
		display: grid;
		width: 28px;
		height: 28px;
		place-items: center;
		border: 0;
		border-radius: 5px;
		background: transparent;
		color: var(--muted-foreground);
		cursor: inherit;
	}

	.block-handle button:hover,
	.block-handle button:focus-visible {
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
		color: var(--foreground);
	}

	.block-handle button:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.block-drop-indicator {
		position: fixed;
		z-index: 38;
		height: 2px;
		transform: translateY(-1px);
		background: var(--ring);
		pointer-events: none;
	}

	:global(.note-canvas .ProseMirror-selectednode) {
		outline: 1px solid color-mix(in oklch, var(--ring) 72%, transparent) !important;
		outline-offset: 4px;
		background: color-mix(in oklch, var(--ring) 5%, transparent);
	}

	.highlight-colors {
		display: flex;
		align-items: center;
		gap: 3px;
		border-inline-start: 1px solid var(--border);
		padding-inline-start: 5px;
	}

	.format-bubble .color-swatch {
		width: 22px;
		height: 22px;
		border: 1px solid color-mix(in oklch, var(--foreground) 16%, transparent);
		border-radius: 5px;
		padding: 0;
	}

	.color-swatch[data-color='yellow'] {
		background: color-mix(in oklch, #f5d90a 55%, var(--background));
	}
	.color-swatch[data-color='green'] {
		background: color-mix(in oklch, #46a758 50%, var(--background));
	}
	.color-swatch[data-color='blue'] {
		background: color-mix(in oklch, #0091ff 45%, var(--background));
	}
	.color-swatch[data-color='pink'] {
		background: color-mix(in oklch, #d6409f 45%, var(--background));
	}

	.format-bubble .color-swatch.active {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.format-bubble .clear-highlight {
		padding-inline: 6px;
		color: var(--muted-foreground);
	}

	.format-bubble button,
	.slash-menu button {
		border: none;
		background: transparent;
		color: var(--foreground);
		font-family: inherit;
		cursor: pointer;
	}

	.format-bubble button {
		border-radius: 6px;
		padding: 6px 8px;
		font-size: 0.72rem;
		font-weight: 550;
	}

	.format-bubble button.active,
	.format-bubble button:hover,
	.slash-menu button.active,
	.slash-menu button:hover {
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
	}

	.slash-menu {
		display: flex;
		flex-direction: column;
		transform: none;
		margin: 0;
		border-radius: 8px;
		overflow: hidden;
	}

	.slash-heading {
		margin: 0 10px;
		border-bottom: 1px solid var(--border);
		padding: 9px 2px 7px;
		color: var(--muted-foreground);
		font-size: 0.7rem;
	}

	.slash-options {
		min-height: 0;
		margin: 0;
		padding: 5px;
		overflow-y: auto;
		overscroll-behavior: contain;
		list-style: none;
		scrollbar-gutter: stable;
	}

	.slash-menu button {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-radius: 5px;
		padding: 6px 8px;
		text-align: left;
	}

	.slash-label {
		font-size: 0.8rem;
		font-weight: 550;
	}

	.slash-desc,
	.slash-empty {
		color: var(--muted-foreground);
		font-size: 0.72rem;
	}

	.slash-desc {
		max-width: 42%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.slash-empty {
		padding: 8px 10px;
	}

	.slash-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid var(--border);
		padding: 8px 12px;
		font-size: 0.74rem;
	}

	.slash-footer kbd {
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.68rem;
	}

	.sr-only {
		position: absolute;
		overflow: hidden;
		width: 1px;
		height: 1px;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}

	@media (max-width: 767px) {
		.note-canvas {
			min-height: calc(100dvh - 148px);
			padding: 0 16px calc(96px + env(safe-area-inset-bottom));
		}

		:global(.note-canvas .ProseMirror) {
			min-height: calc(100dvh - 220px);
			font-size: 1rem;
		}

		.format-bubble {
			max-width: calc(100vw - 16px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.format-bubble,
		.slash-menu {
			transition: none;
		}
	}
</style>
