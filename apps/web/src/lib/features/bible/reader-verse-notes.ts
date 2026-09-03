import type { NoteVerseRef } from '$lib/features/notes/note-verse-index';

export type VerseNoteSummary = {
	notePath: string;
	id: string;
	title: string;
	updatedAt: string;
};

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

function coversVerse(ref: NoteVerseRef, verse: number): boolean {
	const start = Math.min(ref.verseStart, ref.verseEnd);
	const end = Math.max(ref.verseStart, ref.verseEnd);
	return verse >= start && verse <= end;
}

export function noteRefsForVerse(
	refs: NoteVerseRef[],
	query: ChapterQuery,
	verse: number
): NoteVerseRef[] {
	return refs.filter((ref) => matchesChapter(ref, query) && coversVerse(ref, verse));
}

export function dedupeRefsByNotePath(refs: NoteVerseRef[]): NoteVerseRef[] {
	const seen = new Set<string>();
	const deduped: NoteVerseRef[] = [];
	for (const ref of refs) {
		if (seen.has(ref.notePath)) continue;
		seen.add(ref.notePath);
		deduped.push(ref);
	}
	return deduped;
}

export function countDistinctNotesForVerse(
	refs: NoteVerseRef[],
	query: ChapterQuery,
	verse: number
): number {
	return dedupeRefsByNotePath(noteRefsForVerse(refs, query, verse)).length;
}

export function shouldOpenNoteDirectly(distinctNoteCount: number): boolean {
	return distinctNoteCount === 1;
}

export function formatMultiNoteBadge(distinctNoteCount: number): string | null {
	if (distinctNoteCount < 2) return null;
	if (distinctNoteCount >= 10) return '9+';
	return String(distinctNoteCount);
}

export function readerNoteOpensInBible(): boolean {
	return true;
}

export function sortNoteSummariesByUpdatedAt(summaries: VerseNoteSummary[]): VerseNoteSummary[] {
	return [...summaries].sort((left, right) => {
		const byUpdatedAt = right.updatedAt.localeCompare(left.updatedAt);
		if (byUpdatedAt !== 0) return byUpdatedAt;
		return left.id.localeCompare(right.id);
	});
}

export function resolveNoteDisplayTitle(summary: Pick<VerseNoteSummary, 'title' | 'id'>): string {
	const title = summary.title.trim();
	if (title) return title;
	return 'Sem título';
}
