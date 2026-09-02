<script lang="ts">
	import { onDestroy } from 'svelte';
	import { BookOpen } from '@lucide/svelte';
	import { Tipex, defaultExtensions } from '@friendofsvelte/tipex';
	import '@friendofsvelte/tipex/styles/index.css';
	import type { Editor } from '@tiptap/core';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import {
		createNoteEditorService,
		type SaveStatus
	} from './note-editor-service';
	import type { Note } from './note-types';
	import { isSlashVerseTrigger } from './slash-verse-command';
	import {
		htmlBodyToMarkdown,
		markdownBodyToHtml,
		VerseBlockExtension,
		verseBlockFromFence
	} from './verse-block-extension';
	import VerseSelector, { type VerseSelectionResult } from './VerseSelector.svelte';

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
	let slashHandling = $state(false);

	const initialBody = markdownBodyToHtml(note.body);
	const extensions = [...defaultExtensions, VerseBlockExtension];

	const editorService = createNoteEditorService({
		storage,
		note,
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

	function handleUpdate() {
		if (!editor) return;
		const markdown = htmlBodyToMarkdown(editor.getHTML());
		editorService.scheduleSave(markdown);

		if (slashHandling || verseSelectorOpen) return;

		const { from } = editor.state.selection;
		const textBefore = editor.state.doc.textBetween(Math.max(0, from - 30), from, '\n', ' ');
		const slashMatch = textBefore.match(/(\/\S*)$/);
		if (slashMatch && isSlashVerseTrigger(slashMatch[1])) {
			slashHandling = true;
			const triggerLen = slashMatch[1].length;
			editor.chain().focus().deleteRange({ from: from - triggerLen, to: from }).run();
			slashHandling = false;
			verseSelectorOpen = true;
		}
	}

	function insertVerseBlock(result: VerseSelectionResult) {
		if (!editor) return;

		const block = verseBlockFromFence({
			attrs: {
				versionId: result.versionId,
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

<div class="note-canvas">
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
		onupdate={handleUpdate}
	>
		{#snippet foot()}
			<div class="editor-foot">
				<Button
					type="button"
					variant="outline"
					size="sm"
					aria-label="Inserir versículo"
					onclick={() => (verseSelectorOpen = true)}
				>
					<BookOpen size={15} strokeWidth={1.75} aria-hidden="true" />
					Inserir versículo
				</Button>
			</div>
		{/snippet}
	</Tipex>

	<VerseSelector
		bind:open={verseSelectorOpen}
		{storage}
		onConfirm={handleVerseConfirm}
	/>
</div>

<style>
	.note-canvas {
		max-width: 760px;
		margin: 0 auto;
		padding: 0 clamp(16px, 4vw, 24px) 64px;
		font-family: var(--font-sans);
	}

	.save-status {
		min-height: 1.25rem;
		margin: 0 0 8px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-align: right;
	}

	.status-error {
		color: var(--destructive);
	}

	:global(.note-tipex) {
		border: none !important;
		box-shadow: none !important;
		background: transparent !important;
	}

	:global(.note-tipex .tipex-editor-section) {
		border: none !important;
		box-shadow: none !important;
		background: transparent !important;
	}

	:global(.note-tipex .ProseMirror) {
		border: none !important;
		box-shadow: none !important;
		outline: none;
		padding: 0 !important;
		min-height: 50vh;
		font-family: var(--font-sans);
		font-size: 1rem;
		line-height: 1.7;
	}

	:global(.note-tipex .ProseMirror:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 4px;
	}

	:global(.note-tipex .verse-block-callout) {
		margin: 1.25rem 0;
		border-inline-start: 2px solid color-mix(in oklch, var(--foreground) 18%, transparent);
		background: color-mix(in oklch, var(--foreground) 3%, transparent);
		padding: 14px 16px 14px 18px;
	}

	:global(.note-tipex .verse-block-ref) {
		margin: 0 0 10px;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 500;
	}

	:global(.note-tipex .verse-snapshot) {
		margin: 0;
		font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
		font-size: 0.9rem;
		line-height: 1.65;
		white-space: pre-wrap;
	}

	.editor-foot {
		display: flex;
		justify-content: flex-start;
		padding: 16px 0 0;
	}
</style>
