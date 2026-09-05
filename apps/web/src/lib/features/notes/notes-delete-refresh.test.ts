import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const SIDEBAR = new URL('./NotesSecondarySidebar.svelte', import.meta.url);
const NOTE_PAGE = new URL('../../../routes/notes/[id]/+page.svelte', import.meta.url);

// SPECSFY: US-001 FR-001 FR-006 NFR-002 AC-002
describe('notes deletion refresh', () => {
	it('reloads the shared list after deleting from the sidebar', async () => {
		const source = await readFile(SIDEBAR, 'utf8');
		expect(source).toContain('await notesState.loadNotes(storage, true)');
	});

	it('reloads the shared list before leaving the note detail route', async () => {
		const source = await readFile(NOTE_PAGE, 'utf8');
		expect(source).toContain('await notesState.loadNotes(activeStorage, true)');
	});
});
