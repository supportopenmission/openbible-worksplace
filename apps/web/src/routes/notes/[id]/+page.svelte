<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import NoteCanvasEditor from '$lib/features/notes/NoteCanvasEditor.svelte';
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

	function handleSaved(saved: Note) {
		note = saved;
	}
</script>

<svelte:head>
	<title>{note?.title ?? 'Nota'} | OpenBible</title>
</svelte:head>

<div class="note-page">
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href={resolve('/notes')}>Notas</a>
		<span aria-hidden="true">/</span>
		<span aria-current="page">{note?.title ?? 'Nota'}</span>
	</nav>

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

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 9px;
		max-width: 760px;
		margin: 0 auto 24px;
		padding: 0 clamp(16px, 4vw, 24px);
		color: var(--muted-foreground);
		font-size: 0.72rem;
	}

	.breadcrumb a {
		color: var(--foreground);
		font-weight: 500;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
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
