import { renderVerseFence } from '$lib/features/notes/verse-block-extension';
import { readBibleChapter, type BibleCatalog } from './bible-reader';
import type { ReaderHighlightRecord } from './reader-highlights-repository';
import { sameRange, type VerseRange } from './verse-selection';

export type ReaderHighlightStyleKind = 'pen' | 'underline' | 'wavy' | 'box' | 'erase';

export type ReaderHighlightStyle = {
	id: string;
	kind: ReaderHighlightStyleKind;
	label: string;
};

export type ReaderHighlight = {
	versionId: string;
	bookId: number;
	chapter: number;
	verseStart: number;
	verseEnd: number;
	styleId: string;
};

export type HighlightSelection = VerseRange & {
	versionId: string;
	bookId: number;
	chapter: number;
};

/**
 * Paleta Q6: canetas sólidas nomeadas, três riscos e apagar. Nuvem,
 * strike-through, risco duplo, tracejado e atalhos de uma letra ficam fora.
 */
export const READER_HIGHLIGHT_PALETTE: ReaderHighlightStyle[] = [
	{ id: 'pen-gold', kind: 'pen', label: 'Caneta dourada' },
	{ id: 'pen-mint', kind: 'pen', label: 'Caneta verde' },
	{ id: 'pen-sky', kind: 'pen', label: 'Caneta azul' },
	{ id: 'pen-rose', kind: 'pen', label: 'Caneta rosa' },
	{ id: 'pen-lilac', kind: 'pen', label: 'Caneta lilás' },
	{ id: 'underline', kind: 'underline', label: 'Sublinhado' },
	{ id: 'wavy', kind: 'wavy', label: 'Sublinhado ondulado' },
	{ id: 'box', kind: 'box', label: 'Caixa' },
	{ id: 'erase', kind: 'erase', label: 'Apagar' }
];

export function readerHighlightStyle(styleId: string): ReaderHighlightStyle | null {
	return READER_HIGHLIGHT_PALETTE.find((style) => style.id === styleId) ?? null;
}

function normalizeSelection(selection: HighlightSelection): HighlightSelection {
	const verseStart = Math.min(selection.verseStart, selection.verseEnd);
	const verseEnd = Math.max(selection.verseStart, selection.verseEnd);
	return {
		versionId: selection.versionId,
		bookId: selection.bookId,
		chapter: selection.chapter,
		verseStart,
		verseEnd
	};
}

function isSameAnnotation(highlight: ReaderHighlight, selection: HighlightSelection): boolean {
	return (
		highlight.versionId === selection.versionId &&
		highlight.bookId === selection.bookId &&
		highlight.chapter === selection.chapter &&
		sameRange(highlight, selection)
	);
}

export function applyHighlight(
	existing: ReaderHighlight[],
	selection: HighlightSelection,
	styleId: string
): ReaderHighlight[] {
	const range = normalizeSelection(selection);
	const annotation: ReaderHighlight = { ...range, styleId };
	const index = existing.findIndex((highlight) => isSameAnnotation(highlight, range));
	if (index === -1) return [...existing, annotation];
	return existing.map((highlight, position) => (position === index ? annotation : highlight));
}

export function eraseHighlight(
	existing: ReaderHighlight[],
	selection: HighlightSelection
): ReaderHighlight[] {
	const range = normalizeSelection(selection);
	return existing.filter((highlight) => !isSameAnnotation(highlight, range));
}

export function highlightsCoveringVerse(
	existing: ReaderHighlight[],
	verse: number
): ReaderHighlight[] {
	return existing.filter(
		(highlight) => verse >= highlight.verseStart && verse <= highlight.verseEnd
	);
}

export function referenceLabel(input: {
	book: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
}): string {
	const verses =
		input.verseStart === input.verseEnd
			? `${input.verseStart}`
			: `${input.verseStart}–${input.verseEnd}`;
	return `${input.book} ${input.chapter}.${verses}`;
}

export function formatCopyReference(input: {
	book: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
	versionLabel: string;
}): string {
	return `${referenceLabel(input)} (${input.versionLabel})`;
}

export function formatVerseSnapshot(verses: { number: number; text: string }[]): string {
	return verses.map((verse) => `${verse.number} ${verse.text.trim()}`).join('\n');
}

export function formatCopyTextAndReference(input: {
	book: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
	versionLabel: string;
	verses: { number: number; text: string }[];
}): string {
	return `${formatVerseSnapshot(input.verses)}\n\n${formatCopyReference(input)}`;
}

export function isSameReaderHighlight(
	left: ReaderHighlightRecord,
	right: ReaderHighlightRecord
): boolean {
	return (
		left.versionId === right.versionId &&
		left.bookId === right.bookId &&
		left.chapter === right.chapter &&
		left.verseStart === right.verseStart &&
		left.verseEnd === right.verseEnd
	);
}

export async function loadHighlightPassage(
	catalog: BibleCatalog,
	highlight: ReaderHighlightRecord
): Promise<{ text: string } | { error: string }> {
	const version = catalog.versions.find((item) => item.id === highlight.versionId);
	if (!version) {
		return { error: 'Esta versão bíblica não está disponível no workspace.' };
	}

	try {
		const verses = await readBibleChapter(version, highlight.bookId, highlight.chapter);
		const passage = verses
			.filter(
				(verse) => verse.number >= highlight.verseStart && verse.number <= highlight.verseEnd
			)
			.map((verse) => `${verse.number} ${verse.text.trim()}`)
			.join(' ');

		if (!passage) {
			return { error: 'Não foi possível carregar o texto deste trecho.' };
		}

		return { text: passage };
	} catch {
		return { error: 'Não foi possível carregar o texto deste trecho.' };
	}
}

export function buildVerseFenceFromRange(input: {
	versionId: string;
	bookId: number;
	book: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
	snapshot: string;
}): string {
	return renderVerseFence({
		attrs: {
			versionId: input.versionId,
			bookId: String(input.bookId),
			book: input.book,
			chapter: String(input.chapter),
			verseStart: String(input.verseStart),
			verseEnd: String(input.verseEnd)
		},
		body: input.snapshot.trimEnd()
	});
}
