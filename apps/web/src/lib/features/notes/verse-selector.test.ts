import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	confirmVerseSelection,
	prefillFromReaderSelection,
	validateVerseRange
} from './verse-selector';
import { selectionToVerseAttrs } from './milkdown-verse-node';

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

// SPECSFY: US-002 FR-006 NFR-003 AC-010
describe('milkdown missing bible version', () => {
	it('reports an explicit missing-version state instead of inventing text', () => {
		const confirmed = confirmVerseSelection(
			{
				versionId: '',
				bookId: 43,
				book: 'João',
				chapter: 3,
				verseStart: 16,
				verseEnd: 18
			},
			{}
		);
		expect(selectionToVerseAttrs(confirmed, [])).toEqual({
			ok: false,
			reason: 'missing-version'
		});
	});

	it('resolves attrs when the version exists in the catalog', () => {
		const confirmed = confirmVerseSelection(
			{
				versionId: 'nvi.sqlite',
				bookId: 43,
				book: 'João',
				chapter: 3,
				verseStart: 16,
				verseEnd: 16
			},
			{}
		);
		expect(selectionToVerseAttrs(confirmed, ['nvi.sqlite'])).toEqual({
			ok: true,
			attrs: {
				versionId: 'nvi.sqlite',
				version: '',
				bookId: '43',
				book: 'João',
				chapter: '3',
				verseStart: '16',
				verseEnd: '16'
			}
		});
	});
});

// SPECSFY: US-002 FR-006 NFR-002 AC-017
describe('milkdown selector reuse', () => {
	it('maps confirmed dialog/sheet state to the same fence attrs', () => {
		const confirmed = confirmVerseSelection(
			{
				versionId: 'acf.sqlite',
				bookId: 1,
				book: 'Gênesis',
				chapter: 1,
				verseStart: 1,
				verseEnd: 2
			},
			{}
		);
		expect(selectionToVerseAttrs(confirmed, ['acf.sqlite'])).toEqual({
			ok: true,
			attrs: {
				versionId: 'acf.sqlite',
				version: '',
				bookId: '1',
				book: 'Gênesis',
				chapter: '1',
				verseStart: '1',
				verseEnd: '2'
			}
		});
	});

	it('keeps desktop select content above the verse dialog surface', () => {
		const source = readFileSync(new URL('./VerseSelector.svelte', import.meta.url), 'utf8');
		expect(source.match(/<Select\.Content class="z-\[80\]">/g)).toHaveLength(3);
	});
});
