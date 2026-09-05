<script lang="ts">
	import { List } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import type { NoteHeading } from './note-index';

	let {
		headings = [],
		onNavigate = () => {}
	}: {
		headings?: NoteHeading[];
		onNavigate?: (anchor: string) => void;
	} = $props();

	const isMobile = new IsMobile();
	let drawerOpen = $state(false);

	function navigate(anchor: string) {
		drawerOpen = false;
		onNavigate(anchor);
	}
</script>

{#if isMobile.current}
	<Button
		type="button"
		variant="ghost"
		size="icon-sm"
		aria-label="Índices da nota"
		title="Índices da nota"
		onclick={() => (drawerOpen = true)}
	>
		<List size={16} strokeWidth={1.8} aria-hidden="true" />
	</Button>
	<Sheet.Root bind:open={drawerOpen}>
		<Sheet.Content side="bottom" class="note-index-drawer">
			<Sheet.Header>
				<Sheet.Title>Índices</Sheet.Title>
				<Sheet.Description>Navegue até uma seção da nota.</Sheet.Description>
			</Sheet.Header>
			{#if headings.length === 0}
				<p class="index-empty" role="status">Nenhum título nesta nota. Use # para criar seções.</p>
			{:else}
				<ul class="index-list">
					{#each headings as heading (heading.anchor)}
						<li>
							<button
								type="button"
								class="index-item"
								data-level={heading.level}
								onclick={() => navigate(heading.anchor)}
							>
								{heading.title}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Índice da nota"
					title="Índice da nota"
				>
					<List size={16} strokeWidth={1.8} aria-hidden="true" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="note-index-menu">
			<DropdownMenu.Label>Índice</DropdownMenu.Label>
			{#if headings.length === 0}
				<p class="index-empty" role="status">Nenhum título nesta nota. Use # para criar seções.</p>
			{:else}
				{#each headings as heading (heading.anchor)}
					<DropdownMenu.Item class="index-item" data-level={heading.level} onclick={() => navigate(heading.anchor)}>
						{heading.title}
					</DropdownMenu.Item>
				{/each}
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}

<style>
	.index-list {
		list-style: none;
		margin: 0;
		padding: 8px 0 16px;
		max-height: 60dvh;
		overflow-y: auto;
	}

	.index-item {
		display: block;
		width: 100%;
		text-align: start;
		font-size: 0.875rem;
		line-height: 1.5;
		padding: 8px 12px;
		border-radius: var(--radius-md);
		color: var(--foreground);
	}

	.index-item[data-level='2'] {
		padding-inline-start: 24px;
	}

	.index-item[data-level='3'] {
		padding-inline-start: 36px;
		color: var(--muted-foreground);
	}

	.index-item:hover {
		background-color: var(--muted);
	}

	.index-empty {
		margin: 0;
		padding: 12px;
		font-size: 0.8125rem;
		color: var(--muted-foreground);
	}
</style>
