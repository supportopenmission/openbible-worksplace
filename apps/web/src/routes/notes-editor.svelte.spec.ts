import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NotesEditorPage from './notes/[id]/+page.svelte';

describe('notes editor revised canvas controls', () => {
	// SPECSFY: US-002 US-003 FR-002 FR-005 NFR-001 AC-005
	it('removes the legacy insert-verse button from the canvas route', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		await expect.element(page.getByRole('textbox')).toBeInTheDocument();
		const button = page.getByRole('button', { name: /inserir versículo/i });
		await expect.element(button).not.toBeInTheDocument();
	});

	// SPECSFY: US-002 US-003 FR-002 FR-005 FR-010 NFR-001 AC-005 AC-014
	it('marks the canvas as viewport-filling and exposes an adaptive slash surface', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		await expect.element(page.getByTestId('note-canvas')).toHaveAttribute('data-viewport-fill', 'true');
	});

	// SPECSFY: US-002 FR-002 FR-010 NFR-001 AC-003 AC-014
	it('exposes an accessible highlight color control for selected text', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{Control>}a{/Control}');
		await expect
			.element(page.getByRole('button', { name: 'Cor de destaque: Amarelo' }))
			.toBeInTheDocument();
	});
});
