<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
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

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="bible-reference-modal" showCloseButton={false}>
		<Dialog.Title class="sr-only">Passagem Bíblica</Dialog.Title>
		<Dialog.Description class="sr-only">
			Visualização do texto bíblico da referência selecionada.
		</Dialog.Description>

		<BibleReferenceContent
			{reference}
			{passage}
			{loading}
			{error}
			onClose={() => handleOpenChange(false)}
		/>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.bible-reference-modal) {
		max-width: 540px;
		width: calc(100vw - 32px);
		padding: 24px;
		border-radius: var(--radius);
		background-color: var(--background);
		border: 1px solid var(--border);
	}
</style>
