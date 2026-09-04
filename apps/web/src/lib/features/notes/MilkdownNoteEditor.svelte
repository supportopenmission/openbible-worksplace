<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import type { Note } from './note-types';
	import { createNoteEditorService, type SaveStatus } from './note-editor-service';
	import { filterSlashItems, getSlashItems, milkdownSlashPlugin, moveSlashSelection, type MilkdownSlashItem } from './milkdown-slash';
	import { verseNodeSchema, verseDirective } from './milkdown-verse-node';
	import VerseSelector, { type VerseSelectionResult } from './VerseSelector.svelte';
	import MilkdownMobileToolbar from './MilkdownMobileToolbar.svelte';

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
	let filteredItems = $derived(filterSlashItems(getSlashItems(), slashQuery));

	function closeSlash() {
		slashOpen = false;
		slashIndex = 0;
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
	}

	async function insertVerse(selection: VerseSelectionResult) {
		if (!editor) return;
		const { editorViewCtx } = await import('@milkdown/kit/core');
		editor.action((ctx) => {
			const view = ctx.get(editorViewCtx);
			const type = view.state.schema.nodes.verse;
			if (!type) return;
			const node = type.create({
				versionId: selection.versionId,
				version: selection.version ?? '',
				bookId: String(selection.bookId),
				book: selection.book ?? `Livro ${selection.bookId}`,
				chapter: String(selection.chapter),
				verseStart: String(selection.verseStart),
				verseEnd: String(selection.verseEnd),
				snapshotBody: selection.snapshot
			});
			view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView());
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
			const { Editor, rootCtx, defaultValueCtx } = core;
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
					ctx.get(listenerCtx).markdownUpdated((_ctx, next, previous) => {
						if (next === previous) return;
						saveService?.scheduleSave(next);
						const token = next.match(/(?:^|\s)(\/[^\s]*)\s*$/)?.[1];
						if (token) {
							slashQuery = token;
							slashOpen = true;
							slashIndex = 0;
						} else closeSlash();
					});
				})
				.use(commonmark)
				.use(gfm)
				.use(verseDirective)
				.use(verseNodeSchema)
				.use(milkdownSlashPlugin)
				.use(listener);
			await editor.create();
		} catch (error) {
			initError = error instanceof Error ? error.message : 'Não foi possível abrir o editor.';
		}

		return () => {
			query.removeEventListener('change', updateMobile);
		};
	});

	onDestroy(() => {
		host?.removeEventListener('keydown', handleKeydown, true);
		saveService?.dispose();
		void editor?.destroy();
	});
</script>

<div class="milkdown-editor" data-testid="note-canvas" data-viewport-fill="true">
	<div class="editor-status" aria-live="polite">
		{#if saveStatus === 'saving'}Salvando…{:else if saveStatus === 'saved'}Salvo{:else if saveStatus === 'error'}Erro ao salvar{/if}
	</div>
	{#if initError}
		<p class="editor-error" role="alert">{initError}</p>
	{/if}
	<div class="milkdown-host" bind:this={host}></div>

	{#if slashOpen && !mobile}
		<div class="slash-menu" role="listbox" aria-label="Comandos de bloco">
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

<Sheet.Root bind:open={slashOpen}>
	{#if mobile}
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
	{/if}
</Sheet.Root>

{#if storage}
	<VerseSelector bind:open={verseSelectorOpen} {storage} onConfirm={insertVerse} onCancel={() => (verseSelectorOpen = false)} />
{/if}

<MilkdownMobileToolbar active={mobile} onAction={runToolbar} />

<style>
	.milkdown-editor { position: relative; width: 100%; min-height: 60dvh; }
	.editor-status { min-height: 20px; padding: 0 clamp(16px, 5vw, 48px); color: var(--muted-foreground); font-size: .75rem; text-align: right; }
	.editor-error { margin: 8px clamp(16px, 5vw, 48px); color: var(--destructive); }
	.milkdown-host { width: 100%; min-height: 60dvh; }
	:global(.milkdown-host .milkdown), :global(.milkdown-host .ProseMirror) { border: 0; outline: 0; background: transparent; box-shadow: none; }
	:global(.milkdown-host .ProseMirror) { max-width: 800px; min-height: 60dvh; margin: 0 auto; padding: 8px clamp(16px, 5vw, 48px) 140px; color: var(--foreground); font-family: var(--font-sans); line-height: 1.7; white-space: pre-wrap; }
	:global(.milkdown-host .ProseMirror h1) { margin: 12px 0 24px; font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; letter-spacing: -.035em; }
	:global(.milkdown-host .verse-block-callout) { margin: 24px 0; padding: 18px 20px; border-left: 2px solid var(--border); background: transparent; }
	:global(.milkdown-host .verse-block-ref) { margin: 0 0 10px; color: var(--muted-foreground); font-family: var(--font-mono); font-size: .75rem; }
	:global(.milkdown-host .verse-snapshot) { margin: 0; white-space: pre-wrap; color: var(--foreground); font-family: Georgia, serif; font-size: 1rem; line-height: 1.75; }
	.slash-menu { position: absolute; top: 72px; left: 50%; width: min(360px, calc(100vw - 32px)); max-height: 320px; overflow-y: auto; transform: translateX(-50%); border: 1px solid var(--border); border-radius: var(--radius); background: var(--popover); padding: 6px; color: var(--popover-foreground); }
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
