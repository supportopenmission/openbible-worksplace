import type { WorkspaceStorage } from '$lib/storage/types';
import type { BibleVersion } from '$lib/features/bible/bible-reader';
import { loadBibleCatalog, readBibleChapter } from '$lib/features/bible/bible-reader';
import { displayVersionAbbreviation } from '$lib/features/bible/version-label';
import { formatVerseSnapshot } from './verse-selector';
import {
	matchCatalogBook,
	parseFirstBibleReference,
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

export interface CatalogVersionAlias {
	id: string;
	fileName?: string;
	name?: string;
}

function normalizeVersionAlias(value: string | null | undefined): string {
	return (
		(value ?? '')
			.trim()
			.replace(/\\/g, '/')
			.split('/')
			.pop()
			?.replace(/\.(?:sqlite|db)$/i, '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLocaleLowerCase('pt-BR')
			.replace(/[^a-z0-9]+/g, '') ?? ''
	);
}

/** Match parser/user aliases such as `ARA` to a catalog file or display name. */
export function matchCatalogVersion<T extends CatalogVersionAlias>(
	versions: T[],
	requested: string | null | undefined
): T | null {
	const target = normalizeVersionAlias(requested);
	if (!target) return null;
	return (
		versions.find((version) => {
			const aliases = [version.id, version.fileName, version.name];
			if (version.name) {
				try {
					aliases.push(
						displayVersionAbbreviation({
							name: version.name,
							fileName: version.fileName,
							id: version.id
						})
					);
				} catch {
					// A malformed display label should not prevent file aliases from matching.
				}
			}
			return aliases.some((alias) => normalizeVersionAlias(alias) === target);
		}) ?? null
	);
}

/** Short `{book, chapter, verse}` contract used by the hover card. */
export function parseBibleReference(text: string): ParsedShortReference | null {
	const reference = parseFirstBibleReference(text);
	if (!reference || reference.chapter == null || reference.verseStart == null) return null;
	return {
		book: shortBookLabel(reference),
		chapter: reference.chapter,
		verse: reference.verseStart
	};
}

/** Pure version/text resolution behind the hover card states. */
export function resolveHoverCard(
	parsed: ParsedShortReference | null,
	context: HoverLookupContext
): HoverCardData {
	const reference = parsed ? `${parsed.book} ${parsed.chapter}.${parsed.verse}` : '';
	const installedVersion = (requested: string | null) =>
		requested
			? (context.installedVersions.find(
					(installed) => normalizeVersionAlias(installed) === normalizeVersionAlias(requested)
				) ?? null)
			: null;
	const versionId =
		installedVersion(context.parserVersionId) ?? installedVersion(context.defaultVersionId);
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
		const parserVersionId = attrs.version || null;
		const preferredVersionIds = [
			parserVersionId,
			preferences?.defaultVersionId ?? null,
			preferences?.readerVersionId ?? null
		];
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
		const version =
			preferredVersionIds.reduce<BibleVersion | null>(
				(found, requested) => found ?? matchCatalogVersion(catalog.versions, requested),
				null
			) ??
			catalog.versions[0] ??
			null;
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
