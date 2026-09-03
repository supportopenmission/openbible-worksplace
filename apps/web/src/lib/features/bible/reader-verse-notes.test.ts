import { describe, expect, it } from 'vitest';
import type { NoteVerseRef } from '$lib/features/notes/note-verse-index';
import * as verseNotes from './reader-verse-notes';

const chapterQuery = {
	versionId: 'ara.sqlite',
	bookId: 1,
	chapter: 1
};

const noteA: NoteVerseRef = {
	notePath: 'notes/note-a.md',
	blockIndex: 0,
	versionId: 'ara.sqlite',
	bookId: 1,
	bookName: 'Gênesis',
	chapter: 1,
	verseStart: 3,
	verseEnd: 3
};

const noteB: NoteVerseRef = {
	notePath: 'notes/note-b.md',
	blockIndex: 0,
	versionId: 'ara.sqlite',
	bookId: 1,
	bookName: 'Gênesis',
	chapter: 1,
	verseStart: 3,
	verseEnd: 3
};

const duplicateBlockSameNote: NoteVerseRef = {
	notePath: 'notes/note-a.md',
	blockIndex: 1,
	versionId: 'ara.sqlite',
	bookId: 1,
	bookName: 'Gênesis',
	chapter: 1,
	verseStart: 3,
	verseEnd: 3
};

const intervalNote: NoteVerseRef = {
	notePath: 'notes/note-range.md',
	blockIndex: 0,
	versionId: 'ara.sqlite',
	bookId: 1,
	bookName: 'Gênesis',
	chapter: 5,
	verseStart: 2,
	verseEnd: 5
};

describe('reader verse notes', () => {
	it('opens a single note directly without showing the selector', () => {
		// SPECSFY: US-001 FR-001 FR-006 FR-010 NFR-001 AC-001
		expect(verseNotes.shouldOpenNoteDirectly).toEqual(expect.any(Function));
		expect(verseNotes.shouldOpenNoteDirectly(1)).toBe(true);
		expect(verseNotes.shouldOpenNoteDirectly(2)).toBe(false);
	});

	it('does not show a badge for a single active note', () => {
		// SPECSFY: US-001 FR-001 FR-002 AC-002
		expect(verseNotes.formatMultiNoteBadge).toEqual(expect.any(Function));
		expect(verseNotes.formatMultiNoteBadge(1)).toBeNull();
		expect(verseNotes.formatMultiNoteBadge(0)).toBeNull();
	});

	it('keeps reader navigation on /bible when opening from the icon', () => {
		// SPECSFY: US-001 FR-001 FR-010 NFR-002 AC-003
		expect(verseNotes.readerNoteOpensInBible).toEqual(expect.any(Function));
		expect(verseNotes.readerNoteOpensInBible()).toBe(true);
	});

	it('shows badge 2 and lists two distinct notes for the verse', () => {
		// SPECSFY: US-002 FR-002 FR-003 NFR-001 AC-004
		expect(verseNotes.countDistinctNotesForVerse).toEqual(expect.any(Function));
		expect(verseNotes.formatMultiNoteBadge).toEqual(expect.any(Function));
		const refs = [noteA, noteB];
		expect(verseNotes.countDistinctNotesForVerse(refs, chapterQuery, 3)).toBe(2);
		expect(verseNotes.formatMultiNoteBadge(2)).toBe('2');
	});

	it('shows badge 9+ when ten or more distinct notes cover the verse', () => {
		// SPECSFY: US-002 FR-002 NFR-003 AC-005
		expect(verseNotes.formatMultiNoteBadge).toEqual(expect.any(Function));
		expect(verseNotes.formatMultiNoteBadge(10)).toBe('9+');
		expect(verseNotes.formatMultiNoteBadge(12)).toBe('9+');
	});

	it('orders note summaries by updatedAt descending', () => {
		// SPECSFY: US-002 FR-003 FR-007 AC-008
		expect(verseNotes.sortNoteSummariesByUpdatedAt).toEqual(expect.any(Function));
		const sorted = verseNotes.sortNoteSummariesByUpdatedAt([
			{ notePath: 'notes/old.md', id: 'old', title: 'Antiga', updatedAt: '2026-01-01T00:00:00.000Z' },
			{ notePath: 'notes/new.md', id: 'new', title: 'Nova', updatedAt: '2026-09-03T00:00:00.000Z' }
		]);
		expect(sorted[0]?.id).toBe('new');
		expect(sorted[1]?.id).toBe('old');
	});

	it('deduplicates refs that share the same note_path on one verse', () => {
		// SPECSFY: US-002 FR-008 AC-010
		expect(verseNotes.dedupeRefsByNotePath).toEqual(expect.any(Function));
		const deduped = verseNotes.dedupeRefsByNotePath([noteA, duplicateBlockSameNote]);
		expect(deduped).toHaveLength(1);
		expect(deduped[0]?.notePath).toBe('notes/note-a.md');
	});

	it('reads display title from note summary frontmatter', () => {
		// SPECSFY: FR-007 NFR-002 AC-015
		expect(verseNotes.resolveNoteDisplayTitle).toEqual(expect.any(Function));
		expect(
			verseNotes.resolveNoteDisplayTitle({
				notePath: 'notes/study.md',
				id: 'study',
				title: 'Estudo Gênesis',
				updatedAt: '2026-09-03T00:00:00.000Z'
			})
		).toBe('Estudo Gênesis');
	});

	it('falls back to Sem título when summary title is empty', () => {
		// SPECSFY: FR-007 AC-016
		expect(verseNotes.resolveNoteDisplayTitle).toEqual(expect.any(Function));
		expect(
			verseNotes.resolveNoteDisplayTitle({
				notePath: 'notes/empty.md',
				id: 'empty',
				title: '',
				updatedAt: ''
			})
		).toBe('Sem título');
	});

	it('counts interval refs on intermediate verses in the chapter', () => {
		// SPECSFY: FR-010 AC-018
		expect(verseNotes.countDistinctNotesForVerse).toEqual(expect.any(Function));
		const query = { versionId: 'ara.sqlite', bookId: 1, chapter: 5 };
		expect(verseNotes.countDistinctNotesForVerse([intervalNote], query, 3)).toBe(1);
		expect(verseNotes.countDistinctNotesForVerse([intervalNote], query, 2)).toBe(1);
	});
});
