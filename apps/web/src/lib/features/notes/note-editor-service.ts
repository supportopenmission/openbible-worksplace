import type { WorkspaceStorage } from '$lib/storage/types';
import { syncTitleWithH1 } from './note-markdown';
import { persistNoteVerseRefsToWorkspace, type VerseReferenceInput } from './note-verse-index';
import type { Note } from './note-types';
import { saveNote } from './notes-repository';
import { extractVerseFencesFromMarkdown } from './verse-block-extension';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const H1_PATTERN = /^(?:\s*)#\s+(.+?)\s*$/m;
const DEBOUNCE_MS = 650;

function titleFromBody(body: string): string | null {
	const match = body.match(H1_PATTERN);
	return match ? match[1].trim() : null;
}

function verseRefsFromMarkdown(body: string, _notePath: string): VerseReferenceInput[] {
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
}

export function createNoteEditorService(options: NoteEditorServiceOptions) {
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let latestBody = options.note.body;
	let disposed = false;

	function setStatus(status: SaveStatus) {
		options.onStatusChange?.(status);
	}

	async function persist(body: string): Promise<Note> {
		const title = titleFromBody(body);
		const noteFile = syncTitleWithH1(
			{
				meta: {
					id: options.note.id,
					title: options.note.title,
					createdAt: options.note.createdAt,
					updatedAt: options.note.updatedAt,
					type: 'note',
					path: options.note.path
				},
				body
			},
			title ?? options.note.title
		);
		const saved = await saveNote(options.storage, {
			...options.note,
			title: noteFile.meta.title,
			body: noteFile.body,
			content: noteFile.body,
			meta: noteFile.meta,
			updatedAt: noteFile.meta.updatedAt
		});
		const refs = verseRefsFromMarkdown(noteFile.body, saved.path);
		await persistNoteVerseRefsToWorkspace(options.storage, saved.path, refs);
		options.note = saved;
		return saved;
	}

	async function saveNow(body = latestBody): Promise<Note | null> {
		if (disposed) return null;
		latestBody = body;
		setStatus('saving');
		try {
			const saved = await persist(body);
			if (!disposed) setStatus('saved');
			return saved;
		} catch {
			if (!disposed) setStatus('error');
			return null;
		}
	}

	function scheduleSave(body: string) {
		latestBody = body;
		if (debounceTimer) clearTimeout(debounceTimer);
		setStatus('saving');
		debounceTimer = setTimeout(() => {
			void saveNow(body);
		}, DEBOUNCE_MS);
	}

	function dispose() {
		disposed = true;
		if (debounceTimer) clearTimeout(debounceTimer);
	}

	return { scheduleSave, saveNow, dispose, getStatus: () => latestBody };
}
