<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { RotateCw } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import HighlightsList from '$lib/features/bible/HighlightsList.svelte';
	import PageHeader from '$lib/features/navigation/PageHeader.svelte';
	import { loadBibleCatalog } from '$lib/features/bible/bible-reader';
	import { isSameReaderHighlight } from '$lib/features/bible/reader-highlights';
	import {
		readAllReaderHighlights,
		type ReaderHighlightRecord
	} from '$lib/features/bible/reader-highlights-repository';
	import { rebuildWorkspaceIndex } from '$lib/features/notes/index-rebuilder';
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
	let rebuilding = $state(false);
	let rebuildProgress = $state(0);
	let rebuildError = $state('');
	let rebuildMessage = $state('');

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

	async function rebuildHighlightsIndex() {
		const storage = activeStorage;
		if (!storage || rebuilding) return;

		rebuilding = true;
		rebuildProgress = 0;
		rebuildError = '';
		rebuildMessage = '';
		try {
			const projection = await rebuildWorkspaceIndex(storage, {
				onProgress: (processed, total) => {
					rebuildProgress = total === 0 ? 1 : processed / total;
				}
			});
			await loadHighlights(storage);
			rebuildProgress = 1;
			rebuildMessage = `${projection.records.length} registro(s) disponível(is) na projeção reconstruída.`;
		} catch (error) {
			rebuildError =
				error instanceof Error
					? error.message
					: 'Não foi possível reconstruir o índice deste workspace.';
		} finally {
			rebuilding = false;
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
		<section class="rebuild-panel" aria-labelledby="rebuild-title">
			<div class="rebuild-copy">
				<p class="eyebrow">Recuperação local</p>
				<h2 id="rebuild-title">Reconstruir índice de destaques</h2>
				<p>
					A projeção pode ser refeita a partir dos registros primários sem alterar as Bíblias ou as
					notas.
				</p>
			</div>
			<Button
				type="button"
				variant="outline"
				onclick={() => void rebuildHighlightsIndex()}
				disabled={rebuilding}
			>
				<RotateCw size={15} strokeWidth={1.8} aria-hidden="true" />
				{rebuilding ? 'Reconstruindo...' : 'Reconstruir índice'}
			</Button>
			{#if rebuilding}
				<div class="rebuild-progress" aria-live="polite">
					<div class="progress-track" aria-hidden="true">
						<span style={`width: ${Math.round(rebuildProgress * 100)}%`}></span>
					</div>
					<p role="status">Processando registros: {Math.round(rebuildProgress * 100)}%</p>
				</div>
			{:else if rebuildError}
				<p class="highlights-error" role="alert">{rebuildError}</p>
			{:else if rebuildMessage}
				<p class="rebuild-success" role="status">{rebuildMessage}</p>
			{/if}
		</section>
		<div class="highlights-collection" class:highlights-collection-empty={highlights.length === 0}>
			<HighlightsList
				{highlights}
				{catalog}
				storage={activeStorage}
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

	.rebuild-panel {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 16px 24px;
		align-items: end;
		margin: 20px 0 24px;
		padding: 16px 0;
		border-block: 1px solid var(--border);
	}

	.rebuild-copy {
		min-width: 0;
	}

	.eyebrow {
		margin: 0 0 4px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.rebuild-panel h2 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.rebuild-panel p:not(.eyebrow):not(.rebuild-success):not(.highlights-error) {
		max-width: 62ch;
		margin: 6px 0 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.rebuild-progress,
	.rebuild-success,
	.rebuild-panel .highlights-error {
		grid-column: 1 / -1;
	}

	.progress-track {
		height: 3px;
		overflow: hidden;
		background: var(--muted);
	}

	.progress-track span {
		display: block;
		height: 100%;
		background: var(--foreground);
		transition: width 160ms ease;
	}

	.rebuild-progress p,
	.rebuild-success {
		margin: 7px 0 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
	}

	.rebuild-success {
		color: var(--foreground);
	}

	@media (max-width: 767px) {
		.highlights-page {
			padding-top: 0;
		}

		.highlights-page-title {
			display: block;
		}

		.rebuild-panel {
			grid-template-columns: 1fr;
			gap: 12px;
			align-items: start;
		}

		.rebuild-panel :global(button) {
			width: 100%;
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
