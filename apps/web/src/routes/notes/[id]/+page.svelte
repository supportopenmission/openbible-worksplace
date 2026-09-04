<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ChevronLeft } from '@lucide/svelte';
	import NoteCanvasEditor from '$lib/features/notes/NoteCanvasEditor.svelte';
	import { notePageChrome } from '$lib/features/notes/note-page-chrome.svelte';
	import { createNote, readNote } from '$lib/features/notes/notes-repository';
	import { serializeNoteFile } from '$lib/features/notes/note-markdown';
	import type { Note } from '$lib/features/notes/note-types';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';

	let {
		data,
		storageOverride
	}: {
		data?: { noteId: string };
		storageOverride?: WorkspaceStorage;
	} = $props();

	const workspace = getWorkspaceState();
	const noteId = $derived(data?.noteId ?? page.params.id);

	let note = $state<Note | null>(null);
	let activeStorage = $state<WorkspaceStorage | null>(null);
	let loading = $state(true);
	let error = $state('');

	async function seedFallbackNote(id: string): Promise<WorkspaceStorage> {
		const files = new Map<string, Uint8Array>();
		const encoder = new TextEncoder();

		const fallback: WorkspaceStorage = {
			kind: 'opfs',
			label: 'Memória local',
			async ensureDirectory() {},
			async writeFile(path, content) {
				files.set(path, typeof content === 'string' ? encoder.encode(content) : content);
			},
			async readFile(path) {
				return files.get(path) ?? null;
			},
			async fileExists(path) {
				return files.has(path);
			},
			async deleteFile(path) {
				files.delete(path);
			},
			async listFiles(dir) {
				const prefix = `${dir.replace(/\/$/, '')}/`;
				return [...files.keys()]
					.filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
					.map((file) => file.slice(prefix.length));
			}
		};

		const now = new Date().toISOString();
		const path = `notes/${id}.md`;
		const parsed = serializeNoteFile({
			meta: {
				id,
				title: 'Nova nota',
				createdAt: now,
				updatedAt: now,
				type: 'note',
				path
			},
			body: '\n# Nova nota\n'
		});
		await fallback.writeFile(path, parsed);
		return fallback;
	}

	onMount(async () => {
		notePageChrome.activate();
		loading = true;
		error = '';
		try {
			const resolvedStorage = storageOverride ?? workspace?.storage ?? null;

			if (resolvedStorage) {
				activeStorage = resolvedStorage;
				note = await readNote(resolvedStorage, noteId);
			} else if (data?.noteId) {
				activeStorage = await seedFallbackNote(noteId);
				note = await readNote(activeStorage, noteId);
			} else {
				let loaded = await readNote(noteId);
				if (!loaded) {
					loaded = await createNote();
				}
				note = loaded;
				activeStorage = storageOverride ?? workspace?.storage ?? null;
			}

			if (!note) {
				error = 'Nota não encontrada';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Não foi possível carregar a nota.';
		} finally {
			loading = false;
		}
	});

	$effect(() => {
		if (note?.title) notePageChrome.updateTitle(note.title);
	});

	onDestroy(() => {
		notePageChrome.deactivate();
	});

	function handleSaved(saved: Note) {
		note = saved;
		notePageChrome.updateTitle(saved.title);
	}
</script>

<svelte:head>
	<title>{note?.title ?? 'Nota'} | OpenBible</title>
</svelte:head>

<div class="note-page">
	<div class="note-back">
		<a href={resolve('/notes')} aria-label="Voltar para todas as notas">
			<ChevronLeft size={17} strokeWidth={2} aria-hidden="true" />
			<span>Todas as notas</span>
		</a>
	</div>
	{#if loading}
		<p class="state-message" role="status">Carregando nota…</p>
	{:else if error || !note || !activeStorage}
		<p class="state-message error" role="alert">{error || 'Nota não encontrada'}</p>
	{:else}
		<NoteCanvasEditor {note} storage={activeStorage} onSaved={handleSaved} />
	{/if}
</div>

<style>
	.note-page {
		padding: 8px 0 80px;
	}

	.note-back {
		display: none;
	}

	@media (max-width: 767px) {
		.note-back {
			display: block;
			padding: 12px 16px 0;
		}

		.note-back a {
			display: inline-flex;
			align-items: center;
			gap: 2px;
			margin-left: -6px;
			padding: 6px;
			color: var(--muted-foreground);
			font-size: 0.85rem;
			font-weight: 500;
			text-decoration: none;
		}

		.note-back a:active {
			color: var(--foreground);
		}
	}

	.state-message {
		max-width: 760px;
		margin: 24px auto 0;
		padding: 0 clamp(16px, 4vw, 24px);
		color: var(--muted-foreground);
		font-size: 0.9375rem;
	}

	.state-message.error {
		color: var(--destructive);
	}
</style>
