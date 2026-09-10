<!--
Ponto único de escolha do motor do editor de notas.

Lê a preferência `editorEngine` do workspace (`milkdown`, estável e
padrão, ou `edra`, novo motor em migração gradativa) e renderiza o
editor correspondente com as mesmas props. Ambos persistem o mesmo
Markdown canônico no backend operacional (SQLite `app.sqlite` no Tauri,
IndexedDB no PWA), então a troca não migra nem converte dados.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import { resolveEditorEngine } from '$lib/storage/preferences';
	import type { Note } from './note-types';
	import type { SaveStatus } from './note-editor-service';
	import type { NoteHeading } from './note-index';
	import MilkdownNoteEditor from './MilkdownNoteEditor.svelte';
	import EdraNoteEditor from './EdraNoteEditor.svelte';

	let {
		note,
		storage,
		readOnly = false,
		toolbarEnabled = true,
		toolbarPinned = false,
		aboveTitle,
		onSaved,
		onStatusChange,
		onHeadings
	}: {
		note: Note;
		storage: WorkspaceStorage;
		readOnly?: boolean;
		toolbarEnabled?: boolean;
		toolbarPinned?: boolean;
		aboveTitle?: Snippet;
		onSaved?: (note: Note) => void;
		onStatusChange?: (status: SaveStatus) => void;
		onHeadings?: (headings: NoteHeading[]) => void;
	} = $props();

	const workspace = getWorkspaceState();
	const engine = $derived(resolveEditorEngine(workspace?.preferences));
</script>

{#key engine}
	{#if engine === 'edra'}
		<EdraNoteEditor
			{note}
			{storage}
			{readOnly}
			{toolbarEnabled}
			{toolbarPinned}
			{aboveTitle}
			{onSaved}
			{onStatusChange}
			{onHeadings}
		/>
	{:else}
		<MilkdownNoteEditor
			{note}
			{storage}
			{readOnly}
			{toolbarEnabled}
			{toolbarPinned}
			{aboveTitle}
			{onSaved}
			{onStatusChange}
			{onHeadings}
		/>
	{/if}
{/key}
