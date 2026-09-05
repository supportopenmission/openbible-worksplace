<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { ChevronDown, Search } from '@lucide/svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import {
		loadBibleCatalog,
		readBibleChapter,
		type BibleCatalog,
		type BibleVersion
	} from '$lib/features/bible/bible-reader';
	import { displayVersionAbbreviation } from '$lib/features/bible/version-label';
	import { readReaderPreference } from '$lib/features/bible/reader-preference';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import VerseBlockView from './VerseBlockView.svelte';
	import {
		confirmVerseSelection,
		formatVerseSnapshot,
		prefillFromReaderSelection,
		validateVerseRange,
		type VerseSelectionState
	} from './verse-selector';

	export type VerseSelectionResult = VerseSelectionState & { snapshot: string };

	let {
		open = $bindable(false),
		storage,
		onConfirm,
		onCancel
	}: {
		open?: boolean;
		storage: WorkspaceStorage;
		onConfirm: (selection: VerseSelectionResult) => void;
		onCancel?: () => void;
	} = $props();

	const workspace = getWorkspaceState();
	const isMobile = new IsMobile();

	let catalog = $state<BibleCatalog | null>(null);
	let catalogLoading = $state(false);
	let catalogError = $state('');
	let selection = $state<VerseSelectionState>({
		versionId: '',
		bookId: 0,
		book: '',
		chapter: 1,
		verseStart: 1,
		verseEnd: 1
	});
	let previewSnapshot = $state('');
	let previewLoading = $state(false);
	let previewError = $state('');
	let rangeError = $state('');
	let chapterDrawerOpen = $state(false);
	let bookDrawerOpen = $state(false);
	let versionDrawerOpen = $state(false);
	let bookSearch = $state('');
	let versionSearch = $state('');

	let versions = $derived(
		catalog?.versions.filter((version) => version.books.some((book) => book.chapters.length > 0)) ??
			[]
	);
	let selectedVersion = $derived(
		versions.find((version) => version.id === selection.versionId) ?? null
	);
	let selectedBook = $derived(
		selectedVersion?.books.find((book) => book.id === selection.bookId) ?? null
	);
	let chapterOptions = $derived(selectedBook?.chapters ?? []);
	let filteredBooks = $derived(
		(selectedVersion?.books ?? []).filter((book) =>
			book.name.toLocaleLowerCase('pt-BR').includes(bookSearch.trim().toLocaleLowerCase('pt-BR'))
		)
	);
	let filteredVersions = $derived(
		versions.filter((version) =>
			version.name
				.toLocaleLowerCase('pt-BR')
				.includes(versionSearch.trim().toLocaleLowerCase('pt-BR'))
		)
	);
	let chapterVerseCount = $state(1);
	let maxVerse = $derived(Math.max(1, chapterVerseCount));

	function applyPrefill(availableVersions: typeof versions) {
		const readerPref = readReaderPreference();
		const workspacePref = workspace?.preferences.readerSelection;
		const source = readerPref ?? workspacePref;
		if (!source) return;

		const prefilled = prefillFromReaderSelection(source);
		const version = availableVersions.find((item) => item.id === prefilled.versionId);
		const book = version?.books.find((item) => item.id === prefilled.bookId);
		selection = confirmVerseSelection(selection, {
			...prefilled,
			book: book?.name ?? prefilled.book ?? ''
		});
	}

	function handleVersionChange(versionId: string) {
		const version = versions.find((item) => item.id === versionId);
		const firstBook = version?.books[0];
		selection = confirmVerseSelection(selection, {
			versionId,
			bookId: firstBook?.id ?? 0,
			book: firstBook?.name ?? '',
			chapter: firstBook?.chapters[0] ?? 1,
			verseStart: 1,
			verseEnd: 1
		});
	}

	function handleBookChange(value: string) {
		const bookId = Number(value);
		const book = selectedVersion?.books.find((item) => item.id === bookId);
		selection = confirmVerseSelection(selection, {
			bookId,
			book: book?.name ?? '',
			chapter: book?.chapters[0] ?? 1,
			verseStart: 1,
			verseEnd: 1
		});
	}

	function handleChapterChange(value: string) {
		const chapter = Number(value);
		selection = confirmVerseSelection(selection, {
			chapter,
			verseStart: 1,
			verseEnd: 1
		});
	}

	function chooseChapter(chapter: number) {
		handleChapterChange(String(chapter));
		chapterDrawerOpen = false;
	}

	function chooseBook(bookId: number) {
		handleBookChange(String(bookId));
		bookSearch = '';
		bookDrawerOpen = false;
	}

	function chooseVersion(versionId: string) {
		handleVersionChange(versionId);
		versionSearch = '';
		versionDrawerOpen = false;
	}

	function handleVerseStartChange(event: Event) {
		const verseStart = Number((event.currentTarget as HTMLInputElement).value);
		selection = confirmVerseSelection(selection, {
			verseStart,
			verseEnd: Math.max(verseStart, selection.verseEnd)
		});
	}

	function handleVerseEndChange(event: Event) {
		const verseEnd = Number((event.currentTarget as HTMLInputElement).value);
		selection = confirmVerseSelection(selection, { verseEnd });
	}

	async function loadCatalog() {
		catalogLoading = true;
		catalogError = '';
		try {
			catalog = await loadBibleCatalog(storage);
			const loadedVersions =
				catalog.versions.filter((version) =>
					version.books.some((book) => book.chapters.length > 0)
				) ?? [];
			applyPrefill(loadedVersions);
			if (!selection.versionId && loadedVersions.length > 0) {
				const first = loadedVersions[0];
				const firstBook = first.books[0];
				selection = confirmVerseSelection(selection, {
					versionId: first.id,
					bookId: firstBook?.id ?? 0,
					book: firstBook?.name ?? '',
					chapter: firstBook?.chapters[0] ?? 1,
					verseStart: 1,
					verseEnd: 1
				});
			}
		} catch (error) {
			catalogError =
				error instanceof Error ? error.message : 'Não foi possível carregar as versões bíblicas.';
		} finally {
			catalogLoading = false;
		}
	}

	async function loadPreview(version: BibleVersion) {
		if (!selectedBook) {
			previewSnapshot = '';
			return;
		}

		previewLoading = true;
		previewError = '';
		try {
			const verses = await readBibleChapter(version, selection.bookId, selection.chapter);
			chapterVerseCount = verses.length > 0 ? verses[verses.length - 1].number : 1;
			const filtered = verses.filter(
				(verse) => verse.number >= selection.verseStart && verse.number <= selection.verseEnd
			);
			previewSnapshot = formatVerseSnapshot(filtered);
		} catch (error) {
			previewSnapshot = '';
			previewError =
				error instanceof Error
					? error.message
					: 'Não foi possível carregar o preview do versículo.';
		} finally {
			previewLoading = false;
		}
	}

	$effect(() => {
		if (!open || !selectedVersion || !selectedBook) return;
		void loadPreview(selectedVersion);
	});

	$effect(() => {
		if (open && !catalog && !catalogLoading) {
			void loadCatalog();
		}
	});

	onMount(() => {
		if (open) void loadCatalog();
	});

	function handleCancel() {
		open = false;
		onCancel?.();
	}

	function handleConfirm() {
		rangeError = '';
		if (!validateVerseRange(selection)) {
			rangeError = 'Informe um intervalo de versículos válido no mesmo capítulo.';
			return;
		}
		if (!previewSnapshot.trim()) {
			rangeError = 'Não há texto disponível para o intervalo selecionado.';
			return;
		}

		onConfirm({
			...selection,
			book: selection.book ?? selectedBook?.name ?? '',
			version: selectedVersion
				? displayVersionAbbreviation(selectedVersion)
				: (selection.version ?? ''),
			snapshot: previewSnapshot
		});
		open = false;
	}
