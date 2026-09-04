<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import type { Note } from './note-types';
	import { createNoteEditorService, type SaveStatus } from './note-editor-service';
	import { filterSlashItems, getSlashItems, moveSlashSelection, type MilkdownSlashItem } from './milkdown-slash';
	import { verseNodeSchema, verseDirective } from './milkdown-verse-node';
	import VerseSelector, { type VerseSelectionResult } from './VerseSelector.svelte';
	import MilkdownMobileToolbar from './MilkdownMobileToolbar.svelte';
	import { buildVerseInsertTransaction } from './milkdown-verse-insert';
	import {
		applyIosEditorInputAttributes,
		createKeyboardInsetTracker,
		NOTE_TOOLBAR_HEIGHT_PX,
		setNoteKeyboardInset
	} from './note-editor-viewport';

	let {
		markdown,
		note,
		storage,
		onSaved
	}: {
		markdown?: string;
		note?: Note;
		storage?: WorkspaceStorage;
		onSaved?: (note: Note) => void;
	} = $props();

	let host: HTMLDivElement;
	let editorRoot: HTMLDivElement;
	let editor: import('@milkdown/kit/core').Editor | null = null;
	let coreModule: typeof import('@milkdown/kit/core') | null = null;
	let commonmarkModule: typeof import('@milkdown/kit/preset/commonmark') | null = null;
	let saveService: ReturnType<typeof createNoteEditorService> | null = null;
	let saveStatus = $state<SaveStatus>('idle');
	let initError = $state('');
	let slashOpen = $state(false);
	let slashQuery = $state('/');
	let slashIndex = $state(0);
	let mobile = $state(false);
	let verseSelectorOpen = $state(false);
	let slashPosition = $state<{ top: number; left: number; width: number; maxHeight: number } | null>(
		null
	);
	let toolbarActive = $state<Record<string, boolean>>({});
	let filteredItems = $derived(filterSlashItems(getSlashItems(), slashQuery));

	function closeSlash() {
		slashOpen = false;
		slashIndex = 0;
		slashPosition = null;
	}

	function positionSlashMenu(position: number) {
		if (!editor || !coreModule || typeof window === 'undefined') return;
		const { editorViewCtx } = coreModule;
		editor.action((ctx) => {
			const coords = ctx.get(editorViewCtx).coordsAtPos(position);
			const padding = 12;
			const gap = 6;
			const width = Math.min(360, window.innerWidth - padding * 2);
			const below = Math.max(0, window.innerHeight - coords.bottom - gap - padding);
			const above = Math.max(0, coords.top - gap - padding);
			const placeAbove = below < 180 && above > below;
			const maxHeight = Math.max(120, Math.min(320, placeAbove ? above : below));
			const left = Math.min(
				Math.max(coords.left, padding),
				window.innerWidth - width - padding
			);
			const top = placeAbove
				? Math.max(padding, coords.top - gap - maxHeight)
				: Math.min(coords.bottom + gap, window.innerHeight - padding - maxHeight);
			slashPosition = { top, left, width, maxHeight };
		});
	}

	function repositionOverlays() {
		if (slashOpen && editor && coreModule && !mobile) {
			const { editorViewCtx } = coreModule;
			editor.action((ctx) => {
				positionSlashMenu(ctx.get(editorViewCtx).state.selection.from);
			});
		}
	}

	function updateToolbarState() {
		if (!editor || !coreModule) return;
		const { editorViewCtx } = coreModule;
		editor.action((ctx) => {
			const { state } = ctx.get(editorViewCtx);
			const resolvedFrom = state.selection.$from;
			const active: Record<string, boolean> = {
				bold: Boolean(state.schema.marks.strong?.isInSet(resolvedFrom.marks())),
				italic: Boolean(state.schema.marks.emphasis?.isInSet(resolvedFrom.marks())),
				heading: false,
				bullet: false,
				task: false,
				quote: false,
				verse: false
			};
			for (let depth = resolvedFrom.depth; depth > 0; depth -= 1) {
				const node = resolvedFrom.node(depth);
				if (node.type.name === 'heading') active.heading = true;
				if (node.type.name === 'bullet_list') active.bullet = true;
				if (node.type.name === 'list_item' && node.attrs.checked !== undefined) {
					active.task = true;
				}
				if (node.type.name === 'blockquote') active.quote = true;
			}
			toolbarActive = active;
		});
	}

	function runSlash(item: MilkdownSlashItem) {
		if (!editor || !coreModule || !commonmarkModule) return;
		if (item.id === 'verse') {
			closeSlash();
			verseSelectorOpen = true;
			return;
		}
		const { commandsCtx, editorViewCtx } = coreModule;
		const commonmark = commonmarkModule;
		editor.action((ctx) => {
			const commands = ctx.get(commandsCtx);
			const initialView = ctx.get(editorViewCtx);
			const { $from: resolvedFrom, from } = initialView.state.selection;
			const textBefore = initialView.state.doc.textBetween(resolvedFrom.start(), from, ' ');
			const trigger = textBefore.match(/\/[^\s]*$/)?.[0];
			if (trigger) {
				initialView.dispatch(initialView.state.tr.delete(from - trigger.length, from));
			}
			if (item.id === 'heading') commands.call(commonmark.wrapInHeadingCommand.key, 2);
			if (item.id === 'bullet') commands.call(commonmark.wrapInBulletListCommand.key);
			if (item.id === 'ordered') commands.call(commonmark.wrapInOrderedListCommand.key);
			if (item.id === 'task') {
				commands.call(commonmark.wrapInBulletListCommand.key);
				const view = ctx.get(editorViewCtx);
				const selection = view.state.selection.$from;
				for (let depth = selection.depth; depth > 0; depth -= 1) {
					const node = selection.node(depth);
					if (node.type.name !== 'list_item') continue;
					view.dispatch(
						view.state.tr.setNodeMarkup(selection.before(depth), undefined, {
							...node.attrs,
							checked: false
						})
					);
					break;
				}
			}
			if (item.id === 'quote') commands.call(commonmark.wrapInBlockquoteCommand.key);
			if (item.id === 'code') commands.call(commonmark.createCodeBlockCommand.key);
			if (item.id === 'divider') {
				const view = ctx.get(editorViewCtx);
				const node = view.state.schema.nodes.hr?.create();
				if (node) view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
			}
		});
		closeSlash();
		updateToolbarState();
	}

	function runToolbar(action: import('./milkdown-markdown-io').ToolbarAction) {
		if (action === 'verse') {
			verseSelectorOpen = true;
			return;
		}
		if (!editor || !coreModule || !commonmarkModule) return;
		const { commandsCtx, editorViewCtx } = coreModule;
		const commonmark = commonmarkModule;
		editor.action((ctx) => {
			const commands = ctx.get(commandsCtx);
			if (action === 'bold') commands.call(commonmark.toggleStrongCommand.key);
			if (action === 'italic') commands.call(commonmark.toggleEmphasisCommand.key);
			if (action === 'heading') commands.call(commonmark.wrapInHeadingCommand.key, 2);
			if (action === 'bullet') commands.call(commonmark.wrapInBulletListCommand.key);
			if (action === 'task') {
				commands.call(commonmark.wrapInBulletListCommand.key);
				const view = ctx.get(editorViewCtx);
				const selection = view.state.selection.$from;
				for (let depth = selection.depth; depth > 0; depth -= 1) {
					const node = selection.node(depth);
					if (node.type.name !== 'list_item') continue;
					view.dispatch(
						view.state.tr.setNodeMarkup(selection.before(depth), undefined, {
							...node.attrs,
							checked: false
						})
					);
					break;
				}
			}
			if (action === 'quote') commands.call(commonmark.wrapInBlockquoteCommand.key);
		});
		updateToolbarState();
	}

	async function insertVerse(selection: VerseSelectionResult) {
		if (!editor) return;
		const { editorViewCtx } = await import('@milkdown/kit/core');
		editor.action((ctx) => {
			const view = ctx.get(editorViewCtx);
			const tr = buildVerseInsertTransaction(view.state, {
				versionId: selection.versionId,
				version: selection.version ?? '',
				bookId: String(selection.bookId),
				book: selection.book ?? `Livro ${selection.bookId}`,
				chapter: String(selection.chapter),
				verseStart: String(selection.verseStart),
				verseEnd: String(selection.verseEnd),
				snapshotBody: selection.snapshot
			});
			if (!tr) return;
			view.dispatch(tr);
			view.focus();
		});
		verseSelectorOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!slashOpen) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			closeSlash();
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			slashIndex = moveSlashSelection(filteredItems.length, slashIndex, event.key === 'ArrowDown' ? 'next' : 'prev');
		}
		if (event.key === 'Enter' && filteredItems[slashIndex]) {
			event.preventDefault();
			void runSlash(filteredItems[slashIndex]);
		}
	}

	onMount(async () => {
		const query = matchMedia('(max-width: 767px)');
		const updateMobile = () => (mobile = query.matches);
		updateMobile();
		query.addEventListener('change', updateMobile);
		host.addEventListener('keydown', handleKeydown, true);

		try {
			const [core, commonmarkPreset, { gfm }, { listener, listenerCtx }] = await Promise.all([
				import('@milkdown/kit/core'),
				import('@milkdown/kit/preset/commonmark'),
				import('@milkdown/kit/preset/gfm'),
				import('@milkdown/kit/plugin/listener')
			]);
			coreModule = core;
			commonmarkModule = commonmarkPreset;
			const { Editor, rootCtx, defaultValueCtx, editorViewCtx, editorViewOptionsCtx } = core;
			const { commonmark } = commonmarkPreset;
			if (note && storage) {
				saveService = createNoteEditorService({
					note,
					storage,
					onStatusChange: (status) => (saveStatus = status),
					onSaved
				});
			}
			editor = Editor.make()
				.config((ctx) => {
					ctx.set(rootCtx, host);
					ctx.set(defaultValueCtx, note?.body ?? markdown ?? '');
					ctx.set(editorViewOptionsCtx, {
						attributes: {
							autocomplete: 'off',
							autocorrect: 'off',
							autocapitalize: 'sentences',
							spellcheck: 'true',
							'data-1p-ignore': 'true',
							'data-lpignore': 'true'
						}
					});
					ctx.get(listenerCtx).markdownUpdated((_ctx, next, previous) => {
						if (next === previous) return;
						saveService?.scheduleSave(next);
						const view = _ctx.get(editorViewCtx);
						const { from } = view.state.selection;
						const textBefore = view.state.doc.textBetween(
							Math.max(0, from - 80),
							from,
							' ',
							' '
						);
						const token = textBefore.match(/\/[^\s]*$/)?.[0];
						if (token) {
							slashQuery = token;
							slashOpen = true;
							slashIndex = 0;
							positionSlashMenu(from);
						} else closeSlash();
					});
				})
				.use(commonmark)
				.use(gfm)
				.use(verseDirective)
				.use(verseNodeSchema)
				.use(listener);
			await editor.create();
			editor.action((ctx) => {
				applyIosEditorInputAttributes(ctx.get(editorViewCtx).dom);
			});
			updateToolbarState();
		} catch (error) {
			initError = error instanceof Error ? error.message : 'Não foi possível abrir o editor.';
		}

		const stopKeyboardInset = createKeyboardInsetTracker((inset) => {
			if (editorRoot) setNoteKeyboardInset(editorRoot, inset);
		});

		return () => {
			query.removeEventListener('change', updateMobile);
			stopKeyboardInset();
		};
	});

	onDestroy(() => {
		host?.removeEventListener('keydown', handleKeydown, true);
		saveService?.dispose();
		void editor?.destroy();
	});
