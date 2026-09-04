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
		const extractedTitle = titleFromBody(body);
		const effectiveTitle = extractedTitle ?? latestTitle ?? options.note.title;
		const noteFile = syncTitleWithH1(
			{
				meta: {
					id: options.note.id,
					title: effectiveTitle,
					description: latestDescription,
					createdAt: options.note.createdAt,
					updatedAt: options.note.updatedAt,
					type: 'note',
					path: options.note.path
				},
				body
			},
			effectiveTitle
		);
		const saved = await saveNote(options.storage, {
			...options.note,
			title: noteFile.meta.title,
			description: noteFile.meta.description,
			body: noteFile.body,
			content: noteFile.body,
			meta: noteFile.meta,
			updatedAt: noteFile.meta.updatedAt
		});
		const refs = verseRefsFromMarkdown(noteFile.body);
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

	function scheduleSave(body: string) {
		latestBody = body;
		pendingChanges = true;
		if (debounceTimer) clearTimeout(debounceTimer);
		setStatus('saving');
		debounceTimer = setTimeout(() => {
			void saveNow(body);
		}, DEBOUNCE_MS);
	}

	function updateTitle(title: string) {
		latestTitle = title.trim() || options.note.title || 'Nova nota';
		options.note.title = latestTitle;
		scheduleSave(latestBody);
	}

	function updateDescription(description: string) {
		latestDescription = description.trim() || undefined;
		options.note.description = latestDescription;
		scheduleSave(latestBody);
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
		dispose,
		getStatus: () => latestBody
	};
}
