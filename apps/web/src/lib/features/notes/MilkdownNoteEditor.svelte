<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import type { Note } from './note-types';
	import { createNoteEditorService, type SaveStatus } from './note-editor-service';
	import {
		filterSlashItems,
		getSlashItems,
		moveSlashSelection,
		type MilkdownSlashItem
	} from './milkdown-slash';
	import {
		unsupportedDirectiveFallback,
		verseNodeSchema,
		verseDirective
	} from './milkdown-verse-node';
	import VerseSelector, { type VerseSelectionResult } from './VerseSelector.svelte';
	import MilkdownMobileToolbar from './MilkdownMobileToolbar.svelte';
	import SelectionFormatPopover from './SelectionFormatPopover.svelte';
	import ReferenceHoverCard from './ReferenceHoverCard.svelte';
	import {
		shouldShowFormatPopover,
		type FormatPopoverAction
	} from './selection-popover';
	import {
		loadHoverPassage,
		type LoadedHoverCard
	} from './reference-hover';
import { collectEditorHeadings, type NoteHeading } from './note-index';
import { toggleMark } from '@milkdown/prose/commands';
import {
	formatActionMarkName,
	highlightInputRule,
	highlightMarkSchema,
	markRemarkPlugin,
	underlineInputRule,
	underlineMarkSchema
} from './milkdown-mark-node';
import { resolveToolbarVisibility } from './note-toolbar';
	import { videoNodeSchema, buildVideoInsertTransaction } from './milkdown-video-node';
	import YouTubeBlockView from './YouTubeBlockView.svelte';
	import { parseYouTubeUrl } from './youtube-embed';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { buildVerseInsertTransaction } from './milkdown-verse-insert';
	import {
		applyIosEditorInputAttributes,
		createKeyboardInsetTracker,
		setNoteKeyboardInset
	} from './note-editor-viewport';
	import { bibleReferencePlugin, BibleReferenceViewer, openBibleReference } from '$lib/bible';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { extractContentFromNoteBody, extractTitleFromMarkdown } from './note-markdown';
	import { milkdownPlaceholderPlugin } from './milkdown-placeholder-plugin';

	let {
		markdown,
		note,
		storage,
		readOnly = false,
		toolbarEnabled = true,
		toolbarPinned = false,
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
		onSaved?: (note: Note) => void;
		onStatusChange?: (status: SaveStatus) => void;
		onHeadings?: (headings: NoteHeading[]) => void;
	} = $props();

	let host: HTMLDivElement;
	let editorRoot: HTMLDivElement;
	let titleEl = $state<HTMLHeadingElement | null>(null);
	let descriptionEl = $state<HTMLParagraphElement | null>(null);

	let noteTitle = $state(
		untrack(() => note?.title || extractTitleFromMarkdown(markdown ?? '') || 'Nova nota')
	);
	let noteDescription = $state(untrack(() => note?.description || ''));

	let editor: import('@milkdown/kit/core').Editor | null = null;
	let coreModule: typeof import('@milkdown/kit/core') | null = null;
	let commonmarkModule: typeof import('@milkdown/kit/preset/commonmark') | null = null;
	let saveService: ReturnType<typeof createNoteEditorService> | null = null;
	let saveStatus = $state<SaveStatus>('idle');
	let initError = $state('');
	let slashOpen = $state(false);
	let slashQuery = $state('');
	let slashIndex = $state(0);
	let mobile = $state(false);
	let editingActive = $state(false);
	let toolbarOpen = $state(false);
	let verseSelectorOpen = $state(false);
	let slashPosition = $state<{
		top: number;
		left: number;
		width: number;
		maxHeight: number;
	} | null>(null);
	let toolbarActive = $state<Record<string, boolean>>({});
