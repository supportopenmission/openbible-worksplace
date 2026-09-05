<script lang="ts">
	import {
		Bold,
		CheckSquare,
		Heading1,
		Italic,
		List,
		ListOrdered,
		Quote,
		BookOpen,
		X
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { ToolbarAction } from './milkdown-markdown-io';

	let {
		active = true,
		visible = true,
		disabled = false,
		activeActions = {},
		onAction = () => {},
		onToggle = () => {},
		onClose = () => {}
	}: {
		active?: boolean;
		visible?: boolean;
		disabled?: boolean;
		activeActions?: Partial<Record<ToolbarAction, boolean>>;
		onAction?: (action: ToolbarAction) => void;
		onToggle?: () => void;
		onClose?: () => void;
	} = $props();

	const actions = [
		{ id: 'bold', label: 'Negrito', icon: Bold },
		{ id: 'italic', label: 'Itálico', icon: Italic },
		{ id: 'heading', label: 'Título', icon: Heading1 },
		{ id: 'bullet', label: 'Lista', icon: List },
		{ id: 'ordered', label: 'Lista numerada', icon: ListOrdered },
		{ id: 'task', label: 'Checklist', icon: CheckSquare },
		{ id: 'quote', label: 'Citação', icon: Quote },
		{ id: 'verse', label: 'Versículo', icon: BookOpen }
	] as const;
</script>

{#if active}
	{#if visible}
		<div class="milkdown-toolbar" role="toolbar" aria-label="Formatação da nota">
			<div class="toolbar-scroll">
				{#each actions as action (action.id)}
					{#if action.id === 'heading' || action.id === 'verse'}
						<div class="toolbar-separator" role="separator" aria-orientation="vertical"></div>
					{/if}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-label={action.label}
						aria-pressed={activeActions[action.id] ?? false}
						{disabled}
						class={activeActions[action.id] ? 'active' : undefined}
						title={action.label}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => onAction(action.id)}
					>
						<action.icon size={16} strokeWidth={1.8} aria-hidden="true" />
						<span>{action.label}</span>
					</Button>
				{/each}
				<div class="toolbar-separator" role="separator" aria-orientation="vertical"></div>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					class="toolbar-close"
					aria-label="Fechar barra de ferramentas"
					title="Fechar barra de ferramentas"
					onmousedown={(e) => e.preventDefault()}
					onclick={onClose}
				>
					<X size={15} strokeWidth={1.8} aria-hidden="true" />
				</Button>
			</div>
		</div>
	{:else}
		<Button
			type="button"
			variant="outline"
			size="icon"
			class="milkdown-toolbar-fab"
			aria-label="Abrir ferramentas de formatação"
			aria-expanded="false"
			title="Abrir ferramentas de formatação"
			onmousedown={(e) => e.preventDefault()}
			onclick={onToggle}
		>
			<List size={18} strokeWidth={1.8} aria-hidden="true" />
		</Button>
	{/if}
{/if}

<style>
	.milkdown-toolbar {
		position: fixed;
		right: 0;
		left: 0;
		z-index: 45;
		bottom: max(calc(58px + env(safe-area-inset-bottom, 0px)), var(--note-keyboard-inset, 0px));
		display: none;
		border-top: 1px solid var(--border);
		background: color-mix(in oklch, var(--background) 95%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: 0 -1px 4px color-mix(in oklch, var(--foreground) 4%, transparent);
		transition: bottom 180ms ease;
	}

	:global(.milkdown-toolbar-fab) {
		position: fixed;
		right: max(16px, env(safe-area-inset-right, 0px));
		bottom: max(calc(68px + env(safe-area-inset-bottom, 0px)), var(--note-keyboard-inset, 0px));
		z-index: 45;
		width: 40px;
		height: 40px;
		border-radius: 999px;
		border-color: var(--border);
		background: color-mix(in oklch, var(--background) 92%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 2px 8px color-mix(in oklch, var(--foreground) 10%, transparent);
		transition:
			bottom 180ms ease,
			background-color 120ms ease,
			transform 120ms ease;
	}

	:global(.milkdown-toolbar-fab:hover) {
		background: color-mix(in oklch, var(--foreground) 8%, transparent);
		transform: scale(1.04);
	}

	.toolbar-scroll {
		display: flex;
		align-items: center;
		gap: 2px;
		overflow-x: auto;
		padding: 4px max(8px, env(safe-area-inset-left, 0px));
		scrollbar-width: none;
	}

	.toolbar-scroll::-webkit-scrollbar {
		display: none;
	}

	.toolbar-separator {
		width: 1px;
		height: 20px;
		background: var(--border);
		margin: 0 3px;
		flex-shrink: 0;
	}

	:global(.milkdown-toolbar button) {
		flex: 0 0 auto;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		height: 40px;
		min-width: 44px;
		padding: 4px 6px;
		border-radius: 6px;
		font-size: 0.65rem;
		font-weight: 500;
		line-height: 1;
		color: var(--muted-foreground);
		transition: background-color 120ms ease, color 120ms ease;
	}

	:global(.milkdown-toolbar button:hover) {
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
		color: var(--foreground);
	}

	:global(.milkdown-toolbar button:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	:global(.milkdown-toolbar .toolbar-close) {
		align-self: center;
		flex: 0 0 auto;
		margin-inline-start: 2px;
		height: 32px;
		width: 32px;
		min-width: 32px;
		border-radius: 6px;
		padding: 0;
	}

	:global(.milkdown-toolbar button.active) {
		background: color-mix(in oklch, var(--foreground) 10%, transparent);
		color: var(--foreground);
		font-weight: 600;
	}

	@media (max-width: 767px) {
		.milkdown-toolbar,
		:global(.milkdown-toolbar-fab) {
			display: block;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.milkdown-toolbar,
		:global(.milkdown-toolbar-fab) {
			transition: none;
		}

		.toolbar-scroll {
			scroll-behavior: auto;
		}
	}
</style>
