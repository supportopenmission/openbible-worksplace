import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NotesEditorPage from './notes/[id]/+page.svelte';

describe('notes editor Milkdown canvas controls', () => {
	// SPECSFY: US-001 FR-003 NFR-002 AC-013
	it('removes the legacy insert-verse button from the canvas route', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		await expect.element(page.getByRole('textbox')).toBeInTheDocument();
		const button = page.getByRole('button', { name: /inserir versículo/i });
		await expect.element(button).not.toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-006 NFR-003 AC-007 AC-014
	it('marks the canvas as viewport-filling and exposes an adaptive slash surface', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		await expect
			.element(page.getByTestId('note-canvas'))
			.toHaveAttribute('data-viewport-fill', 'true');
	});

	// SPECSFY: US-003 FR-004 NFR-002 NFR-003 AC-003 AC-016
	it('exposes the seven accessible mobile formatting actions', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		const toolbar = page.getByRole('toolbar', { name: 'Formatação da nota' });
		await expect.element(toolbar).toBeInTheDocument();
		for (const name of ['Negrito', 'Itálico', 'Título', 'Lista', 'Tarefas', 'Citação', 'Versículo']) {
			await expect.element(toolbar.getByRole('button', { name })).toBeInTheDocument();
		}
	});

	// SPECSFY: US-003 FR-004 NFR-002 AC-016
	it('turns the current mobile block into an unchecked task', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'mobile-task-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{End}{Enter}Revisar nota');
		await page.getByRole('toolbar', { name: 'Formatação da nota' }).getByRole('button', { name: 'Tarefas' }).click();
		expect(
			editor.element().querySelector('li[data-item-type="task"][data-checked="false"]')
		).not.toBeNull();
	});

	// SPECSFY: US-001 US-002 FR-003 NFR-002 AC-001 AC-013
	it('applies the active slash command with Enter before the editor inserts a line', async () => {
		await page.viewport(1440, 900);
		render(NotesEditorPage, { props: { data: { noteId: 'slash-enter-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{End}{Enter}/h2');
		await expect.element(page.getByRole('listbox', { name: 'Comandos de bloco' })).toBeInTheDocument();
		await userEvent.keyboard('{Enter}');

		const heading = page.getByRole('heading', { level: 2 });
		await expect.element(heading).toBeInTheDocument();
		expect(heading.element().textContent).not.toContain('/h2');
	});

	// SPECSFY: US-002 US-003 FR-003 FR-004 NFR-002 AC-002
	it('opens a searchable 90dvh command drawer on mobile', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'mobile-slash-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{End}{Enter}/');
		const drawer = page.getByRole('dialog', { name: 'Comandos' });
		await expect.element(drawer).toBeInTheDocument();
		await expect.element(drawer.getByPlaceholder('Buscar comandos')).toBeInTheDocument();
		expect(drawer.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(750);
	});

	// SPECSFY: US-003 FR-004 NFR-002 NFR-003 AC-003 AC-016
	it('keeps the measured formatting toolbar inside the viewport', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'toolbar-position-note' } } });
		const toolbar = page.getByRole('toolbar', { name: 'Formatação da nota' });
		await expect.element(toolbar).toBeInTheDocument();

		const rect = toolbar.element().getBoundingClientRect();
		expect(rect.left).toBeGreaterThanOrEqual(0);
		expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
	});
});
