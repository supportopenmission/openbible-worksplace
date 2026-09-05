import { parseBibleReferences } from './parser/BibleReferenceParser';
import { getBookName } from './parser/books';
import type { BibleReference } from './parser/types';

export interface ReferenceVersionOptions {
	parserVersionId?: string | null;
	defaultVersionId?: string | null;
	installedVersions: string[];
}

export interface CatalogBookLike {
	id: number;
	name: string;
	abbreviation: string;
}

/** First valid reference in free text, reusing the project parser. */
export function parseFirstBibleReference(text: string): BibleReference | null {
	const [reference] = parseBibleReferences(text);
	return reference ?? null;
}

/** Short display token as written (e.g. `Gn` from `Gn 3.1`). */
export function shortBookLabel(reference: BibleReference): string {
	const label = reference.raw.replace(/\s*\d+[:.]\d+.*$/, '').trim();
	return label || reference.book;
}

/**
 * Effective version: parser version when installed, else the default
 * version when installed, else null (caller shows the missing-bible state).
 */
export function resolveReferenceVersionId(
	reference: BibleReference | null,
	options: ReferenceVersionOptions
): string | null {
	if (!reference) return null;
	const explicit = reference.translation || options.parserVersionId || null;
	const candidates = [explicit, options.defaultVersionId];
	for (const candidate of candidates) {
		if (candidate && options.installedVersions.includes(candidate)) return candidate;
	}
	return null;
}

function normalizeBookName(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

/** Match an osis reference against catalog books by name or abbreviation. */
export function matchCatalogBook(
	books: CatalogBookLike[],
	reference: BibleReference
): CatalogBookLike | null {
	const fullName = normalizeBookName(getBookName(reference.book));
	const shortLabel = normalizeBookName(shortBookLabel(reference));
	const osis = normalizeBookName(reference.book);
	for (const book of books) {
		const name = normalizeBookName(book.name);
		const abbreviation = normalizeBookName(book.abbreviation);
		if (
			name === fullName ||
			name === shortLabel ||
			abbreviation === shortLabel ||
			abbreviation === osis
		) {
			return book;
		}
	}
	return null;
}
