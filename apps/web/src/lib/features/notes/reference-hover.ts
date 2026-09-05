import type { WorkspaceStorage } from '$lib/storage/types';
import type { BibleVersion } from '$lib/features/bible/bible-reader';
import { loadBibleCatalog, readBibleChapter } from '$lib/features/bible/bible-reader';
import { formatVerseSnapshot } from './verse-selector';
import {
	matchCatalogBook,
	parseFirstBibleReference,
	resolveReferenceVersionId,
	shortBookLabel
} from '$lib/bible/reference-parser';
import type { BibleReference } from '$lib/bible/parser/types';

export interface ParsedShortReference {
	book: string;
	chapter: number;
	verse: number;
}

export interface HoverLookupContext {
	parserVersionId: string | null;
	defaultVersionId: string | null;
	installedVersions: string[];
	lookup: () => string;
}

export type HoverCardData =
	| { status: 'ready'; versionId: string; reference: string; text: string }
	| { status: 'missing-bible'; versionId?: null; reference: string; text: null };

/** Short `{book, chapter, verse}` contract used by the hover card. */
export function parseBibleReference(text: string): ParsedShortReference | null {
	const reference = parseFirstBibleReference(text);
	if (!reference || reference.chapter == null || reference.verseStart == null) return null;
	return { book: shortBookLabel(reference), chapter: reference.chapter, verse: reference.verseStart };
}

/** Pure version/text resolution behind the hover card states. */
export function resolveHoverCard(
	parsed: ParsedShortReference | null,
	context: HoverLookupContext
): HoverCardData {
	const reference = parsed ? `${parsed.book} ${parsed.chapter}.${parsed.verse}` : '';
	const versionId =
		(context.parserVersionId && context.installedVersions.includes(context.parserVersionId)
			? context.parserVersionId
			: null) ??
		(context.defaultVersionId && context.installedVersions.includes(context.defaultVersionId)
			? context.defaultVersionId
			: null);
	if (!versionId) return { status: 'missing-bible', reference, text: null };
	return { status: 'ready', versionId, reference, text: context.lookup() };
}

export interface HoverTargetAttrs {
	osis: string;
	raw: string;
	version: string;
	book: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
}

export interface LoadedHoverCard {
	status: 'ready' | 'missing-bible' | 'unavailable';
	reference: string;
	text: string | null;
	versionId: string | null;
	versionLabel: string | null;
	bibleReference: BibleReference | null;
}

function displayVersion(version: BibleVersion): string {
	return version.name || version.fileName || version.id;
}

export interface HoverVersionPreferences {
	defaultVersionId: string | null;
	readerVersionId: string | null;
}

/**
 * Load hover card data for a decorated reference: resolve the effective
 * version (decorated → default → reader selection), match the book in the
 * catalog and read the verse range snapshot. Never throws.
 */
export async function loadHoverPassage(
	storage: WorkspaceStorage | undefined,
	attrs: HoverTargetAttrs,
	preferences?: HoverVersionPreferences | null
): Promise<LoadedHoverCard> {
	const reference = attrs.raw || `${attrs.book} ${attrs.chapter}`;
	try {
		if (!storage) {
			return {
				status: 'missing-bible',
				reference,
				text: null,
				versionId: null,
				versionLabel: null,
				bibleReference: null
			};
		}
		const catalog = await loadBibleCatalog(storage);
		const installed = catalog.versions.map((version) => version.id);
		const parserVersionId = attrs.version || null;
		const defaultVersionId =
			preferences?.defaultVersionId || preferences?.readerVersionId || null;
		const parsed = parseBibleReference(attrs.raw);
		const bibleReference: BibleReference = {
			raw: attrs.raw,
			osis: attrs.osis,
			book: attrs.book,
			chapter: attrs.chapter,
			verseStart: attrs.verseStart,
			verseEnd: attrs.verseEnd,
			translation: parserVersionId ?? undefined,
			from: 0,
			to: attrs.raw.length
		};
		const versionId = resolveReferenceVersionId(bibleReference, {
			parserVersionId,
			defaultVersionId,
			installedVersions: installed
		});
		const version = catalog.versions.find((candidate) => candidate.id === versionId) ?? null;
		const book = version ? matchCatalogBook(version.books, bibleReference) : null;
		if (!version || !book) {
			return {
				status: 'missing-bible',
				reference,
				text: null,
				versionId: null,
				versionLabel: null,
				bibleReference
			};
		}
		const end = Math.max(attrs.verseEnd, attrs.verseStart);
		const verses = await readBibleChapter(version, book.id, attrs.chapter);
		const filtered = verses.filter(
			(verse) => verse.number >= attrs.verseStart && verse.number <= end
		);
		if (!filtered.length) {
			return {
				status: 'unavailable',
				reference,
				text: null,
				versionId: version.id,
				versionLabel: displayVersion(version),
				bibleReference
			};
		}
		return {
			status: 'ready',
			reference,
			text: formatVerseSnapshot(filtered),
			versionId: version.id,
			versionLabel: displayVersion(version),
			bibleReference
		};
	} catch {
		return {
			status: 'unavailable',
			reference,
			text: null,
			versionId: null,
			versionLabel: null,
			bibleReference: null
		};
	}
}