let toolbarResolved = $derived(
	resolveToolbarVisibility({
		mode: readOnly ? 'view' : 'edit',
		alwaysVisible: toolbarPinned,
		viewport: mobile ? 'mobile' : 'desktop'
	})
);
	let formatPopover = $state<{ top: number; left: number } | null>(null);
	let formatPressed = $state<Partial<Record<FormatPopoverAction, boolean>>>({});
	let hoverCard = $state<{
		top: number;
		left: number;
		reference: string;
		loading: boolean;
		data: LoadedHoverCard | null;
	} | null>(null);
	let hoverAnchor = $state<HTMLElement | null>(null);
	let hoverRequest = 0;
	let videoDialogOpen = $state(false);
	let videoUrl = $state('');
	let videoUrlError = $state('');
	let filteredItems = $derived(filterSlashItems(getSlashItems(), slashQuery));

	$effect(() => {
		if (slashIndex >= filteredItems.length) slashIndex = Math.max(filteredItems.length - 1, 0);
	});

	$effect(() => {
		if (!toolbarEnabled) toolbarOpen = false;
	});

	$effect(() => {
		const ro = readOnly;
		if (editor && coreModule) {
			const { editorViewCtx } = coreModule;
			editor.action((ctx) => {
				const view = ctx.get(editorViewCtx);
				view.setProps({ editable: () => !ro });
			});
		}
	});

	$effect(() => {
		if (note) {
			const externalTitle = note.title ?? '';
			if (externalTitle !== noteTitle && document.activeElement !== titleEl) {
				noteTitle = externalTitle;
				if (titleEl && titleEl.innerText !== externalTitle) {
					titleEl.innerText = externalTitle;
				}
			}
			const externalDesc = note.description ?? '';
			if (externalDesc !== noteDescription && document.activeElement !== descriptionEl) {
				noteDescription = externalDesc;
				if (descriptionEl && descriptionEl.innerText !== externalDesc) {
					descriptionEl.innerText = externalDesc;
				}
			}
		}
	});

	function handleTitleInput(event: Event) {
		const target = event.currentTarget as HTMLElement;
		const text = target.innerText.replace(/\r?\n/g, ' ');
		noteTitle = text;
		if (note) {
			note.title = text.trim() || 'Sem título';
		}
		saveService?.updateTitle(text);
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
		noteDescription = text;
		if (note) {
			note.description = text.trim() || undefined;
		}
		saveService?.updateDescription(text);
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
		if (event.key === 'ArrowUp') {
			if (!editor || !coreModule) return;
			const { editorViewCtx } = coreModule;
			let atStart = false;
			editor.action((ctx) => {
				const view = ctx.get(editorViewCtx);
				atStart = view.state.selection.from <= 1;
			});
			if (atStart) {
				event.preventDefault();
				descriptionEl?.focus();
			}
		}
	}

	function handleContainerClick(event: MouseEvent) {
		if (readOnly) return;
		const target = event.target as HTMLElement | null;
		if (!target) return;
		if (target === titleEl || target === descriptionEl) return;
		if (target.closest('.note-header-fields')) return;
		if (target.closest('.slash-menu') || target.closest('.slash-drawer')) return;
		if (target.closest('.ProseMirror')) return;
		focusEditor();
	}

	function closeSlash() {
		slashOpen = false;
		slashQuery = '';
		slashIndex = 0;
		slashPosition = null;
	}

	function blurEditorBeforeMobileSlash() {
		if (!mobile || !editor || !coreModule) return;
		const { editorViewCtx } = coreModule;
		editor.action((ctx) => {
			ctx.get(editorViewCtx).dom.blur();
		});
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
			const left = Math.min(Math.max(coords.left, padding), window.innerWidth - width - padding);
			const top = placeAbove
				? Math.max(padding, coords.top - gap - maxHeight)
				: Math.min(coords.bottom + gap, window.innerHeight - padding - maxHeight);
			slashPosition = { top, left, width, maxHeight };
		});
	}

	function keepActiveSlashItemVisible() {
		void tick().then(() => {
			document
				.querySelector<HTMLElement>('.slash-menu [role="option"][aria-selected="true"]')
				?.scrollIntoView({ block: 'nearest' });
		});
	}

	function repositionOverlays() {
		hideHoverCard();
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
				ordered: false,
				task: false,
				quote: false,
				verse: false
			};
			for (let depth = resolvedFrom.depth; depth > 0; depth -= 1) {
				const node = resolvedFrom.node(depth);
				if (node.type.name === 'heading') active.heading = true;
				if (node.type.name === 'bullet_list') active.bullet = true;
				if (node.type.name === 'ordered_list') active.ordered = true;
				if (node.type.name === 'list_item' && node.attrs.checked !== undefined) {
					active.task = true;
				}
				if (node.type.name === 'blockquote') active.quote = true;
			}
			toolbarActive = active;
		});
	}

	function focusEditor() {
		if (readOnly) return;
		if (!editor || !coreModule) return;
		const { editorViewCtx } = coreModule;
		editor.action((ctx) => ctx.get(editorViewCtx).focus());
	}

	function updateFormatPopover() {
		if (readOnly || !editor || !coreModule || typeof window === 'undefined' || !host) {
			formatPopover = null;
			return;
		}
		const domSelection = document.getSelection();
		if (
			!domSelection ||
			domSelection.isCollapsed ||
			!domSelection.anchorNode ||
			!host.contains(domSelection.anchorNode)
		) {
			formatPopover = null;
			return;
		}
		const { editorViewCtx } = coreModule;
		editor.action((ctx) => {
			const view = ctx.get(editorViewCtx);
			const { selection } = view.state;
			if (selection.empty) {
				formatPopover = null;
				return;
			}
			const stored = view.state.storedMarks ?? selection.$from.marks();
			const present: FormatPopoverAction[] = [];
			if (view.state.schema.marks.strong?.isInSet(stored)) present.push('bold');
			if (view.state.schema.marks.emphasis?.isInSet(stored)) present.push('italic');
			if (view.state.schema.marks.highlight?.isInSet(stored)) present.push('highlight');
			if (view.state.schema.marks.underline?.isInSet(stored)) present.push('underline');
			const decision = shouldShowFormatPopover(
				{ from: selection.from, to: selection.to, collapsed: selection.empty },
				{ mode: 'edit', marks: present }
			);
			if (!decision.visible) {
				formatPopover = null;
				return;
			}
			formatPressed = decision.pressed ?? {};
			const rect = view.coordsAtPos(selection.from);
			const padding = 100;
			const left = Math.min(
				Math.max((rect.left + rect.right) / 2, padding),
				window.innerWidth - padding
			);
			formatPopover = { top: Math.max(rect.top, 64), left };
		});
	}

	function handleSelectionChange() {
		if (readOnly) {
			formatPopover = null;
			return;
		}
		updateFormatPopover();
	}

	function handleEditorContextMenu(event: MouseEvent) {
		if (readOnly || !host) return;
		const target = event.target;
		if (!(target instanceof HTMLElement) || !host.contains(target)) return;
		const domSelection = document.getSelection();
		if (
			domSelection &&
			!domSelection.isCollapsed &&
			domSelection.anchorNode &&
			host.contains(domSelection.anchorNode)
		) {
			event.preventDefault();
			updateFormatPopover();
		}
	}

	function runFormatPopoverAction(action: FormatPopoverAction) {
		if (action === 'bold' || action === 'italic') {
			runToolbar(action);
			updateFormatPopover();
			return;
		}
		if (!editor || !coreModule) return;
		const { editorViewCtx } = coreModule;
		editor.action((ctx) => {
			const view = ctx.get(editorViewCtx);
			const markType = view.state.schema.marks[formatActionMarkName(action)];
			if (!markType) return;
			toggleMark(markType)(view.state, view.dispatch);
		});
		focusEditor();
		updateToolbarState();
		updateFormatPopover();
	}

	function readHoverTarget(element: HTMLElement) {
		const osis = element.getAttribute('data-osis');
		const raw = element.getAttribute('data-raw') || element.textContent || '';
		const chapter = Number(element.getAttribute('data-chapter'));
		const verseStart = Number(element.getAttribute('data-verse-start'));
		const verseEnd = Number(element.getAttribute('data-verse-end'));
		if (!osis || !raw || !Number.isFinite(chapter)) return null;
		const start = Number.isFinite(verseStart) && verseStart > 0 ? verseStart : 1;
		return {
			osis,
			raw,
			version: element.getAttribute('data-version') || '',
			book: element.getAttribute('data-book') || '',
			chapter,
			verseStart: start,
			verseEnd: Number.isFinite(verseEnd) && verseEnd >= start ? verseEnd : start
		};
	}

	function hideHoverCard() {
		hoverRequest += 1;
		hoverAnchor = null;
		hoverCard = null;
	}

	async function showHoverCard(anchor: HTMLElement) {
		if (readOnly) return;
		const attrs = readHoverTarget(anchor);
		if (!attrs) return;
		const rect = anchor.getBoundingClientRect();
		const padding = 170;
		const left = Math.min(
			Math.max((rect.left + rect.right) / 2, padding),
			Math.max(window.innerWidth - padding, padding)
		);
		const request = ++hoverRequest;
		hoverAnchor = anchor;
		hoverCard = { top: rect.bottom, left, reference: attrs.raw, loading: true, data: null };
		const workspacePreferences = getWorkspaceState()?.preferences ?? null;
		const data = await loadHoverPassage(
			storage,
			attrs,
			workspacePreferences
				? {
						defaultVersionId: workspacePreferences.defaultBibleVersionId ?? null,
						readerVersionId: workspacePreferences.readerSelection?.versionId ?? null
					}
				: null
		);
		if (request !== hoverRequest) return;
		hoverCard = { top: rect.bottom, left, reference: attrs.raw, loading: false, data };
	}

	function handleReferenceMouseOver(event: MouseEvent) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const reference = target.closest<HTMLElement>('.bible-reference');
		if (!reference || reference === hoverAnchor) return;
		void showHoverCard(reference);
	}

	function handleReferenceMouseOut(event: MouseEvent) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (target.closest('.bible-reference') !== hoverAnchor) return;
		const next = event.relatedTarget;
		if (next instanceof HTMLElement && next.closest('.reference-hover-card')) return;
		hideHoverCard();
	}

	function handleReferenceFocusIn(event: FocusEvent) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const reference = target.closest<HTMLElement>('.bible-reference');
		if (!reference || reference === hoverAnchor) return;
		void showHoverCard(reference);
	}

	function handleReferenceFocusOut(event: FocusEvent) {
		const next = event.relatedTarget;
		if (next instanceof HTMLElement && next.closest('.reference-hover-card')) return;
		hideHoverCard();
	}

	function openHoverReference() {
		const reference = hoverCard?.data?.bibleReference;
		hideHoverCard();
		if (reference) void openBibleReference(reference);
	}

	function insertVideoBlock(url: string, videoId: string) {
		if (!editor || !coreModule) return;
		const { editorViewCtx } = coreModule;
		editor.action((ctx) => {
			const view = ctx.get(editorViewCtx);
			const tr = buildVideoInsertTransaction(view.state, { videoId, url });
			if (tr) view.dispatch(tr);
		});
		focusEditor();
		updateToolbarState();
		refreshHeadings();
	}

	function confirmVideoInsert() {
		const parsed = parseYouTubeUrl(videoUrl);
		if (!parsed.ok) {
			videoUrlError =
				parsed.reason === 'unsupported-provider'
					? 'Só vídeos do YouTube são aceitos.'
					: 'Cole uma URL válida do YouTube.';
			return;
		}
		insertVideoBlock(videoUrl.trim(), parsed.videoId);
		videoDialogOpen = false;
		videoUrl = '';
		videoUrlError = '';
	}

	function activateVideoFacade(target: HTMLElement) {
		if (!editor || !coreModule || !host) return;
		const figure = target.closest('figure[data-type="video"]');
		if (!figure || !host.contains(figure)) return;
		const { editorViewCtx } = coreModule;
		editor.action((ctx) => {
			const view = ctx.get(editorViewCtx);
			let pos: number | null = null;
			try {
				pos = view.posAtDOM(figure, 0);
			} catch {
				pos = null;
			}
			let node = pos != null ? view.state.doc.nodeAt(pos) : null;
			if ((!node || node.type.name !== 'video') && pos != null) {
				node = null;
				pos = null;
			}
			if (!node) {
				view.state.doc.descendants((child, childPos) => {
					if (child.type.name === 'video' && !child.attrs.loaded) {
						node = child;
						pos = childPos;
						return false;
					}
				});
			}
			if (!node || pos == null) return;
			view.dispatch(
				view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, loaded: true })
			);
		});
	}

	function handleVideoClick(event: MouseEvent) {
		if (readOnly) return;
		const target = event.target;
		if (target instanceof HTMLElement && target.closest('.video-facade')) {
			activateVideoFacade(target);
		}
	}

	function handleVideoKeydown(event: KeyboardEvent) {
		if (readOnly) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		const target = event.target;
		if (target instanceof HTMLElement && target.closest('.video-facade')) {
			event.preventDefault();
			activateVideoFacade(target);
		}
	}

	function refreshHeadings() {
		if (!host || !onHeadings) return;
		onHeadings(collectEditorHeadings(host));
	}

	function runSlash(item: MilkdownSlashItem) {
		if (!editor || !coreModule || !commonmarkModule) return;
		if (item.id === 'verse') {
			const { editorViewCtx } = coreModule;
			editor.action((ctx) => {
				const view = ctx.get(editorViewCtx);
				const { from, $from: resolvedFrom } = view.state.selection;
				const textBefore = view.state.doc.textBetween(resolvedFrom.start(), from, ' ');
				const trigger = textBefore.match(/\/[^\s]*$/)?.[0];
				if (trigger) {
					view.dispatch(view.state.tr.delete(from - trigger.length, from));
				}
				view.focus();
			});
			closeSlash();
			verseSelectorOpen = true;
			return;
		}
		if (item.id === 'video') {
			closeSlash();
			videoUrl = '';
			videoUrlError = '';
			videoDialogOpen = true;
			focusEditor();
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
		focusEditor();
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
			if (action === 'ordered') commands.call(commonmark.wrapInOrderedListCommand.key);
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
		focusEditor();
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
			slashIndex = moveSlashSelection(
				filteredItems.length,
				slashIndex,
				event.key === 'ArrowDown' ? 'next' : 'prev'
			);
			keepActiveSlashItemVisible();
		}
		if (event.key === 'Enter' && filteredItems[slashIndex]) {
			event.preventDefault();
			void runSlash(filteredItems[slashIndex]);
		}
	}

	function handleEditorFocusIn(event: FocusEvent) {
		if (readOnly) {
			editingActive = false;
			return;
		}
		const target = event.target;
		if (target instanceof HTMLElement && target.closest('.ProseMirror, .milkdown-toolbar, .format-popover, .reference-hover-card')) {
			editingActive = true;
			if (!mobile) toolbarOpen = true;
		} else {
			editingActive = false;
		}
	}

	function handleEditorFocusOut(event: FocusEvent) {
		const next = event.relatedTarget;
		if (
			next instanceof HTMLElement &&
			next.closest('.ProseMirror, .milkdown-toolbar, .milkdown-toolbar-toggle, .format-popover, .reference-hover-card')
		) {
			return;
		}
		editingActive = false;
		toolbarOpen = false;
	}

	function handleTaskMarkerClick(event: MouseEvent) {
		if (readOnly) return;
		const target = event.target;
		if (!(target instanceof HTMLElement) || !editor || !coreModule) return;
		const item = target.closest<HTMLElement>('li[data-item-type="task"]');
		if (!item) return;
		const bounds = item.getBoundingClientRect();
		const offsetX = event.clientX - bounds.left;
		const isCheckboxInput = target instanceof HTMLInputElement && target.type === 'checkbox';
		if (!isCheckboxInput && (offsetX < -36 || offsetX > 28)) return;

		const { editorViewCtx } = coreModule;
		editor.action((ctx) => {
			const view = ctx.get(editorViewCtx);
			const position = view.posAtDOM(item, 0);
			const resolvedPos = view.state.doc.resolve(position);
			let listItemDepth = -1;
			for (let d = resolvedPos.depth; d > 0; d--) {
				if (resolvedPos.node(d).type.name === 'list_item') {
					listItemDepth = d;
					break;
				}
			}
			if (listItemDepth === -1) return;
			const node = resolvedPos.node(listItemDepth);
			const nodePos = resolvedPos.before(listItemDepth);
			event.preventDefault();
			view.dispatch(
				view.state.tr
					.setNodeMarkup(nodePos, undefined, {
						...node.attrs,
						checked: node.attrs.checked !== true
					})
					.scrollIntoView()
			);
			view.focus();
		});
	}

	function handleReferenceClick(event: MouseEvent) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const refEl = target.closest<HTMLElement>('.bible-reference');
		if (!refEl) return;
		const osis = refEl.getAttribute('data-osis');
		if (!osis) return;

		const raw = refEl.getAttribute('data-raw') || refEl.textContent?.replace(/\u00a0/g, ' ') || '';
		const translation = refEl.getAttribute('data-version') || undefined;
		const book = refEl.getAttribute('data-book') || '';
		const chapterStr = refEl.getAttribute('data-chapter');
		const chapter = chapterStr ? parseInt(chapterStr, 10) : undefined;
		const verseStartStr = refEl.getAttribute('data-verse-start');
		const verseStart = verseStartStr ? parseInt(verseStartStr, 10) : undefined;
		const verseEndStr = refEl.getAttribute('data-verse-end');
		const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : undefined;

		event.preventDefault();
		event.stopPropagation();
		void openBibleReference({
			raw,
			osis,
			book,
			chapter,
			verseStart,
			verseEnd,
			translation,
			from: 0,
			to: raw.length
		});
	}

	onMount(async () => {
		editorRoot.addEventListener('focusin', handleEditorFocusIn);
		editorRoot.addEventListener('focusout', handleEditorFocusOut);
		editorRoot.addEventListener('click', handleTaskMarkerClick);
		editorRoot.addEventListener('click', handleReferenceClick);
		const query = matchMedia('(max-width: 767px)');
		const updateMobile = () => (mobile = query.matches);
		updateMobile();
		query.addEventListener('change', updateMobile);
		host.addEventListener('keydown', handleKeydown, true);
		document.addEventListener('selectionchange', handleSelectionChange);
		editorRoot.addEventListener('mouseover', handleReferenceMouseOver);
		editorRoot.addEventListener('mouseout', handleReferenceMouseOut);
		editorRoot.addEventListener('focusin', handleReferenceFocusIn);
		editorRoot.addEventListener('focusout', handleReferenceFocusOut);
		editorRoot.addEventListener('click', handleVideoClick);
		editorRoot.addEventListener('keydown', handleVideoKeydown);

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
					onStatusChange: (status) => {
						saveStatus = status;
						onStatusChange?.(status);
					},
					onSaved
				});
			}

			const rawContent = note?.body ?? markdown ?? '';
			const initialContent = note
				? extractContentFromNoteBody(rawContent, note.title)
				: extractContentFromNoteBody(rawContent);

			editor = Editor.make()
				.config((ctx) => {
					ctx.set(rootCtx, host);
					ctx.set(defaultValueCtx, initialContent);
					ctx.set(editorViewOptionsCtx, {
						editable: () => !readOnly,
						attributes: {
							autocomplete: 'off',
							autocorrect: 'off',
							autocapitalize: 'sentences',
							enterkeyhint: 'enter',
							inputmode: 'text',
							spellcheck: 'true',
							'data-1p-ignore': 'true',
							'data-lpignore': 'true'
						},
						handlePaste: (view, event) => {
							if (readOnly) return false;
							const data = event.clipboardData?.getData('text/plain') ?? '';
							const candidate = data.trim();
							if (!candidate || /\s/.test(candidate)) return false;
							const parsed = parseYouTubeUrl(candidate);
							if (!parsed.ok) return false;
							const tr = buildVideoInsertTransaction(view.state, {
								videoId: parsed.videoId,
								url: candidate
							});
							if (!tr) return false;
							view.dispatch(tr);
							updateToolbarState();
							refreshHeadings();
							return true;
						}
					});
					ctx.get(listenerCtx).markdownUpdated((_ctx, next, previous) => {
						if (next === previous) return;
						saveService?.scheduleSave(next);
						refreshHeadings();
						const view = _ctx.get(editorViewCtx);
						const { from } = view.state.selection;
						const textBefore = view.state.doc.textBetween(Math.max(0, from - 80), from, ' ', ' ');
						const token = textBefore.match(/\/[^\s]*$/)?.[0];
						if (token) {
							blurEditorBeforeMobileSlash();
							slashQuery = token.slice(1);
							slashOpen = true;
							slashIndex = 0;
							positionSlashMenu(from);
						} else closeSlash();
					});
				})
				.use(commonmark)
				.use(gfm)
				.use(verseDirective)
				.use(unsupportedDirectiveFallback)
				.use(verseNodeSchema)
				.use(videoNodeSchema)
				.use(markRemarkPlugin)
				.use(highlightMarkSchema)
				.use(underlineMarkSchema)
				.use(highlightInputRule)
				.use(underlineInputRule)
				.use(bibleReferencePlugin)
				.use(milkdownPlaceholderPlugin())
				.use(listener);
			await editor.create();
			editor.action((ctx) => {
				applyIosEditorInputAttributes(ctx.get(editorViewCtx).dom);
			});
			refreshHeadings();
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
		if (typeof document !== 'undefined') {
			document.removeEventListener('selectionchange', handleSelectionChange);
		}
		host?.removeEventListener('keydown', handleKeydown, true);
		host?.removeEventListener('keydown', handleEditorKeydown, true);
		editorRoot?.removeEventListener('focusin', handleEditorFocusIn);
		editorRoot?.removeEventListener('focusout', handleEditorFocusOut);
		editorRoot?.removeEventListener('click', handleTaskMarkerClick);
		editorRoot?.removeEventListener('click', handleReferenceClick);
		editorRoot?.removeEventListener('mouseover', handleReferenceMouseOver);
		editorRoot?.removeEventListener('mouseout', handleReferenceMouseOut);
		editorRoot?.removeEventListener('focusin', handleReferenceFocusIn);
		editorRoot?.removeEventListener('focusout', handleReferenceFocusOut);
		editorRoot?.removeEventListener('click', handleVideoClick);
		editorRoot?.removeEventListener('keydown', handleVideoKeydown);
		saveService?.dispose();
		void editor?.destroy();
	});
