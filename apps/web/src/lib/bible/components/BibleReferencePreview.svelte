<script lang="ts">
	import type { BibleReference } from '../parser/types';
	import type { BiblePassage } from '../repository/types';
	import { formatPassageLabel } from '../parser/normalize';

	let {
		reference,
		passage,
		loading = false
	}: {
		reference: BibleReference | null;
		passage: BiblePassage | null;
		loading?: boolean;
	} = $props();

	let label = $derived(
		reference
			? formatPassageLabel(
					reference.book,
					reference.chapter,
					reference.verseStart,
					reference.verseEnd
				)
			: 'Passagem'
	);
</script>

<div class="bible-reference-preview" role="tooltip">
	<div class="preview-header">
		<strong>{label}</strong>
		{#if reference?.translation}
			<span class="preview-trans">{reference.translation}</span>
		{/if}
	</div>

	{#if loading}
		<p class="preview-msg">Carregando…</p>
	{:else if passage && passage.verses.length > 0}
		<p class="preview-text">
			{passage.verses[0].text}
			{#if passage.verses.length > 1}…{/if}
		</p>
	{:else}
		<p class="preview-msg">Clique para abrir passagem completa.</p>
	{/if}
</div>

<style>
	.bible-reference-preview {
		max-width: 280px;
		padding: 10px 12px;
		font-size: 0.8125rem;
		background: var(--popover);
		color: var(--popover-foreground);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 6px;
	}

	.preview-trans {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--muted-foreground);
	}

	.preview-text {
		margin: 0;
		line-height: 1.5;
		color: var(--foreground);
	}

	.preview-msg {
		margin: 0;
		color: var(--muted-foreground);
	}
</style>
