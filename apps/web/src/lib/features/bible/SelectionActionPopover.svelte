<script lang="ts">
	import { tick } from 'svelte';
	import { Copy, Eraser, Link, NotebookPen, Square, Underline, X } from '@lucide/svelte';
	import { READER_HIGHLIGHT_PALETTE } from './reader-highlights';

	let {
		open,
		anchor,
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
		anchor: HTMLElement | null;
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

	const viewportMargin = 12;
	const anchorGap = 8;

	let surface = $state<HTMLDivElement | null>(null);
	let top = $state(viewportMargin);
	let left = $state(viewportMargin);
	let focusedOnOpen = false;

	function updatePosition() {
		if (!open || !anchor || !surface || typeof window === 'undefined') return;
		const target = anchor.getBoundingClientRect();
		const box = surface.getBoundingClientRect();
		const maxLeft = Math.max(viewportMargin, window.innerWidth - box.width - viewportMargin);
		const maxTop = Math.max(viewportMargin, window.innerHeight - box.height - viewportMargin);
		const below = target.bottom + anchorGap;
		const fitsBelow = below + box.height + viewportMargin <= window.innerHeight;

		left = Math.min(Math.max(target.left, viewportMargin), maxLeft);
		top = Math.min(
			Math.max(fitsBelow ? below : target.top - anchorGap - box.height, viewportMargin),
			maxTop
		);
	}

	$effect(() => {
		if (!open) {
			focusedOnOpen = false;
			return;
		}
		void anchor;
		void tick().then(() => {
			updatePosition();
			if (focusedOnOpen) return;
			focusedOnOpen = true;
			surface?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
		});
	});

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
		if (event.key !== 'Escape') return;
		event.preventDefault();
		event.stopPropagation();
		onClose();
	}
</script>

<svelte:window onscroll={updatePosition} onresize={updatePosition} />

{#if open}
	<div
		bind:this={surface}
		class="selection-popover"
		role="dialog"
		tabindex="-1"
		aria-label={`Ações para ${referenceLabel}`}
		style:top="{top}px"
		style:left="{left}px"
		onkeydown={handleKeydown}
	>
		<div class="popover-header">
			<p class="popover-reference">{referenceLabel}</p>
			<button
				type="button"
				class="popover-close"
				onclick={onClose}
				aria-label="Fechar ações do versículo"
				title="Fechar"
			>
				<X size={14} strokeWidth={2} aria-hidden="true" />
			</button>
		</div>

		<div class="popover-toolbar">
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

			<span class="popover-divider" aria-hidden="true"></span>

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
							<Underline size={15} strokeWidth={1.8} aria-hidden="true" />
						{:else if stroke.kind === 'wavy'}
							<svg
								class="wavy-icon"
								viewBox="0 0 18 6"
								aria-hidden="true"
								width="15"
								height="7"
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
							<Square size={13} strokeWidth={1.8} aria-hidden="true" />
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
					<Eraser size={15} strokeWidth={1.8} aria-hidden="true" />
				</button>
			</div>

			<span class="popover-divider" aria-hidden="true"></span>

			<div class="action-group" role="group" aria-label="Copiar e anotar">
				<button
					type="button"
					class="tool-action"
					aria-label="Copiar referência"
					title="Copiar referência"
					disabled={busy}
					onclick={onCopyReference}
				>
					<Link size={15} strokeWidth={1.8} aria-hidden="true" />
				</button>
				<button
					type="button"
					class="tool-action"
					aria-label="Copiar texto e referência"
					title="Copiar texto e referência"
					disabled={busy}
					onclick={onCopyText}
				>
					<Copy size={15} strokeWidth={1.8} aria-hidden="true" />
				</button>
				<button
					type="button"
					class="tool-action"
					aria-label="Criar nota"
					title="Criar nota"
					disabled={busy}
					onclick={onCreateNote}
				>
					<NotebookPen size={15} strokeWidth={1.8} aria-hidden="true" />
				</button>
			</div>
		</div>

		{#if errorMessage}
			<p role="alert" class="popover-error">{errorMessage}</p>
		{/if}
	</div>
{/if}

<style>
	.selection-popover {
		--pen-gold: #d9a441;
		--pen-mint: #4f9d69;
		--pen-sky: #4f83c2;
		--pen-rose: #c4657f;
		--pen-lilac: #8d7bc4;
		--swatch-alpha: 58%;

		position: fixed;
		z-index: 45;
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: max-content;
		max-width: min(440px, calc(100vw - 24px));
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--background);
		padding: 8px 10px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		pointer-events: none;
		animation: popover-fade 120ms ease;
	}

	@keyframes popover-fade {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.selection-popover :global(button) {
		pointer-events: auto;
	}

	:global(.dark) .selection-popover {
		--swatch-alpha: 72%;

		border-color: #292929;
		background: #090909;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
	}

	.popover-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 0 2px 2px;
	}

	.popover-reference {
		margin: 0;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.popover-close {
		display: flex;
		flex-shrink: 0;
		width: 22px;
		height: 22px;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 4px;
		background: transparent;
		padding: 0;
		color: var(--muted-foreground);
		cursor: pointer;
		transition: background-color 0.12s ease, color 0.12s ease;
	}

	.popover-close:hover {
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
		color: var(--foreground);
	}

	.popover-toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.popover-toolbar::-webkit-scrollbar {
		display: none;
	}

	.action-group {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 3px;
	}

	.popover-divider {
		flex-shrink: 0;
		width: 1px;
		height: 20px;
		background: var(--border);
	}

	.pen-action {
		display: flex;
		width: 30px;
		height: 30px;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 999px;
		background: transparent;
		padding: 0;
		cursor: pointer;
		transition: transform 0.1s ease;
	}

	.pen-action:hover:not(:disabled) {
		transform: scale(1.08);
	}

	.pen-dot {
		display: block;
		width: 20px;
		height: 20px;
		border: 1px solid var(--border);
		border-radius: 999px;
	}

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
		width: 30px;
		height: 30px;
		align-items: center;
		justify-content: center;
		border: 1px solid transparent;
		border-radius: 6px;
		background: transparent;
		padding: 0;
		color: var(--foreground);
		cursor: pointer;
		transition: background-color 0.12s ease, border-color 0.12s ease;
	}

	.tool-action:hover:not(:disabled) {
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
	}

	.tool-action[aria-pressed='true'] {
		border-color: var(--foreground);
		background: color-mix(in oklch, var(--foreground) 10%, transparent);
	}

	.tool-action:disabled,
	.pen-action:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.wavy-icon {
		display: block;
	}

	.popover-error {
		margin: 4px 0 0;
		color: var(--destructive);
		font-size: 0.72rem;
		line-height: 1.4;
	}

	.selection-popover:focus-visible,
	.popover-close:focus-visible,
	.pen-action:focus-visible,
	.tool-action:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.selection-popover {
			animation: none;
		}
	}
</style>
