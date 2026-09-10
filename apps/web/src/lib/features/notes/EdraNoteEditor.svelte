<!--
Motor Edra no formato do exemplo oficial (Toolbar, BubbleMenu, DragHandle),
com o `createOpenBibleEditor` (ver `src/lib/edra/README.md`).

Persiste o mesmo Markdown canônico do motor Milkdown via
`createNoteEditorService`, sem mudança de schema: o corpo segue em
`workspace_notes.body` (SQLite `app.sqlite` no Tauri, IndexedDB no PWA).
Título e descrição vivem nos metadados, fora do conteúdo.
-->
<script lang="ts">
	import { onDestroy, onMount, untrack, type Snippet } from 'svelte';
	import { Edra, createOpenBibleEditor, type Editor } from '$lib/edra/shadcn/index.js';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import type { Note } from './note-types';
	import { createNoteEditorService, type SaveStatus } from './note-editor-service';
	import VerseSelector, { type VerseSelectionResult } from './VerseSelector.svelte';
	import { normalizeSavedMarkdown } from './edra-pure-extensions.js';
	import { collectEditorHeadings, type NoteHeading } from './note-index';
	import {
		applyIosEditorInputAttributes,
		createKeyboardInsetTracker,
		setNoteKeyboardInset
	} from './note-editor-viewport';
	import { extractContentFromNoteBody, extractTitleFromMarkdown } from './note-markdown';

	let {
		markdown,
		note,
		storage,
		readOnly = false,
		toolbarEnabled = true,
		toolbarPinned = false,
		aboveTitle,
		onSaved,
		onStatusChange,
		onHeadings
	}: {
		markdown?: string;
		note?: Note;
		storage?: WorkspaceStorage;
		readOnly?: boolean;
		toolbarEnabled?: boolean;
		toolbarPinned?: boolean;
		aboveTitle?: Snippet;
		onSaved?: (note: Note) => void;
		onStatusChange?: (status: SaveStatus) => void;
		onHeadings?: (headings: NoteHeading[]) => void;
	} = $props();

	// `toolbarPinned` reservado para compatibilidade com o motor clássico;
	// a Toolbar do Edra é estática quando visível.
	void toolbarPinned;

	let editorRoot: HTMLDivElement;
	let titleEl = $state<HTMLHeadingElement | null>(null);
	let descriptionEl = $state<HTMLParagraphElement | null>(null);

	let noteTitle = $state(
		untrack(() => note?.title || extractTitleFromMarkdown(markdown ?? '') || 'Nova nota')
	);
	let noteDescription = $state(untrack(() => note?.description || ''));
	let titleDirty = $state(false);
	let descriptionDirty = $state(false);
	let verseSelectorOpen = $state(false);
	let showDragHandle = $state(false);
	let initError = $state('');
	let updatesArmed = false;
	let appliedEditable = untrack(() => !readOnly);

	const initialContent = untrack(() => {
		const rawContent = note?.body ?? markdown ?? '';
		return note
			? extractContentFromNoteBody(rawContent, note.title)
			: extractContentFromNoteBody(rawContent);
	});

	const saveService =
		note && storage
			? createNoteEditorService({
					note: untrack(() => note),
					storage: untrack(() => storage),
					onStatusChange: (status) => {
						onStatusChange?.(status);
					},
					onSaved
				})
			: null;

	let editor: Editor | undefined = createEditorInstance();

	function createEditorInstance(): Editor | undefined {
		try {
			return createOpenBibleEditor({
				content: initialContent,
				contentType: 'markdown',
				editable: !readOnly,
				onUpdate: ({ editor: updated }) => {
					// Transações da construção (conversão Markdown inicial) não são edição.
					if (!updatesArmed) return;
					saveService?.scheduleSave(normalizeSavedMarkdown(updated.getMarkdown()));
					refreshHeadings();
				}
			});
		} catch (error) {
			initError = error instanceof Error ? error.message : 'Não foi possível abrir o editor.';
			return undefined;
		}
	}

	const chromeVisible = $derived(Boolean(editor) && toolbarEnabled && !readOnly);

	function fieldIsFocused(element: HTMLElement | null) {
		return Boolean(
			element && (document.activeElement === element || element.contains(document.activeElement))
		);
	}

	function handleTitleInput(event: Event) {
		const target = event.currentTarget as HTMLElement;
		const text = target.innerText.replace(/\r?\n/g, ' ');
		titleDirty = true;
		noteTitle = text;
		saveService?.updateTitle(text);
	}

	function handleTitleBlur() {
		titleDirty = false;
		void saveService?.flush();
	}

	function handleTitleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			descriptionEl?.focus();
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			descriptionEl?.focus();
		}
	}

	function handleDescriptionInput(event: Event) {
		const target = event.currentTarget as HTMLElement;
		const text = target.innerText.replace(/\r?\n/g, ' ');
		descriptionDirty = true;
		noteDescription = text;
		saveService?.updateDescription(text);
	}

	function handleDescriptionBlur() {
		descriptionDirty = false;
		void saveService?.flush();
	}

	function handleDescriptionKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === 'ArrowDown') {
			event.preventDefault();
			focusEditor();
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			titleEl?.focus();
		}
	}

	function handleEditorKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowUp' && editor && editor.state.selection.from <= 1) {
			event.preventDefault();
			descriptionEl?.focus();
		}
	}

	function focusEditor() {
		if (readOnly || !editor) return;
		editor.commands.focus();
	}

	function refreshHeadings() {
		if (!editorRoot) return;
		if (onHeadings) onHeadings(collectEditorHeadings(editorRoot));
	}

	function handleInsertVerseEvent() {
		if (readOnly || !storage) return;
		verseSelectorOpen = true;
	}

	async function insertVerse(selection: VerseSelectionResult) {
		if (!editor) return;
		editor.chain().focus().insertContent({
			type: 'verseFence',
			attrs: {
				versionId: selection.versionId,
				version: selection.version ?? '',
				bookId: String(selection.bookId),
				book: selection.book ?? `Livro ${selection.bookId}`,
				chapter: String(selection.chapter),
				verseStart: String(selection.verseStart),
				verseEnd: String(selection.verseEnd),
				body: selection.snapshot,
				raw: ''
			}
		}).run();
		verseSelectorOpen = false;
		focusEditor();
		refreshHeadings();
	}

	$effect(() => {
		if (note) {
			const externalTitle = note.title ?? '';
			if (externalTitle !== noteTitle && !titleDirty && !fieldIsFocused(titleEl)) {
				noteTitle = externalTitle;
				if (titleEl && titleEl.innerText !== externalTitle) {
					// eslint-disable-next-line svelte/no-dom-manipulating -- synchronize external contenteditable content without stealing focus
					titleEl.innerText = externalTitle;
				}
			}
			const externalDesc = note.description ?? '';
			if (externalDesc !== noteDescription && !descriptionDirty && !fieldIsFocused(descriptionEl)) {
				noteDescription = externalDesc;
				if (descriptionEl && descriptionEl.innerText !== externalDesc) {
					// eslint-disable-next-line svelte/no-dom-manipulating -- synchronize external contenteditable content without stealing focus
					descriptionEl.innerText = externalDesc;
				}
			}
		}
	});

	$effect(() => {
		const wantEditable = !readOnly;
		if (editor && wantEditable !== appliedEditable) {
			appliedEditable = wantEditable;
			editor.setEditable(wantEditable);
		}
	});

	onMount(() => {
		try {
			showDragHandle =
				typeof window !== 'undefined' &&
				typeof window.matchMedia === 'function' &&
				window.matchMedia('(pointer: fine)').matches;
		} catch {
			showDragHandle = false;
		}
		editorRoot.addEventListener('keydown', handleEditorKeydown, true);
		window.addEventListener('openbible:insert-verse', handleInsertVerseEvent);
		if (editor?.view.dom) applyIosEditorInputAttributes(editor.view.dom);
		refreshHeadings();
		updatesArmed = true;
		const stopKeyboardInset = createKeyboardInsetTracker((inset) => {
			if (editorRoot) setNoteKeyboardInset(editorRoot, inset);
		});
		return () => {
			stopKeyboardInset();
		};
	});

	onDestroy(() => {
		editorRoot?.removeEventListener('keydown', handleEditorKeydown, true);
		window.removeEventListener('openbible:insert-verse', handleInsertVerseEvent);
		saveService?.dispose();
	});
