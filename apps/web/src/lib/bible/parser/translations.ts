import type { BibleTranslation } from './types';
import { displayVersionAbbreviation } from '$lib/features/bible/version-label';
import type { WorkspaceStorage } from '$lib/storage/types';

export const bibleTranslations: Record<string, BibleTranslation> = {
	ARA: {
		id: 'ara',
		abbreviation: 'ARA',
		name: 'Almeida Revista e Atualizada'
	},
	ARC: {
		id: 'arc',
		abbreviation: 'ARC',
		name: 'Almeida Revista e Corrigida'
	},
	NAA: {
		id: 'naa',
		abbreviation: 'NAA',
		name: 'Nova Almeida Atualizada'
	},
	NVI: {
		id: 'nvi',
		abbreviation: 'NVI',
		name: 'Nova Versão Internacional'
	}
};

/**
 * Registers or updates a translation in the registry.
 */
export function registerTranslation(translation: BibleTranslation): void {
	const key = translation.abbreviation.toUpperCase();
	bibleTranslations[key] = {
		id: translation.id.toLowerCase(),
		abbreviation: translation.abbreviation.toUpperCase(),
		name: translation.name
	};
}

/**
 * Registers a Bible version into the translation registry, extracting
 * its abbreviation via displayVersionAbbreviation.
 */
export function registerBibleVersion(version: {
	name: string;
	fileName?: string;
	id?: string;
}): BibleTranslation {
	const abbr = displayVersionAbbreviation(version);
	const translation: BibleTranslation = {
		id: abbr.toLowerCase(),
		abbreviation: abbr,
		name: version.name || abbr
	};
	registerTranslation(translation);
	return translation;
}

/**
 * Populates translations from a list of Bible versions.
 */
export function populateTranslationsFromCatalog(
	versions: Array<{ name: string; fileName?: string; id?: string }>
): BibleTranslation[] {
	return versions.map((v) => registerBibleVersion(v));
}

/**
 * Reads all installed Bibles from workspace storage and registers their translations.
 */
export async function populateTranslationsFromStorage(
	storage: WorkspaceStorage
): Promise<BibleTranslation[]> {
	try {
		const { loadBibleCatalog } = await import('$lib/features/bible/bible-reader');
		const catalog = await loadBibleCatalog(storage);
		return populateTranslationsFromCatalog(catalog.versions);
	} catch {
		return Object.values(bibleTranslations);
	}
}

/**
 * Normalizes and finds a translation from input (case-insensitive).
 * Handles formats like: "ARA", "ara", "Ara", "(ARA)", "(ara)", etc.
 */
export function findTranslation(input: string): BibleTranslation | undefined {
	const cleaned = input.replace(/[()]/g, '').trim().toUpperCase();
	if (!cleaned) return undefined;

	for (const [key, value] of Object.entries(bibleTranslations)) {
		if (
			key.toUpperCase() === cleaned ||
			value.id.toUpperCase() === cleaned ||
			value.abbreviation.toUpperCase() === cleaned
		) {
			return value;
		}
	}

	return undefined;
}
