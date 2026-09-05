<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		ArrowUpRight,
		BookOpen,
		ChevronDown,
		Highlighter,
		Menu,
		Plus,
		RefreshCw,
		Search,
		StickyNote,
		X
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ButtonGroup } from '$lib/components/ui/button-group/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import {
		getAdjacentChapter,
		loadBibleCatalog,
		readBibleChapter,
		searchBible,
		type BibleCatalog,
		type BibleSearchResult,
		type BibleVerse
	} from './bible-reader';
	import { displayVersionAbbreviation } from './version-label';
	import {
		isReaderSelectionValid,
		readReaderPreference,
		saveReaderPreference,
		type ReaderSelection
	} from './reader-preference';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import {
		formContinuousRange,
		rangeCoversVerse,
		sameRange,
		type VerseRange
	} from './verse-selection';
	import {
		applyHighlight,
		buildVerseFenceFromRange,
		eraseHighlight,
		formatCopyReference,
		formatCopyTextAndReference,
		formatVerseSnapshot,
		highlightsCoveringVerse,
		isSameReaderHighlight,
		readerHighlightStyle,
		referenceLabel,
		type ReaderHighlight
	} from './reader-highlights';
	import {
		persistHighlight,
		readAllReaderHighlights,
		readChapterHighlights,
		removeHighlight,
		type ReaderHighlightRecord
	} from './reader-highlights-repository';
	import { createNote, loadNoteSummariesForPaths, readNote, saveNote } from '$lib/features/notes/notes-repository';
	import type { Note } from '$lib/features/notes/note-types';
	import {
		persistNoteVerseRefsToWorkspace,
		readChapterNoteVerseRefs,
		type NoteVerseRef
	} from '$lib/features/notes/note-verse-index';
	import { versesCoveredByActiveNotes } from './reader-note-indicators';
	import {
		countDistinctNotesForVerse,
		dedupeRefsByNotePath,
		formatMultiNoteBadge,
		noteRefsForVerse,
		shouldOpenNoteDirectly,
		sortNoteSummariesByUpdatedAt,
		type VerseNoteSummary
	} from './reader-verse-notes';
	import { noteIdFromPath, recallReaderNote, rememberReaderNote } from './reader-note-session';
	import SelectionActionPopover from './SelectionActionPopover.svelte';
	import SelectionActionBar from './SelectionActionBar.svelte';
	import VerseNoteSelector from './VerseNoteSelector.svelte';
	import BibleNoteSplit from './BibleNoteSplit.svelte';
	import HighlightsList from './HighlightsList.svelte';
	import LocalBibleImport from './LocalBibleImport.svelte';
	import RemoteBibleImport from '$lib/features/bible-remote/RemoteBibleImport.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';

	let {
		storage,
		initialError = '',
		onRetry
	}: {
		storage: WorkspaceStorage | null;
		initialError?: string;
		onRetry?: () => void | Promise<void>;
	} = $props();

	const workspace = getWorkspaceState();

	type ReaderState = 'loading' | 'empty' | 'error' | 'ready' | 'unavailable';

	let state = $state<ReaderState>('loading');
	let showLocalImport = $state(false);
	let showRemoteImport = $state(false);

	function handleInstalled() {
		showLocalImport = false;
		showRemoteImport = false;
		if (storage) void loadCatalog(storage);
	}
	let catalog = $state<BibleCatalog | null>(null);
	let errorMessage = $state('');
	let selectedVersionId = $state('');
	let selectedBookId = $state<number | null>(null);
	let selectedChapter = $state<number | null>(null);
	let verses = $state<BibleVerse[]>([]);
	let chapterLoading = $state(false);
	let chapterError = $state('');
	let searchTerm = $state('');
	let searchResults = $state<BibleSearchResult[] | null>(null);
	let searchLoading = $state(false);
	let searchMessage = $state('');
	let searchOpen = $state(false);
	let fabOpen = $state(false);
	let highlightsSheetOpen = $state(false);
	let allHighlights = $state<ReaderHighlightRecord[]>([]);
	let allHighlightsLoading = $state(false);
	let chapterNoteRefs = $state<NoteVerseRef[]>([]);
	type SelectorMode = 'book' | 'chapter' | 'version';
	let selectorMode = $state<SelectorMode>('book');
	let selectorOpen = $state(false);
	let bookSearchTerm = $state('');
	let bookSearchInput = $state<HTMLInputElement | null>(null);
	let selectorBookId = $state<number | null>(null);
	let selectorChapter = $state<number | null>(null);
	const isMobile = new IsMobile();
	let highlights = $state<ReaderHighlight[]>([]);
	let highlightError = $state('');
	let verseSelection = $state<VerseRange | null>(null);
	let selectionAnchorVerse = $state<number | null>(null);
	let popoverOpen = $state(false);
	let popoverAnchor = $state<HTMLElement | null>(null);
	let popoverError = $state('');
	let popoverBusy = $state(false);
	let splitNote = $state<Note | null>(null);
	let splitNoteList = $state<Note[] | null>(null);
	/** Espelha o `showSplit` do BibleNoteSplit no desktop: a toolbar mora no tile. */
	const desktopSplitActive = $derived(
		!isMobile.current &&
			((splitNoteList != null && splitNoteList.length > 0 && splitNote == null) ||
				(splitNote != null && storage != null))
	);
	let verseNoteSelectorOpen = $state(false);
	let verseNoteSelectorAnchor = $state<HTMLElement | null>(null);
	let verseNoteSelectorVerse = $state<number | null>(null);
	let verseNoteSelectorSummaries = $state<VerseNoteSummary[]>([]);
	let verseNoteSelectorLoading = $state(false);
	let verseNoteSelectorError = $state('');
	let loadToken = 0;
	let toolbarVisible = $state(true);
	let lastScrollY = 0;
	/** Sessão de ponteiro: não precisa ser reativa — só evita o click pós-arraste. */
	let versePointerActive = false;
	let versePointerStart = 0;
	let versePointerDragged = false;
	let suppressVerseClick = false;
	let pendingToggleClose = false;

	const scrollDelta = 10;
	const scrollRevealTop = 48;
	let scrollBlockers = $derived({
		selector: selectorOpen,
		search: searchOpen,
		highlights: highlightsSheetOpen
	});

	$effect(() => {
		if (selectorOpen || searchOpen || highlightsSheetOpen) toolbarVisible = true;
	});

	$effect(() => {
		void selectedChapter;
		void selectedBookId;
		toolbarVisible = true;
	});

	onMount(() => {
		lastScrollY = window.scrollY;

		const onScroll = () => {
			if (scrollBlockers.selector || scrollBlockers.search || scrollBlockers.highlights) {
				lastScrollY = window.scrollY;
				return;
			}

			const currentY = window.scrollY;

			if (currentY <= scrollRevealTop) {
				toolbarVisible = true;
			} else if (currentY - lastScrollY > scrollDelta) {
				toolbarVisible = false;
			} else if (lastScrollY - currentY > scrollDelta) {
				toolbarVisible = true;
			}

			lastScrollY = currentY;
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	let usableVersions = $derived(
		catalog?.versions.filter((version) => version.books.some((book) => book.chapters.length > 0)) ??
			[]
	);
	let selectedVersion = $derived(
		usableVersions.find((version) => version.id === selectedVersionId) ?? null
	);
	let selectedBook = $derived(
		selectedVersion?.books.find((book) => book.id === selectedBookId) ?? null
	);
	let selectorBook = $derived(
		selectedVersion?.books.find((book) => book.id === selectorBookId) ?? null
	);
	let previousChapter = $derived(
		selectedVersion && selectedBookId !== null && selectedChapter !== null
			? getAdjacentChapter(
					selectedVersion,
					{ bookId: selectedBookId, chapter: selectedChapter },
					'previous'
				)
			: null
	);
	let nextChapter = $derived(
		selectedVersion && selectedBookId !== null && selectedChapter !== null
			? getAdjacentChapter(
					selectedVersion,
					{ bookId: selectedBookId, chapter: selectedChapter },
					'next'
				)
			: null
	);
	let highlightSelection = $derived(
		verseSelection && selectedVersion && selectedBook && selectedChapter !== null
			? {
					versionId: selectedVersion.id,
					bookId: selectedBook.id,
					chapter: selectedChapter,
					verseStart: verseSelection.verseStart,
					verseEnd: verseSelection.verseEnd
				}
			: null
	);
	let selectedVerses = $derived.by(() => {
		const range = verseSelection;
		return range ? verses.filter((verse) => rangeCoversVerse(range, verse.number)) : [];
	});
	let activeStyleId = $derived.by(() => {
		const target = highlightSelection;
		if (!target) return null;
		const found = highlights.find(
			(highlight) =>
				highlight.versionId === target.versionId &&
				highlight.bookId === target.bookId &&
				highlight.chapter === target.chapter &&
				sameRange(highlight, target)
		);
		return found?.styleId ?? null;
	});
	let selectionReference = $derived(
		verseSelection && selectedBook && selectedVersion && selectedChapter !== null
			? formatCopyReference({
					book: selectedBook.name,
					chapter: selectedChapter,
					verseStart: verseSelection.verseStart,
					verseEnd: verseSelection.verseEnd,
					versionLabel: displayVersionAbbreviation(selectedVersion)
				})
			: ''
	);
	let filteredBooks = $derived.by(() => {
		const term = bookSearchTerm.trim().toLocaleLowerCase('pt-BR');
		return (
			selectedVersion?.books.filter((book) => {
				if (book.chapters.length === 0) return false;
				if (!term) return true;
				return [book.name, book.abbreviation].some((value) =>
					value.toLocaleLowerCase('pt-BR').includes(term)
				);
			}) ?? []
		);
	});
	let noteIndicatorVerses = $derived.by(() => {
		if (!selectedVersion || selectedBookId === null || selectedChapter === null) return [];
		return versesCoveredByActiveNotes(chapterNoteRefs, {
			versionId: selectedVersion.id,
			bookId: selectedBookId,
			chapter: selectedChapter
		});
	});

	function chapterQuery() {
		if (!selectedVersion || selectedBookId === null || selectedChapter === null) return null;
		return {
			versionId: selectedVersion.id,
			bookId: selectedBookId,
			chapter: selectedChapter
		};
	}

	function noteBadgeForVerse(verseNumber: number): string | null {
		const query = chapterQuery();
		if (!query) return null;
		return formatMultiNoteBadge(countDistinctNotesForVerse(chapterNoteRefs, query, verseNumber));
	}

	function noteRefForVerse(verseNumber: number): NoteVerseRef | null {
		if (!selectedVersion || selectedBookId === null || selectedChapter === null) return null;
		const matches = chapterNoteRefs.filter(
			(ref) =>
				ref.versionId === selectedVersion.id &&
				ref.bookId === selectedBookId &&
				ref.chapter === selectedChapter &&
				verseNumber >= Math.min(ref.verseStart, ref.verseEnd) &&
				verseNumber <= Math.max(ref.verseStart, ref.verseEnd)
		);
		return matches[0] ?? null;
	}

	let bookGroups = $derived.by(() => {
		const groups: Array<{ id: string; label: string; books: typeof filteredBooks }> = [];
		const oldTestament = filteredBooks.filter((book) => book.testamentId === 1);
		const newTestament = filteredBooks.filter((book) => book.testamentId === 2);
		const groupedBookIds = new Set([...oldTestament, ...newTestament].map((book) => book.id));

		if (oldTestament.length > 0) {
			groups.push({ id: 'old-testament', label: 'Antigo Testamento', books: oldTestament });
		}
		if (newTestament.length > 0) {
			groups.push({ id: 'new-testament', label: 'Novo Testamento', books: newTestament });
		}

		const otherBooks = filteredBooks.filter((book) => !groupedBookIds.has(book.id));
		if (otherBooks.length > 0) {
			groups.push({
				id: 'other-books',
				label: groups.length > 0 ? 'Outros livros' : 'Livros disponíveis',
				books: otherBooks
			});
		}
		return groups;
	});

	$effect(() => {
		if (selectorOpen && selectorMode === 'book') bookSearchInput?.focus();
	});

	$effect(() => {
		const currentStorage = storage;
		if (!currentStorage) {
			state = initialError ? 'error' : 'unavailable';
			errorMessage = initialError;
			return;
		}
		void loadCatalog(currentStorage);
	});

	function workspaceSelection() {
		return workspace?.preferences.readerSelection ?? readReaderPreference();
	}

	async function loadCatalog(currentStorage: WorkspaceStorage) {
		const token = ++loadToken;
		state = 'loading';
		errorMessage = '';
		catalog = null;
		verses = [];
		try {
			const nextCatalog = await loadBibleCatalog(currentStorage);
			if (token !== loadToken) return;
			catalog = nextCatalog;
			if (usableVersionCount(nextCatalog) === 0) {
				state = 'empty';
				return;
			}

			const storedSelection = workspaceSelection();
			const selection =
				storedSelection && isReaderSelectionValid(storedSelection, nextCatalog)
					? storedSelection
					: firstSelection(nextCatalog);
			if (!selection) {
				state = 'empty';
				return;
			}
			selectedVersionId = selection.versionId;
			selectedBookId = selection.bookId;
			selectedChapter = selection.chapter;
			state = 'ready';
			await loadChapter(selection, token);
		} catch (error) {
			if (token !== loadToken) return;
			state = 'error';
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar as Bíblias.';
		}
	}

	function usableVersionCount(nextCatalog: BibleCatalog): number {
		return nextCatalog.versions.filter((version) =>
			version.books.some((book) => book.chapters.length > 0)
		).length;
	}

	function firstSelection(nextCatalog: BibleCatalog): ReaderSelection | null {
		const defaultId = workspace?.preferences.defaultBibleVersionId;
		if (defaultId) {
			const preferred = nextCatalog.versions.find(
				(v) => v.id === defaultId || v.fileName === defaultId
			);
			if (preferred) {
				const book = preferred.books.find((item) => item.chapters.length > 0);
				if (book) return { versionId: preferred.id, bookId: book.id, chapter: book.chapters[0] };
			}
		}
		for (const version of nextCatalog.versions) {
			const book = version.books.find((item) => item.chapters.length > 0);
			if (book) return { versionId: version.id, bookId: book.id, chapter: book.chapters[0] };
		}
		return null;
	}

	async function loadChapter(selection: ReaderSelection, token = loadToken) {
		const version = catalog?.versions.find((item) => item.id === selection.versionId);
		if (!version) return;
		chapterLoading = true;
		chapterError = '';
		try {
			const nextVerses = await readBibleChapter(version, selection.bookId, selection.chapter);
			if (token !== loadToken) return;
			verses = nextVerses;
			closePopover();
			highlights = [];
			chapterNoteRefs = [];
			highlightError = '';
			void loadHighlights(selection, token);
			void loadChapterNoteRefs(selection, token);
			saveReaderPreference(selection);
			void workspace?.updatePreferences({ readerSelection: selection });
		} catch (error) {
			if (token !== loadToken) return;
			chapterError = error instanceof Error ? error.message : 'Não foi possível ler este capítulo.';
		} finally {
			if (token === loadToken) chapterLoading = false;
		}
	}

	function selectionFor(versionId: string, bookId: number, chapter: number): ReaderSelection {
		return { versionId, bookId, chapter };
	}

	function openSelector(mode: SelectorMode) {
		selectorMode = mode;
		if (mode === 'book') {
			bookSearchTerm = '';
			selectorBookId = selectedBookId;
			selectorChapter = selectedChapter;
		} else if (mode === 'chapter') {
			selectorBookId = selectedBookId;
			selectorChapter = selectedChapter;
		}
		selectorOpen = true;
	}

	function selectBook(bookId: number) {
		const book = selectedVersion?.books.find((item) => item.id === bookId);
		if (!book || book.chapters.length === 0) return;
		selectorBookId = book.id;
		selectorChapter = book.chapters.includes(selectedChapter ?? -1)
			? selectedChapter
			: book.chapters[0];
		selectorMode = 'chapter';
		bookSearchTerm = '';
	}

	function selectChapter(chapter: number) {
		if (!selectedVersion || selectorBookId === null) return;
		selectorOpen = false;
		void chooseSelection(selectionFor(selectedVersion.id, selectorBookId, chapter));
	}

	function selectVersion(versionId: string) {
		switchVersion(versionId);
		selectorOpen = false;
	}

	function switchVersion(versionId: string) {
		if (versionId === selectedVersionId) return;
		const version = usableVersions.find((item) => item.id === versionId);
		if (!version) return;

		const currentBookId = selectorBookId ?? selectedBookId;
		const currentChapter = selectorChapter ?? selectedChapter;

		if (currentBookId !== null) {
			const book = version.books.find(
				(item) => item.id === currentBookId && item.chapters.length > 0
			);
			if (book) {
				const chapter =
					currentChapter !== null && book.chapters.includes(currentChapter)
						? currentChapter
						: book.chapters[0];
				selectorBookId = book.id;
				selectorChapter = chapter;
				void chooseSelection(selectionFor(version.id, book.id, chapter));
				return;
			}
		}

		const book = version.books.find((item) => item.chapters.length > 0);
		if (!book) return;
		selectorBookId = book.id;
		selectorChapter = book.chapters[0];
		void chooseSelection(selectionFor(version.id, book.id, book.chapters[0]));
	}

	function openBibleImport() {
		selectorOpen = false;
		void goto(`${resolve('/')}?import=bible`);
	}

	function selectorTitle(mode: SelectorMode): string {
		if (mode === 'book') return 'Selecionar livro';
		if (mode === 'chapter') return 'Selecionar capítulo';
		return 'Selecionar versão';
	}

	async function chooseSelection(selection: ReaderSelection) {
		const version = catalog?.versions.find((item) => item.id === selection.versionId);
		if (!version || !isReaderSelectionValid(selection, catalog ?? { versions: [] })) return;
		selectedVersionId = selection.versionId;
		selectedBookId = selection.bookId;
		selectedChapter = selection.chapter;
		searchResults = null;
		searchMessage = '';
		await loadChapter(selection);
	}

	async function moveChapter(selection: { bookId: number; chapter: number } | null) {
		if (!selectedVersion || !selection) return;
		await chooseSelection(selectionFor(selectedVersion.id, selection.bookId, selection.chapter));
	}

	async function runSearch() {
		const term = searchTerm.trim();
		if (!term || !selectedVersion) {
			searchResults = null;
			searchMessage = term ? 'Nenhuma versão selecionada.' : 'Informe um termo para buscar.';
			return;
		}
		searchLoading = true;
		searchMessage = '';
		try {
			const results = await searchBible(selectedVersion, term);
			searchResults = results;
			searchMessage =
				results.length === 0
					? 'Nenhum versículo encontrado.'
					: `${results.length} resultados encontrados.`;
			searchOpen = false;
		} catch (error) {
			searchResults = null;
			searchMessage = error instanceof Error ? error.message : 'Não foi possível fazer a busca.';
		} finally {
			searchLoading = false;
		}
	}

	async function retry() {
		if (storage) {
			await loadCatalog(storage);
		} else {
			await onRetry?.();
		}
	}

	/** Os destaques vivem só em `.openbible/index.sqlite`; uma falha aqui não pode
	 * impedir a leitura do capítulo. */
	async function loadHighlights(query: ReaderSelection, token: number) {
		const currentStorage = storage;
		if (!currentStorage) return;
		try {
			const records = await readChapterHighlights(currentStorage, query);
			if (token !== loadToken) return;
			highlights = records;
		} catch {
			if (token !== loadToken) return;
			highlightError = 'Não foi possível carregar seus destaques deste capítulo.';
		}
	}

	async function loadChapterNoteRefs(query: ReaderSelection, token: number) {
		const currentStorage = storage;
		if (!currentStorage) return;
		try {
			const refs = await readChapterNoteVerseRefs(currentStorage, query);
			if (token !== loadToken) return;
			chapterNoteRefs = refs;
		} catch {
			if (token !== loadToken) return;
			chapterNoteRefs = [];
		}
	}

	async function loadAllHighlights() {
		const currentStorage = storage;
		if (!currentStorage) return;
		allHighlightsLoading = true;
		try {
			allHighlights = await readAllReaderHighlights(currentStorage);
		} catch {
			allHighlights = [];
		} finally {
			allHighlightsLoading = false;
		}
	}

	function handleAllHighlightRemoved(highlight: ReaderHighlightRecord) {
		allHighlights = allHighlights.filter((item) => !isSameReaderHighlight(item, highlight));
		if (
			selectedVersion?.id === highlight.versionId &&
			selectedBookId === highlight.bookId &&
			selectedChapter === highlight.chapter
		) {
			highlights = eraseHighlight(highlights, highlight);
		}
	}

	function handleAllHighlightNavigate(highlight: ReaderHighlightRecord) {
		highlightsSheetOpen = false;
		void chooseSelection(selectionFor(highlight.versionId, highlight.bookId, highlight.chapter));
	}

	function openHighlightsSheet() {
		highlightsSheetOpen = true;
		void loadAllHighlights();
	}

	function openReaderSearch() {
		fabOpen = false;
		searchOpen = true;
	}

	function openReaderHighlights() {
		fabOpen = false;
		openHighlightsSheet();
	}

	$effect(() => {
		if (!fabOpen || typeof window === 'undefined') return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') fabOpen = false;
		};
		window.addEventListener('keydown', closeOnEscape);
		return () => window.removeEventListener('keydown', closeOnEscape);
	});

	async function openNoteFromVerse(verseNumber: number) {
		const ref = noteRefForVerse(verseNumber);
		const currentStorage = storage;
		if (!ref || !currentStorage) return;
		splitNoteList = null;
		const cached = recallReaderNote(ref.notePath);
		if (cached) {
			splitNote = cached;
			return;
		}
		const id = noteIdFromPath(ref.notePath);
		if (!id) return;
		const note = await readNote(currentStorage, id);
		if (note) {
			rememberReaderNote(note);
			splitNote = note;
		}
	}

	function closeVerseNoteSelector() {
		verseNoteSelectorOpen = false;
		verseNoteSelectorAnchor = null;
		verseNoteSelectorVerse = null;
		verseNoteSelectorSummaries = [];
		verseNoteSelectorError = '';
		verseNoteSelectorLoading = false;
	}

	async function openNoteFromSummary(summary: VerseNoteSummary) {
		closeVerseNoteSelector();
		const currentStorage = storage;
		if (!currentStorage) return;
		splitNoteList = null;
		const cached = recallReaderNote(summary.notePath);
		if (cached) {
			splitNote = cached;
			return;
		}
		const note = await readNote(currentStorage, summary.id);
		if (note) {
			rememberReaderNote(note);
			splitNote = note;
		}
	}

	async function openAllNotesForVerse() {
		const verse = verseNoteSelectorVerse;
		const currentStorage = storage;
		const query = chapterQuery();
		closeVerseNoteSelector();
		if (verse === null || !currentStorage || !query) return;
		const refs = dedupeRefsByNotePath(noteRefsForVerse(chapterNoteRefs, query, verse));
		const summaries = sortNoteSummariesByUpdatedAt(
			await loadNoteSummariesForPaths(
				currentStorage,
				refs.map((ref) => ref.notePath)
			)
		);
		const notes: Note[] = [];
		for (const summary of summaries) {
			const cached = recallReaderNote(summary.notePath);
			if (cached) {
				notes.push(cached);
				continue;
			}
			const note = await readNote(currentStorage, summary.id);
			if (!note) continue;
			rememberReaderNote(note);
			notes.push(note);
		}
		splitNote = null;
		splitNoteList = notes;
	}

	async function handleNoteIconClick(verseNumber: number, anchor: HTMLElement) {
		const currentStorage = storage;
		const query = chapterQuery();
		if (!currentStorage || !query) {
			verseNoteSelectorError = 'Workspace indisponível.';
			return;
		}
		const count = countDistinctNotesForVerse(chapterNoteRefs, query, verseNumber);
		if (shouldOpenNoteDirectly(count)) {
			await openNoteFromVerse(verseNumber);
			return;
		}
		if (count < 2) return;
		verseNoteSelectorVerse = verseNumber;
		verseNoteSelectorAnchor = anchor;
		verseNoteSelectorOpen = true;
		verseNoteSelectorLoading = true;
		verseNoteSelectorError = '';
		verseNoteSelectorSummaries = [];
		try {
			const refs = dedupeRefsByNotePath(noteRefsForVerse(chapterNoteRefs, query, verseNumber));
			verseNoteSelectorSummaries = sortNoteSummariesByUpdatedAt(
				await loadNoteSummariesForPaths(
					currentStorage,
					refs.map((ref) => ref.notePath)
				)
			);
		} catch {
			verseNoteSelectorError = 'Não foi possível carregar as notas deste versículo.';
			verseNoteSelectorOpen = false;
		} finally {
			verseNoteSelectorLoading = false;
		}
	}

	function closeSplitPanel() {
		splitNote = null;
		splitNoteList = null;
	}

	function handleListNoteSelected(note: Note) {
		rememberReaderNote(note);
		splitNote = note;
	}

	function backToVerseNoteList() {
		splitNote = null;
	}

	function closePopover() {
		popoverOpen = false;
		popoverAnchor = null;
		popoverError = '';
		popoverBusy = false;
		verseSelection = null;
		selectionAnchorVerse = null;
		versePointerActive = false;
		pendingToggleClose = false;
	}

	function releaseVersePointer(event: PointerEvent) {
		const row = event.currentTarget;
		if (row instanceof HTMLElement && row.hasPointerCapture(event.pointerId)) {
			row.releasePointerCapture(event.pointerId);
		}
	}

	function verseNumberFromPoint(clientX: number, clientY: number): number | null {
		const node = document.elementFromPoint(clientX, clientY);
		const row = node?.closest('[data-verse-row]');
		if (!(row instanceof HTMLElement)) return null;
		const verse = Number(row.dataset.verseRow);
		return Number.isInteger(verse) && verse > 0 ? verse : null;
	}

	function applyVerseRange(verse: number, event: { shiftKey: boolean }, row: HTMLElement | null) {
		const isWholeSelection =
			verseSelection?.verseStart === verse && verseSelection?.verseEnd === verse;

		if (event.shiftKey && selectionAnchorVerse !== null) {
			verseSelection = formContinuousRange(selectionAnchorVerse, verse) ?? verseSelection;
			return 'extend';
		}
		if (isWholeSelection && popoverOpen) return 'toggle-close';
		if (popoverOpen && selectionAnchorVerse !== null) {
			verseSelection = formContinuousRange(selectionAnchorVerse, verse) ?? verseSelection;
			return 'extend';
		}
		selectionAnchorVerse = verse;
		verseSelection = { verseStart: verse, verseEnd: verse };
		popoverAnchor = row;
		return 'replace';
	}

	function selectVerse(verse: number, event: MouseEvent | KeyboardEvent) {
		if (suppressVerseClick) {
			suppressVerseClick = false;
			return;
		}
		const row = event.currentTarget as HTMLElement | null;
		const action = applyVerseRange(verse, event, row);
		if (action === 'toggle-close') {
			closePopover();
			return;
		}

		popoverError = '';
		popoverOpen = true;
	}

	function handleVersePointerDown(verse: number, event: PointerEvent) {
		if (event.button !== 0) return;
		const row = event.currentTarget;
		if (!(row instanceof HTMLElement)) return;
		try {
			row.setPointerCapture(event.pointerId);
		} catch {
			/* ponteiro já encerrado */
		}
		suppressVerseClick = true;
		versePointerActive = true;
		versePointerStart = verse;
		versePointerDragged = false;
		pendingToggleClose = applyVerseRange(verse, event, row) === 'toggle-close';
		popoverError = '';
	}

	function handleVersePointerMove(event: PointerEvent) {
		if (!versePointerActive || (event.buttons & 1) === 0) return;
		const verse = verseNumberFromPoint(event.clientX, event.clientY);
		if (verse === null || verse === versePointerStart) return;
		versePointerDragged = true;
		pendingToggleClose = false;
		selectionAnchorVerse = versePointerStart;
		verseSelection = formContinuousRange(versePointerStart, verse) ?? verseSelection;
	}

	function handleVersePointerUp(event: PointerEvent) {
		if (!versePointerActive) return;
		versePointerActive = false;
		releaseVersePointer(event);
		if (pendingToggleClose && !versePointerDragged) {
			closePopover();
			return;
		}
		popoverOpen = true;
	}

	function handleVersePointerCancel(event: PointerEvent) {
		if (!versePointerActive) return;
		versePointerActive = false;
		pendingToggleClose = false;
		releaseVersePointer(event);
	}

	function handleVerseKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !popoverOpen) return;
		event.preventDefault();
		closePopover();
	}

	function verseMarkLabel(covering: ReaderHighlight[]): string {
		return covering
			.map((highlight) => readerHighlightStyle(highlight.styleId)?.label ?? highlight.styleId)
			.join(', ');
	}

	async function applyStyle(styleId: string) {
		const target = highlightSelection;
		const currentStorage = storage;
		if (!currentStorage || !target) return;
		const previous = highlights;
		highlights = applyHighlight(highlights, target, styleId);
		popoverBusy = true;
		popoverError = '';
		try {
			await persistHighlight(currentStorage, { ...target, styleId });
		} catch {
			highlights = previous;
			popoverError = 'Não foi possível salvar o destaque neste workspace.';
		} finally {
			popoverBusy = false;
		}
	}

	async function eraseStyle() {
		const target = highlightSelection;
		const currentStorage = storage;
		if (!currentStorage || !target) return;
		const previous = highlights;
		highlights = eraseHighlight(highlights, target);
		popoverBusy = true;
		popoverError = '';
		try {
			await removeHighlight(currentStorage, target);
		} catch {
			highlights = previous;
			popoverError = 'Não foi possível apagar o destaque neste workspace.';
		} finally {
			popoverBusy = false;
		}
	}

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			popoverError = '';
		} catch {
			popoverError = 'Não foi possível copiar. A área de transferência não está disponível.';
		}
	}

	function copyReference() {
		if (!selectionReference) return;
		void copy(selectionReference);
	}

	function copyTextAndReference() {
		const range = verseSelection;
		if (!range || !selectedBook || !selectedVersion || selectedChapter === null) return;
		void copy(
			formatCopyTextAndReference({
				book: selectedBook.name,
				chapter: selectedChapter,
				verseStart: range.verseStart,
				verseEnd: range.verseEnd,
				versionLabel: displayVersionAbbreviation(selectedVersion),
				verses: selectedVerses
			})
		);
	}

	/** Criar nota nunca aplica destaque: a fatia grava só a nota nova com o fence
	 * do intervalo e abre o split ao lado do leitor. */
	async function createNoteFromSelection() {
		const range = verseSelection;
		const currentStorage = storage;
		if (!currentStorage || !range || !selectedBook || !selectedVersion || selectedChapter === null)
			return;
		const reference = referenceLabel({
			book: selectedBook.name,
			chapter: selectedChapter,
			verseStart: range.verseStart,
			verseEnd: range.verseEnd
		});
		popoverBusy = true;
		try {
			const created = await createNote(currentStorage);
			const fence = buildVerseFenceFromRange({
				versionId: selectedVersion.id,
				bookId: selectedBook.id,
				book: selectedBook.name,
				chapter: selectedChapter,
				verseStart: range.verseStart,
				verseEnd: range.verseEnd,
				snapshot: formatVerseSnapshot(selectedVerses)
			});
			const saved = await saveNote(currentStorage, {
				...created,
				title: reference,
				body: `\n# ${reference}\n\n${fence}\n`
			});
			await persistNoteVerseRefsToWorkspace(currentStorage, saved.path, [
				{
					blockIndex: 0,
					versionId: selectedVersion.id,
					bookId: selectedBook.id,
					bookName: selectedBook.name,
					chapter: selectedChapter,
					verseStart: range.verseStart,
					verseEnd: range.verseEnd
				}
			]);
			rememberReaderNote(saved);
			chapterNoteRefs = await readChapterNoteVerseRefs(currentStorage, {
				versionId: selectedVersion.id,
				bookId: selectedBook.id,
				chapter: selectedChapter
			});
			splitNote = saved;
			closePopover();
		} catch {
			popoverError = 'Não foi possível criar a nota neste workspace.';
		} finally {
			popoverBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Bíblia | OpenBible</title>
	<meta name="description" content="Leia suas Bíblias OpenLP importadas no workspace local." />
</svelte:head>

{#snippet searchForm()}
	<form
		class="search-panel-form"
		onsubmit={(event) => {
			event.preventDefault();
			void runSearch();
		}}
	>
		<label for="bible-search">Buscar no texto</label>
		<div class="search-row">
			<Input
				id="bible-search"
				type="search"
				bind:value={searchTerm}
				placeholder="Ex.: esperança"
				autocomplete="off"
				autofocus
			/>
			<Button type="submit" disabled={searchLoading}>
				<Search size={15} strokeWidth={1.8} aria-hidden="true" />
				Buscar
			</Button>
		</div>
		{#if searchMessage}
			<p class="search-panel-message" role="status">{searchMessage}</p>
		{/if}
	</form>
{/snippet}

{#snippet versionDropdownMenu()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<InputGroup.Button
					{...props}
					type="button"
					size="sm"
					class="version-dropdown-trigger"
					aria-label="Versão"
					title={selectedVersion?.name}
				>
					<span class="version-trigger-label">{displayVersionAbbreviation(selectedVersion!)}</span>
					<ChevronDown size={12} strokeWidth={1.8} aria-hidden="true" />
				</InputGroup.Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="version-dropdown-content">
			<DropdownMenu.Label>Traduções instaladas</DropdownMenu.Label>
			<DropdownMenu.RadioGroup
				value={selectedVersionId}
				onValueChange={(value) => value && switchVersion(value)}
			>
				{#each usableVersions as version (version.id)}
					<DropdownMenu.RadioItem value={version.id}>
						<span class="version-menu-item">
							<span class="version-menu-abbr">{displayVersionAbbreviation(version)}</span>
							<span class="version-menu-name">{version.name}</span>
						</span>
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onSelect={openBibleImport}>
				<Plus size={14} strokeWidth={1.8} aria-hidden="true" />
				Importar nova versão
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<div class="reader-page" class:with-note={splitNote !== null || splitNoteList !== null}>
	{#if state === 'loading'}
		<section class="state-panel" aria-live="polite" role="status">
			<p class="state-label">Leitura local</p>
			<h2>Carregando Bíblias importadas</h2>
			<div class="loading-lines" aria-hidden="true"><span></span><span></span><span></span></div>
		</section>
	{:else if state === 'unavailable'}
		<section class="state-panel" aria-live="polite">
			<p class="state-label">Workspace não configurado</p>
			<h2>Configure um workspace para ler a Bíblia</h2>
			<p>Volte ao início para escolher onde seus arquivos locais serão mantidos.</p>
			<a class="text-action" href={resolve('/')}>Voltar ao início</a>
		</section>
	{:else if state === 'error'}
		<section class="state-panel state-error" aria-live="assertive">
			<p class="state-label">Não foi possível carregar</p>
			<h2>Não foi possível carregar as Bíblias</h2>
			<p>{errorMessage || 'O armazenamento local não respondeu.'}</p>
			<div class="state-actions">
				<button class="button secondary" type="button" onclick={retry}>
					<RefreshCw size={15} strokeWidth={1.8} aria-hidden="true" /> Tentar novamente
				</button>
				<a class="text-action" href={resolve('/')}>Voltar ao início</a>
			</div>
		</section>
	{:else if state === 'empty'}
		<Empty.Root class="bible-empty">
			<Empty.Header>
				<Empty.Media variant="icon"><BookOpen size={16} strokeWidth={1.8} aria-hidden="true" /></Empty.Media>
				<h2 class="bible-empty-title" data-slot="empty-title">Nenhuma Bíblia instalada</h2>
				<Empty.Description>
					Você ainda não tem nenhuma Bíblia neste workspace.
					<br />Importe um SQLite no padrão OpenLP para começar a leitura.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content class="bible-empty-actions">
				<button class="button primary" type="button" onclick={() => (showLocalImport = true)}>
					Importar arquivos
				</button>
				<button
					class="button secondary"
					type="button"
					onclick={() => (showRemoteImport = true)}
					aria-haspopup="dialog"
				>
					Usar URL do bucket
				</button>
				<a class="text-action" href={resolve('/config')}>
					Abrir configurações <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
				</a>
			</Empty.Content>
		</Empty.Root>
		<Dialog.Root bind:open={showLocalImport}>
			<Dialog.Content class="bible-import-dialog" aria-labelledby="bible-import-local-title">
				<div class="import-dialog-head">
					<Dialog.Title id="bible-import-local-title">Importar arquivos SQLite</Dialog.Title>
					<Dialog.Description>
						Envie arquivos compatíveis com o padrão OpenLP. Eles ficam em <code>bibles/</code>.
					</Dialog.Description>
				</div>
				<LocalBibleImport {storage} onInstalled={handleInstalled} />
			</Dialog.Content>
		</Dialog.Root>
		<Dialog.Root bind:open={showRemoteImport}>
			<Dialog.Content class="bible-import-dialog" aria-labelledby="bible-import-remote-title">
				<div class="import-dialog-head">
					<Dialog.Title id="bible-import-remote-title">Importar do bucket R2</Dialog.Title>
					<Dialog.Description>
						Informe a URL pública do bucket para listar e instalar as versões.
					</Dialog.Description>
				</div>
				<RemoteBibleImport {storage} variant="bible" bare onInstalled={handleInstalled} />
			</Dialog.Content>
		</Dialog.Root>
		{#if catalog && catalog.diagnostics.length > 0}
			<section class="diagnostic" aria-live="polite">
				<strong>O arquivo foi encontrado, mas não pôde ser lido.</strong>
				<ul>
					{#each catalog.diagnostics as diagnostic (diagnostic.fileName)}
						<li><span>{diagnostic.fileName}</span>: {diagnostic.message}</li>
					{/each}
				</ul>
			</section>
		{/if}
	{:else if selectedVersion && selectedBook && selectedChapter !== null}
		{#snippet readerToolbar()}
			<section
				class="reader-toolbar"
				class:toolbar-hidden={!toolbarVisible}
				aria-label="Controles do leitor"
			>
			<div class="toolbar-shell">
				<ButtonGroup class="reader-toolbar-group" aria-label="Navegação da Bíblia">
					<Button
						variant="ghost"
						size="icon-sm"
						class="toolbar-nav-button"
						disabled={!previousChapter || chapterLoading}
						onclick={() => moveChapter(previousChapter)}
						aria-label="Capítulo anterior"
						title="Capítulo anterior"
					>
						<ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
					</Button>
					<button
						class="toolbar-choice book-choice"
						type="button"
						data-slot="button"
						onclick={() => openSelector('book')}
						aria-haspopup="dialog"
						aria-expanded={selectorOpen && selectorMode === 'book'}
						aria-label="Livro"
						title="Selecionar livro"
					>
						<span>{selectedBook.name}</span>
						<ChevronDown size={13} strokeWidth={1.8} aria-hidden="true" class="choice-chevron" />
					</button>
					<button
						class="toolbar-choice chapter-choice"
						type="button"
						data-slot="button"
						onclick={() => openSelector('chapter')}
						aria-haspopup="dialog"
						aria-expanded={selectorOpen && selectorMode === 'chapter'}
						aria-label="Capítulo"
						title="Selecionar capítulo"
					>
						<span>{selectedChapter}</span>
						<ChevronDown size={13} strokeWidth={1.8} aria-hidden="true" class="choice-chevron" />
					</button>
					<button
						class="toolbar-choice version-choice"
						type="button"
						data-slot="button"
						onclick={() => openSelector('version')}
						aria-label="Versão"
						role="combobox"
						aria-haspopup="dialog"
						aria-controls="bible-selector"
						aria-expanded={selectorOpen && selectorMode === 'version'}
						title={selectedVersion.name}
					>
						<span class="version-label">{displayVersionAbbreviation(selectedVersion)}</span>
						<ChevronDown size={13} strokeWidth={1.8} aria-hidden="true" class="choice-chevron" />
					</button>
					<Button
						variant="ghost"
						size="icon-sm"
						class="toolbar-nav-button"
						disabled={!nextChapter || chapterLoading}
						onclick={() => moveChapter(nextChapter)}
						aria-label="Próximo capítulo"
						title="Próximo capítulo"
					>
						<ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						class="toolbar-search-button"
						onclick={() => (searchOpen = true)}
						aria-label="Buscar no texto"
						title="Buscar no texto"
					>
						<Search size={16} strokeWidth={1.8} aria-hidden="true" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						class="toolbar-highlights-button"
						onclick={() => openHighlightsSheet()}
						aria-label="Destaques"
						title="Destaques"
					>
						<Highlighter size={16} strokeWidth={1.8} aria-hidden="true" />
					</Button>
				</ButtonGroup>
			</div>
			</section>
		{/snippet}
		{#if !desktopSplitActive}
			{@render readerToolbar()}
		{/if}
		<div
			class="reader-fab"
			class:fab-open={fabOpen}
			class:fab-hidden={popoverOpen}
		>
			<div class="fab-actions" aria-hidden={!fabOpen}>
				<button
					type="button"
					class="fab-action"
					tabindex={fabOpen ? 0 : -1}
					onclick={openReaderSearch}
					aria-label="Buscar no texto"
				>
					<span class="fab-label" aria-hidden="true">Buscar</span>
					<span class="fab-circle" aria-hidden="true">
						<Search size={16} strokeWidth={1.8} />
					</span>
				</button>
				<button
					type="button"
					class="fab-action"
					tabindex={fabOpen ? 0 : -1}
					onclick={openReaderHighlights}
					aria-label="Destaques"
				>
					<span class="fab-label" aria-hidden="true">Destaques</span>
					<span class="fab-circle" aria-hidden="true">
						<Highlighter size={16} strokeWidth={1.8} />
					</span>
				</button>
			</div>
			<button
				type="button"
				class="fab-main"
				onclick={() => (fabOpen = !fabOpen)}
				aria-expanded={fabOpen}
				aria-label={fabOpen ? 'Fechar ações de leitura' : 'Abrir ações de leitura'}
			>
				{#if fabOpen}
					<X size={18} strokeWidth={2} aria-hidden="true" />
				{:else}
					<Menu size={18} strokeWidth={2} aria-hidden="true" />
				{/if}
			</button>
		</div>

		{#if isMobile.current}
			<Sheet.Root bind:open={searchOpen}>
				<Sheet.Content side="bottom" class="search-drawer-content">
					<Sheet.Header class="search-panel-header">
						<Sheet.Title>Buscar na Bíblia</Sheet.Title>
						<Sheet.Description>Pesquise por uma palavra ou frase na versão atual.</Sheet.Description
						>
					</Sheet.Header>
					{@render searchForm()}
				</Sheet.Content>
			</Sheet.Root>
		{:else}
			<Dialog.Root bind:open={searchOpen}>
				<Dialog.Content class="search-dialog-content">
					<div class="search-panel-header">
						<Dialog.Title>Buscar na Bíblia</Dialog.Title>
						<Dialog.Description
							>Pesquise por uma palavra ou frase na versão atual.</Dialog.Description
						>
					</div>
					{@render searchForm()}
				</Dialog.Content>
			</Dialog.Root>
		{/if}

		<Sheet.Root bind:open={highlightsSheetOpen}>
			<Sheet.Content side={isMobile.current ? 'bottom' : 'right'} class="highlights-sheet-content">
				<Sheet.Header>
					<Sheet.Title>Destaques</Sheet.Title>
					<Sheet.Description>Todos os destaques salvos neste workspace.</Sheet.Description>
				</Sheet.Header>
				{#if allHighlightsLoading}
					<p class="highlights-sheet-status" role="status">Carregando destaques...</p>
				{:else}
					<HighlightsList
						highlights={allHighlights}
						{catalog}
						{storage}
						onNavigate={handleAllHighlightNavigate}
						onRemoved={handleAllHighlightRemoved}
					/>
				{/if}
			</Sheet.Content>
		</Sheet.Root>

		{#snippet selectorPanel()}
			{#if selectorMode === 'book'}
				<div class="selector-screen book-screen" data-selector-screen="book">
					<InputGroup.Root class="book-search-group">
						<InputGroup.Addon align="inline-start">
							<Search size={15} strokeWidth={1.8} aria-hidden="true" />
						</InputGroup.Addon>
						<InputGroup.Input
							type="search"
							bind:value={bookSearchTerm}
							bind:ref={bookSearchInput}
							placeholder="Buscar livro..."
							aria-label="Pesquisar livro ou capítulo"
							autocomplete="off"
						/>
						<InputGroup.Addon align="inline-end" class="book-search-end">
							{#if bookSearchTerm}
								<InputGroup.Button
									type="button"
									size="icon-xs"
									aria-label="Limpar pesquisa de livros"
									onclick={() => (bookSearchTerm = '')}
								>
									<X size={14} strokeWidth={1.8} aria-hidden="true" />
								</InputGroup.Button>
							{/if}
							{@render versionDropdownMenu()}
						</InputGroup.Addon>
					</InputGroup.Root>
					<div class="selector-scroll">
						{#if bookGroups.length > 0}
							{#each bookGroups as group (group.label)}
								<section class="book-section" aria-labelledby={`book-group-${group.id}`}>
									<h2 id={`book-group-${group.id}`}>{group.label}</h2>
									<div class="book-grid">
										{#each group.books as book (book.id)}
											<button
												class:selected={book.id === selectorBookId}
												class="book-option"
												type="button"
												onclick={() => selectBook(book.id)}
												aria-current={book.id === selectorBookId ? 'true' : undefined}
											>
												<span class="book-option-copy">
													<strong>{book.name}</strong>
													<small>{book.abbreviation || 'Livro'}</small>
												</span>
												<ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
											</button>
										{/each}
									</div>
								</section>
							{/each}
						{:else}
							<p class="selector-empty">Nenhum livro encontrado.</p>
						{/if}
					</div>
				</div>
			{:else if selectorMode === 'chapter'}
				<div class="selector-screen chapter-screen" data-selector-screen="chapter">
					<div class="selector-topline">
						<button class="selector-back" type="button" onclick={() => openSelector('book')}>
							<ArrowLeft size={13} strokeWidth={1.8} aria-hidden="true" />
							Voltar para Livros
						</button>
						<p>Selecionado: <strong>{selectorBook?.name ?? selectedBook.name}</strong></p>
					</div>
					<div class="chapter-heading">
						<h2>Selecione o capítulo</h2>
					</div>
					<div
						class="chapter-grid"
						role="group"
						aria-label={`Capítulos de ${selectorBook?.name ?? selectedBook.name}`}
					>
						{#each selectorBook?.chapters ?? [] as chapter (chapter)}
							<button
								class:selected={chapter === selectorChapter}
								class="chapter-option"
								type="button"
								onclick={() => selectChapter(chapter)}
								aria-current={chapter === selectorChapter ? 'true' : undefined}
							>
								{chapter}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="selector-screen version-screen" data-selector-screen="version">
					<div class="version-list" role="listbox" aria-label="Versões disponíveis">
						{#each usableVersions as version (version.id)}
							<button
								class:selected={version.id === selectedVersionId}
								class="version-option"
								type="button"
								role="option"
								aria-selected={version.id === selectedVersionId}
								onclick={() => selectVersion(version.id)}
								title={version.name}
							>
								<span class="version-option-badge">{displayVersionAbbreviation(version)}</span>
								<span class="version-option-copy">
									<strong>{version.name}</strong>
									<small>{version.fileName}</small>
								</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/snippet}

		{#if isMobile.current}
			<Sheet.Root bind:open={selectorOpen}>
				<Sheet.Content
					id="bible-selector"
					side="bottom"
					class="selector-drawer-content"
					data-selector-mode={selectorMode}
					aria-labelledby="bible-selector-title"
				>
					<Sheet.Header class="selector-shell-header">
						<Sheet.Title id="bible-selector-title">{selectorTitle(selectorMode)}</Sheet.Title>
						<Sheet.Description>
							{#if selectorMode === 'chapter' && (selectorBook ?? selectedBook)}
								{selectorBook?.name ?? selectedBook?.name}
							{:else if selectorMode === 'version'}
								Escolha a tradução que deseja ler.
							{:else}
								Pesquise ou escolha um livro para continuar.
							{/if}
						</Sheet.Description>
					</Sheet.Header>
					{@render selectorPanel()}
				</Sheet.Content>
			</Sheet.Root>
		{:else}
			<Dialog.Root bind:open={selectorOpen}>
				<Dialog.Content
					id="bible-selector"
					class="selector-dialog-content"
					data-selector-mode={selectorMode}
					aria-labelledby="bible-selector-title"
				>
					<div class="selector-shell-header">
						<Dialog.Title id="bible-selector-title">{selectorTitle(selectorMode)}</Dialog.Title>
						<Dialog.Description>
							{#if selectorMode === 'chapter' && (selectorBook ?? selectedBook)}
								{selectorBook?.name ?? selectedBook?.name}
							{:else if selectorMode === 'version'}
								Escolha a tradução que deseja ler.
							{:else}
								Pesquise ou escolha um livro para continuar.
							{/if}
						</Dialog.Description>
					</div>
					{@render selectorPanel()}
				</Dialog.Content>
			</Dialog.Root>
		{/if}

		{#if catalog && catalog.diagnostics.length > 0}
			<section class="diagnostic" aria-live="polite">
				<strong>Alguns arquivos não puderam ser lidos.</strong>
				<ul>
					{#each catalog.diagnostics as diagnostic (diagnostic.fileName)}
						<li><span>{diagnostic.fileName}</span>: {diagnostic.message}</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if searchResults}
			<section class="search-results" aria-labelledby="search-results-heading">
				<div class="section-heading">
					<h2 id="search-results-heading">Resultados da busca</h2>
					<p>{searchMessage}</p>
				</div>
				{#if searchResults.length > 0}
					<ul>
						{#each searchResults as result (`${result.bookId}-${result.chapter}-${result.verse}`)}
							<li>
								<button
									type="button"
									onclick={() =>
										chooseSelection(
											selectionFor(selectedVersion.id, result.bookId, result.chapter)
										)}
								>
									<strong>{result.bookName} {result.chapter}:{result.verse}</strong>
									<span>{result.text}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{:else if searchMessage}
			<p class="inline-message" role="status">{searchMessage}</p>
		{/if}

		{#if highlightError}
			<p class="highlight-error" role="alert">{highlightError}</p>
		{/if}

		<BibleNoteSplit
			note={splitNote}
			listNotes={splitNoteList}
			{storage}
			toolbar={desktopSplitActive ? readerToolbar : null}
			onClose={closeSplitPanel}
			onBackToList={backToVerseNoteList}
			onSaved={(note) => (splitNote = note)}
			onSelectListNote={handleListNoteSelected}
		>
			<main class="reading-column" aria-labelledby="chapter-heading">
				<h2 id="chapter-heading" class="sr-only">{selectedBook.name} {selectedChapter}</h2>
				{#if chapterLoading}
					<p class="chapter-status" role="status">Carregando capítulo...</p>
				{:else if chapterError}
					<div class="chapter-error" role="alert">
						<p>Não foi possível ler este capítulo.</p>
						<button
							class="button secondary"
							type="button"
							onclick={() =>
								loadChapter({
									versionId: selectedVersion.id,
									bookId: selectedBook.id,
									chapter: selectedChapter ?? 1
								})}
						>
							Tentar novamente
						</button>
					</div>
				{:else if verses.length === 0}
					<p class="chapter-status" role="status">
						Este capítulo não possui versículos disponíveis.
					</p>
				{:else}
					<ol class="verse-list">
						{#each verses as verse (verse.number)}
							{@const covering = highlightsCoveringVerse(highlights, verse.number)}
							{@const selected = verseSelection
								? rangeCoversVerse(verseSelection, verse.number)
								: false}
							{@const hasUnderline = covering.some(
								(highlight) => readerHighlightStyle(highlight.styleId)?.kind === 'underline'
							)}
							{@const hasWavy = covering.some(
								(highlight) => readerHighlightStyle(highlight.styleId)?.kind === 'wavy'
							)}
							<li>
								<div class="verse-row" data-selected={selected ? 'true' : undefined}>
									<span class="verse-number-cell">
										<span class="verse-number" aria-label={`Versículo ${verse.number}`}
											>{verse.number}</span
										>
										{#if noteIndicatorVerses.includes(verse.number)}
											{@const noteBadge = noteBadgeForVerse(verse.number)}
											<button
												type="button"
												class="verse-note-button"
												aria-label="Abrir nota"
												title="Abrir nota"
												onclick={(event) =>
													void handleNoteIconClick(
														verse.number,
														event.currentTarget as HTMLElement
													)}
											>
												<StickyNote size={12} strokeWidth={1.8} aria-hidden="true" />
												{#if noteBadge}
													<span class="verse-note-badge" aria-hidden="true">{noteBadge}</span>
												{/if}
											</button>
										{/if}
									</span>
									<button
										type="button"
										class="verse-content"
										data-verse-row={verse.number}
										aria-pressed={selected}
										onclick={(event) => selectVerse(verse.number, event)}
										onpointerdown={(event) => handleVersePointerDown(verse.number, event)}
										onpointermove={handleVersePointerMove}
										onpointerup={handleVersePointerUp}
										onpointercancel={handleVersePointerCancel}
										onkeydown={handleVerseKeydown}
									>
										<span class="verse-body">
											<span class="verse-marks" aria-hidden="true">
												{#each covering as highlight (`${highlight.verseStart}-${highlight.verseEnd}`)}
													<span
														class="verse-mark"
														data-style-id={highlight.styleId}
														data-kind={readerHighlightStyle(highlight.styleId)?.kind}
													></span>
												{/each}
											</span>
											<span
												class="verse-text"
												data-underline={hasUnderline ? 'true' : undefined}
												data-wavy={hasWavy ? 'true' : undefined}>{verse.text}</span
											>
											{#if covering.length > 0}
												<span class="sr-only">Destacado: {verseMarkLabel(covering)}</span>
											{/if}
										</span>
									</button>
								</div>
							</li>
						{/each}
					</ol>
				{/if}
			</main>
		</BibleNoteSplit>

		{#if isMobile.current}
			<SelectionActionBar
				open={popoverOpen}
				referenceLabel={selectionReference}
				{activeStyleId}
				errorMessage={popoverError}
				busy={popoverBusy}
				onApplyStyle={(styleId) => void applyStyle(styleId)}
				onErase={() => void eraseStyle()}
				onCopyReference={copyReference}
				onCopyText={copyTextAndReference}
				onCreateNote={() => void createNoteFromSelection()}
				onClose={closePopover}
			/>
		{:else}
			<SelectionActionPopover
				open={popoverOpen}
				anchor={popoverAnchor}
				referenceLabel={selectionReference}
				{activeStyleId}
				errorMessage={popoverError}
				busy={popoverBusy}
				onApplyStyle={(styleId) => void applyStyle(styleId)}
				onErase={() => void eraseStyle()}
				onCopyReference={copyReference}
				onCopyText={copyTextAndReference}
				onCreateNote={() => void createNoteFromSelection()}
				onClose={closePopover}
			/>
		{/if}

		<VerseNoteSelector
			open={verseNoteSelectorOpen}
			anchor={verseNoteSelectorAnchor}
			mobile={isMobile.current}
			summaries={verseNoteSelectorSummaries}
			loading={verseNoteSelectorLoading}
			errorMessage={verseNoteSelectorError}
			onSelectNote={(summary) => void openNoteFromSummary(summary)}
			onViewAll={() => void openAllNotesForVerse()}
			onClose={closeVerseNoteSelector}
		/>
	{:else}
		<section class="state-panel" aria-live="polite">
			<h2>Nenhum capítulo disponível</h2>
			<a class="text-action" href={resolve('/')}>Voltar ao início</a>
		</section>
	{/if}
</div>

<style>
	.reader-page {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-height: 100%;
		max-width: none;
		margin: 0;
		padding: 8px clamp(20px, 5vw, 64px) 80px;
	}

	.reader-page.with-note {
		box-sizing: border-box;
		min-height: 0;
		height: 100%;
		flex: 1;
		padding-bottom: 0;
		overflow: hidden;
	}

	@media (min-width: 768px) {
		.reader-page.with-note {
			padding-left: 20px;
		}
	}

	.text-action:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.state-label,
	.section-heading p {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.state-panel {
		max-width: 700px;
		margin-top: 54px;
		border-block: 1px solid var(--border);
		padding: 26px 0;
	}

	:global(.bible-empty) {
		max-width: 560px;
		min-height: min(56dvh, 420px);
		margin: 0 auto;
		border: 0;
		background: transparent;
	}

	.bible-empty-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	:global(.bible-empty-actions) {
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		max-width: none;
	}

	:global(.bible-empty-actions > .text-action) {
		flex-basis: 100%;
		margin-top: 0;
		justify-content: center;
		text-align: center;
	}

	:global(.bible-import-dialog) {
		width: min(calc(100% - 32px), 560px);
		max-width: 560px;
		max-height: min(80dvh, 640px);
		overflow-y: auto;
	}

	.import-dialog-head {
		display: grid;
		gap: 6px;
		margin-bottom: 16px;
	}

	.import-dialog-head code {
		font-family: var(--font-mono);
		font-size: 0.86em;
	}

	@media (max-width: 560px) {
		:global(.bible-empty-actions) {
			flex-direction: column;
			align-items: stretch;
		}

		:global(.bible-empty-actions > .button) {
			width: 100%;
			min-height: 42px;
		}

		:global(.bible-empty-actions > .text-action) {
			flex-basis: auto;
			text-align: center;
		}
	}

	.state-panel h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.025em;
	}

	.state-panel p:not(.state-label) {
		max-width: 560px;
		margin: 10px 0 0;
		color: var(--muted-foreground);
		line-height: 1.6;
	}

	.state-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		margin-top: 20px;
	}

	.text-action {
		display: inline-flex;
		margin-top: 20px;
		color: var(--primary);
		font-size: 0.8rem;
		font-weight: 500;
		text-decoration: none;
	}

	.state-actions .text-action {
		margin-top: 0;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		min-height: 34px;
		border: 1px solid transparent;
		border-radius: 8px;
		padding: 7px 11px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
	}

	.button.primary {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.button.secondary {
		border-color: var(--border);
		background: transparent;
		color: var(--foreground);
	}

	.button:hover:not(:disabled) {
		opacity: 0.8;
	}

	.button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.loading-lines {
		display: grid;
		gap: 11px;
		max-width: 460px;
		margin-top: 22px;
	}

	.loading-lines span {
		display: block;
		height: 11px;
		border-radius: 5px;
		background: var(--muted);
	}

	.loading-lines span:nth-child(2) {
		width: 82%;
	}
	.loading-lines span:nth-child(3) {
		width: 64%;
	}

	.reader-toolbar {
		position: sticky;
		top: calc(-1 * var(--shell-header-height, 48px));
		z-index: 25;
		display: flex;
		order: -1;
		justify-content: center;
		margin-top: 0;
		padding: 6px 0 8px;
		background: var(--background);
		transition:
			padding 220ms ease,
			opacity 220ms ease;
	}

	.reader-toolbar.toolbar-hidden {
		padding-block: 0;
		opacity: 0;
		pointer-events: none;
	}

	.toolbar-shell {
		display: flex;
		width: fit-content;
		max-width: 100%;
		transform: translateY(0);
		transition: transform 220ms ease;
	}

	.reader-toolbar.toolbar-hidden .toolbar-shell {
		transform: translateY(calc(-100% - 12px));
	}

	.reader-page.with-note .reader-toolbar {
		position: static;
	}

	:global(.reader-toolbar-group) {
		display: inline-flex;
		width: auto;
		min-width: 0;
		max-width: 100%;
		flex-wrap: nowrap;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: color-mix(in oklch, var(--foreground) 7%, var(--background));
		padding: 2px;
		overflow: hidden;
	}

	.toolbar-choice {
		display: inline-flex;
		min-width: 0;
		min-height: 26px;
		align-items: center;
		justify-content: center;
		gap: 3px;
		border: 0;
		border-radius: 9999px;
		background: transparent;
		padding: 3px 7px;
		color: var(--foreground);
		font: inherit;
		font-size: 0.76rem;
		font-weight: 500;
		line-height: 1;
		cursor: pointer;
	}

	.toolbar-choice:hover {
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
	}

	.toolbar-choice:focus-visible,
	.search-results button:focus-visible,
	.book-option:focus-visible,
	.chapter-option:focus-visible,
	.version-option:focus-visible,
	.selector-back:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	.toolbar-choice span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.choice-chevron) {
		flex-shrink: 0;
		color: var(--muted-foreground);
		opacity: 0.72;
	}

	.book-choice {
		min-width: 88px;
		max-width: 160px;
	}

	.chapter-choice {
		min-width: 52px;
	}

	.version-choice {
		min-width: 52px;
		padding-inline: 8px;
		font-weight: 600;
	}

	.version-label {
		max-width: 64px;
	}

	:global(.dark .reader-toolbar-group) {
		background: #171717;
		border-color: #292929;
	}

	:global(.toolbar-nav-button),
	:global(.toolbar-search-button),
	:global(.toolbar-highlights-button) {
		flex: 0 0 auto;
		border-radius: 9999px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.selector-shell-header {
		padding: 0 2px 2px;
	}

	:global(.selector-shell-header [data-slot='dialog-title']),
	:global(.selector-shell-header [data-slot='sheet-title']) {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.25;
	}

	:global(.selector-shell-header [data-slot='dialog-description']),
	:global(.selector-shell-header [data-slot='sheet-description']) {
		margin: 4px 0 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		line-height: 1.45;
	}

	.selector-screen {
		min-width: 0;
	}

	.book-screen {
		display: flex;
		min-height: 0;
		flex-direction: column;
	}

	:global(.book-search-group) {
		min-height: 34px;
		border-radius: 10px;
		background: color-mix(in oklch, var(--foreground) 5%, var(--background));
	}

	:global(
		.book-search-group:has([data-slot='input-group-control']:focus-visible),
		.book-search-group:has([data-slot='input-group-control']:focus)
	) {
		border-color: var(--border);
		box-shadow: none;
		outline: none;
		--tw-ring-shadow: 0 0 #0000;
		--tw-ring-offset-shadow: 0 0 #0000;
	}

	:global(.book-search-group [data-slot='input-group-control']) {
		min-width: 0;
	}

	:global(.book-search-group [data-slot='input-group-control']:focus-visible) {
		outline: none;
		box-shadow: none;
		--tw-ring-shadow: 0 0 #0000;
		--tw-ring-offset-shadow: 0 0 #0000;
	}

	:global(.book-search-end) {
		gap: 2px;
		padding-inline: 4px 2px;
	}

	:global(.version-dropdown-trigger) {
		min-width: 52px;
		gap: 3px;
		padding-inline: 7px 6px !important;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.version-trigger-label {
		min-width: 0;
		max-width: 44px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.version-dropdown-content) {
		min-width: 220px;
	}

	.version-menu-item {
		display: grid;
		gap: 1px;
		min-width: 0;
	}

	.version-menu-abbr {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.version-menu-name {
		overflow: hidden;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.selector-scroll {
		min-height: 0;
		max-height: min(46dvh, 360px);
		margin-top: 16px;
		overflow-y: auto;
		overflow-x: clip;
		padding: 0 2px 2px;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.selector-scroll::-webkit-scrollbar,
	.chapter-screen::-webkit-scrollbar,
	.version-screen::-webkit-scrollbar {
		display: none;
	}

	.book-section + .book-section {
		margin-top: 20px;
	}

	.book-section h2,
	.chapter-heading h2 {
		margin: 0 0 9px;
		color: var(--muted-foreground);
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.book-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.book-option {
		display: flex;
		min-width: 0;
		min-height: 49px;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
		border: 1px solid color-mix(in oklch, var(--foreground) 12%, var(--background));
		border-radius: 11px;
		background: transparent;
		padding: 10px 11px;
		color: var(--foreground);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.book-option:hover {
		border-color: color-mix(in oklch, var(--foreground) 28%, var(--background));
		background: color-mix(in oklch, var(--foreground) 5%, transparent);
	}

	.book-option.selected,
	.chapter-option.selected,
	.version-option.selected {
		border-color: var(--foreground);
		background: var(--foreground);
		color: var(--background);
	}

	.book-option-copy {
		display: grid;
		min-width: 0;
		gap: 2px;
	}

	.book-option strong {
		overflow-wrap: anywhere;
		font-size: 0.78rem;
		font-weight: 550;
		line-height: 1.25;
	}

	.book-option small {
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.56rem;
		text-transform: uppercase;
	}

	.book-option.selected small,
	.book-option.selected :global(svg) {
		color: color-mix(in oklch, var(--background) 65%, transparent);
	}

	.selector-empty {
		margin: 20px 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
	}

	.chapter-screen,
	.version-screen {
		max-height: min(52dvh, 380px);
		overflow-y: auto;
		overflow-x: clip;
		padding-top: 1px;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.selector-topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding-bottom: 13px;
	}

	.selector-topline p {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.68rem;
		white-space: nowrap;
	}

	.selector-topline strong {
		margin-left: 4px;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 4px 7px;
		color: var(--foreground);
		font-size: 0.68rem;
		font-weight: 550;
	}

	.selector-back {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		border: 0;
		border-radius: 6px;
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
		padding: 5px 7px;
		color: var(--foreground);
		font: inherit;
		font-size: 0.68rem;
		cursor: pointer;
	}

	.selector-back:hover {
		background: color-mix(in oklch, var(--foreground) 12%, transparent);
	}

	.chapter-heading {
		margin-top: 20px;
	}

	.chapter-grid {
		display: grid;
		grid-template-columns: repeat(10, minmax(0, 1fr));
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 15px;
	}

	.chapter-option {
		min-height: 63px;
		border: 0;
		border-right: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		background: transparent;
		padding: 10px 4px;
		color: var(--foreground);
		font: inherit;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.chapter-option:nth-child(10n) {
		border-right: 0;
	}

	.chapter-option:nth-last-child(-n + 10) {
		border-bottom: 0;
	}

	.chapter-option:hover {
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
	}

	.chapter-option.selected:hover {
		background: var(--foreground);
	}

	.version-list {
		display: grid;
		gap: 6px;
		margin-top: 0;
	}

	.version-option {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 10px;
		min-width: 0;
		min-height: 44px;
		border: 1px solid color-mix(in oklch, var(--foreground) 12%, var(--background));
		border-radius: 11px;
		background: transparent;
		padding: 10px 12px;
		color: var(--foreground);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.version-option:hover {
		border-color: color-mix(in oklch, var(--foreground) 28%, var(--background));
		background: color-mix(in oklch, var(--foreground) 5%, transparent);
	}

	.version-option.selected {
		border-color: var(--foreground);
		background: var(--foreground);
		color: var(--background);
	}

	.version-option-badge {
		display: inline-flex;
		min-width: 42px;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border);
		border-radius: 7px;
		padding: 4px 6px;
		font-family: var(--font-mono);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.version-option-copy {
		display: grid;
		min-width: 0;
		gap: 2px;
	}

	.version-option-copy strong {
		overflow: hidden;
		font-size: 0.8rem;
		font-weight: 550;
		line-height: 1.25;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.version-option-copy small {
		overflow: hidden;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.version-option.selected .version-option-badge {
		border-color: color-mix(in oklch, var(--background) 35%, transparent);
		color: var(--background);
	}

	.version-option.selected .version-option-copy small {
		color: color-mix(in oklch, var(--background) 65%, transparent);
	}

	:global(.selector-dialog-content) {
		width: min(calc(100% - 32px), 560px);
		max-width: 560px;
		max-height: min(68dvh, 480px);
		border-radius: 14px;
		background: var(--background);
		padding: 14px;
	}

	:global(.selector-dialog-content[data-selector-mode='version']) {
		width: min(calc(100% - 32px), 480px);
		max-height: min(62dvh, 420px);
	}

	:global(.dark .selector-dialog-content) {
		border-color: #292929;
		background: #090909;
	}

	:global(.selector-drawer-content) {
		max-height: min(62dvh, 480px);
		border-radius: 16px 16px 0 0;
		border-color: var(--border);
		background: var(--background);
		padding: 14px 14px calc(16px + env(safe-area-inset-bottom));
	}

	:global(.dark .selector-drawer-content) {
		border-color: #292929;
		background: #090909;
	}

	:global([data-slot='dialog-overlay']),
	:global([data-slot='sheet-overlay']) {
		background: color-mix(in oklch, var(--background) 35%, transparent);
	}

	.search-panel-form {
		display: grid;
		gap: 8px;
		margin-top: 24px;
	}

	.search-panel-form > label {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.search-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 8px;
	}

	.search-panel-message {
		margin: 2px 0 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
	}

	:global(.search-dialog-content) {
		width: min(100% - 32px, 560px);
	}

	:global(.search-drawer-content) {
		max-height: min(560px, calc(100dvh - 24px));
		padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
		border-color: var(--border);
		background: var(--background);
	}

	:global(.dark .search-drawer-content) {
		border-color: #292929;
		background: #090909;
	}

	:global(.search-panel-header) {
		padding: 0;
	}

	.diagnostic,
	.search-results,
	.inline-message,
	.chapter-error {
		margin-top: 28px;
		border-top: 1px solid var(--border);
		padding-top: 18px;
	}

	.diagnostic {
		max-width: 760px;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.diagnostic strong {
		color: var(--foreground);
		font-weight: 600;
	}

	.diagnostic ul {
		margin: 10px 0 0;
		padding-left: 18px;
	}

	.diagnostic li + li {
		margin-top: 5px;
	}

	.diagnostic li span,
	.verse-number {
		font-family: var(--font-mono);
	}

	.search-results {
		max-width: 760px;
	}

	.section-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px 16px;
	}

	.section-heading h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.search-results ul {
		margin: 16px 0 0;
		padding: 0;
		list-style: none;
	}

	.search-results li + li {
		border-top: 1px solid var(--border);
	}

	.search-results button {
		display: grid;
		width: 100%;
		gap: 4px;
		border: 0;
		background: transparent;
		padding: 12px 0;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.search-results button:hover strong,
	.search-results button:focus-visible strong {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.search-results strong {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.search-results span {
		overflow: hidden;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.inline-message,
	.chapter-status {
		color: var(--muted-foreground);
		font-size: 0.8rem;
	}

	.reading-column {
		max-width: 700px;
		margin: 24px auto 0;
	}

	.verse-list {
		/* Tintas discretas: o texto continua legível porque a camada fica atrás dele. */
		--pen-gold: #d9a441;
		--pen-mint: #4f9d69;
		--pen-sky: #4f83c2;
		--pen-rose: #c4657f;
		--pen-lilac: #8d7bc4;
		--pen-alpha: 32%;
		--ink-stroke: color-mix(in oklch, var(--foreground) 55%, transparent);

		margin: 0;
		padding: 20px 0 0;
		list-style: none;
	}

	:global(.dark) .verse-list {
		--pen-alpha: 42%;
	}

	.verse-list li + li {
		margin-top: 16px;
	}

	.verse-row {
		display: grid;
		width: calc(100% + 12px);
		grid-template-columns: 36px minmax(0, 1fr);
		gap: 12px;
		align-items: start;
		margin-inline: -6px;
	}

	.verse-content {
		display: block;
		width: 100%;
		border: 0;
		border-radius: 8px;
		background: transparent;
		padding: 2px 6px;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		touch-action: pan-y;
		user-select: none;
	}

	.verse-row[data-selected='true'] .verse-content {
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
	}

	.verse-content:hover {
		background: color-mix(in oklch, var(--foreground) 4%, transparent);
	}

	.verse-row[data-selected='true'] .verse-content:hover {
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
	}

	.verse-content:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	.verse-number-cell {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		padding-top: 2px;
	}

	.verse-number {
		color: var(--muted-foreground);
		font-size: 0.7rem;
		text-align: right;
	}

	.verse-note-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 4px;
		background: transparent;
		padding: 1px;
		color: var(--muted-foreground);
		cursor: pointer;
	}

	.verse-note-badge {
		position: absolute;
		top: -4px;
		right: -6px;
		min-width: 12px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--background);
		padding: 0 3px;
		color: var(--foreground);
		font-family: var(--font-mono);
		font-size: 0.5rem;
		font-weight: 600;
		line-height: 1.3;
		text-align: center;
	}

	.verse-note-button:hover {
		color: var(--foreground);
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
	}

	.verse-note-button:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	:global(.highlights-sheet-content) {
		width: min(100%, 420px);
		max-width: 420px;
		padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
		border-color: var(--border);
		background: var(--background);
	}

	:global(.dark .highlights-sheet-content) {
		border-color: #292929;
		background: #090909;
	}

	.highlights-sheet-status {
		margin: 16px 0 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
	}

	.verse-body {
		position: relative;
		display: block;
		min-width: 0;
	}

	.verse-marks,
	.verse-mark {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.verse-text {
		position: relative;
		z-index: 1;
		display: block;
		min-width: 0;
		font-size: 1.05rem;
		line-height: 1.75;
		overflow-wrap: anywhere;
	}

	.verse-text[data-underline='true'] {
		text-decoration-line: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 0.22em;
		text-decoration-color: var(--ink-stroke);
	}

	.verse-text[data-wavy='true'] {
		text-decoration-line: underline;
		text-decoration-style: wavy;
		text-decoration-thickness: 1.5px;
		text-underline-offset: 0.2em;
		text-decoration-color: var(--ink-stroke);
	}

	.verse-mark[data-kind='pen'] {
		inset: -2px -4px;
		border-radius: 4px;
	}

	.verse-mark[data-style-id='pen-gold'] {
		background: color-mix(in oklch, var(--pen-gold) var(--pen-alpha), transparent);
	}
	.verse-mark[data-style-id='pen-mint'] {
		background: color-mix(in oklch, var(--pen-mint) var(--pen-alpha), transparent);
	}
	.verse-mark[data-style-id='pen-sky'] {
		background: color-mix(in oklch, var(--pen-sky) var(--pen-alpha), transparent);
	}
	.verse-mark[data-style-id='pen-rose'] {
		background: color-mix(in oklch, var(--pen-rose) var(--pen-alpha), transparent);
	}
	.verse-mark[data-style-id='pen-lilac'] {
		background: color-mix(in oklch, var(--pen-lilac) var(--pen-alpha), transparent);
	}

	.verse-mark[data-kind='box'] {
		inset: -3px -5px;
		border-radius: 5px;
		outline: 1.5px solid var(--ink-stroke);
	}

	.highlight-error {
		margin: 20px 0 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
	}

	.chapter-error p {
		margin: 0 0 12px;
		color: var(--destructive);
	}

	.reader-fab {
		display: none;
	}

	@media (max-width: 700px) {
		.reader-fab.fab-hidden {
			display: none;
		}

		.reader-fab {
			position: fixed;
			right: 16px;
			bottom: calc(88px + env(safe-area-inset-bottom));
			z-index: 30;
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 12px;
		}

		.fab-main {
			display: flex;
			width: 48px;
			height: 48px;
			align-items: center;
			justify-content: center;
			border: 1px solid var(--border);
			border-radius: 999px;
			background: var(--primary);
			padding: 0;
			color: var(--primary-foreground);
			cursor: pointer;
		}

		.fab-actions {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 10px;
			opacity: 0;
			pointer-events: none;
			transform: translateY(8px) scale(0.96);
			transition:
				opacity 180ms ease,
				transform 180ms ease;
		}

		.fab-open .fab-actions {
			opacity: 1;
			pointer-events: auto;
			transform: none;
		}

		.fab-action {
			display: flex;
			align-items: center;
			gap: 8px;
			border: 0;
			background: transparent;
			padding: 0;
			color: var(--foreground);
			font: inherit;
			font-size: 0.78rem;
			font-weight: 500;
			cursor: pointer;
		}

		.fab-label {
			border: 1px solid var(--border);
			border-radius: 999px;
			background: var(--background);
			padding: 4px 10px;
			line-height: 1.2;
			white-space: nowrap;
		}

		.fab-circle {
			display: flex;
			width: 40px;
			height: 40px;
			align-items: center;
			justify-content: center;
			border: 1px solid var(--border);
			border-radius: 999px;
			background: var(--background);
		}
	}

	@media (max-width: 700px) {
		.reader-page {
			padding-top: 14px;
			padding-inline: 0;
		}

		.reading-column {
			padding-bottom: 120px;
		}

		.verse-row {
			width: 100%;
			margin-inline: 0;
		}

		.verse-list {
			padding-right: 16px;
		}

		.reader-toolbar {
			width: 100%;
			padding-inline: 16px;
		}

		.toolbar-shell {
			justify-content: center;
			min-width: min(290px, 100%);
		}

		:global(.reader-toolbar-group) {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto auto auto;
			grid-template-areas: 'prev book chapter version next';
			gap: 2px 4px;
			width: 100%;
			border-radius: 16px;
			padding: 4px;
		}

		:global(.reader-toolbar-group > :nth-child(1)) {
			grid-area: prev;
		}

		:global(.reader-toolbar-group > :nth-child(5)) {
			grid-area: next;
		}

		:global(.reader-toolbar-group > .book-choice) {
			grid-area: book;
			min-width: 0;
		}

		:global(.reader-toolbar-group > .chapter-choice) {
			grid-area: chapter;
		}

		:global(.reader-toolbar-group > .version-choice) {
			grid-area: version;
		}

		:global(.reader-toolbar-group > .toolbar-search-button),
		:global(.reader-toolbar-group > .toolbar-highlights-button) {
			display: none;
		}

		.toolbar-choice {
			padding-inline: 5px;
			font-size: 0.72rem;
		}

		.book-choice {
			flex: 1 1 auto;
			min-width: 0;
			max-width: none;
		}

		.chapter-choice {
			flex: 0 0 auto;
			min-width: 40px;
		}

		.version-choice {
			flex: 0 0 auto;
			min-width: 44px;
		}

		.version-label {
			max-width: 44px;
		}

		:global(.choice-chevron) {
			display: none;
		}

		:global(.selector-dialog-content) {
			width: calc(100% - 24px);
			max-height: calc(100dvh - 24px);
			padding: 12px;
		}

		:global(.selector-drawer-content) {
			max-height: calc(100dvh - 8px);
			padding-inline: 14px;
		}

		.selector-scroll {
			max-height: calc(100dvh - 190px);
		}

		.book-grid {
			grid-template-columns: 1fr;
		}

		.selector-topline {
			align-items: flex-start;
			flex-direction: column;
		}

		.chapter-screen,
		.version-screen {
			display: flex;
			min-height: 0;
			flex: 1;
			flex-direction: column;
			max-height: none;
			overflow-y: auto;
		}

		.chapter-grid {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}

		.chapter-option:nth-child(10n) {
			border-right: 1px solid var(--border);
		}

		.chapter-option:nth-child(5n) {
			border-right: 0;
		}

		.chapter-option:nth-last-child(-n + 10) {
			border-bottom: 1px solid var(--border);
		}

		.chapter-option:nth-last-child(-n + 5) {
			border-bottom: 0;
		}
	}

	@media (max-width: 767px) {
		.reader-toolbar {
			top: 0;
		}
	}

	@media (max-width: 380px) {
		:global(.reader-toolbar-group) {
			padding: 2px;
		}

		.toolbar-choice {
			padding-inline: 4px;
		}

		.chapter-choice {
			min-width: 34px;
		}

		.version-choice {
			min-width: 38px;
		}

		.version-label {
			max-width: 38px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reader-toolbar,
		.toolbar-shell,
		.fab-actions {
			transition: none;
		}

		:global([data-slot='dialog-content']),
		:global([data-slot='sheet-content']) {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
