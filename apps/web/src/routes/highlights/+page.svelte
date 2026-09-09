<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import HighlightsList from '$lib/features/bible/HighlightsList.svelte';
	import PageHeader from '$lib/features/navigation/PageHeader.svelte';
	import { loadBibleCatalog } from '$lib/features/bible/bible-reader';
	import {
		isSameReaderHighlight,
		readerHighlightStyle
	} from '$lib/features/bible/reader-highlights';
	import {
		readAllReaderHighlights,
		type ReaderHighlightRecord
	} from '$lib/features/bible/reader-highlights-repository';
	import { saveReaderPreference } from '$lib/features/bible/reader-preference';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';

	let { storageOverride }: { storageOverride?: WorkspaceStorage } = $props();

	const workspace = getWorkspaceState();
	const activeStorage = $derived(storageOverride ?? workspace?.storage ?? null);

	let highlights = $state<Awaited<ReturnType<typeof readAllReaderHighlights>>>([]);
	let catalog = $state<Awaited<ReturnType<typeof loadBibleCatalog>> | null>(null);
	let loading = $state(true);
	let errorMessage = $state('');
	let searchQuery = $state('');
	let kindFilter = $state<'all' | 'pen' | 'underline' | 'wavy' | 'box'>('all');

	function highlightBookName(highlight: ReaderHighlightRecord): string {
		const version = catalog?.versions.find((item) => item.id === highlight.versionId);
		return version?.books.find((item) => item.id === highlight.bookId)?.name ?? '';
	}

	function highlightKind(highlight: ReaderHighlightRecord): string {
		return readerHighlightStyle(highlight.styleId)?.kind ?? 'pen';
	}

	let filteredHighlights = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		return highlights.filter((highlight) => {
			if (kindFilter !== 'all' && highlightKind(highlight) !== kindFilter) return false;
			if (!query) return true;
			const book = highlightBookName(highlight).toLowerCase();
			const haystack = `${book} ${highlight.chapter} ${highlight.verseStart} ${highlight.verseEnd} ${highlight.versionId}`.toLowerCase();
			return haystack.includes(query);
		});
	});

	$effect(() => {
		const storage = activeStorage;
		if (!storage) {
			loading = false;
			highlights = [];
			catalog = null;
			return;
		}
		void loadHighlights(storage);
	});

	async function loadHighlights(storage: NonNullable<typeof workspace>['storage']) {
		loading = true;
		errorMessage = '';
		try {
			const [nextCatalog, nextHighlights] = await Promise.all([
				loadBibleCatalog(storage),
				readAllReaderHighlights(storage)
			]);
			catalog = nextCatalog;
			highlights = nextHighlights;
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'Não foi possível carregar os destaques deste workspace.';
			highlights = [];
		} finally {
			loading = false;
		}
	}

	function handleNavigate(highlight: ReaderHighlightRecord) {
		const selection = {
			versionId: highlight.versionId,
			bookId: highlight.bookId,
			chapter: highlight.chapter
		};
		saveReaderPreference(selection);
		void workspace?.updatePreferences({ readerSelection: selection });
		void goto(resolve('/bible'));
	}

	function handleRemoved(highlight: ReaderHighlightRecord) {
		highlights = highlights.filter((item) => !isSameReaderHighlight(item, highlight));
	}

	function handleRestored(highlight: ReaderHighlightRecord) {
		const exists = highlights.some((item) => isSameReaderHighlight(item, highlight));
		if (!exists) highlights = [...highlights, highlight];
	}

	function clearFilters() {
		searchQuery = '';
		kindFilter = 'all';
	}
</script>

<svelte:head>
	<title>Destaques | OpenBible</title>
	<meta
		name="description"
		content="Consulte todos os destaques salvos no seu workspace OpenBible."
	/>
</svelte:head>

