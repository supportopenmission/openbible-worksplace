<script lang="ts">
	import { ArrowLeft, ArrowRight, ChevronDown, Plus, RefreshCw, Search, X } from '@lucide/svelte';
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
	type SelectorMode = 'book' | 'chapter' | 'version';
	let selectorMode = $state<SelectorMode>('book');
	let selectorOpen = $state(false);
	let bookSearchTerm = $state('');
	let bookSearchInput = $state<HTMLInputElement | null>(null);
	let selectorBookId = $state<number | null>(null);
	let selectorChapter = $state<number | null>(null);
	const isMobile = new IsMobile();
	let loadToken = 0;
	let toolbarVisible = $state(true);
	let scrollBlockers = $state({ selector: false, search: false });
	let lastScrollY = 0;

	const scrollDelta = 10;
	const scrollRevealTop = 48;

	$effect(() => {
		scrollBlockers = { selector: selectorOpen, search: searchOpen };
		if (selectorOpen || searchOpen) toolbarVisible = true;
	});

	$effect(() => {
		void selectedChapter;
		void selectedBookId;
		toolbarVisible = true;
	});

	onMount(() => {
		lastScrollY = window.scrollY;

		const onScroll = () => {
			if (scrollBlockers.selector || scrollBlockers.search) {
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

<div class="reader-page">
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
		<section class="state-panel" aria-live="polite">
			<p class="state-label">Nenhuma fonte disponível</p>
			<h2>Nenhuma Bíblia compatível encontrada</h2>
			<p>Importe um arquivo SQLite compatível com o padrão OpenLP para começar a leitura.</p>
			<div class="state-actions">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="button primary" href={resolve('/') + '?import=bible'}>Importar uma Bíblia</a>
				<a class="text-action" href={resolve('/')}>Voltar ao início</a>
			</div>
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
		</section>
	{:else if selectedVersion && selectedBook && selectedChapter !== null}
		<section class="reader-toolbar" class:toolbar-hidden={!toolbarVisible} aria-label="Controles do leitor">
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
				</ButtonGroup>
			</div>
		</section>

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
				<p class="chapter-status" role="status">Este capítulo não possui versículos disponíveis.</p>
			{:else}
				<ol class="verse-list">
					{#each verses as verse (verse.number)}
						<li>
							<span class="verse-number" aria-label={`Versículo ${verse.number}`}
								>{verse.number}</span
							>
							<p>{verse.text}</p>
						</li>
					{/each}
				</ol>
			{/if}
		</main>
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
		max-width: 1120px;
		margin: 0 auto;
		padding: 8px clamp(20px, 5vw, 64px) 80px;
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
		top: 0;
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
	:global(.toolbar-search-button) {
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
		margin: 0;
		padding: 20px 0 0;
		list-style: none;
	}

	.verse-list li {
		display: grid;
		grid-template-columns: 32px minmax(0, 1fr);
		gap: 12px;
		align-items: start;
	}

	.verse-list li + li {
		margin-top: 16px;
	}

	.verse-number {
		padding-top: 3px;
		color: var(--muted-foreground);
		font-size: 0.7rem;
		text-align: right;
	}

	.verse-list p {
		min-width: 0;
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.75;
		overflow-wrap: anywhere;
	}

	.chapter-error p {
		margin: 0 0 12px;
		color: var(--destructive);
	}

	@media (max-width: 700px) {
		.reader-page {
			padding-top: 14px;
		}

		.reader-toolbar {
			width: 100%;
		}

		.toolbar-shell {
			width: 100%;
		}

		:global(.reader-toolbar-group) {
			display: flex;
			width: 100%;
			border-radius: 12px;
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

	@media (max-width: 380px) {
		.reader-page {
			padding-inline: 16px;
		}

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
		.toolbar-shell {
			transition: none;
		}

		:global([data-slot='dialog-content']),
		:global([data-slot='sheet-content']) {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
