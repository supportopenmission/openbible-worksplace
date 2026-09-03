<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		resolveNoteDisplayTitle,
		type VerseNoteSummary
	} from './reader-verse-notes';

	let {
		open,
		anchor,
		mobile,
		summaries,
		loading = false,
		errorMessage = '',
		onSelectNote,
		onViewAll,
		onClose
	}: {
		open: boolean;
		anchor: HTMLElement | null;
		mobile: boolean;
		summaries: VerseNoteSummary[];
		loading?: boolean;
		errorMessage?: string;
		onSelectNote: (summary: VerseNoteSummary) => void;
		onViewAll: () => void;
		onClose: () => void;
	} = $props();

	const viewportMargin = 12;
	const anchorGap = 8;

	let surface = $state<HTMLElement | null>(null);
	let top = $state(viewportMargin);
	let left = $state(viewportMargin);
	let focusedOnOpen = false;

	function updatePosition() {
		if (!open || mobile || !anchor || !surface || typeof window === 'undefined') return;
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

	async function focusFirstButton() {
		await tick();
		surface?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
	}

	$effect(() => {
		if (!open) {
			focusedOnOpen = false;
			return;
		}
		void anchor;
		void summaries;
		void loading;
		void tick().then(() => {
			if (!mobile) updatePosition();
			if (focusedOnOpen) return;
			focusedOnOpen = true;
			void focusFirstButton();
		});
	});

	$effect(() => {
		if (!open || mobile || typeof window === 'undefined') return;
		const dismiss = (event: PointerEvent) => {
			const target = event.target as HTMLElement | null;
			if (!target) return;
			if (surface?.contains(target)) return;
			if (anchor?.contains(target)) return;
			onClose();
		};
		window.addEventListener('pointerdown', dismiss, true);
		return () => window.removeEventListener('pointerdown', dismiss, true);
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !open) return;
		event.preventDefault();
		event.stopPropagation();
		onClose();
	}

</script>

<svelte:window onscroll={updatePosition} onresize={updatePosition} onkeydown={handleKeydown} />

{#snippet selectorBody()}
	<div class="selector-body">
		{#if loading}
			<p class="selector-status" aria-live="polite">Carregando…</p>
		{:else if summaries.length > 0}
			<div class="note-list" role="list">
				{#each summaries as summary (summary.id)}
					<Button
						variant="ghost"
						size="sm"
						class="note-item"
						disabled={loading}
						onclick={() => onSelectNote(summary)}
					>
						{resolveNoteDisplayTitle(summary)}
					</Button>
				{/each}
			</div>
		{/if}

		<div class="selector-footer">
			<Button variant="ghost" size="sm" class="view-all" disabled={loading} onclick={onViewAll}>
				Ver todas
			</Button>
		</div>

		{#if errorMessage}
			<p role="alert" class="selector-error">{errorMessage}</p>
		{/if}
	</div>
{/snippet}

{#if mobile}
	<Sheet.Root bind:open={() => open, (value) => { if (!value) onClose(); }}>
		<Sheet.Content
			side="bottom"
			class="verse-note-selector-sheet"
			role="dialog"
			aria-label="Notas do versículo"
			onkeydown={handleKeydown}
		>
			<Sheet.Header class="pb-0 text-left">
				<Sheet.Title>Notas do versículo</Sheet.Title>
			</Sheet.Header>
			<div bind:this={surface}>
				{@render selectorBody()}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{:else if open}
	<div
		bind:this={surface}
		class="verse-note-selector-popover"
		role="dialog"
		tabindex="-1"
		aria-label="Notas do versículo"
		style:top="{top}px"
		style:left="{left}px"
		onkeydown={handleKeydown}
	>
		{@render selectorBody()}
	</div>
{/if}

<style>
	.verse-note-selector-popover,
	:global(.verse-note-selector-sheet) {
		display: grid;
		gap: 8px;
	}

	.verse-note-selector-popover {
		position: fixed;
		z-index: 45;
		width: max-content;
		max-width: min(288px, calc(100vw - 24px));
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--background);
		padding: 10px;
		padding-bottom: calc(10px + env(safe-area-inset-bottom));
	}

	:global(.dark) .verse-note-selector-popover {
		border-color: #292929;
		background: #090909;
	}

	:global(.verse-note-selector-sheet) {
		border-radius: 12px 12px 0 0;
		padding-bottom: calc(16px + env(safe-area-inset-bottom));
	}

	.verse-note-selector-popover:focus-visible,
	.verse-note-selector-popover :global(button:focus-visible),
	:global(.verse-note-selector-sheet button:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: -1px;
	}

	.selector-body {
		display: grid;
		gap: 8px;
	}

	.selector-status {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.note-list {
		display: grid;
		gap: 2px;
	}

	.note-list :global([data-slot='button']),
	.selector-footer :global([data-slot='button']) {
		width: calc(100% + 16px);
		justify-content: flex-start;
		margin-inline: -8px;
		padding-inline: 8px;
		font-weight: 450;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.selector-footer {
		border-top: 1px solid var(--border);
		padding-top: 6px;
	}

	.selector-error {
		margin: 0;
		color: var(--destructive);
		font-size: 0.72rem;
		line-height: 1.4;
	}

	@media (prefers-reduced-motion: reduce) {
		.verse-note-selector-popover,
		.verse-note-selector-popover :global(button),
		:global(.verse-note-selector-sheet),
		:global(.verse-note-selector-sheet button) {
			transition: none !important;
		}
	}
</style>
