import { describe, expect, it } from 'vitest';
import {
	isReaderSelectionValid,
	readReaderPreference,
	READER_SELECTION_STORAGE_KEY,
	saveReaderPreference
} from './reader-preference';

function createStorage(initial?: string): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
	let value = initial ?? null;
	return {
		getItem: () => value,
		setItem: (...args: [string, string]) => {
			value = args[1];
		},
		removeItem: () => {
			value = null;
		}
	};
}

const catalog = {
	versions: [
		{
			id: 'ara.sqlite',
			fileName: 'ara.sqlite',
			name: 'ara.sqlite',
			books: [{ id: 1, name: 'Gênesis', abbreviation: 'Gn', chapters: [1, 2] }]
		}
	],
	diagnostics: []
};

describe('Bible reader preference', () => {
	it('persists and reads a valid local selection', () => {
		// SPECSFY: US-001 US-002 FR-002 FR-003 NFR-001 NFR-002 AC-003
		const storage = createStorage();
		const selection = { versionId: 'ara.sqlite', bookId: 1, chapter: 2 };

		expect(saveReaderPreference(selection, storage)).toBe(true);
		expect(readReaderPreference(storage)).toEqual(selection);
		expect(storage.getItem(READER_SELECTION_STORAGE_KEY)).toContain('ara.sqlite');
	});

	it('rejects a selection whose chapter is no longer in the catalog', () => {
		// SPECSFY: US-001 US-002 FR-002 FR-003 NFR-001 NFR-002 AC-003
		const selection = { versionId: 'ara.sqlite', bookId: 1, chapter: 99 };

		expect(isReaderSelectionValid(selection, catalog)).toBe(false);
	});

	it('discards malformed stored values instead of restoring invalid coordinates', () => {
		// SPECSFY: US-001 US-002 FR-002 FR-003 NFR-001 NFR-002 AC-003
		const storage = createStorage('{"versionId":"ara.sqlite","bookId":"1"}');

		expect(readReaderPreference(storage)).toBeNull();
	});
});
