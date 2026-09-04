import { findTranslation } from './translations';
import { getBookName } from './books';

export interface TranslationSuffixResult {
	translation: string;
	consumedLength: number;
}

/**
 * Checks if the text immediately following a reference matches a registered translation.
 * Matches: " ARA", " ara", " (ARA)", " (ara)", etc.
 */
export function parseTranslationSuffix(
	text: string,
	toIndex: number,
	maxToIndex: number = text.length
): TranslationSuffixResult | null {
	const remaining = text.slice(toIndex, maxToIndex);
	const match = remaining.match(
		/^\s*(?:\((?<paren>[A-Za-z0-9]+)\)|(?<bare>[A-Za-z0-9]+(?=[^\w]|$)))/
	);

	if (!match || !match.groups) return null;

	const candidate = match.groups.paren || match.groups.bare;
	if (!candidate) return null;

	const matched = findTranslation(candidate);
	if (!matched) return null;

	return {
		translation: matched.abbreviation,
		consumedLength: match[0].length
	};
}

/**
 * Formats a user-friendly label for a reference, e.g. "Gênesis 3:1" or "Gênesis 3:1-5" or "Gênesis 3".
 */
export function formatPassageLabel(
	book: string,
	chapter?: number,
	verseStart?: number,
	verseEnd?: number
): string {
	const bookName = getBookName(book);
	if (chapter == null) return bookName;
	if (verseStart == null) return `${bookName} ${chapter}`;
	if (verseEnd == null || verseEnd === verseStart) {
		return `${bookName} ${chapter}:${verseStart}`;
	}
	return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
}
