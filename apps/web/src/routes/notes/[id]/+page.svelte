<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		AlertCircle,
		BookOpen,
		Check,
		ChevronLeft,
		Clock,
		FileDown,
		List,
		Loader2,
		MoreHorizontal,
		Pencil,
		Printer,
		Trash2
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import MilkdownNoteEditor from '$lib/features/notes/MilkdownNoteEditor.svelte';
	import type { SaveStatus } from '$lib/features/notes/note-editor-service';
	import { scrollToHeadingAnchor, type NoteHeading } from '$lib/features/notes/note-index';
	import {
		buildExportMarkdownAsync,
		expandVideoFences,
		exportPdfFallback,
		exportPortableMarkdown,
		resolveFenceVerses,
		type PortableExportSnapshot
	} from '$lib/features/notes/note-export';
	import { notePageChrome } from '$lib/features/notes/note-page-chrome.svelte';
	import { readNote, saveNote } from '$lib/features/notes/notes-repository';
	import {
		NOTE_EDITOR_WIDTHS,
		readNoteToolbarEnabled,
		readNoteToolbarPinned,
		saveNoteToolbarEnabled,
		saveNoteToolbarPinned,
		type NoteEditorWidth
	} from '$lib/features/notes/note-editor-layout';
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
	let notFound = $state(false);
	let deleteDialogOpen = $state(false);
	let deleting = $state(false);
	let saveStatus = $state<SaveStatus>('idle');
	let lastSavedAt = $state<Date | null>(null);
	let readOnly = $state(false);
	let toolbarEnabled = $state(readNoteToolbarEnabled());
	let toolbarPinned = $state(readNoteToolbarPinned());
	let indexHeadings = $state<NoteHeading[]>([]);
	let exportError = $state('');
	let exportWarning = $state('');
	let exporting = $state(false);
	let loadRequest = 0;
	let requestedNoteId: string | null = null;
	let requestedStorage: WorkspaceStorage | null | undefined;

	async function seedFallbackNote(id: string): Promise<WorkspaceStorage> {
		const fallback: WorkspaceStorage = {
			kind: 'native',
			label: 'Memória local',
			async ensureDirectory() {},
			async writeFile() {},
			async readFile() {
				return null;
			},
			async fileExists() {
				return false;
			},
			async listFiles() {
				return [];
			}
		};

		const now = new Date().toISOString();
		await saveNote(fallback, {
			id,
			title: 'Nova nota',
			createdAt: now,
			updatedAt: now,
			meta: {
				id,
				title: 'Nova nota',
				createdAt: now,
				updatedAt: now,
				type: 'note',
				path: `notes/${id}.md`
			},
			body: '\n# Nova nota\n',
			content: '\n# Nova nota\n',
			path: `notes/${id}.md`
		});
		return fallback;
	}

	async function loadNoteData(id: string, resolvedStorage: WorkspaceStorage | null) {
		const request = ++loadRequest;
		loading = true;
		error = '';
		notFound = false;
		note = null;
		activeStorage = null;
		try {
			if (resolvedStorage) {
				const nextNote = await readNote(resolvedStorage, id);
				if (request !== loadRequest) return;
				activeStorage = resolvedStorage;
				note = nextNote;
			} else if (data?.noteId) {
				const fallbackStorage = await seedFallbackNote(id);
				const nextNote = await readNote(fallbackStorage, id);
				if (request !== loadRequest) return;
				activeStorage = fallbackStorage;
				note = nextNote;
			} else {
				const loaded = await readNote(id);
				if (request !== loadRequest) return;
				note = loaded;
				activeStorage = resolvedStorage;
			}
			if (request !== loadRequest) return;

			if (!note) {
				notFound = true;
			} else {
				if (note.updatedAt) {
					lastSavedAt = new Date(note.updatedAt);
				}
			}
		} catch (err) {
			if (request !== loadRequest) return;
			error = err instanceof Error ? err.message : 'Não foi possível carregar a nota.';
		} finally {
			if (request !== loadRequest) return;
			loading = false;
		}
	}

	onMount(() => {
		notePageChrome.activate();
	});

	$effect(() => {
		const targetId = noteId;
		const currentStorage = storageOverride ?? workspace?.storage ?? null;
		if (!targetId) return;
		if (targetId === requestedNoteId && currentStorage === requestedStorage) return;
		requestedNoteId = targetId;
		requestedStorage = currentStorage;
		void loadNoteData(targetId, currentStorage);
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

	function setToolbarEnabled(enabled: boolean) {
		toolbarEnabled = enabled;
		saveNoteToolbarEnabled(enabled);
	}

	function setToolbarPinned(pinned: boolean) {
		toolbarPinned = pinned;
		saveNoteToolbarPinned(pinned);
	}

	function safeExportFileName(title: string, extension: string): string {
		const base = (title || 'nota').replace(/[\\/:*?"<>|]/g, '').trim() || 'nota';
		return `${base}.${extension}`;
	}

	async function expandNoteForExport(): Promise<string> {
		if (!note || !activeStorage) throw new Error('no-note');
		const storage = activeStorage;
		const videoWarnings = expandVideoFences(note.body).warnings;
		exportWarning = [
			'A saída é derivada do snapshot da nota; a fonte não será alterada.',
			...videoWarnings
		].join(' ');
		return buildExportMarkdownAsync(note.body, (fence) => resolveFenceVerses(storage, fence));
	}

	async function createExportSnapshot(): Promise<PortableExportSnapshot> {
		if (!note) throw new Error('no-note');
		return { title: note.title, markdown: await expandNoteForExport() };
	}

	function downloadText(content: string, mime: string, extension: string, title: string) {
		const blob = new Blob([content], { type: mime });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = safeExportFileName(title, extension);
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	}

	async function exportMarkdownFile() {
		if (!note || exporting) return;
		exporting = true;
		exportError = '';
		try {
			const artifact = exportPortableMarkdown(await createExportSnapshot());
			downloadText(artifact.markdown, 'text/markdown;charset=utf-8', 'md', note.title);
		} catch {
			exportError = 'Não foi possível exportar: um versículo não tem texto disponível.';
		} finally {
			exporting = false;
		}
	}

	async function exportPdfFile() {
		if (!note || exporting) return;
		exporting = true;
		exportError = '';
		try {
			const artifact = exportPdfFallback(await createExportSnapshot());
			const printWindow = window.open('', '_blank');
			if (!printWindow) throw new Error('popup-blocked');
			printWindow.document.write(artifact.document);
			printWindow.document.close();
			printWindow.focus();
			printWindow.print();
		} catch (error) {
			exportError =
				error instanceof Error && error.message === 'popup-blocked'
					? 'A janela de impressão foi bloqueada. Permita pop-ups para salvar o PDF.'
					: 'Não foi possível exportar: um versículo não tem texto disponível.';
		} finally {
			exporting = false;
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

	let dateDisplayMode = $state<'updated' | 'created'>('updated');
	let indexSheetOpen = $state(false);

	function toggleDateMode() {
		dateDisplayMode = dateDisplayMode === 'updated' ? 'created' : 'updated';
	}

	function formatSmartDate(dateStrOrDate: string | Date | null | undefined): string {
		if (!dateStrOrDate) return '';
		const date = typeof dateStrOrDate === 'string' ? new Date(dateStrOrDate) : dateStrOrDate;
		if (isNaN(date.getTime())) return '';
		const now = new Date();
		const isToday = date.toDateString() === now.toDateString();
		const time = new Intl.DateTimeFormat('pt-BR', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
		if (isToday) {
			return `às ${time}`;
		}
		const dayMonth = new Intl.DateTimeFormat('pt-BR', {
			day: 'numeric',
			month: 'short'
		}).format(date);
		return `em ${dayMonth}, ${time}`;
	}

	const currentStatusTooltip = $derived.by(() => {
		if (saveStatus === 'saving') return 'Salvando alterações…';
		if (saveStatus === 'error') return 'Erro ao salvar alterações';
		if (dateDisplayMode === 'created') {
			const createdDate = note?.createdAt ? new Date(note.createdAt) : null;
			return `Criada em ${formatSavedFull(createdDate)} · Clique para ver data de atualização`;
		}
		const updatedDate = lastSavedAt ?? (note?.updatedAt ? new Date(note.updatedAt) : null);
		return `Atualizada em ${formatSavedFull(updatedDate)} · Clique para ver data de criação`;
	});

	async function confirmDelete() {
		if (!activeStorage || !note || deleting) return;
		deleting = true;
		try {
			const deleted = await notesState.deleteNote(activeStorage, note.id);
			if (!deleted) return;
			await notesState.loadNotes(activeStorage, true);
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
		</div>
		<div class="header-right">
			{#if note}
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
					<DropdownMenu.Content align="end" class="note-options-menu w-56">
						<DropdownMenu.Item onclick={() => (readOnly = !readOnly)}>
							{#if readOnly}
								<Pencil size={14} strokeWidth={1.8} aria-hidden="true" class="mr-2" />
								<span>Modo de edição</span>
							{:else}
								<BookOpen size={14} strokeWidth={1.8} aria-hidden="true" class="mr-2" />
								<span>Modo de leitura</span>
							{/if}
						</DropdownMenu.Item>

						<DropdownMenu.Item onclick={() => (indexSheetOpen = true)}>
							<List size={14} strokeWidth={1.8} aria-hidden="true" class="mr-2" />
							<span>Índices da nota</span>
						</DropdownMenu.Item>

						<DropdownMenu.Separator />

						<DropdownMenu.Label>Exportar nota</DropdownMenu.Label>
						<DropdownMenu.Item disabled={exporting} onclick={() => void exportMarkdownFile()}>
							<FileDown size={14} strokeWidth={1.8} aria-hidden="true" class="mr-2" />
							<div class="export-menu-copy">
								<span>Markdown</span>
								<span class="export-menu-desc">Arquivo editável</span>
							</div>
						</DropdownMenu.Item>
						<DropdownMenu.Item disabled={exporting} onclick={() => void exportPdfFile()}>
							<Printer size={14} strokeWidth={1.8} aria-hidden="true" class="mr-2" />
							<div class="export-menu-copy">
								<span>PDF</span>
								<span class="export-menu-desc">Impressão local</span>
							</div>
						</DropdownMenu.Item>

						<DropdownMenu.Separator />

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
						<DropdownMenu.CheckboxItem
							checked={toolbarEnabled}
							onCheckedChange={(checked) => setToolbarEnabled(checked === true)}
						>
							<span>Barra de formatação</span>
						</DropdownMenu.CheckboxItem>
						<DropdownMenu.CheckboxItem
							checked={toolbarPinned}
							onCheckedChange={(checked) => setToolbarPinned(checked === true)}
						>
							<span>Manter barra sempre visível</span>
						</DropdownMenu.CheckboxItem>
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
				{#if exportError}
					<span class="export-error" role="alert">{exportError}</span>
				{:else if exportWarning}
					<span class="export-warning" role="status">{exportWarning}</span>
				{/if}
			{/if}
		</div>
	</header>

	<div class="note-pane-body">
		{#if loading}
			<div class="note-loading-state" role="status" aria-label="Carregando nota">
				<span class="loading-line loading-title" aria-hidden="true"></span>
				<span class="loading-line loading-description" aria-hidden="true"></span>
				<div class="loading-body" aria-hidden="true">
					<span class="loading-line"></span>
					<span class="loading-line loading-line-short"></span>
					<span class="loading-line"></span>
				</div>
				<span class="sr-only">Carregando nota…</span>
			</div>
		{:else if notFound}
			<section
				class="note-not-found"
				data-testid="note-not-found"
				aria-labelledby="note-not-found-title"
			>
				<p class="not-found-code" aria-hidden="true">404</p>
				<h1 id="note-not-found-title">Nota não encontrada</h1>
				<p>Esse endereço não corresponde a uma nota disponível neste workspace.</p>
				<a class="not-found-link" href={resolve('/notes')}>Voltar para todas as notas</a>
			</section>
		{:else if error || !note || !activeStorage}
			<p class="state-message error" role="alert">{error || 'Nota não encontrada'}</p>
		{:else}
			{#key activeStorage}
				<MilkdownNoteEditor
					{note}
					{readOnly}
					{toolbarEnabled}
					{toolbarPinned}
					storage={activeStorage}
					onSaved={handleSaved}
					onStatusChange={handleStatusChange}
					onHeadings={(headings) => (indexHeadings = headings)}
				>
					{#snippet aboveTitle()}
						{#if note}
							<div class="save-status-container" role="status" aria-live="polite">
								<button
									type="button"
									class="save-status-indicator"
									onclick={(e) => {
										e.stopPropagation();
										toggleDateMode();
									}}
									aria-label={dateDisplayMode === 'updated'
										? 'Ver data de criação'
										: 'Ver data de atualização'}
									title={currentStatusTooltip}
								>
									{#if saveStatus === 'saving'}
										<Loader2
											size={12}
											class="animate-spin text-muted-foreground"
											aria-hidden="true"
										/>
										<span class="status-text saving">Salvando…</span>
									{:else if saveStatus === 'error'}
										<AlertCircle size={12} class="text-destructive" aria-hidden="true" />
										<span class="status-text error">Erro ao salvar</span>
									{:else if dateDisplayMode === 'created'}
										<Clock size={12} class="text-muted-foreground" aria-hidden="true" />
										<span class="status-text saved">
											Criada {formatSmartDate(note.createdAt)}
										</span>
									{:else}
										<Check size={12} class="text-muted-foreground" aria-hidden="true" />
										<span class="status-text saved">
											{#if lastSavedAt}
												Salva às {formatSavedTime(lastSavedAt)}
											{:else}
												Atualizada {formatSmartDate(note.updatedAt)}
											{/if}
										</span>
									{/if}
								</button>
							</div>
						{/if}
					{/snippet}
				</MilkdownNoteEditor>
			{/key}
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

<Sheet.Root bind:open={indexSheetOpen}>
	<Sheet.Content side="bottom" class="note-index-drawer">
		<Sheet.Header>
			<Sheet.Title>Índices da nota</Sheet.Title>
			<Sheet.Description>Navegue até uma seção da nota.</Sheet.Description>
		</Sheet.Header>
		{#if indexHeadings.length === 0}
			<p class="index-empty" role="status">Nenhum título nesta nota. Use # para criar seções.</p>
		{:else}
			<ul class="index-list">
				{#each indexHeadings as heading (heading.anchor)}
					<li>
						<button
							type="button"
							class="index-item"
							data-level={heading.level}
							onclick={() => {
								indexSheetOpen = false;
								scrollToHeadingAnchor(document, heading.anchor);
							}}
						>
							{heading.title}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</Sheet.Content>
</Sheet.Root>

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

	.save-status-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.save-status-indicator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 3px 10px;
		border-radius: 9999px;
		background: transparent;
		border: 1px solid transparent;
		color: var(--muted-foreground);
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1;
		cursor: pointer;
		user-select: none;
		transition:
			background-color 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.save-status-indicator:hover {
		background: color-mix(in oklch, var(--foreground) 5%, transparent);
		border-color: color-mix(in oklch, var(--foreground) 10%, transparent);
		color: var(--foreground);
	}

	.save-status-indicator:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.save-status-indicator:active {
		transform: scale(0.98);
	}

	.status-text {
		color: inherit;
		font-size: 0.75rem;
		line-height: 1;
	}

	.status-text.error {
		color: var(--destructive);
	}

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
		background: transparent;
		border: none;
		cursor: pointer;
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

	.export-error {
		color: var(--destructive);
		font-size: 0.75rem;
		line-height: 1.4;
		max-width: 220px;
	}

	.export-warning {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		line-height: 1.4;
		max-width: 220px;
	}

	.export-menu-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 2px;
	}

	.export-menu-desc {
		color: var(--muted-foreground);
		font-size: 0.7rem;
		line-height: 1.35;
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
		padding-bottom: max(24px, env(safe-area-inset-bottom, 0px));
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

	.note-loading-state {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: min(760px, calc(100% - 48px));
		margin: 48px auto 0;
	}

	.loading-line {
		display: block;
		width: 100%;
		height: 14px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--muted) 78%, var(--background));
		animation: note-loading-pulse 1.35s ease-in-out infinite;
	}

	.loading-line.loading-title {
		width: min(62%, 420px);
		height: 42px;
		margin-bottom: 4px;
	}

	.loading-line.loading-description {
		width: min(38%, 260px);
		height: 16px;
	}

	.loading-body {
		display: grid;
		gap: 14px;
		margin-top: 18px;
	}

	.loading-line-short {
		width: 76%;
	}

	.note-not-found {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: min(560px, calc(100% - 48px));
		margin: clamp(64px, 14vh, 140px) auto 0;
	}

	.not-found-code {
		margin: 0 0 12px;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: var(--muted-foreground);
	}

	.note-not-found h1 {
		margin: 0;
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		letter-spacing: -0.035em;
	}

	.note-not-found p:not(.not-found-code) {
		max-width: 42rem;
		margin: 12px 0 24px;
		color: var(--muted-foreground);
		line-height: 1.55;
	}

	.not-found-link {
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		padding: 0 14px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--foreground);
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.not-found-link:hover {
		background: var(--muted);
		border-color: var(--ring);
	}

	.not-found-link:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	@keyframes note-loading-pulse {
		0%,
		100% {
			opacity: 0.52;
		}
		50% {
			opacity: 0.86;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loading-line {
			animation: none;
			opacity: 0.68;
		}
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

		.note-pane-body {
			overflow: hidden;
			padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
		}
	}
</style>
