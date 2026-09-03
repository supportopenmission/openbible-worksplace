<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
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

	/** A superfície é `fixed`: presa na viewport com 12px de folga e virada para cima
	 * quando não cabe abaixo do versículo âncora. O `padding-bottom` já embute
	 * `env(safe-area-inset-bottom)`, então a altura medida respeita a área segura. */
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
		<p class="popover-reference">{referenceLabel}</p>

		<div class="style-row" role="group" aria-label="Estilos de destaque">
			{#each pens as pen (pen.id)}
				<button
					type="button"
					class="pen-swatch"
					data-style-id={pen.id}
					aria-label={pen.label}
					aria-pressed={activeStyleId === pen.id}
					disabled={busy}
					onclick={() => onApplyStyle(pen.id)}
				></button>
			{/each}
		</div>

		<div class="style-row stroke-row" role="group" aria-label="Riscos">
			{#each strokes as stroke (stroke.id)}
				<button
					type="button"
					class="stroke-option"
					data-kind={stroke.kind}
					aria-label={stroke.label}
					aria-pressed={activeStyleId === stroke.id}
					disabled={busy}
					onclick={() => onApplyStyle(stroke.id)}
				>
					{stroke.kind === 'underline'
						? 'Sublinhado'
						: stroke.kind === 'wavy'
							? 'Ondulado'
							: 'Caixa'}
				</button>
			{/each}
		</div>

		<div class="style-row">
			<button type="button" class="stroke-option erase-option" disabled={busy} onclick={onErase}>
				Apagar
			</button>
		</div>

		<div class="popover-separator" role="presentation"></div>

		<div class="action-column">
			<Button variant="ghost" size="sm" disabled={busy} onclick={onCopyReference}>
				Copiar referência
			</Button>
			<Button variant="ghost" size="sm" disabled={busy} onclick={onCopyText}>
				Copiar texto e referência
			</Button>
			<Button variant="ghost" size="sm" disabled={busy} onclick={onCreateNote}>Criar nota</Button>
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
		display: grid;
		gap: 8px;
		width: max-content;
		max-width: min(288px, calc(100vw - 24px));
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--background);
		padding: 10px;
		padding-bottom: calc(10px + env(safe-area-inset-bottom));
		pointer-events: none;
	}

	.selection-popover :global(button) {
		pointer-events: auto;
	}

	:global(.dark) .selection-popover {
		--swatch-alpha: 72%;

		border-color: #292929;
		background: #090909;
	}

	.selection-popover:focus-visible,
	.selection-popover :global(button:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: -1px;
	}

	.popover-reference {
		margin: 0;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.02em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.style-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}

	.pen-swatch {
		width: 22px;
		height: 22px;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0;
		cursor: pointer;
	}

	/* A tinta é sempre misturada com `transparent`: em oklch, misturar com uma cor
	   opaca desloca o matiz (verde vira oliva, azul vira violeta). */
	.pen-swatch[data-style-id='pen-gold'] {
		background: color-mix(in oklch, var(--pen-gold) var(--swatch-alpha), transparent);
	}
	.pen-swatch[data-style-id='pen-mint'] {
		background: color-mix(in oklch, var(--pen-mint) var(--swatch-alpha), transparent);
	}
	.pen-swatch[data-style-id='pen-sky'] {
		background: color-mix(in oklch, var(--pen-sky) var(--swatch-alpha), transparent);
	}
	.pen-swatch[data-style-id='pen-rose'] {
		background: color-mix(in oklch, var(--pen-rose) var(--swatch-alpha), transparent);
	}
	.pen-swatch[data-style-id='pen-lilac'] {
		background: color-mix(in oklch, var(--pen-lilac) var(--swatch-alpha), transparent);
	}

	.pen-swatch[aria-pressed='true'] {
		border-color: var(--foreground);
		border-width: 2px;
	}

	.stroke-option {
		border: 1px solid var(--border);
		border-radius: 7px;
		background: transparent;
		padding: 4px 8px;
		color: var(--foreground);
		font: inherit;
		font-size: 0.72rem;
		line-height: 1.2;
		cursor: pointer;
	}

	.stroke-option[data-kind='underline'] {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.stroke-option[data-kind='wavy'] {
		text-decoration: underline;
		text-decoration-style: wavy;
		text-underline-offset: 3px;
	}

	.stroke-option[aria-pressed='true'] {
		border-color: var(--foreground);
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
	}

	.stroke-option:hover:not(:disabled) {
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
	}

	.stroke-option:disabled,
	.pen-swatch:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.erase-option {
		color: var(--muted-foreground);
	}

	.popover-separator {
		height: 1px;
		background: var(--border);
	}

	.action-column {
		display: grid;
		gap: 2px;
	}

	.action-column :global([data-slot='button']) {
		/* Alinha o rótulo com o cabeçalho e as canetas, mantendo a superfície de hover. */
		width: calc(100% + 16px);
		justify-content: flex-start;
		margin-inline: -8px;
		padding-inline: 8px;
		font-weight: 450;
	}

	.popover-error {
		margin: 0;
		color: var(--destructive);
		font-size: 0.72rem;
		line-height: 1.4;
	}

	@media (prefers-reduced-motion: reduce) {
		.selection-popover,
		.selection-popover :global(button) {
			transition: none !important;
		}
	}
</style>
