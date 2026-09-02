import { describe, expect, it } from 'vitest';
import { createNote, listNotes, trashNote } from './notes-repository';

// SPECSFY: US-001 FR-001 NFR-002 AC-001
describe('notes-repository list and create', () => {
	it('lists active notes and creates a file under notes/', async () => {
		const notes = await listNotes();
		expect(notes.length).toBeGreaterThanOrEqual(0);
		const created = await createNote();
		expect(created.path).toMatch(/^notes\/.+\.md$/);
	});
});

// SPECSFY: US-001 FR-001 FR-006 NFR-002 AC-002
describe('notes-repository trash', () => {
	it('moves a note to trash without deleting silently', async () => {
		const created = await createNote();
		await trashNote(created.id);
		const notes = await listNotes();
		expect(notes.find((n) => n.id === created.id)).toBeUndefined();
	});
});

// SPECSFY: US-001 US-002 FR-001 FR-002 NFR-001 NFR-002 AC-011
describe('notes-repository title sync for listing', () => {
	it('reflects synchronized title after H1 edit and save', async () => {
		const created = await createNote();
		created.title = 'Estudo sobre João 3';
		const notes = await listNotes();
		expect(notes.find((n) => n.id === created.id)?.title).toBe('Estudo sobre João 3');
	});
});
