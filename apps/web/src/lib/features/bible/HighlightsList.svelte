<script lang="ts">
	import { ArrowUpRight, Highlighter, Trash2 } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import type { BibleCatalog } from './bible-reader';
	import {
		isSameReaderHighlight,
		loadHighlightPassage,
		referenceLabel,
		readerHighlightStyle
	} from './reader-highlights';
	import { removeHighlight, type ReaderHighlightRecord } from './reader-highlights-repository';
	import { displayVersionAbbreviation } from './version-label';

	let {
		highlights,
		catalog = null,
		storage = null,
		emptyMessage = 'Nenhum destaque salvo neste workspace.',
		onNavigate,
		onRemoved
	}: {
		highlights: ReaderHighlightRecord[];
		catalog?: BibleCatalog | null;
		storage?: WorkspaceStorage | null;
		emptyMessage?: string;
		onNavigate?: (highlight: ReaderHighlightRecord) => void;
		onRemoved?: (highlight: ReaderHighlightRecord) => void;
	} = $props();

	const isMobile = new IsMobile();

	let detailOpen = $state(false);
	let selectedHighlight = $state<ReaderHighlightRecord | null>(null);
	let passageText = $state('');
	let passageLoading = $state(false);
	let passageError = $state('');
	let removeError = $state('');
	let removing = $state(false);

	function bookName(versionId: string, bookId: number): string {
		const version = catalog?.versions.find((item) => item.id === versionId);
		const book = version?.books.find((item) => item.id === bookId);
		return book?.name ?? `Livro ${bookId}`;
	}

	function versionAbbreviation(versionId: string): string {
		const version = catalog?.versions.find((item) => item.id === versionId);
		if (!version) return versionId;
		return displayVersionAbbreviation(version);
	}

	function rowReference(highlight: ReaderHighlightRecord): string {
		return referenceLabel({
			book: bookName(highlight.versionId, highlight.bookId),
			chapter: highlight.chapter,
			verseStart: highlight.verseStart,
			verseEnd: highlight.verseEnd
		});
	}

	function rowStyleLabel(styleId: string): string {
		return readerHighlightStyle(styleId)?.label ?? styleId;
	}

	function rowStyleKind(styleId: string): string {
		return readerHighlightStyle(styleId)?.kind ?? 'pen';
	}

	function highlightKey(highlight: ReaderHighlightRecord): string {
		return `${highlight.versionId}-${highlight.bookId}-${highlight.chapter}-${highlight.verseStart}-${highlight.verseEnd}`;
	}

	function openDetail(highlight: ReaderHighlightRecord) {
		selectedHighlight = highlight;
		passageText = '';
		passageError = '';
		removeError = '';
		detailOpen = true;
	}

	function closeDetail() {
		detailOpen = false;
		selectedHighlight = null;
		passageText = '';
		passageError = '';
		removeError = '';
	}

	async function loadPassage(highlight: ReaderHighlightRecord) {
		if (!catalog) {
			passageError = 'Catálogo bíblico indisponível.';
			return;
		}
		passageLoading = true;
		passageError = '';
		passageText = '';
		try {
			const result = await loadHighlightPassage(catalog, highlight);
			if ('error' in result) {
				passageError = result.error;
				return;
			}
			passageText = result.text;
		} finally {
			passageLoading = false;
		}
	}

	async function handleRemove(highlight: ReaderHighlightRecord, event?: MouseEvent) {
		event?.stopPropagation();
		if (!storage || removing) return;
		removing = true;
		removeError = '';
		try {
			await removeHighlight(storage, highlight);
			onRemoved?.(highlight);
			if (selectedHighlight && isSameReaderHighlight(selectedHighlight, highlight)) {
				closeDetail();
			}
		} catch {
			removeError = 'Não foi possível remover este destaque.';
		} finally {
			removing = false;
		}
	}

	function handleNavigate(highlight: ReaderHighlightRecord) {
		onNavigate?.(highlight);
		closeDetail();
	}

	$effect(() => {
		if (!detailOpen || !selectedHighlight) return;
		void loadPassage(selectedHighlight);
	});
</script>

