<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { loadBibleCatalog } from '$lib/features/bible/bible-reader';
	import type { BibleCatalog } from '$lib/features/bible/bible-reader';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import PageHeader from '$lib/features/navigation/PageHeader.svelte';
	import ContinueReadingCard from './ContinueReadingCard.svelte';
	import QuickActions from './QuickActions.svelte';
	import RecentLists from './RecentLists.svelte';
	import { resolveHomeContinuation } from './home-continuation';
	import type { HomeContinuation } from './home-continuation';
	import { loadHomeRecents } from './home-recents';
	import { createNote } from '$lib/features/notes/notes-repository';
	import type { Note } from '$lib/features/notes/note-types';
	import type { ReaderHighlightRecord } from '$lib/features/bible/reader-highlights-repository';
	import type { WorkspaceStorage } from '$lib/storage/types';

	let { storage = null }: { storage?: WorkspaceStorage | null } = $props();

	const workspace = getWorkspaceState();
	const effectiveStorage = $derived(storage ?? workspace?.storage ?? null);

	let continuation = $state<HomeContinuation | null>(null);
	let continuationLoading = $state(true);
	let continuationError = $state('');
	let notes = $state<Note[]>([]);
	let highlights = $state<ReaderHighlightRecord[]>([]);
	let catalog = $state<BibleCatalog | null>(null);
	let recentsLoading = $state(true);
	let notesError = $state('');
	let highlightsError = $state('');
	let lastLoadedStorage = $state<WorkspaceStorage | null>(null);

	$effect(() => {
		const current = effectiveStorage;
		if (current) {
			if (current === lastLoadedStorage) return;
			lastLoadedStorage = current;
			void loadHome(current);
			return;
		}
		if (!workspace) {
			continuationLoading = false;
			recentsLoading = false;
		}
	});

	async function loadHome(current: WorkspaceStorage) {
		continuationLoading = true;
		recentsLoading = true;
		continuationError = '';
		notesError = '';
		highlightsError = '';
		const preferences = workspace?.preferences ?? { readerSelection: null };
		const [continuationResult, recentsResult, catalogResult] = await Promise.allSettled([
			resolveHomeContinuation(preferences, current),
			loadHomeRecents(current),
			loadBibleCatalog(current)
		]);
		if (continuationResult.status === 'fulfilled') {
			continuation = continuationResult.value;
		} else {
			continuation = null;
			continuationError = 'Não foi possível retomar sua leitura.';
		}
		if (recentsResult.status === 'fulfilled') {
			notes = recentsResult.value.notes;
			highlights = recentsResult.value.highlights;
			notesError = recentsResult.value.notesError;
			highlightsError = recentsResult.value.highlightsError;
		} else {
			notes = [];
			highlights = [];
			notesError = 'Não foi possível carregar as notas recentes.';
			highlightsError = 'Não foi possível carregar os destaques recentes.';
		}
		catalog = catalogResult.status === 'fulfilled' ? catalogResult.value : null;
		continuationLoading = false;
		recentsLoading = false;
	}

	function retryContinuation() {
		const current = effectiveStorage;
		if (current) void loadHome(current);
	}

	function retryRecents() {
		const current = effectiveStorage;
		if (current) void loadHome(current);
	}

	async function handleCreateNote() {
		const current = effectiveStorage;
		if (!current) {
			await goto(resolve('/notes'));
			return;
		}
		try {
			const note = await createNote(current);
			await goto(resolve(`/notes/${note.id}`));
		} catch {
			await goto(resolve('/notes'));
		}
	}
</script>

<svelte:head>
	<title>Início | OpenBible</title>
	<meta name="description" content="Retome sua leitura e escolha o próximo passo no OpenBible." />
</svelte:head>

<main class="home-page" data-storage-kind={effectiveStorage?.kind ?? 'unconfigured'}>
	<PageHeader
		eyebrow="Seu espaço de estudo"
		title="Início"
		description="Retome de onde parou e escolha o próximo passo."
	/>
	<div class="home-body">
		{#if continuationLoading || recentsLoading}
			<div role="status" aria-label="Carregando início">
				<Skeleton class="home-skeleton" />
				<Skeleton class="home-skeleton" />
				<p class="home-loading-hint">Preparando seu espaço...</p>
			</div>
		{:else}
			<ContinueReadingCard
				{continuation}
				{catalog}
				errorMessage={continuationError}
				onRetry={continuationError ? retryContinuation : undefined}
			/>
			<QuickActions />
			<RecentLists
				{notes}
				{highlights}
				{catalog}
				storage={effectiveStorage}
				{notesError}
				{highlightsError}
				onRetryNotes={notesError ? retryRecents : undefined}
				onRetryHighlights={highlightsError ? retryRecents : undefined}
				onCreateNote={handleCreateNote}
			/>
			<!-- retry localizado por seção -->
		{/if}
	</div>
</main>

<style>
	.home-page {
		width: 100%;
		max-width: min(100%, 1120px);
		margin: 0 auto;
		padding: 28px clamp(18px, 5vw, 72px) 80px;
	}

	.home-body {
		margin-top: 28px;
	}

	:global(.home-skeleton) {
		height: 96px;
		border-radius: 12px;
	}

	:global(.home-skeleton + .home-skeleton) {
		margin-top: 12px;
	}

	.home-loading-hint {
		margin: 16px 0 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
	}

	@media (max-width: 767px) {
		.home-page {
			padding-top: 20px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.home-page {
			transition: none;
		}
	}
</style>
