<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { AlertCircle, BookOpen, Check, ChevronLeft, Loader2, MoreHorizontal, Pencil, Trash2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import MilkdownNoteEditor from '$lib/features/notes/MilkdownNoteEditor.svelte';
	import type { SaveStatus } from '$lib/features/notes/note-editor-service';
	import { notePageChrome } from '$lib/features/notes/note-page-chrome.svelte';
	import { createNote, readNote } from '$lib/features/notes/notes-repository';
	import { serializeNoteFile } from '$lib/features/notes/note-markdown';
	import { NOTE_EDITOR_WIDTHS, type NoteEditorWidth } from '$lib/features/notes/note-editor-layout';
	import { notesState } from '$lib/features/notes/notes-state.svelte';
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
	let currentLoadedId = $state<string | null>(null);
	let deleteDialogOpen = $state(false);
	let deleting = $state(false);
	let saveStatus = $state<SaveStatus>('idle');
	let lastSavedAt = $state<Date | null>(null);
	let readOnly = $state(false);

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

	async function loadNoteData(id: string) {
		loading = true;
		error = '';
		try {
			const resolvedStorage = storageOverride ?? workspace?.storage ?? null;

			if (resolvedStorage) {
				activeStorage = resolvedStorage;
				note = await readNote(resolvedStorage, id);
			} else if (data?.noteId) {
				activeStorage = await seedFallbackNote(id);
				note = await readNote(activeStorage, id);
			} else {
				let loaded = await readNote(id);
				if (!loaded) {
					loaded = await createNote();
				}
				note = loaded;
				activeStorage = storageOverride ?? workspace?.storage ?? null;
			}

			if (!note) {
				error = 'Nota não encontrada';
			} else {
				currentLoadedId = id;
				if (note.updatedAt) {
					lastSavedAt = new Date(note.updatedAt);
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Não foi possível carregar a nota.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		notePageChrome.activate();
		if (noteId) {
			void loadNoteData(noteId);
		}
	});

	$effect(() => {
		const targetId = noteId;
		if (targetId && targetId !== currentLoadedId) {
			void loadNoteData(targetId);
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
		lastSavedAt = new Date();
		notePageChrome.updateTitle(saved.title);
		notesState.updateNote(saved);
	}

	function handleStatusChange(status: SaveStatus) {
		saveStatus = status;
		if (status === 'saved') {
			lastSavedAt = new Date();
		}
	}

	function formatSavedTime(date: Date | null): string {
		if (!date || isNaN(date.getTime())) return '';
		return new Intl.DateTimeFormat('pt-BR', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function formatSavedFull(date: Date | null): string {
		if (!date || isNaN(date.getTime())) return '';
		return new Intl.DateTimeFormat('pt-BR', {
			dateStyle: 'medium',
			timeStyle: 'medium'
		}).format(date);
	}

	async function confirmDelete() {
		if (!activeStorage || !note || deleting) return;
		deleting = true;
		try {
			await notesState.deleteNote(activeStorage, note.id);
			deleteDialogOpen = false;
			await goto(resolve('/notes'));
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>{note?.title ?? 'Nota'} | OpenBible</title>
</svelte:head>

<div class="note-pane-container">
	<header class="note-pane-header">
		<div class="header-left">
			<a href={resolve('/notes')} class="mobile-back-link" aria-label="Voltar para todas as notas">
				<ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
				<span>Todas as notas</span>
			</a>
			{#if note}
				<div class="save-status-indicator" role="status" aria-live="polite">
					{#if saveStatus === 'saving'}
						<Loader2 size={12} class="animate-spin text-muted-foreground" aria-hidden="true" />
						<span class="status-text saving">Salvando…</span>
					{:else if saveStatus === 'error'}
						<AlertCircle size={12} class="text-destructive" aria-hidden="true" />
						<span class="status-text error">Erro ao salvar</span>
					{:else if lastSavedAt}
						<Check size={12} class="text-muted-foreground" aria-hidden="true" />
						<span class="status-text saved" title={`Salvo em ${formatSavedFull(lastSavedAt)}`}>
							Salvo às {formatSavedTime(lastSavedAt)}
						</span>
					{:else if saveStatus === 'saved'}
						<Check size={12} class="text-muted-foreground" aria-hidden="true" />
						<span class="status-text saved">Salvo</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="header-right">
			{#if note}
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={readOnly ? 'Alternar para modo de edição' : 'Alternar para modo de leitura'}
					title={readOnly ? 'Modo de leitura (clique para editar)' : 'Modo de edição (clique para ler)'}
					onclick={() => (readOnly = !readOnly)}
				>
					{#if readOnly}
						<Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
					{:else}
						<BookOpen size={15} strokeWidth={1.8} aria-hidden="true" />
					{/if}
				</Button>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label="Opções da nota"
								title="Opções da nota"
							>
								<MoreHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="note-options-menu">
						<DropdownMenu.Label>Largura do editor</DropdownMenu.Label>
						<DropdownMenu.RadioGroup
							value={notePageChrome.width}
							onValueChange={(value) => value && notePageChrome.setWidth(value as NoteEditorWidth)}
						>
							{#each Object.entries(NOTE_EDITOR_WIDTHS) as [id, option] (id)}
								<DropdownMenu.RadioItem value={id}>
									<span class="width-option">
										<span>{option.label}</span>
										<span class="width-option-desc">{option.description}</span>
									</span>
								</DropdownMenu.RadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							class="text-destructive focus:text-destructive"
							onclick={() => (deleteDialogOpen = true)}
						>
							<Trash2 size={14} class="mr-2" />
							<span>Apagar nota</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>
	</header>

	<div class="note-pane-body">
		{#if loading}
			<p class="state-message" role="status">Carregando nota…</p>
		{:else if error || !note || !activeStorage}
			<p class="state-message error" role="alert">{error || 'Nota não encontrada'}</p>
		{:else}
			<MilkdownNoteEditor
				{note}
				{readOnly}
				storage={activeStorage}
				onSaved={handleSaved}
				onStatusChange={handleStatusChange}
			/>
		{/if}
	</div>

	{#if note}
		<footer class="note-footer">
			<nav class="note-breadcrumb" aria-label="Navegação da nota">
				<a href={resolve('/notes')}>Todas as notas</a>
				<span class="breadcrumb-separator" aria-hidden="true">&gt;</span>
				<span class="breadcrumb-current" title={note.title}>{note.title || 'Sem título'}</span>
			</nav>
		</footer>
	{/if}
</div>

<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content showCloseButton={true}>
		<Dialog.Title>Apagar nota</Dialog.Title>
		<Dialog.Description>
			Tem certeza que deseja apagar a nota "{note?.title || 'Sem título'}"?
		</Dialog.Description>
		<div class="dialog-actions">
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancelar</Button>
			<Button variant="destructive" onclick={confirmDelete} disabled={deleting}>
				{deleting ? 'Apagando…' : 'Apagar'}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.note-pane-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 0;
		flex: 1;
		overflow: hidden;
		background: var(--background);
		font-family: var(--font-sans);
	}

	.note-pane-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
		min-height: 48px;
		max-height: 48px;
		padding: 0 16px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		box-sizing: border-box;
		background: var(--background);
	}

	.header-left,
	.header-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.save-status-indicator {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.75rem;
		color: var(--muted-foreground);
		user-select: none;
	}

	.status-text {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		line-height: 1;
	}

	.status-text.error {
		color: var(--destructive);
	}

	.mobile-back-link {
		display: none;
		align-items: center;
		gap: 4px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--muted-foreground);
		text-decoration: none;
		padding: 4px 6px;
		border-radius: 4px;
		transition: color 0.12s ease;
	}

	.mobile-back-link:hover {
		color: var(--foreground);
	}

	.note-pane-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-bottom: 24px;
	}

	.note-footer {
		display: flex;
		align-items: center;
		min-height: 36px;
		padding: 0 16px;
		border-top: 1px solid var(--border);
		background: color-mix(in srgb, var(--background) 95%, var(--foreground));
		flex-shrink: 0;
	}

	.note-breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--muted-foreground);
		overflow: hidden;
		white-space: nowrap;
	}

	.note-breadcrumb a {
		color: var(--muted-foreground);
		text-decoration: none;
		transition: color 0.12s ease;
	}

	.note-breadcrumb a:hover {
		color: var(--foreground);
	}

	.breadcrumb-separator {
		color: var(--muted-foreground);
		opacity: 0.6;
		font-size: 0.7rem;
	}

	.breadcrumb-current {
		color: var(--foreground);
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.width-option {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.width-option-desc {
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.6875rem;
	}

	.state-message {
		max-width: 760px;
		margin: 32px auto 0;
		padding: 0 24px;
		color: var(--muted-foreground);
		font-size: 0.9375rem;
		text-align: center;
	}

	.state-message.error {
		color: var(--destructive);
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 16px;
	}

	@media (max-width: 767px) {
		.mobile-back-link {
			display: inline-flex;
		}

		.note-footer {
			display: none;
		}
	}
</style>