{#snippet styleIndicator(styleId: string)}
	<span
		class="style-indicator"
		data-kind={rowStyleKind(styleId)}
		data-style-id={styleId}
		aria-label={rowStyleLabel(styleId)}
		title={rowStyleLabel(styleId)}
	>
		{#if rowStyleKind(styleId) === 'pen'}
			<span class="pen-pill" aria-hidden="true"></span>
		{:else if rowStyleKind(styleId) === 'box'}
			<span class="box-pill" aria-hidden="true"></span>
		{:else if rowStyleKind(styleId) === 'wavy'}
			<svg class="wavy-pill" viewBox="0 0 18 6" aria-hidden="true">
				<path
					d="M0 3 C1.5 0.5 3 5.5 4.5 3 S7.5 0.5 9 3 10.5 5.5 12 3 13.5 0.5 15 3 16.5 5.5 18 3"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
		{:else}
			<span class="underline-pill" aria-hidden="true"></span>
		{/if}
	</span>
{/snippet}

{#snippet detailBody()}
	{#if selectedHighlight}
		<div class="detail-meta">
			<div class="detail-heading">
				{@render styleIndicator(selectedHighlight.styleId)}
				<p class="detail-reference">{rowReference(selectedHighlight)}</p>
			</div>
			<p class="detail-style">
				<span>{versionAbbreviation(selectedHighlight.versionId)}</span>
				<span aria-hidden="true">·</span>
				<span>{rowStyleLabel(selectedHighlight.styleId)}</span>
			</p>
		</div>

		<blockquote class="detail-passage" aria-label={`Texto de ${rowReference(selectedHighlight)}`}>
			{#if passageLoading}
				<p class="detail-status" role="status">Carregando texto...</p>
			{:else if passageError}
				<p class="detail-error" role="alert">{passageError}</p>
			{:else}
				<p>{passageText}</p>
			{/if}
		</blockquote>

		{#if removeError}
			<p class="detail-error" role="alert">{removeError}</p>
		{/if}

		<div class="detail-actions">
			<Button
				type="button"
				onclick={() => handleNavigate(selectedHighlight!)}
				disabled={!onNavigate}
			>
				<ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
				Ir para o texto
			</Button>
			<Button
				type="button"
				variant="outline"
				onclick={() => void handleRemove(selectedHighlight!)}
				disabled={!storage || removing}
			>
				<Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
				Remover destaque
			</Button>
		</div>
	{/if}
{/snippet}

{#if highlights.length === 0}
	<Empty.Root data-testid="highlights-empty">
		<Empty.Header>
			<Empty.Media variant="icon">
				<Highlighter size={16} strokeWidth={1.8} aria-hidden="true" />
			</Empty.Media>
			<Empty.Title>Nenhum destaque ainda.</Empty.Title>
			<Empty.Description>
				{emptyMessage} Abra a Bíblia, selecione um trecho e salve seu primeiro destaque.
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button href={resolve('/bible')} size="sm" variant="outline">
				Ler a Bíblia
				<ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
			</Button>
		</Empty.Content>
	</Empty.Root>
{:else}
	<div class="highlights-grid" data-testid="highlights-card-list" aria-label="Destaques">
		{#each highlights as highlight (highlightKey(highlight))}
			<article class="highlight-card">
				<button type="button" class="card-main" onclick={() => openDetail(highlight)}>
					<span class="card-reference">{rowReference(highlight)}</span>
					<span class="card-meta">
						<span>{versionAbbreviation(highlight.versionId)}</span>
					</span>
				</button>
				<div class="card-footer">
					{@render styleIndicator(highlight.styleId)}
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={`Remover destaque ${rowReference(highlight)}`}
						disabled={!storage || removing}
						onclick={(event) => void handleRemove(highlight, event)}
					>
						<Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
					</Button>
				</div>
			</article>
		{/each}
	</div>
{/if}

{#if isMobile.current}
	<Sheet.Root bind:open={detailOpen} onOpenChange={(open) => !open && closeDetail()}>
		<Sheet.Content side="bottom" class="highlight-detail-sheet">
			<Sheet.Header>
				<Sheet.Title>Destaque</Sheet.Title>
				<Sheet.Description>Texto do trecho destacado no leitor.</Sheet.Description>
			</Sheet.Header>
			{@render detailBody()}
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<Dialog.Root bind:open={detailOpen} onOpenChange={(open) => !open && closeDetail()}>
		<Dialog.Content class="highlight-detail-dialog" showCloseButton={true}>
			<Dialog.Title>Destaque</Dialog.Title>
			<Dialog.Description>Texto do trecho destacado no leitor.</Dialog.Description>
			{@render detailBody()}
		</Dialog.Content>
	</Dialog.Root>
{/if}

<style>
	.highlights-grid,
	:global(.highlight-detail-dialog),
	:global(.highlight-detail-sheet) {
		--pen-gold: #d9a441;
		--pen-mint: #4f9d69;
		--pen-sky: #4f83c2;
		--pen-rose: #c4657f;
		--pen-lilac: #8d7bc4;
		--swatch-alpha: 58%;
		--ink-stroke: color-mix(in oklch, var(--foreground) 55%, transparent);
	}

	:global(.dark) .highlights-grid,
	:global(.dark) :global(.highlight-detail-dialog),
	:global(.dark) :global(.highlight-detail-sheet) {
		--swatch-alpha: 72%;
	}

	.highlights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
	}

	.highlight-card {
		display: flex;
		min-width: 0;
		flex-direction: column;
		justify-content: space-between;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: transparent;
		transition: background 160ms ease;
	}

	.highlight-card:hover {
		background: color-mix(in oklch, var(--foreground) 3%, transparent);
	}

	.card-main {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 6px;
		border: 0;
		padding: 14px 14px 10px;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.card-main:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
		border-radius: 10px;
	}

	.card-reference {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		line-height: 1.45;
	}

	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		color: var(--muted-foreground);
		font-size: 0.74rem;
		line-height: 1.4;
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 8px 8px;
	}

	.style-indicator {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		color: var(--ink-stroke);
	}

	.pen-pill {
		width: 16px;
		height: 16px;
		border: 1px solid var(--border);
		border-radius: 999px;
	}

	.style-indicator[data-kind='pen'][data-style-id='pen-gold'] .pen-pill {
		background: color-mix(in oklch, var(--pen-gold) var(--swatch-alpha), transparent);
	}

	.style-indicator[data-kind='pen'][data-style-id='pen-mint'] .pen-pill {
		background: color-mix(in oklch, var(--pen-mint) var(--swatch-alpha), transparent);
	}

	.style-indicator[data-kind='pen'][data-style-id='pen-sky'] .pen-pill {
		background: color-mix(in oklch, var(--pen-sky) var(--swatch-alpha), transparent);
	}

	.style-indicator[data-kind='pen'][data-style-id='pen-rose'] .pen-pill {
		background: color-mix(in oklch, var(--pen-rose) var(--swatch-alpha), transparent);
	}

	.style-indicator[data-kind='pen'][data-style-id='pen-lilac'] .pen-pill {
		background: color-mix(in oklch, var(--pen-lilac) var(--swatch-alpha), transparent);
	}

	.box-pill {
		width: 16px;
		height: 10px;
		border: 1.5px solid var(--ink-stroke);
		border-radius: 3px;
	}

	.underline-pill {
		display: block;
		width: 16px;
		height: 2px;
		background: var(--ink-stroke);
		border-radius: 1px;
	}

	.wavy-pill {
		display: block;
		width: 18px;
		height: 6px;
	}

	:global(.highlight-detail-dialog),
	:global(.highlight-detail-sheet) {
		max-height: min(90vh, 720px);
		overflow-y: auto;
		border-color: var(--border);
		background: var(--background);
	}

	:global(.dark .highlight-detail-dialog),
	:global(.dark .highlight-detail-sheet) {
		border-color: #292929;
		background: #090909;
	}

	.detail-meta {
		display: grid;
		gap: 6px;
	}

	.detail-heading {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.detail-reference {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.01em;
	}

	.detail-style {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.76rem;
	}

	.detail-passage {
		margin: 16px 0 0;
		border-left: 2px solid var(--border);
		padding: 0 0 0 14px;
	}

	.detail-passage p {
		margin: 0;
		color: var(--foreground);
		font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
		font-size: 0.92rem;
		line-height: 1.65;
		overflow-wrap: anywhere;
	}

	.detail-status,
	.detail-error {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.detail-status {
		color: var(--muted-foreground);
	}

	.detail-error {
		color: var(--destructive);
	}

	.detail-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 18px;
	}

	.detail-actions :global(button) {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
</style>