</script>

<div class="note-editor-viewport" bind:this={editorRoot} role="presentation">
	<div class="edra-editor" data-testid="note-canvas" data-viewport-fill="true" data-engine="edra">
		{#if initError}
			<p class="editor-error" role="alert">{initError}</p>
		{:else if editor}
			<Edra {editor}>
				{#if chromeVisible}
					<div class="edra-toolbar-full">
						<Edra.Toolbar class="edra-toolbar-bar" />
					</div>
				{/if}

				<div class="note-container" role="presentation">
					<div class="note-header-fields">
						{#if aboveTitle}
							<div class="note-above-title">
								{@render aboveTitle()}
							</div>
						{/if}

						<h1
							bind:this={titleEl}
							contenteditable={readOnly ? 'false' : 'plaintext-only'}
							class="note-title"
							tabindex="-1"
							class:readonly={readOnly}
							data-placeholder="Sem título"
							data-empty={!noteTitle.trim()}
							oninput={handleTitleInput}
							onkeydown={handleTitleKeydown}
							onblur={handleTitleBlur}
						>
							{noteTitle}
						</h1>

						<p
							bind:this={descriptionEl}
							contenteditable={readOnly ? 'false' : 'plaintext-only'}
							class="note-description"
							tabindex="-1"
							class:readonly={readOnly}
							data-placeholder={readOnly ? '' : 'Adicione uma descrição…'}
							data-empty={!noteDescription.trim()}
							aria-label="Descrição da nota"
							oninput={handleDescriptionInput}
							onkeydown={handleDescriptionKeydown}
							onblur={handleDescriptionBlur}
						>
							{noteDescription}
						</p>
					</div>

					<div class="edra-canvaswrap">
						<Edra.Content class="tiptap edra-content" />
						{#if chromeVisible && showDragHandle}
							<Edra.DragHandle />
						{/if}
					</div>
				</div>

				{#if chromeVisible}
					<Edra.BubbleMenu />
				{/if}
			</Edra>
		{/if}
	</div>

	{#if storage}
		<VerseSelector
			bind:open={verseSelectorOpen}
			{storage}
			onConfirm={insertVerse}
			onCancel={() => (verseSelectorOpen = false)}
		/>
	{/if}
</div>

<style>
	.note-editor-viewport {
		--note-keyboard-inset: 0px;
		display: contents;
	}

	@media (max-width: 767px) {
		.note-editor-viewport {
			display: flex;
			min-height: 0;
			height: 100%;
			flex: 1;
			flex-direction: column;
			overflow: hidden;
		}
	}

	.edra-editor {
		position: relative;
		width: 100%;
		min-height: 60dvh;
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	@media (max-width: 767px) {
		.edra-editor {
			display: flex;
			min-height: 0;
			flex: 1;
			flex-direction: column;
			overflow-y: auto;
			overscroll-behavior: contain;
			-webkit-overflow-scrolling: touch;
		}
	}

	.editor-error {
		margin: 8px clamp(16px, 5vw, 48px);
		color: var(--destructive);
		font-family: var(--font-sans);
	}

	.edra-toolbar-full {
		position: sticky;
		top: 0;
		z-index: 20;
		width: 100%;
		background: var(--background);
		border-bottom: 1px solid var(--border);
	}

	.edra-toolbar-full :global(.edra-toolbar-bar) {
		max-width: 800px;
		margin-inline: auto;
		padding: 4px clamp(16px, 5vw, 48px);
		overflow-x: auto;
		scrollbar-width: thin;
	}

	.note-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-height: 100%;
		flex: 1;
		max-width: 800px;
		margin: 0 auto;
		box-sizing: border-box;
		padding: 20px clamp(16px, 5vw, 48px) 140px;
	}

	@media (max-width: 767px) {
		.note-container {
			max-width: none;
			padding: 16px 16px
				calc(max(64px + env(safe-area-inset-bottom, 0px), var(--note-keyboard-inset, 0px)) + 16px);
		}
	}

	.note-header-fields {
		display: flex;
		flex-direction: column;
		width: 100%;
		margin-bottom: 24px;
	}

	.note-above-title {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin-bottom: 6px;
	}

	.note-title {
		position: relative;
		width: 100%;
		margin: 8px 0 12px;
		font-family: var(--font-sans);
		font-size: clamp(2rem, 5vw, 2.75rem);
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.035em;
		color: var(--foreground);
		outline: none;
		border: none;
		background: transparent;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.note-title[data-empty='true']::before {
		content: attr(data-placeholder);
		position: absolute;
		left: 0;
		top: 0;
		color: var(--muted-foreground);
		opacity: 0.45;
		pointer-events: none;
	}

	.note-description {
		position: relative;
		width: 100%;
		margin: 0;
		font-family: var(--font-sans);
		font-size: 1.05rem;
		line-height: 1.5;
		letter-spacing: -0.011em;
		color: var(--muted-foreground);
		outline: none;
		border: none;
		background: transparent;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.note-description:focus {
		color: var(--foreground);
	}

	.note-description[data-empty='true']::before {
		content: attr(data-placeholder);
		position: absolute;
		left: 0;
		top: 0;
		color: var(--muted-foreground);
		opacity: 0.65;
		pointer-events: none;
	}

	.note-title.readonly,
	.note-description.readonly {
		cursor: default;
		user-select: text;
	}

	.note-description.readonly[data-empty='true'] {
		display: none;
	}

	.edra-canvaswrap {
		position: relative;
		display: flex;
		flex-direction: column;
		flex: 1;
		width: 100%;
		min-height: 0;
	}

	/* Nós próprios do OpenBible (versículo, vídeo, callout) e a paleta de
	marca-texto nomeada. A tipografia base vem do `editor.css` do Edra. */
	:global(.edra-content .ProseMirror mark) {
		border-radius: 2px;
		padding: 0 1px;
		background-color: color-mix(in srgb, #eab308 35%, transparent);
	}

	:global(.edra-content .ProseMirror mark[data-color='yellow']) {
		background-color: color-mix(in srgb, #eab308 35%, transparent);
	}

	:global(.edra-content .ProseMirror mark[data-color='green']) {
		background-color: color-mix(in srgb, #22c55e 30%, transparent);
	}

	:global(.edra-content .ProseMirror mark[data-color='blue']) {
		background-color: color-mix(in srgb, #3b82f6 30%, transparent);
	}

	:global(.edra-content .ProseMirror mark[data-color='pink']) {
		background-color: color-mix(in srgb, #ec4899 30%, transparent);
	}

	:global(.edra-content .ProseMirror a) {
		color: var(--foreground);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.edra-content .ProseMirror .openbible-verse-fence) {
		margin: 20px 0;
		border-inline-start: 2px solid var(--border);
		background: color-mix(in oklch, var(--foreground) 3%, transparent);
		padding: 14px 16px 14px 18px;
	}

	:global(.edra-content .ProseMirror .openbible-verse-fence-ref) {
		margin: 0 0 10px;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 500;
	}

	:global(.edra-content .ProseMirror .openbible-verse-fence-body) {
		margin: 0;
		border: 0;
		background: transparent;
		padding: 0;
		font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
		font-size: 0.9rem;
		line-height: 1.65;
		white-space: pre-wrap;
	}

	:global(.edra-content .ProseMirror .openbible-video-fence) {
		margin: 20px 0;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 12px 16px;
	}

	:global(.edra-content .ProseMirror-selectednode) {
		outline: 1px solid color-mix(in oklch, var(--ring) 72%, transparent);
		outline-offset: 4px;
	}
</style>
