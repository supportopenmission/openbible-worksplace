<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import {
		Bold,
		CheckSquare,
		ChevronDown,
		ChevronUp,
		Heading1,
		Italic,
		List,
		ListOrdered,
		PanelTop,
		Quote,
		BookOpen
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { ToolbarAction } from './milkdown-markdown-io';

	let {
		active = true,
		enabled = true,
		visible = true,
		disabled = false,
		activeActions = {},
		onAction = () => {},
		onToggle = () => {}
	}: {
		active?: boolean;
		enabled?: boolean;
		visible?: boolean;
		disabled?: boolean;
		activeActions?: Partial<Record<ToolbarAction, boolean>>;
		onAction?: (action: ToolbarAction) => void;
		onToggle?: () => void;
	} = $props();

	let reducedMotion = $state(false);

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => (reducedMotion = media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	});

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

	const toolbarGroups = [
		{ label: 'Texto', actions: [actions[0], actions[1]] },
		{ label: 'Blocos', actions: [actions[2], actions[3], actions[4], actions[5], actions[6]] },
		{ label: 'Inserir', actions: [actions[7]] }
	] as const;
</script>

{#if active && enabled}
	{#if visible}
		<div
			transition:slide={{ duration: reducedMotion ? 0 : 180 }}
			id="note-formatting-toolbar"
			class="milkdown-toolbar"
			role="toolbar"
			aria-label="Formatação da nota"
		>
			<div class="toolbar-scroll">
				{#each toolbarGroups as group, groupIndex (group.label)}
					<div class="toolbar-group" aria-label={group.label}>
						{#each group.actions as action (action.id)}
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={action.label}
								aria-pressed={activeActions[action.id] ?? false}
								{disabled}
								class={activeActions[action.id] ? 'toolbar-action active' : 'toolbar-action'}
								title={action.label}
								onmousedown={(e) => e.preventDefault()}
								onclick={() => onAction(action.id)}
							>
								<action.icon size={17} strokeWidth={1.8} aria-hidden="true" />
							</Button>
						{/each}
					</div>
					{#if groupIndex < toolbarGroups.length - 1}
						<div class="toolbar-separator" role="separator" aria-orientation="vertical"></div>
					{/if}
				{/each}
				<div class="toolbar-separator" role="separator" aria-orientation="vertical"></div>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					class="toolbar-collapse"
					aria-label="Recolher barra de ferramentas"
					aria-expanded="true"
					title="Recolher barra de ferramentas"
					onmousedown={(e) => e.preventDefault()}
					onclick={onToggle}
				>
					<ChevronUp size={16} strokeWidth={1.8} aria-hidden="true" />
				</Button>
			</div>
		</div>
	{:else}
		<Button
			type="button"
			variant="outline"
			size="sm"
			class="milkdown-toolbar-toggle"
			aria-label="Abrir ferramentas de formatação"
			aria-expanded="false"
			aria-controls="note-formatting-toolbar"
			title="Abrir ferramentas de formatação"
			onmousedown={(e) => e.preventDefault()}
			onclick={onToggle}
		>
			<PanelTop size={16} strokeWidth={1.8} aria-hidden="true" />
			<span>Formatar</span>
			<ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
		</Button>
	{/if}
{/if}

<style>
	.milkdown-toolbar {
		position: sticky;
		top: 0;
		right: 0;
		left: 0;
		z-index: 45;
		width: 100%;
		display: block;
		overflow: hidden;
		border-bottom: 1px solid var(--border);
		background: var(--background);
	}

	:global(.milkdown-toolbar-toggle) {
		display: flex;
		position: sticky;
		width: fit-content;
		max-width: 100%;
		margin-inline-start: auto;
		margin-inline-end: 0;
		inset: auto;
		z-index: 45;
		height: 36px;
		min-width: 92px;
		border-radius: 0 0 8px 8px;
		border-color: var(--border);
		background: var(--background);
		color: var(--foreground);
		font-size: 0.8125rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		transition: background-color 120ms ease;
	}

	:global(.milkdown-toolbar-toggle:hover) {
		background: var(--muted);
	}

	.toolbar-scroll {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		overflow-x: auto;
		min-height: 52px;
		padding: 6px max(12px, env(safe-area-inset-left, 0px)) 6px
			max(12px, env(safe-area-inset-right, 0px));
		scrollbar-width: none;
	}

	.toolbar-scroll::-webkit-scrollbar {
		display: none;
	}

	.toolbar-group {
		display: flex;
		align-items: center;
		gap: 2px;
		flex: 0 0 auto;
	}

	.toolbar-separator {
		width: 1px;
		height: 24px;
		background: var(--border);
		margin: 0 7px;
		flex-shrink: 0;
	}

	:global(.milkdown-toolbar .toolbar-action) {
		flex: 0 0 auto;
		height: 40px;
		min-width: 40px;
		border-radius: calc(var(--radius) - 2px);
		color: var(--muted-foreground);
		transition:
			background-color 120ms ease,
			color 120ms ease;
	}

	:global(.milkdown-toolbar .toolbar-action:hover) {
		background: var(--muted);
		color: var(--foreground);
	}

	:global(.milkdown-toolbar .toolbar-action[aria-pressed='true']) {
		background: var(--accent);
		color: var(--accent-foreground);
		box-shadow: inset 0 0 0 1px var(--border);
	}

	:global(.milkdown-toolbar .toolbar-collapse) {
		align-self: center;
		flex: 0 0 auto;
		margin-inline-start: auto;
		height: 32px;
		width: 36px;
		min-width: 32px;
		border-radius: calc(var(--radius) - 2px);
		padding: 0;
	}

	@media (max-width: 767px) {
		.milkdown-toolbar {
			display: block;
		}

		:global(.milkdown-toolbar-toggle) {
			display: flex;
			position: sticky;
			top: env(safe-area-inset-top, 0px);
			right: auto;
			bottom: auto;
			margin-inline-start: auto;
			margin-inline-end: 0;
		}

		.toolbar-scroll {
			justify-content: flex-start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.milkdown-toolbar-toggle) {
			transition: none;
		}

		.toolbar-scroll {
			scroll-behavior: auto;
		}
	}
</style>