</script>

{#snippet selectorBody()}
	<div class="selector-form">
		{#if catalogLoading}
			<p class="status-message" role="status">Carregando versões…</p>
		{:else if catalogError}
			<p class="status-message error" role="alert">{catalogError}</p>
		{:else if versions.length === 0}
			<p class="status-message" role="status">Nenhuma versão bíblica disponível no workspace.</p>
		{:else}
			<div class="field-row two-fields">
				<div class="field book-field">
					<span class="field-label" id="verse-book-label">Livro</span>
					{#if isMobile.current}
						<Drawer.NestedRoot bind:open={bookDrawerOpen}>
							<Drawer.Trigger
								type="button"
								class="catalog-trigger"
								aria-labelledby="verse-book-label"
								disabled={!selectedVersion}
							>
								<span>{selectedBook?.name ?? 'Selecione um livro'}</span>
								<ChevronDown aria-hidden="true" />
							</Drawer.Trigger>
							<Drawer.Content class="catalog-drawer">
								<Drawer.Header>
									<Drawer.Title>Escolher livro</Drawer.Title>
									<Drawer.Description>Busque e selecione um livro da Bíblia.</Drawer.Description>
								</Drawer.Header>
								<div class="catalog-search">
									<InputGroup.Root>
										<InputGroup.Addon>
											<Search aria-hidden="true" />
										</InputGroup.Addon>
										<InputGroup.Input
											bind:value={bookSearch}
											placeholder="Buscar livro"
											aria-label="Buscar livro"
											autocomplete="off"
										/>
									</InputGroup.Root>
								</div>
								<div class="catalog-items" role="listbox" aria-label="Livros da Bíblia">
									{#each filteredBooks as book (book.id)}
										<Item.Root
											variant={selection.bookId === book.id ? 'outline' : 'default'}
											size="sm"
											class="catalog-item"
										>
											<button
												type="button"
												role="option"
												aria-selected={selection.bookId === book.id}
												onclick={() => chooseBook(book.id)}
											>
												{book.name}
											</button>
										</Item.Root>
									{/each}
								</div>
							</Drawer.Content>
						</Drawer.NestedRoot>
					{:else}
						<Select.Root
							type="single"
							value={String(selection.bookId)}
							onValueChange={handleBookChange}
							disabled={!selectedVersion}
							aria-labelledby="verse-book-label"
						>
							<Select.Trigger id="verse-book" class="selector-trigger">
								{selectedBook?.name ?? 'Selecione um livro'}
							</Select.Trigger>
							<Select.Content class="z-[80]">
								<Select.Group>
									{#each selectedVersion?.books ?? [] as book (book.id)}
										<Select.Item value={String(book.id)} label={book.name}>{book.name}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					{/if}
				</div>

				<div class="field version-field">
					<span class="field-label" id="verse-version-label">Versão</span>
					{#if isMobile.current}
						<Drawer.NestedRoot bind:open={versionDrawerOpen}>
							<Drawer.Trigger
								type="button"
								class="catalog-trigger"
								aria-labelledby="verse-version-label"
							>
								<span title={selectedVersion?.name}>
									{selectedVersion
										? displayVersionAbbreviation(selectedVersion)
										: 'Selecione uma versão'}
								</span>
								<ChevronDown aria-hidden="true" />
							</Drawer.Trigger>
							<Drawer.Content class="catalog-drawer">
								<Drawer.Header>
									<Drawer.Title>Escolher versão</Drawer.Title>
									<Drawer.Description>Selecione uma versão da Bíblia.</Drawer.Description>
								</Drawer.Header>
								<div class="catalog-search">
									<InputGroup.Root>
										<InputGroup.Addon>
											<Search aria-hidden="true" />
										</InputGroup.Addon>
										<InputGroup.Input
											bind:value={versionSearch}
											placeholder="Buscar versão"
											aria-label="Buscar versão"
											autocomplete="off"
										/>
									</InputGroup.Root>
								</div>
								<div class="catalog-items" role="listbox" aria-label="Versões da Bíblia">
									{#each filteredVersions as version (version.id)}
										<Item.Root
											variant={selection.versionId === version.id ? 'outline' : 'default'}
											size="sm"
											class="catalog-item"
										>
											<button
												type="button"
												role="option"
												aria-selected={selection.versionId === version.id}
												onclick={() => chooseVersion(version.id)}
											>
												{version.name}
											</button>
										</Item.Root>
									{/each}
								</div>
							</Drawer.Content>
						</Drawer.NestedRoot>
					{:else}
						<Select.Root
							type="single"
							value={selection.versionId}
							onValueChange={handleVersionChange}
							aria-labelledby="verse-version-label"
						>
							<Select.Trigger id="verse-version" class="selector-trigger">
								{selectedVersion
									? displayVersionAbbreviation(selectedVersion)
									: 'Selecione uma versão'}
							</Select.Trigger>
							<Select.Content class="z-[80]">
								<Select.Group>
									{#each versions as version (version.id)}
										<Select.Item value={version.id} label={version.name}>{version.name}</Select.Item
										>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					{/if}
				</div>
			</div>

			<div class="field chapter-field">
				<span class="field-label" id="verse-chapter-label">Capítulo</span>
				{#if isMobile.current}
					<Drawer.NestedRoot bind:open={chapterDrawerOpen}>
						<Drawer.Trigger
							type="button"
							class="chapter-trigger"
							aria-labelledby="verse-chapter-label"
						>
							<span>Capítulo {selection.chapter}</span>
							<ChevronDown aria-hidden="true" />
						</Drawer.Trigger>
						<Drawer.Content class="chapter-drawer">
							<Drawer.Header>
								<Drawer.Title>Escolher capítulo</Drawer.Title>
								<Drawer.Description>Selecione um capítulo para continuar.</Drawer.Description>
							</Drawer.Header>
							<div
								class="chapter-grid"
								role="group"
								aria-label={`Capítulos de ${selectedBook?.name ?? 'Bíblia'}`}
							>
								{#each chapterOptions as chapter (chapter)}
									<button
										class:selected={selection.chapter === chapter}
										class="chapter-option"
										type="button"
										onclick={() => chooseChapter(chapter)}
										aria-current={selection.chapter === chapter ? 'true' : undefined}
									>
										{chapter}
									</button>
								{/each}
							</div>
						</Drawer.Content>
					</Drawer.NestedRoot>
				{:else}
					<Select.Root
						type="single"
						value={String(selection.chapter)}
						onValueChange={handleChapterChange}
						disabled={!selectedBook}
						aria-labelledby="verse-chapter-label"
					>
						<Select.Trigger id="verse-chapter" class="selector-trigger">
							{selection.chapter}
						</Select.Trigger>
						<Select.Content class="z-[80]">
							<Select.Group>
								{#each chapterOptions as chapter (chapter)}
									<Select.Item value={String(chapter)} label={String(chapter)}
										>{chapter}</Select.Item
									>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				{/if}
			</div>

			<div class="field-row two-fields">
				<div class="field verse-start-field">
					<label for="verse-start">Versículo inicial</label>
					<input
						id="verse-start"
						type="number"
						inputmode="numeric"
						min="1"
						max={maxVerse}
						value={selection.verseStart}
						onchange={handleVerseStartChange}
						aria-label="Versículo inicial"
					/>
				</div>

				<div class="field verse-end-field">
					<label for="verse-end">Versículo final</label>
					<input
						id="verse-end"
						type="number"
						inputmode="numeric"
						min={selection.verseStart}
						max={maxVerse}
						value={selection.verseEnd}
						onchange={handleVerseEndChange}
						aria-label="Versículo final"
					/>
				</div>
			</div>

			<div class="preview-section" aria-live="polite">
				<p class="preview-label">Pré-visualização</p>
				{#if previewLoading}
					<p class="status-message">Carregando texto…</p>
				{:else if previewError}
					<p class="status-message error" role="alert">{previewError}</p>
				{:else if previewSnapshot}
					<VerseBlockView
						versionId={selection.versionId}
						version={selectedVersion
							? displayVersionAbbreviation(selectedVersion)
							: selection.version}
						bookId={selection.bookId}
						book={selection.book ?? selectedBook?.name ?? ''}
						chapter={selection.chapter}
						verseStart={selection.verseStart}
						verseEnd={selection.verseEnd}
						snapshotBody={previewSnapshot}
					/>
				{:else}
					<p class="status-message">Selecione um intervalo para ver o preview.</p>
				{/if}
			</div>

			{#if rangeError}
				<p class="status-message error" role="alert">{rangeError}</p>
			{/if}
		{/if}
	</div>

	<div class="selector-actions">
		<Button type="button" variant="outline" onclick={handleCancel}>Cancelar</Button>
		<Button
			type="button"
			onclick={handleConfirm}
			disabled={catalogLoading || !!catalogError || versions.length === 0}
		>
			Inserir
		</Button>
	</div>
{/snippet}

{#if isMobile.current}
	<Drawer.Root bind:open>
		<Drawer.Content class="verse-selector-drawer">
			<Drawer.Header>
				<Drawer.Title>Inserir versículo</Drawer.Title>
				<Drawer.Description>Escolha a referência bíblica para inserir na nota.</Drawer.Description>
			</Drawer.Header>
			{@render selectorBody()}
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<Dialog.Root bind:open>
		<Dialog.Content class="verse-selector-dialog" showCloseButton={true}>
			<Dialog.Title>Inserir versículo</Dialog.Title>
			<Dialog.Description>Escolha a referência bíblica para inserir na nota.</Dialog.Description>
			{@render selectorBody()}
		</Dialog.Content>
	</Dialog.Root>
{/if}

<style>
	:global(.verse-selector-dialog),
	:global(.verse-selector-drawer) {
		max-height: min(90vh, 720px);
		overflow-y: auto;
	}

	:global(.verse-selector-drawer) {
		height: min(90dvh, 720px);
		padding-inline: max(16px, env(safe-area-inset-left, 0px));
		padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
	}

	:global(.verse-selector-drawer > [data-slot='drawer-header']) {
		padding-inline: 0;
	}

	.selector-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 8px;
	}

	.field-row {
		display: grid;
		gap: 12px;
	}

	.two-fields {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.field-label,
	label {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	:global(.selector-trigger),
	input {
		width: 100%;
		min-height: 36px;
	}

	:global(.chapter-trigger) {
		display: flex;
		width: 100%;
		min-height: 40px;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		border: 1px solid var(--input);
		border-radius: var(--radius);
		background: transparent;
		padding: 0 12px;
		color: var(--foreground);
		font: inherit;
		text-align: left;
	}

	:global(.catalog-trigger) {
		display: flex;
		width: 100%;
		min-height: 36px;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		border: 1px solid var(--input);
		border-radius: var(--radius);
		background: transparent;
		padding: 0 10px;
		color: var(--foreground);
		font: inherit;
		text-align: left;
	}

	:global(.catalog-trigger svg) {
		width: 16px;
		height: 16px;
		color: var(--muted-foreground);
	}

	:global(.catalog-trigger:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	:global(.chapter-trigger svg) {
		width: 16px;
		height: 16px;
		color: var(--muted-foreground);
	}

	:global(.chapter-trigger:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	:global(.chapter-drawer) {
		height: min(70dvh, 560px);
		max-height: min(70dvh, 560px);
		overflow-x: hidden;
		padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
	}

	:global(.chapter-drawer > [data-slot='drawer-header']) {
		padding-inline: 16px;
	}

	:global(.catalog-drawer) {
		height: min(78dvh, 640px);
		max-height: min(78dvh, 640px);
		overflow: hidden;
		padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
	}

	:global(.catalog-drawer > [data-slot='drawer-header']) {
		padding-inline: 16px;
	}

	.catalog-search {
		padding: 0 16px 12px;
	}

	.catalog-items {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		gap: 8px;
		overflow-y: auto;
		padding: 0 16px 16px;
	}

	:global(.catalog-item) {
		min-width: 0;
		padding: 0;
	}

	:global(.catalog-item button) {
		width: 100%;
		min-height: 44px;
		border: 0;
		background: transparent;
		padding: 8px 12px;
		color: var(--foreground);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	:global(.catalog-item button:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	.chapter-grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		min-height: 0;
		flex: 1;
		margin: 0 16px 16px;
		overflow-y: auto;
		overflow-x: hidden;
		border: 1px solid var(--border);
		border-radius: 15px;
		scrollbar-width: none;
	}

	.chapter-grid::-webkit-scrollbar {
		display: none;
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

	.chapter-option:nth-child(5n) {
		border-right: 0;
	}

	.chapter-option:nth-last-child(-n + 5) {
		border-bottom: 0;
	}

	.chapter-option:hover {
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
	}

	.chapter-option.selected,
	.chapter-option.selected:hover {
		border-color: var(--foreground);
		background: var(--foreground);
		color: var(--background);
	}

	.chapter-option:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	input {
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--background);
		padding: 0 10px;
		color: var(--foreground);
		font-family: var(--font-sans);
		font-size: 0.875rem;
	}

	:global(.selector-trigger:focus-visible),
	input:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.preview-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.preview-label {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.status-message {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.status-message.error {
		color: var(--destructive);
	}

	.selector-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 20px;
	}

	@media (max-width: 767px) {
		:global(.verse-selector-drawer) {
			overflow: hidden;
		}

		:global(.verse-selector-drawer > .selector-form) {
			min-height: 0;
			flex: 1;
			overflow-y: auto;
			padding-bottom: 16px;
		}

		.selector-form {
			display: grid;
			grid-template-columns: repeat(6, minmax(0, 1fr));
			align-content: start;
			grid-template-areas:
				'book book book chapter chapter chapter'
				'start start end end version version'
				'preview preview preview preview preview preview';
		}

		.selector-form > .field-row {
			display: contents;
		}

		.book-field {
			grid-area: book;
		}

		.chapter-field {
			grid-area: chapter;
		}

		.verse-start-field {
			grid-area: start;
		}

		.verse-end-field {
			grid-area: end;
		}

		.version-field {
			grid-area: version;
		}

		.preview-section {
			grid-area: preview;
		}

		.selector-form > .status-message {
			grid-column: 1 / -1;
		}

		:global(.verse-selector-drawer .selector-actions) {
			position: relative;
			flex-shrink: 0;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px;
			margin-top: 16px;
			padding: 12px 0 max(16px, env(safe-area-inset-bottom, 0px));
			border-top: 1px solid var(--border);
			background: var(--popover);
		}

		:global(.verse-selector-drawer .selector-actions > button) {
			width: 100%;
			min-height: 44px;
		}
	}

	@media (max-width: 480px) {
		.two-fields {
			gap: 10px;
		}
	}
</style>
