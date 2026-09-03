<script lang="ts">
	import { verseReferenceLabel } from './verse-block-extension';

	let {
		versionId,
		version = '',
		bookId,
		book,
		chapter,
		verseStart,
		verseEnd,
		snapshotBody
	}: {
		versionId: string;
		version?: string;
		bookId: number;
		book: string;
		chapter: number;
		verseStart: number;
		verseEnd: number;
		snapshotBody: string;
	} = $props();

	const reference = $derived(
		verseReferenceLabel({
			versionId,
			version,
			bookId: String(bookId),
			book,
			chapter: String(chapter),
			verseStart: String(verseStart),
			verseEnd: String(verseEnd)
		})
	);
</script>

<blockquote class="verse-callout" aria-label={`Versículo: ${reference}`}>
	<p class="verse-ref">{reference}</p>
	<pre class="verse-snapshot">{snapshotBody}</pre>
</blockquote>

<style>
	.verse-callout {
		margin: 0;
		border-inline-start: 2px solid color-mix(in oklch, var(--foreground) 18%, transparent);
		background: color-mix(in oklch, var(--foreground) 3%, transparent);
		padding: 14px 16px 14px 18px;
	}

	.verse-ref {
		margin: 0 0 10px;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		line-height: 1.4;
	}

	.verse-snapshot {
		margin: 0;
		color: var(--foreground);
		font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
		font-size: 0.9rem;
		line-height: 1.65;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
