import type { WorkspaceStorage } from '$lib/storage/types';
import { persistNoteVerseRefsToWorkspace, type VerseReferenceInput } from './note-verse-index';
import type { Note } from './note-types';
import { saveNote } from './notes-repository';
import { extractVerseFencesFromMarkdown } from './verse-block-extension';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const BODY_DEBOUNCE_MS = 650;
const METADATA_DEBOUNCE_MS = 1200;

function verseRefsFromMarkdown(body: string): VerseReferenceInput[] {
	return extractVerseFencesFromMarkdown(body).map((fence, blockIndex) => ({
		blockIndex,
		versionId: fence.attrs.versionId,
		bookId: Number(fence.attrs.bookId),
		book: fence.attrs.book,
		bookName: fence.attrs.book,
		chapter: Number(fence.attrs.chapter),
		verseStart: Number(fence.attrs.verseStart),
		verseEnd: Number(fence.attrs.verseEnd)
	}));
}

export interface NoteEditorServiceOptions {
	storage: WorkspaceStorage;
	note: Note;
	onStatusChange?: (status: SaveStatus) => void;
	onSaved?: (note: Note) => void;
}

export function createNoteEditorService(options: NoteEditorServiceOptions) {
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let latestBody = options.note.body;
	let latestTitle = options.note.title;
	let latestDescription = options.note.description;
	let disposed = false;
	let pendingChanges = false;

	function setStatus(status: SaveStatus) {
		options.onStatusChange?.(status);
	}

	async function persist(body: string): Promise<Note> {
		// Título e descrição vivem nos metadados, fora do conteúdo: o corpo é
		// salvo como está, sem extrair H1 nem forçar `# título` na primeira linha.
		const title = latestTitle ?? options.note.title;
		const saved = await saveNote(options.storage, {
			...options.note,
			title,
			description: latestDescription,
			body,
			content: body,
			meta: {
				...options.note.meta,
				title,
				description: latestDescription
			},
			updatedAt: options.note.updatedAt
		});
		const refs = verseRefsFromMarkdown(saved.body);
		await persistNoteVerseRefsToWorkspace(options.storage, saved.path, refs);
		options.note = saved;
		return saved;
	}

	async function saveNow(body = latestBody): Promise<Note | null> {
		if (disposed) return null;
		latestBody = body;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = null;
		setStatus('saving');
		try {
			const saved = await persist(body);
			pendingChanges = false;
			if (!disposed) setStatus('saved');
			if (!disposed) options.onSaved?.(saved);
			return saved;
		} catch {
			if (!disposed) setStatus('error');
			return null;
		}
	}

	function scheduleSave(body: string, delay = BODY_DEBOUNCE_MS) {
		latestBody = body;
		pendingChanges = true;
		if (debounceTimer) clearTimeout(debounceTimer);
		setStatus('saving');
		debounceTimer = setTimeout(() => {
			void saveNow(body);
		}, delay);
	}

	function updateTitle(title: string) {
		latestTitle = title.trim() || options.note.title || 'Nova nota';
		options.note.title = latestTitle;
		scheduleSave(latestBody, METADATA_DEBOUNCE_MS);
	}

	function updateDescription(description: string) {
		latestDescription = description.trim() || undefined;
		options.note.description = latestDescription;
		scheduleSave(latestBody, METADATA_DEBOUNCE_MS);
	}

	function flush() {
		if (disposed || !pendingChanges) return Promise.resolve(null);
		return saveNow();
	}

	function dispose() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = null;
		const bodyToFlush = pendingChanges ? latestBody : null;
		disposed = true;
		if (bodyToFlush !== null) void persist(bodyToFlush).catch(() => {});
	}

	return {
		scheduleSave,
		saveNow,
		updateTitle,
		updateDescription,
		flush,
		dispose,
		getStatus: () => latestBody
	};
}