</script>

<svelte:window onresize={repositionOverlays} onscroll={repositionOverlays} />

<div class="note-editor-viewport" bind:this={editorRoot} oncontextmenu={handleEditorContextMenu}>
	<div class="milkdown-editor" data-testid="note-canvas" data-viewport-fill="true">
		<MilkdownMobileToolbar
			active={!readOnly && editingActive}
			enabled={toolbarEnabled}
			visible={toolbarOpen || (toolbarPinned && toolbarResolved.visible)}
			disabled={!editingActive}
			activeActions={toolbarActive}
			onAction={runToolbar}
			onToggle={() => (toolbarOpen = !toolbarOpen)}
		/>
		<SelectionFormatPopover
			visible={formatPopover !== null}
			top={formatPopover?.top ?? 0}
			left={formatPopover?.left ?? 0}
			pressed={formatPressed}
			onAction={runFormatPopoverAction}
			onClose={() => (formatPopover = null)}
		/>
		<ReferenceHoverCard
			visible={hoverCard !== null}
			top={hoverCard?.top ?? 0}
			left={hoverCard?.left ?? 0}
			status={hoverCard?.data?.status ?? 'loading'}
			reference={hoverCard?.reference ?? ''}
			text={hoverCard?.data?.text}
			versionLabel={hoverCard?.data?.versionLabel}
			loading={hoverCard?.loading ?? false}
			onOpen={openHoverReference}
			onClose={hideHoverCard}
		/>

		{#if initError}
			<p class="editor-error" role="alert">{initError}</p>
		{/if}

		<div class="note-container" onclick={handleContainerClick} role="presentation">
			<div class="note-header-fields">
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
				>
					{noteDescription}
				</p>
			</div>

			<div class="milkdown-host" bind:this={host}></div>
		</div>

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
						<Button class="drawer-command" variant="ghost" onclick={() => runSlash(item)}
							>{item.label}</Button
						>
					{/each}
				</div>
			</Sheet.Content>
		</Sheet.Root>
	{/if}

	{#if storage}
		<VerseSelector
			bind:open={verseSelectorOpen}
			{storage}
			onConfirm={insertVerse}
			onCancel={() => (verseSelectorOpen = false)}
		/>
	{/if}

	<Dialog.Root bind:open={videoDialogOpen}>
		<Dialog.Content class="video-url-dialog" aria-labelledby="video-url-title">
			<Dialog.Title id="video-url-title">Inserir vídeo do YouTube</Dialog.Title>
			<Dialog.Description>Cole a URL do vídeo. Só YouTube é aceito.</Dialog.Description>
			<label class="video-url-field" for="video-url-input">URL do vídeo</label>
			<Input
				id="video-url-input"
				type="url"
				inputmode="url"
				placeholder="https://www.youtube.com/watch?v=…"
				bind:value={videoUrl}
				aria-invalid={videoUrlError ? 'true' : undefined}
				aria-describedby={videoUrlError ? 'video-url-error' : undefined}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						confirmVideoInsert();
					}
				}}
			/>
			{#if videoUrlError}
				<p id="video-url-error" class="video-url-error" role="alert">{videoUrlError}</p>
			{/if}
			{#if parseYouTubeUrl(videoUrl).ok}
				<YouTubeBlockView
					videoId={(parseYouTubeUrl(videoUrl) as { ok: true; videoId: string }).videoId}
					onPlay={confirmVideoInsert}
				/>
			{/if}
			<div class="video-url-actions">
				<Button type="button" variant="ghost" onclick={() => (videoDialogOpen = false)}>
					Cancelar
				</Button>
				<Button type="button" onclick={confirmVideoInsert}>Inserir vídeo</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>

	<BibleReferenceViewer {storage} />
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
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	@media (max-width: 767px) {
		.milkdown-editor {
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
		cursor: text;
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
		transition: color 0.15s ease;
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

	:global(.milkdown-host .ProseMirror[contenteditable='false']) {
		cursor: default;
		user-select: text;
	}

	:global(.milkdown-host .ProseMirror[contenteditable='false'] .is-empty::before) {
		display: none;
	}

	.milkdown-host {
		display: flex;
		flex-direction: column;
		flex: 1;
		width: 100%;
		min-height: 0;
		font-family: var(--font-sans);
	}

	:global(.milkdown-host .milkdown) {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		width: 100%;
		border: 0;
		outline: 0;
		background: transparent;
	}

	:global(.milkdown-host .ProseMirror) {
		display: flex;
		flex-direction: column;
		flex: 1;
		width: 100%;
		border: 0;
		outline: 0;
		background: transparent;
		box-shadow: none;
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(.milkdown-host .ProseMirror) {
		width: 100%;
		max-width: none;
		box-sizing: border-box;
		min-height: 35dvh;
		margin: 0;
		padding: 0;
		color: var(--foreground);
		font-family: var(--font-sans);
		font-size: 1.05rem;
		line-height: 1.75;
		letter-spacing: -0.011em;
		white-space: pre-wrap;
		word-break: break-word;
	}

	/* Placeholder styling for Milkdown */
	:global(.milkdown-host .ProseMirror .is-empty) {
		position: relative;
	}

	:global(.milkdown-host .ProseMirror .is-empty::before) {
		content: attr(data-placeholder);
		float: left;
		color: var(--muted-foreground);
		opacity: 0.45;
		pointer-events: none;
		height: 0;
		font-style: normal;
		user-select: none;
	}

	:global(.milkdown-host .ProseMirror h1),
	:global(.milkdown-host .ProseMirror h2),
	:global(.milkdown-host .ProseMirror h3),
	:global(.milkdown-host .ProseMirror h4),
	:global(.milkdown-host .ProseMirror h5),
	:global(.milkdown-host .ProseMirror h6) {
		font-family: var(--font-sans);
	}

	:global(.milkdown-host .ProseMirror h1) {
		margin: 24px 0 16px;
		font-size: clamp(1.75rem, 4.5vw, 2.25rem);
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.03em;
	}
	:global(.milkdown-host .ProseMirror h2) {
		margin: 28px 0 12px;
		font-size: clamp(1.4rem, 3.5vw, 1.85rem);
		font-weight: 600;
		line-height: 1.25;
		letter-spacing: -0.025em;
	}
	:global(.milkdown-host .ProseMirror h3) {
		margin: 24px 0 8px;
		font-size: 1.2rem;
		font-weight: 600;
		line-height: 1.35;
		letter-spacing: -0.015em;
	}
	:global(.milkdown-host .ProseMirror p) {
		margin: 0 0 12px;
		font-family: var(--font-sans);
		font-size: 1.05rem;
		line-height: 1.75;
		letter-spacing: -0.011em;
	}
	:global(.milkdown-host .ProseMirror ul),
	:global(.milkdown-host .ProseMirror ol) {
		margin: 0 0 16px;
		padding-inline-start: 28px;
	}
	:global(.milkdown-host .ProseMirror ul) {
		list-style: disc;
	}
	:global(.milkdown-host .ProseMirror ol) {
		list-style: decimal;
	}
	:global(.milkdown-host .ProseMirror li) {
		padding-inline-start: 4px;
		font-family: var(--font-sans);
		font-size: 1.05rem;
		line-height: 1.75;
		letter-spacing: -0.011em;
	}
	:global(.milkdown-host .ProseMirror li[data-item-type='task']) {
		position: relative;
		list-style: none;
		padding-inline-start: 4px;
	}
	:global(.milkdown-host .ProseMirror li[data-item-type='task']::before) {
		position: absolute;
		top: 5px;
		left: -28px;
		width: 20px;
		height: 20px;
		box-sizing: border-box;
		border: 1.5px solid var(--border);
		border-radius: 6px;
		background-color: var(--background);
		content: '';
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}
	:global(.milkdown-host .ProseMirror li[data-item-type='task']:hover::before) {
		border-color: var(--foreground);
	}
	:global(.milkdown-host .ProseMirror li[data-item-type='task'][data-checked='true']::before) {
		background-color: var(--primary);
		border-color: var(--primary);
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: center;
		background-size: 13px 13px;
	}
	:global(
		.dark .milkdown-host .ProseMirror li[data-item-type='task'][data-checked='true']::before
	) {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
	}
	:global(.milkdown-host .ProseMirror li[data-item-type='task'][data-checked='true'] > *) {
		text-decoration: line-through;
		color: var(--muted-foreground);
	}
	:global(.milkdown-host .ProseMirror .bible-reference) {
		cursor: pointer;
		text-decoration-line: underline;
		text-decoration-style: dotted;
		text-underline-offset: 3px;
		text-decoration-color: var(--muted-foreground);
		transition:
			color 0.15s ease,
			text-decoration-color 0.15s ease;
	}
	:global(.milkdown-host .ProseMirror .bible-reference:hover) {
		color: var(--primary, #000);
		text-decoration-color: var(--primary, #000);
	}
	:global(.milkdown-host .ProseMirror blockquote) {
		margin: 20px 0;
		border-inline-start: 2px solid var(--border);
		padding-inline-start: 18px;
		color: var(--muted-foreground);
	}
	:global(.milkdown-host .ProseMirror pre) {
		margin: 20px 0;
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--foreground) 5%, transparent);
		padding: 14px 16px;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		line-height: 1.6;
	}
	:global(.milkdown-host .ProseMirror code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
	:global(.milkdown-host .ProseMirror hr) {
		margin: 28px 0;
		border: 0;
		border-top: 1px solid var(--border);
	}
	:global(.milkdown-host .ProseMirror strong) {
		font-weight: 700;
	}
	/* SPEC-0015: normal selection is replaced by the format popover. */
	:global(.milkdown-host .ProseMirror) {
		-webkit-touch-callout: none;
	}
	:global(.milkdown-host .ProseMirror em) {
		font-style: italic;
	}
	:global(.milkdown-host .ProseMirror mark) {
		background-color: color-mix(in srgb, var(--primary) 22%, transparent);
		border-radius: 2px;
		padding: 0 1px;
	}
	:global(.milkdown-host .ProseMirror mark[data-color='yellow']) {
		background-color: color-mix(in srgb, #eab308 35%, transparent);
	}
	:global(.milkdown-host .ProseMirror mark[data-color='green']) {
		background-color: color-mix(in srgb, #22c55e 30%, transparent);
	}
	:global(.milkdown-host .ProseMirror mark[data-color='blue']) {
		background-color: color-mix(in srgb, #3b82f6 30%, transparent);
	}
	:global(.milkdown-host .ProseMirror mark[data-color='pink']) {
		background-color: color-mix(in srgb, #ec4899 30%, transparent);
	}
	:global(.milkdown-host .ProseMirror u) {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	:global(.milkdown-host .ProseMirror figure.video-embed) {
		margin: 16px 0;
	}
	:global(.milkdown-host .ProseMirror .video-facade) {
		display: flex;
		width: 100%;
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 28px 16px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background-color: var(--background);
		cursor: pointer;
		font-size: 0.875rem;
	}
	:global(.milkdown-host .ProseMirror .video-facade:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
	:global(.milkdown-host .ProseMirror .video-facade .video-play) {
		font-size: 1.25rem;
		line-height: 1;
	}
	:global(.milkdown-host .ProseMirror .video-facade .video-domain) {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	:global(.milkdown-host .ProseMirror iframe.video-player) {
		width: 100%;
		aspect-ratio: 16 / 9;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}
	.video-url-dialog {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.video-url-field {
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.video-url-error {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--destructive);
	}
	.video-url-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	:global(.milkdown-host .verse-block-callout) {
		margin: 24px 0;
		padding: 18px 20px;
		border-left: 2px solid var(--border);
		background: transparent;
	}
	:global(.milkdown-host .verse-block-ref) {
		margin: 0 0 10px;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}
	:global(.milkdown-host .verse-snapshot) {
		margin: 0;
		white-space: pre-wrap;
		color: var(--foreground);
		font-family: Georgia, serif;
		font-size: 1rem;
		line-height: 1.75;
	}
	.slash-menu {
		position: fixed;
		z-index: 40;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--popover);
		padding: 6px;
		color: var(--popover-foreground);
		font-family: var(--font-sans);
	}
	.slash-menu button {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 2px;
		border: 0;
		border-radius: calc(var(--radius) - 2px);
		background: transparent;
		padding: 9px 10px;
		color: inherit;
		text-align: left;
		font-family: var(--font-sans);
	}
	.slash-menu button.active,
	.slash-menu button:hover {
		background: var(--accent);
	}
	.slash-menu span {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-family: var(--font-sans);
	}
	.slash-search {
		display: block;
		padding: 12px 16px 6px;
	}
	.slash-search input {
		width: 100%;
		min-height: 44px;
		border: 1px solid var(--input);
		border-radius: var(--radius);
		background: var(--background);
		padding: 0 12px;
		font-family: var(--font-sans);
		font-size: 1rem;
		outline: none;
	}
	.slash-search input:focus-visible {
		border-color: var(--ring);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 24%, transparent);
	}
	.drawer-items {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		gap: 2px;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 6px 12px max(16px, env(safe-area-inset-bottom));
	}
	:global(.drawer-items .drawer-command) {
		width: 100%;
		justify-content: flex-start;
		min-height: 44px;
	}
	:global(.slash-drawer) {
		display: flex;
		min-height: 0;
		height: 90dvh;
		overflow: hidden;
	}
	@media (prefers-reduced-motion: reduce) {
		.slash-menu {
			scroll-behavior: auto;
		}
	}
</style>
