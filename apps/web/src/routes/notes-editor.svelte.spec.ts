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
		await expect
			.element(page.getByTestId('note-canvas'))
			.toHaveAttribute('data-viewport-fill', 'true');
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

	// SPECSFY: US-002 US-003 FR-002 FR-005 NFR-001 AC-017
	it('applies the active slash command with Enter before the editor inserts a line', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'slash-enter-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{End}{Enter}/h2');
		await expect.element(page.getByRole('listbox', { name: 'Blocos' })).toBeInTheDocument();
		await userEvent.keyboard('{Enter}');

		await expect.element(page.getByRole('heading', { level: 2 })).toBeInTheDocument();
		expect(editor.element().querySelectorAll(':scope > p')).toHaveLength(0);
	});

	// SPECSFY: US-002 US-003 FR-002 FR-005 NFR-001 AC-018
	it('exposes an accessible handle that selects and reorders the current block', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'block-handle-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{End}{Enter}Primeiro{Enter}Segundo');
		await page.getByText('Primeiro', { exact: true }).click();

		const handle = page.getByRole('button', { name: 'Selecionar e mover bloco' });
		await expect.element(handle).toBeInTheDocument();
		await handle.click();
		await expect.element(editor).toHaveAttribute('data-block-selected', 'true');
		const target = page.getByText('Segundo', { exact: true }).element();
		const targetRect = target.getBoundingClientRect();
		const transfer = new DataTransfer();
		handle
			.element()
			.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
		target.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: targetRect.left + 10,
				clientY: targetRect.bottom - 1,
				dataTransfer: transfer
			})
		);
		target.dispatchEvent(
			new DragEvent('drop', {
				bubbles: true,
				clientX: targetRect.left + 10,
				clientY: targetRect.bottom - 1,
				dataTransfer: transfer
			})
		);

		expect(
			[...editor.element().querySelectorAll(':scope > p')].map((block) => block.textContent)
		).toEqual(['Segundo', 'Primeiro']);

		handle.element().focus();
		handle
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }));
		expect(
			[...editor.element().querySelectorAll(':scope > p')].map((block) => block.textContent)
		).toEqual(['Primeiro', 'Segundo']);
	});

	// SPECSFY: US-002 US-003 FR-002 FR-005 FR-010 NFR-001 AC-016
	it('keeps the measured formatting toolbar inside the viewport', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'toolbar-position-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{Control>}a{/Control}');
		const toolbar = page.getByRole('toolbar', { name: 'Formatação' });
		await expect.element(toolbar).toBeInTheDocument();

		const rect = toolbar.element().getBoundingClientRect();
		expect(rect.left).toBeGreaterThanOrEqual(8);
		expect(rect.right).toBeLessThanOrEqual(window.innerWidth - 8);
	});
});
