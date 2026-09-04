<script lang="ts">
	import { ArrowRight, ArrowUpRight, BookOpen } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { referenceLabel } from '$lib/features/bible/reader-highlights';
	import type { BibleCatalog } from '$lib/features/bible/bible-reader';
	import { displayVersionAbbreviation } from '$lib/features/bible/version-label';
	import type { HomeContinuation } from './home-continuation';

	let {
		continuation = null,
		catalog = null,
		loading = false,
		errorMessage = '',
		onRetry
	}: {
		continuation: HomeContinuation | null;
		catalog?: BibleCatalog | null;
		loading?: boolean;
		errorMessage?: string;
		onRetry?: () => void;
	} = $props();

	function versionInfo(versionId: string) {
		const version = catalog?.versions.find((item) => item.id === versionId);
		const label = version
			? displayVersionAbbreviation(version)
			: displayVersionAbbreviation({ name: '', fileName: versionId });
		const bookName = (bookId: number) =>
			version?.books.find((item) => item.id === bookId)?.name ?? `Livro ${bookId}`;
		return { label, bookName };
	}

	function selectionTitle(selection: { versionId: string; bookId: number; chapter: number }) {
		const { label, bookName } = versionInfo(selection.versionId);
		return `${bookName(selection.bookId)} ${selection.chapter} · ${label}`;
	}

	function highlightTitle(highlight: {
		versionId: string;
		bookId: number;
		chapter: number;
		verseStart: number;
		verseEnd: number;
	}) {
		const { label, bookName } = versionInfo(highlight.versionId);
		const reference = referenceLabel({
			book: bookName(highlight.bookId),
			chapter: highlight.chapter,
			verseStart: highlight.verseStart,
			verseEnd: highlight.verseEnd
		});
		return `${reference} · ${label}`;
	}
</script>

<section class="continue-card" aria-label="Continuar leitura">
	<p class="eyebrow">Continuar leitura</p>
	{#if loading}
		<div role="status" aria-label="Carregando continuidade">
			<Skeleton class="continue-skeleton" />
			<p class="continue-hint skeleton">Buscando de onde você parou...</p>
		</div>
	{:else if errorMessage}
		<p class="continue-error" role="alert">{errorMessage}</p>
		{#if onRetry}
			<Button type="button" variant="outline" size="sm" data-testid="retry-button" onclick={onRetry}>Tentar novamente</Button>
		{/if}
	{:else if !continuation || continuation.kind === 'empty'}
		<Empty.Root data-testid="continue-empty">
			<Empty.Header>
				<Empty.Media variant="icon">
					<BookOpen size={16} strokeWidth={1.8} aria-hidden="true" />
				</Empty.Media>
				<Empty.Title>Nenhuma leitura em andamento.</Empty.Title>
				<Empty.Description>Abra a Bíblia e comece por qualquer capítulo.</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button href={resolve('/bible')} size="sm">
					Abrir a Bíblia
					<ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
				</Button>
			</Empty.Content>
		</Empty.Root>
	{:else}
		<h2 class="continue-title">
			{#if continuation.kind === 'selection'}
				{selectionTitle(continuation.selection)}
			{:else}
				{highlightTitle(continuation.highlight)}
			{/if}
		</h2>
		<p class="continue-hint">
			{#if continuation.kind === 'selection'}
				Sua última passagem salva no leitor.
			{:else}
				Seu último destaque neste workspace.
			{/if}
		</p>
		<Button href={resolve('/bible')}>
			Continuar
			<ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
		</Button>
	{/if}
</section>

<style>
	.continue-card {
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 20px;
		background: transparent;
	}

	.eyebrow {
		margin: 0 0 12px;
		color: var(--muted-foreground);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.continue-title {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.continue-hint {
		margin: 8px 0 16px;
		color: var(--muted-foreground);
		font-size: 0.85rem;
		line-height: 1.55;
	}

	.continue-error {
		margin: 0 0 12px;
		color: var(--destructive);
		font-size: 0.85rem;
		line-height: 1.55;
	}

	:global(.continue-skeleton) {
		height: 28px;
		border-radius: 6px;
	}

	@media (prefers-reduced-motion: reduce) {
		.continue-card {
			transition: none;
		}
	}
</style>
