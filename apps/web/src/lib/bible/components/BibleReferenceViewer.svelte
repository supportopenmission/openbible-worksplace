<script lang="ts">
	import { onMount } from 'svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import type { BibleRepository } from '../repository/types';
	import { createDefaultBibleRepository } from '../repository/bible-repository';
	import { bibleReferenceViewer } from '../stores/bible-reference-viewer.svelte';
	import BibleReferenceModal from './BibleReferenceModal.svelte';
	import BibleReferenceDrawer from './BibleReferenceDrawer.svelte';

	let {
		storage,
		repository
	}: {
		storage?: WorkspaceStorage;
		repository?: BibleRepository;
	} = $props();

	const isMobile = new IsMobile();

	onMount(() => {
		if (repository) {
			bibleReferenceViewer.setRepository(repository);
		} else if (storage) {
			bibleReferenceViewer.setRepository(createDefaultBibleRepository(storage));
		}
	});

	$effect(() => {
		if (repository) {
			bibleReferenceViewer.setRepository(repository);
		} else if (storage) {
			bibleReferenceViewer.setRepository(createDefaultBibleRepository(storage));
		}
	});

	function handleClose() {
		bibleReferenceViewer.closeBibleReference();
	}
</script>

{#if isMobile.current}
	<BibleReferenceDrawer
		bind:open={bibleReferenceViewer.open}
		reference={bibleReferenceViewer.reference}
		passage={bibleReferenceViewer.passage}
		loading={bibleReferenceViewer.loading}
		error={bibleReferenceViewer.error}
		onClose={handleClose}
	/>
{:else}
	<BibleReferenceModal
		bind:open={bibleReferenceViewer.open}
		reference={bibleReferenceViewer.reference}
		passage={bibleReferenceViewer.passage}
		loading={bibleReferenceViewer.loading}
		error={bibleReferenceViewer.error}
		onClose={handleClose}
	/>
{/if}
