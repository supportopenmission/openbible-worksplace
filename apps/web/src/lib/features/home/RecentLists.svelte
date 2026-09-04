<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import HighlightsList from '$lib/features/bible/HighlightsList.svelte';
	import type { BibleCatalog } from '$lib/features/bible/bible-reader';
	import { isSameReaderHighlight } from '$lib/features/bible/reader-highlights';
	import type { ReaderHighlightRecord } from '$lib/features/bible/reader-highlights-repository';
	import { saveReaderPreference } from '$lib/features/bible/reader-preference';
	import type { Note } from '$lib/features/notes/note-types';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	let {
		notes,
		highlights,
		catalog = null,
		storage = null,
		notesError = '',
		highlightsError = '',
		onRetryNotes,
		onRetryHighlights,
		onCreateNote,
		onHighlightRemoved
	}: {
		notes: Note[];
		highlights: ReaderHighlightRecord[];
		catalog?: BibleCatalog | null;
		storage?: WorkspaceStorage | null;
		notesError?: string;
		highlightsError?: string;
		onRetryNotes?: () => void;
		onRetryHighlights?: () => void;
		onCreateNote?: () => void;
		onHighlightRemoved?: (highlight: ReaderHighlightRecord) => void;
	} = $props();

	const workspace = getWorkspaceState();
	let removedHighlights = $state<ReaderHighlightRecord[]>([]);
	let visibleHighlights = $derived(
		highlights.filter(
			(item) => !removedHighlights.some((removed) => isSameReaderHighlight(item, removed))
		)
	);

	function formatDate(value: string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
		return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function handleNavigateHighlight(highlight: ReaderHighlightRecord) {
		const selection = {
			versionId: highlight.versionId,
			bookId: highlight.bookId,
			chapter: highlight.chapter
		};
		saveReaderPreference(selection);
		void workspace?.updatePreferences({ readerSelection: selection });
		void goto(resolve('/bible'));
	}

	function handleRemovedHighlight(highlight: ReaderHighlightRecord) {
		removedHighlights = [...removedHighlights, highlight];
		onHighlightRemoved?.(highlight);
	}
</script>

<div class="recent-lists">
	<section class="recent-section" aria-labelledby="recent-notes-heading">
		<div class="recent-heading-row">
			<h2 id="recent-notes-heading" class="recent-title">Notas recentes</h2>
			<a class="recent-link" href={resolve('/notes')}>
				Ver todas <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
			</a>
		</div>
		{#if notesError}
			<p class="recent-error" role="alert">{notesError}</p>
			{#if onRetryNotes}
				<Button type="button" variant="outline" size="sm" data-testid="retry-button" onclick={onRetryNotes}>Tentar novamente</Button>
			{/if}
		{:else if notes.length === 0}
			<p class="recent-min-empty">
				Nenhuma nota ainda.
				{#if onCreateNote}
					<button type="button" class="inline-action" onclick={onCreateNote}>
						Crie a primeira nota
					</button>
				{/if}
			</p>
		{:else}
			<ul class="note-list">
				{#each notes as note (note.id)}
					<li>
						<a class="note-row" href={resolve(`/notes/${note.id}`)}>
							<span class="note-title">{note.title || 'Nota sem título'}</span>
							<span class="note-meta">
								<span class="note-id">{note.id}</span>
								{#if formatDate(note.updatedAt)}
									<span aria-hidden="true">·</span>
									<time datetime={note.updatedAt}>{formatDate(note.updatedAt)}</time>
								{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="recent-section" aria-labelledby="recent-highlights-heading">
		<div class="recent-heading-row">
			<h2 id="recent-highlights-heading" class="recent-title">Destaques recentes</h2>
			<a class="recent-link" href={resolve('/highlights')}>
				Ver todos <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
			</a>
		</div>
		{#if highlightsError}
			<p class="recent-error" role="alert">{highlightsError}</p>
			{#if onRetryHighlights}
				<Button type="button" variant="outline" size="sm" data-testid="retry-button" onclick={onRetryHighlights}>Tentar novamente</Button>
			{/if}
		{:else}
			<HighlightsList
				highlights={visibleHighlights}
				{catalog}
				{storage}
				layout="rail"
				emptyVariant="inline"
				emptyMessage="Nenhum destaque neste workspace."
				onNavigate={handleNavigateHighlight}
				onRemoved={handleRemovedHighlight}
			/>
		{/if}
	</section>
</div>

<style>
	.recent-lists {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 40px;
		margin-top: 40px;
	}

	.recent-section {
		min-width: 0;
	}

	.recent-heading-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 16px;
	}

	.recent-title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.recent-link {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 4px;
		color: var(--muted-foreground);
		font-size: 0.78rem;
		font-weight: 500;
		text-decoration: none;
	}

	.recent-link:hover {
		color: var(--foreground);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.recent-link:focus-visible,
	.note-row:focus-visible {
		outline: 3px solid color-mix(in oklch, var(--ring) 45%, transparent);
		outline-offset: 2px;
		border-radius: 8px;
	}

	.note-list {
		display: grid;
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.note-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 12px 14px;
		color: inherit;
		text-decoration: none;
		transition: background-color 160ms ease;
	}

	.note-row:hover {
		background: color-mix(in oklch, var(--foreground) 3%, transparent);
	}

	.note-title {
		overflow: hidden;
		font-size: 0.88rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--muted-foreground);
		font-size: 0.74rem;
	}

	.note-id {
		font-family: var(--font-mono);
	}

	.recent-error {
		margin: 0 0 12px;
		color: var(--destructive);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.recent-min-empty {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.inline-action {
		border: 0;
		padding: 0;
		background: transparent;
		color: var(--foreground);
		font: inherit;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.inline-action:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
		border-radius: 4px;
	}

	@media (max-width: 900px) {
		.recent-lists {
			grid-template-columns: minmax(0, 1fr);
		}

		.note-list {
			display: flex;
			padding-bottom: 4px;
			overflow-x: auto;
			scroll-snap-type: x proximity;
			scrollbar-width: none;
		}

		.note-list::-webkit-scrollbar {
			display: none;
		}

		.note-list > li {
			flex: 0 0 72%;
			scroll-snap-align: start;
		}

		.note-row {
			height: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.note-row {
			transition: none;
		}
	}
</style>