<section class="highlights-page" aria-label="Destaques">
	<div class="highlights-page-title">
		<PageHeader title="Destaques" />
	</div>
	{#if !activeStorage}
		<p class="highlights-error" role="alert">
			Workspace indisponível. Configure o armazenamento para consultar destaques.
		</p>
	{:else if loading}
		<p class="highlights-status" role="status">Carregando destaques...</p>
	{:else if errorMessage}
		<div class="error-state">
			<p class="highlights-error" role="alert">{errorMessage}</p>
			<Button
				type="button"
				variant="outline"
				onclick={() => activeStorage && void loadHighlights(activeStorage)}
			>
				Tentar novamente
			</Button>
		</div>
	{:else}
		{#if highlights.length > 0}
			<div class="highlights-toolbar" role="search">
				<input
					type="search"
					class="highlights-search"
					placeholder="Buscar por livro, capítulo…"
					aria-label="Buscar destaques"
					bind:value={searchQuery}
				/>
				<select class="highlights-filter" aria-label="Filtrar por estilo" bind:value={kindFilter}>
					<option value="all">Todos os estilos</option>
					<option value="pen">Canetas</option>
					<option value="underline">Sublinhado</option>
					<option value="wavy">Ondulado</option>
					<option value="box">Caixa</option>
				</select>
			</div>
			<p class="highlights-count" role="status">
				{#if filteredHighlights.length === highlights.length}
					{highlights.length} {highlights.length === 1 ? 'destaque' : 'destaques'}
				{:else}
					{filteredHighlights.length} de {highlights.length} destaques
				{/if}
			</p>
		{/if}
		{#if highlights.length > 0 && filteredHighlights.length === 0}
			<div class="highlights-no-match">
				<p>Nenhum destaque corresponde aos filtros.</p>
				<Button type="button" variant="outline" onclick={clearFilters}>Limpar filtros</Button>
			</div>
		{:else}
		<div class="highlights-collection" class:highlights-collection-empty={filteredHighlights.length === 0}>
			<HighlightsList
				highlights={filteredHighlights}
				{catalog}
				storage={activeStorage}
				onNavigate={handleNavigate}
				onRemoved={handleRemoved}
				onRestored={handleRestored}
			/>
		</div>
		{/if}
	{/if}
</section>

<style>
	.highlights-page {
		width: 100%;
		max-width: min(100%, 1120px);
		margin: 0 auto;
		padding: 28px clamp(18px, 5vw, 72px) 80px;
	}

	.highlights-page-title {
		display: none;
		width: 100%;
		max-width: min(100%, 1120px);
		margin: 0 auto;
		padding: 20px 0 0;
	}

	.highlights-collection {
		margin-top: 8px;
	}

	.highlights-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}

	.highlights-search {
		min-width: 0;
		flex: 1 1 220px;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--background);
		padding: 8px 12px;
		color: inherit;
		font-size: 0.85rem;
	}

	.highlights-search:focus-visible,
	.highlights-filter:focus-visible {
		outline: 1.5px solid color-mix(in oklch, var(--ring) 72%, transparent);
		outline-offset: 1px;
	}

	.highlights-filter {
		flex: 0 1 180px;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--background);
		padding: 8px 10px;
		color: inherit;
		font-size: 0.85rem;
	}

	.highlights-count {
		margin: 10px 0 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
	}

	.highlights-no-match {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin-top: 16px;
		border: 1px dashed var(--border);
		border-radius: 12px;
		padding: 20px;
	}

	.highlights-no-match p {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.85rem;
	}

	@media (max-width: 767px) {
		.highlights-page {
			padding-top: 0;
		}

		.highlights-page-title {
			display: block;
		}
	}

	.highlights-collection-empty {
		display: flex;
		min-height: calc(100dvh - 160px);
	}

	.highlights-collection-empty > :global([data-testid='highlights-empty']) {
		width: 100%;
		margin: auto;
	}

	.highlights-status {
		margin: 24px 0 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
	}

	.highlights-error {
		margin: 24px 0 0;
		color: var(--destructive);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.error-state {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 24px;
	}

	.error-state .highlights-error {
		margin: 0;
	}

	@media (max-width: 480px) {
		.error-state {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
