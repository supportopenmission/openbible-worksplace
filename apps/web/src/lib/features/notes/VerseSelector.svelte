<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
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

	function handleVersionChange(event: Event) {
		const versionId = (event.currentTarget as HTMLSelectElement).value;
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

	function handleBookChange(event: Event) {
		const bookId = Number((event.currentTarget as HTMLSelectElement).value);
		const book = selectedVersion?.books.find((item) => item.id === bookId);
		selection = confirmVerseSelection(selection, {
			bookId,
			book: book?.name ?? '',
			chapter: book?.chapters[0] ?? 1,
			verseStart: 1,
			verseEnd: 1
		});
	}

	function handleChapterChange(event: Event) {
		const chapter = Number((event.currentTarget as HTMLSelectElement).value);
		selection = confirmVerseSelection(selection, {
			chapter,
			verseStart: 1,
			verseEnd: 1
		});
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
				error instanceof Error ? error.message : 'Não foi possível carregar o preview do versículo.';
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
				: selection.version ?? '',
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
			<div class="field">
				<label for="verse-version">Versão</label>
				<select
					id="verse-version"
					value={selection.versionId}
					onchange={handleVersionChange}
					aria-label="Versão da Bíblia"
				>
					{#each versions as version (version.id)}
						<option value={version.id}>{version.name}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="verse-book">Livro</label>
				<select
					id="verse-book"
					value={String(selection.bookId)}
					onchange={handleBookChange}
					aria-label="Livro"
					disabled={!selectedVersion}
				>
					{#each selectedVersion?.books ?? [] as book (book.id)}
						<option value={book.id}>{book.name}</option>
					{/each}
				</select>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="verse-chapter">Capítulo</label>
					<select
						id="verse-chapter"
						value={String(selection.chapter)}
						onchange={handleChapterChange}
						aria-label="Capítulo"
						disabled={!selectedBook}
					>
						{#each chapterOptions as chapter (chapter)}
							<option value={chapter}>{chapter}</option>
						{/each}
					</select>
				</div>

				<div class="field">
					<label for="verse-start">Versículo inicial</label>
					<input
						id="verse-start"
						type="number"
						min="1"
						max={maxVerse}
						value={selection.verseStart}
						onchange={handleVerseStartChange}
						aria-label="Versículo inicial"
					/>
				</div>

				<div class="field">
					<label for="verse-end">Versículo final</label>
					<input
						id="verse-end"
						type="number"
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
	<Sheet.Root bind:open>
		<Sheet.Content side="bottom" class="verse-selector-sheet">
			<Sheet.Header>
				<Sheet.Title>Inserir versículo</Sheet.Title>
				<Sheet.Description>Escolha a referência bíblica para inserir na nota.</Sheet.Description>
			</Sheet.Header>
			{@render selectorBody()}
		</Sheet.Content>
	</Sheet.Root>
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
	:global(.verse-selector-sheet) {
		max-height: min(90vh, 720px);
		overflow-y: auto;
	}

	.selector-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 8px;
	}

	.field-row {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	label {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	select,
	input {
		width: 100%;
		min-height: 36px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--background);
		padding: 0 10px;
		color: var(--foreground);
		font-family: var(--font-sans);
		font-size: 0.875rem;
	}

	select:focus-visible,
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

	@media (max-width: 480px) {
		.field-row {
			grid-template-columns: 1fr;
		}
	}
</style>
