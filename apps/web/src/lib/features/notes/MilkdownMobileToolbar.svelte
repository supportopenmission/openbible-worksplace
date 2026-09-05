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
						<action.icon aria-hidden="true" />
						<span>{action.label}</span>
					</Button>
				{/each}
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
					<X aria-hidden="true" />
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
			<List aria-hidden="true" />
		</Button>
	{/if}
{/if}

<style>
	.milkdown-toolbar {
		position: fixed;
		right: 0;
		left: 0;
		z-index: 50;
		bottom: max(calc(64px + env(safe-area-inset-bottom, 0px)), var(--note-keyboard-inset, 0px));
		display: none;
		border-top: 1px solid var(--border);
		background: color-mix(in srgb, var(--background) 96%, transparent);
		backdrop-filter: blur(10px);
		transition: bottom 180ms ease;
	}

	:global(.milkdown-toolbar-fab) {
		position: fixed;
		right: max(12px, env(safe-area-inset-right, 0px));
		bottom: max(calc(64px + env(safe-area-inset-bottom, 0px)), var(--note-keyboard-inset, 0px));
		z-index: 50;
		width: 44px;
		height: 44px;
		border-color: var(--border);
		background: color-mix(in srgb, var(--background) 96%, transparent);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 2px 12px color-mix(in srgb, var(--foreground) 12%, transparent);
		transition:
			bottom 180ms ease,
			background-color 120ms ease;
	}

	.toolbar-scroll {
		display: flex;
		gap: 2px;
		overflow-x: auto;
		padding: 6px max(10px, env(safe-area-inset-left, 0px));
		scrollbar-width: none;
	}

	.toolbar-scroll::-webkit-scrollbar {
		display: none;
	}

	:global(.milkdown-toolbar button) {
		flex: 0 0 auto;
		flex-direction: column;
		gap: 1px;
		height: 44px;
		min-width: 48px;
		padding: 4px 8px;
		font-size: 0.6875rem;
		line-height: 1;
	}

	:global(.milkdown-toolbar button:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	:global(.milkdown-toolbar .toolbar-close) {
		align-self: center;
		flex: 0 0 auto;
		margin-inline: 4px;
	}

	:global(.milkdown-toolbar button.active) {
		background: var(--accent);
		color: var(--accent-foreground);
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
