<script lang="ts">
	import { Bold, Highlighter, Italic, Underline } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		formatPopoverActions,
		type FormatPopoverAction
	} from './selection-popover';

	let {
		visible = false,
		top = 0,
		left = 0,
		pressed = {},
		onAction = () => {},
		onClose = () => {}
	}: {
		visible?: boolean;
		top?: number;
		left?: number;
		pressed?: Partial<Record<FormatPopoverAction, boolean>>;
		onAction?: (action: FormatPopoverAction) => void;
		onClose?: () => void;
	} = $props();

	const items = [
		{ id: 'bold', label: 'Negrito', icon: Bold },
		{ id: 'italic', label: 'Itálico', icon: Italic },
		{ id: 'underline', label: 'Sublinhado', icon: Underline },
		{ id: 'highlight', label: 'Destaque', icon: Highlighter }
	] as const;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	}
</script>

{#if visible}
	<div
		class="format-popover"
		role="toolbar"
		aria-label="Formatação da seleção"
		tabindex="-1"
		style:top={`${top}px`}
		style:left={`${left}px`}
		onkeydown={handleKeydown}
	>
		{#each items as item (item.id)}
			{@const active = pressed[item.id] ?? false}
			{@const known = (formatPopoverActions() as readonly string[]).includes(item.id)}
			{#if known}
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={item.label}
					aria-pressed={active}
					class={active ? 'format-action active' : 'format-action'}
					title={item.label}
					onmousedown={(e) => e.preventDefault()}
					onclick={() => onAction(item.id)}
				>
					<item.icon size={16} strokeWidth={1.8} aria-hidden="true" />
				</Button>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.format-popover {
		position: fixed;
		z-index: 60;
		display: flex;
		gap: 2px;
		align-items: center;
		padding: 4px;
		background-color: var(--background);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		transform: translate(-50%, calc(-100% - 8px));
	}

	.format-popover :global(.format-action) {
		border-radius: var(--radius-md);
	}

	.format-popover :global(.format-action.active) {
		background-color: var(--muted);
	}
</style>
