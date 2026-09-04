<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import HighlightsList from '$lib/features/bible/HighlightsList.svelte';
	import PageHeader from '$lib/features/navigation/PageHeader.svelte';
	import { loadBibleCatalog } from '$lib/features/bible/bible-reader';
	import { isSameReaderHighlight } from '$lib/features/bible/reader-highlights';
	import {
		readAllReaderHighlights,
		type ReaderHighlightRecord
	} from '$lib/features/bible/reader-highlights-repository';
	import { saveReaderPreference } from '$lib/features/bible/reader-preference';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	const workspace = getWorkspaceState();

	let highlights = $state<Awaited<ReturnType<typeof readAllReaderHighlights>>>([]);
	let catalog = $state<Awaited<ReturnType<typeof loadBibleCatalog>> | null>(null);
	let loading = $state(true);
	let errorMessage = $state('');

	$effect(() => {
		const storage = workspace?.storage;
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
</script>

<svelte:head>
	<title>Destaques | OpenBible</title>
	<meta name="description" content="Consulte todos os destaques salvos no seu workspace OpenBible." />
</svelte:head>

<section class="highlights-page" aria-label="Destaques">
	<div class="highlights-page-title">
		<PageHeader title="Destaques" />
	</div>
	{#if !workspace?.storage}
		<p class="highlights-error" role="alert">
			Workspace indisponível. Configure o armazenamento para consultar destaques.
		</p>
	{:else if loading}
		<p class="highlights-status" role="status">Carregando destaques...</p>
	{:else if errorMessage}
		<p class="highlights-error" role="alert">{errorMessage}</p>
	{:else}
		<div class="highlights-collection" class:highlights-collection-empty={highlights.length === 0}>
			<HighlightsList
				{highlights}
				{catalog}
				storage={workspace.storage}
				onNavigate={handleNavigate}
				onRemoved={handleRemoved}
			/>
		</div>
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
</style>
