import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NotesEditorPage from './notes/[id]/+page.svelte';

// SPECSFY: US-002 US-003 FR-002 FR-005 NFR-001 AC-005
describe('notes editor accessible insert button', () => {
	it('exposes a focusable insert-verse control on the canvas route', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		const button = page.getByRole('button', { name: /inserir versículo/i });
		await expect.element(button).toBeInTheDocument();
	});
});
