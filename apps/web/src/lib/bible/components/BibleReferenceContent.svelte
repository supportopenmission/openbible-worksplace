<script lang="ts">
	import type { BibleReference } from '../parser/types';
	import type { BiblePassage } from '../repository/types';
	import { formatPassageLabel } from '../parser/normalize';
	import { AlertTriangle, X } from '@lucide/svelte';

	let {
		reference,
		passage,
		loading = false,
		error = null,
		onClose
	}: {
		reference: BibleReference | null;
		passage: BiblePassage | null;
		loading?: boolean;
		error?: string | null;
		onClose?: () => void;
	} = $props();

	let displayTitle = $derived.by(() => {
		if (passage?.bookName) {
			return formatPassageLabel(
				passage.bookName,
				passage.chapter,
				reference?.verseStart,
				reference?.verseEnd
			);
		}
		if (reference) {
			return formatPassageLabel(
				reference.book,
				reference.chapter,
				reference.verseStart,
				reference.verseEnd
			);
		}
		return 'Passagem Bíblica';
	});

	let actualTranslation = $derived(
		passage?.translation ?? reference?.translation ?? 'Bíblia'
	);

	let requestedTranslation = $derived(
		reference?.translation ?? passage?.requestedTranslation
	);

	let hasVersionMismatch = $derived.by(() => {
		if (passage?.versionMismatch) return true;
		if (!requestedTranslation || !passage?.translation) return false;
		const req = requestedTranslation.trim().toLowerCase();
		const act = passage.translation.trim().toLowerCase();
		return req !== act && !act.includes(req);
	});
</script>

<div class="bible-passage-container" role="region" aria-label="Texto bíblico">
	<header class="passage-header">
		<div class="header-main">
			<h2 class="passage-title">{displayTitle}</h2>
			<div class="header-actions">
				<span class="passage-translation" aria-label={`Versão ${actualTranslation}`}>
					{actualTranslation}
				</span>
				{#if onClose}
					<button
						type="button"
						class="close-button"
						onclick={onClose}
						aria-label="Fechar"
						title="Fechar"
					>
						<X size={16} strokeWidth={2} aria-hidden="true" />
					</button>
				{/if}
			</div>
		</div>
		{#if hasVersionMismatch && requestedTranslation}
			<div class="version-warning" role="status">
				<AlertTriangle size={13} strokeWidth={2} class="warning-icon" aria-hidden="true" />
				<span>Versão <strong>{requestedTranslation}</strong> não instalada. Exibindo em <strong>{actualTranslation}</strong>.</span>
			</div>
		{/if}
	</header>

	<div class="passage-body">
		{#if loading}
			<div class="passage-status loading" role="status" aria-live="polite">
				<div class="spinner" aria-hidden="true"></div>
				<span>Carregando passagem…</span>
			</div>
		{:else if error}
			<div class="passage-status error" role="alert">
				<p>{error}</p>
			</div>
		{:else if passage && passage.verses.length > 0}
			<div class="verse-list">
				{#each passage.verses as verse (verse.number)}
					<p class="verse-item">
						<sup class="verse-num" aria-hidden="true">{verse.number}</sup>
						<span class="verse-text">{verse.text}</span>
					</p>
				{/each}
			</div>
		{:else}
			<div class="passage-status empty" role="status">
				<p>Nenhum texto disponível para esta passagem.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.bible-passage-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.passage-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
		border-bottom: 1px solid var(--border);
		padding-bottom: 12px;
	}

	.header-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.header-actions {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.close-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid transparent;
		border-radius: 6px;
		background: transparent;
		color: var(--muted-foreground);
		cursor: pointer;
		transition: background-color 0.12s ease, color 0.12s ease;
		padding: 0;
	}

	.close-button:hover {
		background-color: var(--muted);
		color: var(--foreground);
	}

	.passage-title {
		margin: 0;
		font-family: var(--font-sans);
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--foreground);
	}

	.passage-translation {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--muted-foreground);
		background-color: var(--muted);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.passage-body {
		min-height: 120px;
		max-height: 55vh;
		overflow-y: auto;
		padding-right: 4px;
	}

	.verse-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.verse-item {
		margin: 0;
		font-family: var(--font-serif, Georgia, serif);
		font-size: 1.0625rem;
		line-height: 1.75;
		color: var(--foreground);
	}

	.verse-num {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--muted-foreground);
		margin-right: 6px;
		vertical-align: baseline;
		position: relative;
		top: -0.3em;
	}

	.verse-text {
		color: var(--foreground);
	}

	.passage-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 120px;
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	.passage-status.error {
		color: var(--destructive);
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--border);
		border-top-color: var(--foreground);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.version-warning {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 6px;
		padding: 5px 10px;
		background: color-mix(in srgb, var(--destructive) 10%, transparent);
		color: var(--destructive);
		border: 1px solid color-mix(in srgb, var(--destructive) 25%, transparent);
		border-radius: var(--radius-sm, 6px);
		font-size: 0.75rem;
		line-height: 1.35;
	}

	.version-warning strong {
		font-weight: 600;
	}

	:global(.version-warning .warning-icon) {
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
