import type { ReaderSelection } from '$lib/features/bible/reader-preference';

export interface VerseRangeInput {
	verseStart: number;
	verseEnd: number;
	chapter: number;
	endChapter?: number;
}

export interface VerseSelectionState {
	versionId: string;
	version?: string;
	bookId: number;
	book?: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
}

export function validateVerseRange(input: VerseRangeInput): boolean {
	const endChapter = input.endChapter ?? input.chapter;
	if (endChapter !== input.chapter) return false;
	if (!Number.isInteger(input.verseStart) || !Number.isInteger(input.verseEnd)) return false;
	if (input.verseStart <= 0 || input.verseEnd <= 0) return false;
	return input.verseEnd >= input.verseStart;
}

export function prefillFromReaderSelection(selection: ReaderSelection): VerseSelectionState {
	return {
		versionId: selection.versionId,
		bookId: selection.bookId,
		chapter: selection.chapter,
		verseStart: 1,
		verseEnd: 1
	};
}

export function confirmVerseSelection(
	current: VerseSelectionState,
	patch: Partial<VerseSelectionState>
): VerseSelectionState {
	return { ...current, ...patch };
}

export function formatVerseSnapshot(verses: Array<{ number: number; text: string }>): string {
	return verses.map((verse) => `${verse.number} ${verse.text.trim()}`).join('\n');
}

export function verseRangeLabel(selection: VerseSelectionState): string {
	const book = selection.book ?? `Livro ${selection.bookId}`;
	const range =
		selection.verseStart === selection.verseEnd
			? `${selection.verseStart}`
			: `${selection.verseStart}–${selection.verseEnd}`;
	return `${book} ${selection.chapter}:${range}`;
}
