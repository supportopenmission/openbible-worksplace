import type { Note } from '$lib/features/notes/note-types';

const sessionNotesByPath = new Map<string, Note>();

export function rememberReaderNote(note: Note): void {
	sessionNotesByPath.set(note.path, note);
}

export function recallReaderNote(notePath: string): Note | null {
	return sessionNotesByPath.get(notePath) ?? null;
}

export function noteIdFromPath(notePath: string): string {
	const match = notePath.match(/^notes\/(.+)\.md$/);
	return match?.[1] ?? '';
}
