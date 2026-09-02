import { describe, expect, it } from 'vitest';
import { reindexNoteVerses } from './note-verse-index';

// SPECSFY: US-003 FR-003 FR-004 FR-006 NFR-002 AC-010
describe('note-verse-index multi-version blocks', () => {
	it('stores distinct version_id rows per block', async () => {
		const refs = await reindexNoteVerses('notes/test.md', [
			{
				blockIndex: 0,
				versionId: 'nvi.sqlite',
				bookId: 43,
				chapter: 3,
				verseStart: 16,
				verseEnd: 16
			},
			{
				blockIndex: 1,
				versionId: 'acf.sqlite',
				bookId: 43,
				chapter: 3,
				verseStart: 17,
				verseEnd: 18
			}
		]);
		expect(refs).toHaveLength(2);
		expect(new Set(refs.map((r) => r.versionId)).size).toBe(2);
	});
});
