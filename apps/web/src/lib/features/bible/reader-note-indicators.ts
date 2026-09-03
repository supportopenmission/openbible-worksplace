import type { NoteVerseRef } from '$lib/features/notes/note-verse-index';
import { countDistinctNotesForVerse, dedupeRefsByNotePath, noteRefsForVerse } from './reader-verse-notes';

export const READER_NOTE_INDICATOR_KIND = 'note-icon' as const;

type ChapterQuery = {
	versionId: string;
	bookId: number;
	chapter: number;
};

function matchesChapter(ref: NoteVerseRef, query: ChapterQuery): boolean {
	return (
		ref.versionId === query.versionId &&
		ref.bookId === query.bookId &&
		ref.chapter === query.chapter
	);
}

/** Versículos do capítulo aberto cobertos por refs ativas de nota (sem vínculo com highlight). */
export function versesCoveredByActiveNotes(refs: NoteVerseRef[], query: ChapterQuery): number[] {
	const covered = new Set<number>();
	for (const ref of refs) {
		if (!matchesChapter(ref, query)) continue;
		const start = Math.min(ref.verseStart, ref.verseEnd);
		const end = Math.max(ref.verseStart, ref.verseEnd);
		for (let verse = start; verse <= end; verse += 1) {
			covered.add(verse);
		}
	}
	return [...covered].sort((left, right) => left - right);
}

export function noteIndicatorLinksHighlight(): boolean {
	return false;
}

export function noteIndicatorAppliesHighlightStyle(): boolean {
	return false;
}

export function isNoteIndicatorHighlightStyle(): boolean {
	return false;
}

export function verseNoteSelectorLinksHighlight(): boolean {
	return false;
}

export function countActiveNotesExcludingTrash(
	refs: NoteVerseRef[],
	query: { versionId: string; bookId: number; chapter: number },
	verse: number,
	trashedNotePaths: ReadonlySet<string>
): number {
	const active = noteRefsForVerse(refs, query, verse).filter(
		(ref) => !trashedNotePaths.has(ref.notePath)
	);
	return dedupeRefsByNotePath(active).length;
}

export function distinctActiveNoteCountForVerse(
	refs: NoteVerseRef[],
	query: { versionId: string; bookId: number; chapter: number },
	verse: number,
	trashedNotePaths: ReadonlySet<string> = new Set()
): number {
	if (trashedNotePaths.size === 0) {
		return countDistinctNotesForVerse(refs, query, verse);
	}
	return countActiveNotesExcludingTrash(refs, query, verse, trashedNotePaths);
}
