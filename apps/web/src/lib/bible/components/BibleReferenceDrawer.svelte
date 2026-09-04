<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import type { BibleReference } from '../parser/types';
	import type { BiblePassage } from '../repository/types';
	import BibleReferenceContent from './BibleReferenceContent.svelte';

	let {
		open = $bindable(false),
		reference,
		passage,
		loading = false,
		error = null,
		onClose
	}: {
		open?: boolean;
		reference: BibleReference | null;
		passage: BiblePassage | null;
		loading?: boolean;
		error?: string | null;
		onClose?: () => void;
	} = $props();

	function handleOpenChange(nextOpen: boolean) {
		open = nextOpen;
		if (!nextOpen) {
			onClose?.();
		}
	}
</script>

<Drawer.Root {open} onOpenChange={handleOpenChange}>
	<Drawer.Content class="bible-reference-drawer">
		<div class="drawer-handle" aria-hidden="true"></div>

		<Drawer.Header class="sr-only">
			<Drawer.Title>Passagem Bíblica</Drawer.Title>
			<Drawer.Description>
				Visualização da passagem bíblica selecionada no mobile.
			</Drawer.Description>
		</Drawer.Header>

		<div class="drawer-inner-content">
			<BibleReferenceContent
				{reference}
				{passage}
				{loading}
				{error}
			/>
		</div>
	</Drawer.Content>
</Drawer.Root>

<style>
	:global(.bible-reference-drawer) {
		max-height: 85dvh;
		padding-bottom: max(20px, env(safe-area-inset-bottom, 0px));
		background-color: var(--background);
		border-top: 1px solid var(--border);
	}

	.drawer-handle {
		width: 36px;
		height: 4px;
		background-color: var(--muted-foreground);
		opacity: 0.35;
		border-radius: 9999px;
		margin: 10px auto 4px;
	}

	.drawer-inner-content {
		padding: 12px 16px;
		overflow-y: auto;
	}
</style>
