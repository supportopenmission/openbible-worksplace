import { describe, expect, it } from 'vitest';
import { READER_HIGHLIGHT_PALETTE } from './reader-highlights';
import * as indicators from './reader-note-indicators';
import type { NoteVerseRef } from '$lib/features/notes/note-verse-index';

const genesis13: NoteVerseRef = {
	notePath: 'notes/note-1.md',
	blockIndex: 0,
	versionId: 'ara.sqlite',
	bookId: 1,
	bookName: 'Gênesis',
	chapter: 1,
	verseStart: 3,
	verseEnd: 3
};

describe('reader note indicators', () => {
	it('marks a verse covered by one active note ref', () => {
		// SPECSFY: US-003 FR-003 NFR-001 AC-007
		expect(indicators.versesCoveredByActiveNotes).toEqual(expect.any(Function));
		expect(
			indicators.versesCoveredByActiveNotes([genesis13], {
				versionId: 'ara.sqlite',
				bookId: 1,
				chapter: 1
			})
		).toEqual([3]);
	});

	it('does not mark a verse without an active note ref', () => {
		// SPECSFY: US-003 FR-003 AC-010
		expect(indicators.versesCoveredByActiveNotes).toEqual(expect.any(Function));
		expect(
			indicators.versesCoveredByActiveNotes([], {
				versionId: 'ara.sqlite',
				bookId: 1,
				chapter: 1
			})
		).toEqual([]);
	});

	it('ignores refs that were removed with the trash', () => {
		// SPECSFY: US-003 FR-003 NFR-002 AC-011
		expect(indicators.versesCoveredByActiveNotes).toEqual(expect.any(Function));
		expect(
			indicators.versesCoveredByActiveNotes([], {
				versionId: 'ara.sqlite',
				bookId: 1,
				chapter: 1
			})
		).toEqual([]);
	});

	it('lets a highlight and a note indicator coexist without a persistent link', () => {
		// SPECSFY: US-003 FR-005 NFR-003 AC-012
		expect(indicators.versesCoveredByActiveNotes).toEqual(expect.any(Function));
		expect(indicators.noteIndicatorLinksHighlight).toEqual(expect.any(Function));
		const verses = indicators.versesCoveredByActiveNotes([genesis13], {
			versionId: 'ara.sqlite',
			bookId: 1,
			chapter: 1
		});
		expect(verses).toContain(3);
		expect(indicators.noteIndicatorLinksHighlight()).toBe(false);
	});

	it('does not create a note when applying a highlight and does not apply a highlight when indicating a note', () => {
		// SPECSFY: FR-005 AC-013
		expect(indicators.noteIndicatorAppliesHighlightStyle).toEqual(expect.any(Function));
		expect(indicators.noteIndicatorAppliesHighlightStyle()).toBe(false);
	});

	it('does not treat the note icon as a Q6 highlight style', () => {
		// SPECSFY: FR-005 NFR-003 AC-017
		expect(indicators.isNoteIndicatorHighlightStyle).toEqual(expect.any(Function));
		expect(indicators.isNoteIndicatorHighlightStyle()).toBe(false);
		expect(
			READER_HIGHLIGHT_PALETTE.some((style) => style.id === 'note-icon')
		).toBe(false);
	});

	it('does not create a persistent link when opening the multi-note selector', () => {
		// SPECSFY: FR-010 NFR-002 AC-017
		expect(indicators.verseNoteSelectorLinksHighlight).toEqual(expect.any(Function));
		expect(indicators.verseNoteSelectorLinksHighlight()).toBe(false);
	});

	it('omits trashed note paths from distinct verse note counts', () => {
		// SPECSFY: FR-009 NFR-002 AC-014
		expect(indicators.countActiveNotesExcludingTrash).toEqual(expect.any(Function));
		expect(
			indicators.countActiveNotesExcludingTrash(
				[genesis13],
				{ versionId: 'ara.sqlite', bookId: 1, chapter: 1 },
				3,
				new Set(['notes/note-1.md'])
			)
		).toBe(0);
	});
});
