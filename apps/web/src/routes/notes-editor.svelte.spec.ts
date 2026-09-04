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
		for (const name of ['Negrito', 'Itálico', 'Título', 'Lista', 'Checklist', 'Citação', 'Versículo']) {
			await expect.element(toolbar.getByRole('button', { name, exact: true })).toBeInTheDocument();
		}
	});

	// SPECSFY: US-003 FR-004 NFR-002 AC-016
	it('turns the current mobile block into an unchecked task', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'mobile-task-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{End}{Enter}Revisar nota');
		await page.getByRole('toolbar', { name: 'Formatação da nota' }).getByRole('button', { name: 'Checklist' }).click();
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

	it('toggles task item to complete (checked: true) when task marker is clicked', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'task-toggle-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{End}{Enter}Tarefa teste');
		await page.getByRole('toolbar', { name: 'Formatação da nota' }).getByRole('button', { name: 'Checklist', exact: true }).click();

		const taskItem = editor.element().querySelector<HTMLElement>('li[data-item-type="task"]');
		expect(taskItem).not.toBeNull();
		expect(taskItem?.getAttribute('data-checked')).toBe('false');

		// Click on the task checkbox marker
		const bounds = taskItem!.getBoundingClientRect();
		taskItem!.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true,
				clientX: bounds.left - 10,
				clientY: bounds.top + 10
			})
		);

		await expect
			.poll(() =>
				editor.element().querySelector('li[data-item-type="task"]')?.getAttribute('data-checked')
			)
			.toBe('true');
	});

	it('automatically decorates bible references without modifying markdown text', async () => {
		await page.viewport(1440, 900);
		render(NotesEditorPage, { props: { data: { noteId: 'bible-ref-note' } } });
		const editor = page.getByRole('textbox');
		await editor.click();
		await userEvent.keyboard('{End}{Enter}Estudando Gn 3.1 (ARA) e Jo 3.16.');

		await expect
			.poll(() => editor.element().querySelectorAll('.bible-reference').length)
			.toBe(2);

		const refs = editor.element().querySelectorAll<HTMLElement>('.bible-reference');
		expect(refs[0].getAttribute('data-osis')).toBe('Gen.3.1');
		expect(refs[0].getAttribute('data-version')).toBe('ARA');
		expect(refs[0].getAttribute('data-raw')).toBe('Gn 3.1 (ARA)');

		expect(refs[1].getAttribute('data-osis')).toBe('John.3.16');
		expect(refs[1].getAttribute('data-raw')).toBe('Jo 3.16');

		// Click on reference to open viewer dialog
		refs[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		const dialog = page.getByRole('region', { name: 'Texto bíblico' });
		await expect.element(dialog).toBeInTheDocument();
		expect(dialog.element().textContent).toContain('Gênesis 3:1');
		expect(dialog.element().textContent).toContain('ARA');
		await expect.poll(() => dialog.element().textContent).toContain('serpente');
	});
});