</script>

<svelte:window onresize={repositionOverlays} onscroll={repositionOverlays} />

<div
	class="note-editor-viewport"
	bind:this={editorRoot}
	style:--note-toolbar-height="{NOTE_TOOLBAR_HEIGHT_PX}px"
>
<div
	class="milkdown-editor"
	data-testid="note-canvas"
	data-viewport-fill="true"
>
	<div class="editor-status" aria-live="polite">
		{#if saveStatus === 'saving'}Salvando…{:else if saveStatus === 'saved'}Salvo{:else if saveStatus === 'error'}Erro ao salvar{/if}
	</div>
	{#if initError}
		<p class="editor-error" role="alert">{initError}</p>
	{/if}
	<div class="milkdown-host" bind:this={host}></div>

	{#if slashOpen && !mobile}
		<div
			class="slash-menu"
			role="listbox"
			aria-label="Comandos de bloco"
			style:top={`${slashPosition?.top ?? 0}px`}
			style:left={`${slashPosition?.left ?? 0}px`}
			style:width={`${slashPosition?.width ?? 360}px`}
			style:max-height={`${slashPosition?.maxHeight ?? 320}px`}
		>
			{#each filteredItems as item, index (item.id)}
				<button
					type="button"
					class:active={index === slashIndex}
					role="option"
					aria-selected={index === slashIndex}
					onmousedown={(event) => event.preventDefault()}
					onclick={() => runSlash(item)}
				>
					<strong>{item.label}</strong><span>{item.description}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if mobile}
	<Sheet.Root bind:open={slashOpen}>
		<Sheet.Content side="bottom" class="slash-drawer">
			<Sheet.Header>
				<Sheet.Title>Comandos</Sheet.Title>
				<Sheet.Description>Busque e insira um bloco na nota.</Sheet.Description>
			</Sheet.Header>
			<label class="slash-search">
				<span class="sr-only">Buscar comandos</span>
				<input bind:value={slashQuery} placeholder="Buscar comandos" />
			</label>
			<div class="drawer-items">
				{#each filteredItems as item (item.id)}
					<Button class="drawer-command" variant="ghost" onclick={() => runSlash(item)}>{item.label}</Button>
				{/each}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{/if}

{#if storage}
	<VerseSelector bind:open={verseSelectorOpen} {storage} onConfirm={insertVerse} onCancel={() => (verseSelectorOpen = false)} />
{/if}

<MilkdownMobileToolbar active={mobile} activeActions={toolbarActive} onAction={runToolbar} />
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

	.milkdown-editor {
		position: relative;
		width: 100%;
		min-height: 60dvh;
	}

	.editor-status {
		flex-shrink: 0;
		min-height: 20px;
		padding: 0 clamp(16px, 5vw, 48px);
		color: var(--muted-foreground);
		font-size: .75rem;
		text-align: right;
	}

	.editor-error { margin: 8px clamp(16px, 5vw, 48px); color: var(--destructive); }
	.milkdown-host { width: 100%; min-height: 60dvh; }
	:global(.milkdown-host .milkdown), :global(.milkdown-host .ProseMirror) { border: 0; outline: 0; background: transparent; box-shadow: none; }
	:global(.milkdown-host .ProseMirror) {
		max-width: 800px;
		min-height: 60dvh;
		margin: 0 auto;
		padding: 8px clamp(16px, 5vw, 48px) 140px;
		color: var(--foreground);
		font-family: var(--font-sans);
		line-height: 1.7;
	}

	@media (max-width: 767px) {
		.milkdown-editor {
			display: flex;
			min-height: 0;
			flex: 1;
			flex-direction: column;
			overflow: hidden;
		}

		.milkdown-host {
			display: flex;
			min-height: 0;
			flex: 1;
			flex-direction: column;
			overflow: hidden;
		}

		:global(.milkdown-host .milkdown) {
			display: flex;
			min-height: 0;
			flex: 1;
			flex-direction: column;
			overflow: hidden;
		}

		:global(.milkdown-host .ProseMirror) {
			min-height: 0;
			flex: 1;
			overflow-y: auto;
			overscroll-behavior: contain;
			padding-bottom: calc(
				max(64px + env(safe-area-inset-bottom, 0px), var(--note-keyboard-inset, 0px)) +
					var(--note-toolbar-height, 56px) +
					16px
			);
		}
	}
	:global(.milkdown-host .ProseMirror h1) { margin: 12px 0 24px; font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; letter-spacing: -.035em; }
	:global(.milkdown-host .ProseMirror h2) { margin: 28px 0 12px; font-size: clamp(1.5rem, 4vw, 2rem); line-height: 1.2; letter-spacing: -.025em; }
	:global(.milkdown-host .ProseMirror h3) { margin: 24px 0 8px; font-size: 1.25rem; line-height: 1.3; }
	:global(.milkdown-host .ProseMirror p) { margin: 0 0 12px; }
	:global(.milkdown-host .ProseMirror ul), :global(.milkdown-host .ProseMirror ol) { margin: 0 0 16px; padding-inline-start: 28px; }
	:global(.milkdown-host .ProseMirror li) { padding-inline-start: 4px; }
	:global(.milkdown-host .ProseMirror ul[data-type='taskList']) { padding-inline-start: 0; list-style: none; }
	:global(.milkdown-host .ProseMirror li[data-item-checked]) { display: flex; gap: 8px; align-items: flex-start; }
	:global(.milkdown-host .ProseMirror li[data-item-checked] > label) { flex: 0 0 auto; margin-top: .35em; }
	:global(.milkdown-host .ProseMirror blockquote) { margin: 20px 0; border-inline-start: 2px solid var(--border); padding-inline-start: 18px; color: var(--muted-foreground); }
	:global(.milkdown-host .ProseMirror pre) { margin: 20px 0; overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); background: color-mix(in srgb, var(--foreground) 5%, transparent); padding: 14px 16px; font-family: var(--font-mono); font-size: .875rem; line-height: 1.6; }
	:global(.milkdown-host .ProseMirror code) { font-family: var(--font-mono); font-size: .9em; }
	:global(.milkdown-host .ProseMirror hr) { margin: 28px 0; border: 0; border-top: 1px solid var(--border); }
	:global(.milkdown-host .ProseMirror strong) { font-weight: 700; }
	:global(.milkdown-host .ProseMirror em) { font-style: italic; }
	:global(.milkdown-host .verse-block-callout) { margin: 24px 0; padding: 18px 20px; border-left: 2px solid var(--border); background: transparent; }
	:global(.milkdown-host .verse-block-ref) { margin: 0 0 10px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: .75rem; }
	:global(.milkdown-host .verse-snapshot) { margin: 0; white-space: pre-wrap; color: var(--foreground); font-family: Georgia, serif; font-size: 1rem; line-height: 1.75; }
	.slash-menu { position: fixed; z-index: 40; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius); background: var(--popover); padding: 6px; color: var(--popover-foreground); }
	.slash-menu button { display: flex; width: 100%; flex-direction: column; gap: 2px; border: 0; border-radius: calc(var(--radius) - 2px); background: transparent; padding: 9px 10px; color: inherit; text-align: left; }
	.slash-menu button.active, .slash-menu button:hover { background: var(--accent); }
	.slash-menu span { color: var(--muted-foreground); font-size: .75rem; }
	.slash-search { display: block; padding: 12px 16px 6px; }
	.slash-search input { width: 100%; min-height: 44px; border: 1px solid var(--input); border-radius: var(--radius); background: var(--background); padding: 0 12px; font-size: 1rem; outline: none; }
	.slash-search input:focus-visible { border-color: var(--ring); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 24%, transparent); }
	.drawer-items { display: flex; flex-direction: column; gap: 2px; overflow-y: auto; padding: 6px 12px max(16px, env(safe-area-inset-bottom)); }
	:global(.drawer-items .drawer-command) { width: 100%; justify-content: flex-start; min-height: 44px; }
	:global(.slash-drawer) { height: 90dvh; }
	@media (prefers-reduced-motion: reduce) { .slash-menu { scroll-behavior: auto; } }
</style>
