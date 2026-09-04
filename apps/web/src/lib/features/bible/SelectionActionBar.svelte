<script lang="ts">
	import { Copy, Eraser, Link, NotebookPen, Square, Underline, X } from '@lucide/svelte';
	import { READER_HIGHLIGHT_PALETTE } from './reader-highlights';

	let {
		open,
		referenceLabel,
		activeStyleId,
		errorMessage = '',
		busy = false,
		onApplyStyle,
		onErase,
		onCopyReference,
		onCopyText,
		onCreateNote,
		onClose
	}: {
		open: boolean;
		referenceLabel: string;
		activeStyleId: string | null;
		errorMessage?: string;
		busy?: boolean;
		onApplyStyle: (styleId: string) => void;
		onErase: () => void;
		onCopyReference: () => void;
		onCopyText: () => void;
		onCreateNote: () => void;
		onClose: () => void;
	} = $props();

	const pens = READER_HIGHLIGHT_PALETTE.filter((style) => style.kind === 'pen');
	const strokes = READER_HIGHLIGHT_PALETTE.filter((style) =>
		['underline', 'wavy', 'box'].includes(style.kind)
	);

	let surface = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!open || typeof window === 'undefined') return;
		const dismiss = (event: PointerEvent) => {
			const target = event.target as HTMLElement | null;
			if (!target) return;
			if (surface?.contains(target)) return;
			if (target.closest('[data-verse-row]')) return;
			onClose();
		};
		window.addEventListener('pointerdown', dismiss, true);
		return () => window.removeEventListener('pointerdown', dismiss, true);
	});

	function handleKeydown(event: KeyboardEvent) {
		if (!open || event.key !== 'Escape') return;
		event.preventDefault();
		event.stopPropagation();
		onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		bind:this={surface}
		class="selection-bar"
		role="dialog"
		tabindex="-1"
		aria-label={`Ações para ${referenceLabel}`}
	>
		<div class="bar-header">
			<p class="bar-reference">{referenceLabel}</p>
			<button
				type="button"
				class="bar-close"
				onclick={onClose}
				aria-label="Fechar ações do versículo"
				title="Fechar"
			>
				<X size={16} strokeWidth={2} aria-hidden="true" />
			</button>
		</div>
		<div class="bar-scroll">
			<div class="action-group" role="group" aria-label="Canetas de destaque">
				{#each pens as pen (pen.id)}
					<button
						type="button"
						class="pen-action"
						aria-label={pen.label}
						title={pen.label}
						aria-pressed={activeStyleId === pen.id}
						disabled={busy}
						onclick={() => onApplyStyle(pen.id)}
					>
						<span class="pen-dot" data-style-id={pen.id} aria-hidden="true"></span>
					</button>
				{/each}
			</div>
			<span class="bar-divider" aria-hidden="true"></span>
			<div class="action-group" role="group" aria-label="Riscos">
				{#each strokes as stroke (stroke.id)}
					<button
						type="button"
						class="tool-action"
						aria-label={stroke.label}
						title={stroke.label}
						aria-pressed={activeStyleId === stroke.id}
						disabled={busy}
						onclick={() => onApplyStyle(stroke.id)}
					>
						{#if stroke.kind === 'underline'}
							<Underline size={17} strokeWidth={1.8} aria-hidden="true" />
						{:else if stroke.kind === 'wavy'}
							<svg
								class="wavy-icon"
								viewBox="0 0 18 6"
								aria-hidden="true"
								width="17"
								height="8"
							>
								<path
									d="M0 3 C1.5 0.5 3 5.5 4.5 3 S7.5 0.5 9 3 10.5 5.5 12 3 13.5 0.5 15 3 16.5 5.5 18 3"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
						{:else}
							<Square size={15} strokeWidth={1.8} aria-hidden="true" />
						{/if}
					</button>
				{/each}
				<button
					type="button"
					class="tool-action"
					aria-label="Apagar destaque"
					title="Apagar destaque"
					disabled={busy}
					onclick={onErase}
				>
					<Eraser size={17} strokeWidth={1.8} aria-hidden="true" />
				</button>
			</div>
			<span class="bar-divider" aria-hidden="true"></span>
			<div class="action-group" role="group" aria-label="Copiar e anotar">
				<button
					type="button"
					class="tool-action"
					aria-label="Copiar referência"
					title="Copiar referência"
					disabled={busy}
					onclick={onCopyReference}
				>
					<Link size={17} strokeWidth={1.8} aria-hidden="true" />
				</button>
				<button
					type="button"
					class="tool-action"
					aria-label="Copiar texto e referência"
					title="Copiar texto e referência"
					disabled={busy}
					onclick={onCopyText}
				>
					<Copy size={17} strokeWidth={1.8} aria-hidden="true" />
				</button>
				<button
					type="button"
					class="tool-action"
					aria-label="Criar nota"
					title="Criar nota"
					disabled={busy}
					onclick={onCreateNote}
				>
					<NotebookPen size={17} strokeWidth={1.8} aria-hidden="true" />
				</button>
			</div>
		</div>
		{#if errorMessage}
			<p role="alert" class="bar-error">{errorMessage}</p>
		{/if}
	</div>
{/if}

<style>
	.selection-bar {
		--pen-gold: #d9a441;
		--pen-mint: #4f9d69;
		--pen-sky: #4f83c2;
		--pen-rose: #c4657f;
		--pen-lilac: #8d7bc4;
		--swatch-alpha: 58%;

		position: fixed;
		right: 12px;
		bottom: calc(76px + env(safe-area-inset-bottom));
		left: 12px;
		z-index: 30;
		border: 1px solid var(--border);
		border-radius: 16px;
		background: var(--background);
		padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
		animation: bar-rise 180ms ease;
	}

	:global(.dark) .selection-bar {
		--swatch-alpha: 72%;

		border-color: #292929;
		background: #090909;
	}

	@keyframes bar-rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
	}

	.bar-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 0 6px 4px;
	}

	.bar-reference {
		overflow: hidden;
		min-width: 0;
		flex: 1;
		margin: 0;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.02em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar-close {
		display: flex;
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 999px;
		background: transparent;
		padding: 0;
		color: var(--muted-foreground);
		cursor: pointer;
	}

	.bar-close:hover {
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
		color: var(--foreground);
	}

	.bar-scroll {
		display: flex;
		align-items: center;
		gap: 10px;
		overflow-x: auto;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}

	.bar-scroll::-webkit-scrollbar {
		display: none;
	}

	.action-group {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 4px;
	}

	.bar-divider {
		flex-shrink: 0;
		width: 1px;
		height: 24px;
		background: var(--border);
	}

	.pen-action {
		display: flex;
		width: 40px;
		height: 40px;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 999px;
		background: transparent;
		padding: 0;
		cursor: pointer;
	}

	.pen-dot {
		display: block;
		width: 26px;
		height: 26px;
		border: 1px solid var(--border);
		border-radius: 999px;
	}

	/* Mesma mistura do popover: tinta sempre com `transparent` para não deslocar o matiz. */
	.pen-dot[data-style-id='pen-gold'] {
		background: color-mix(in oklch, var(--pen-gold) var(--swatch-alpha), transparent);
	}

	.pen-dot[data-style-id='pen-mint'] {
		background: color-mix(in oklch, var(--pen-mint) var(--swatch-alpha), transparent);
	}

	.pen-dot[data-style-id='pen-sky'] {
		background: color-mix(in oklch, var(--pen-sky) var(--swatch-alpha), transparent);
	}

	.pen-dot[data-style-id='pen-rose'] {
		background: color-mix(in oklch, var(--pen-rose) var(--swatch-alpha), transparent);
	}

	.pen-dot[data-style-id='pen-lilac'] {
		background: color-mix(in oklch, var(--pen-lilac) var(--swatch-alpha), transparent);
	}

	.pen-action[aria-pressed='true'] .pen-dot {
		border-color: var(--foreground);
		border-width: 2px;
	}

	.tool-action {
		display: flex;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		align-items: center;
		justify-content: center;
		border: 1px solid transparent;
		border-radius: 999px;
		background: transparent;
		padding: 0;
		color: var(--foreground);
		cursor: pointer;
	}

	.tool-action:hover:not(:disabled) {
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
	}

	.tool-action[aria-pressed='true'] {
		border-color: var(--foreground);
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
	}

	.tool-action:disabled,
	.pen-action:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.wavy-icon {
		display: block;
	}

	.bar-error {
		margin: 6px 0 0;
		color: var(--destructive);
		font-size: 0.72rem;
		line-height: 1.4;
	}

	.selection-bar:focus-visible,
	.bar-close:focus-visible,
	.pen-action:focus-visible,
	.tool-action:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.selection-bar {
			animation: none;
		}
	}
</style>
