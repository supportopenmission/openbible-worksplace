import { describe, expect, it } from 'vitest';
import { confirmVerseSelection, prefillFromReaderSelection, validateVerseRange } from './verse-selector';

// SPECSFY: US-003 FR-004 FR-005 NFR-001 AC-006 AC-009
describe('verse-selector validation and prefill', () => {
	it('blocks invalid ranges in the same chapter', () => {
		expect(validateVerseRange({ verseStart: 18, verseEnd: 16, chapter: 3, endChapter: 3 })).toBe(
			false
		);
	});

	it('prefills from readerSelection without mutating it on confirm', () => {
		const initial = { versionId: 'nvi.sqlite', bookId: 43, chapter: 3 };
		const prefilled = prefillFromReaderSelection(initial);
		expect(prefilled.versionId).toBe('nvi.sqlite');
		const confirmed = confirmVerseSelection(prefilled, { versionId: 'acf.sqlite' });
		expect(confirmed.versionId).toBe('acf.sqlite');
		expect(initial.versionId).toBe('nvi.sqlite');
	});
});
