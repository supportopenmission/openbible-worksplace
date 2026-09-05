import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { serializeNoteFile } from '$lib/features/notes/note-markdown';
import type { WorkspaceStorage } from '$lib/storage/types';
import NotesEditorPage from './notes/[id]/+page.svelte';

function noteStorage(noteId: string, body: string): WorkspaceStorage {
	const files = new Map<string, Uint8Array>();
	const encoder = new TextEncoder();
	const path = `notes/${noteId}.md`;
	const source = serializeNoteFile({
		meta: {
			id: noteId,
			title: 'Nota com referência',
			createdAt: '2026-09-05T00:00:00.000Z',
			updatedAt: '2026-09-05T00:00:00.000Z',
			type: 'note',
			path
		},
		body
	});
	files.set(path, encoder.encode(source));

	return {
		kind: 'opfs',
		label: 'Memória de teste',
		async ensureDirectory() {},
		async writeFile(filePath, content) {
			files.set(filePath, typeof content === 'string' ? encoder.encode(content) : content);
		},
		async readFile(filePath) {
			return files.get(filePath) ?? null;
		},
		async fileExists(filePath) {
			return files.has(filePath);
		},
		async listFiles(directory) {
			const prefix = `${directory.replace(/\/$/, '')}/`;
			return [...files.keys()]
				.filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
				.map((file) => file.slice(prefix.length));
		}
	};
}

async function getNoteEditor() {
	const editor = page.getByTestId('note-canvas').getByRole('textbox');
	await expect.element(editor).toBeInTheDocument();
	return editor;
}

describe('notes editor Milkdown canvas controls', () => {
	// SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-005 AC-012 AC-015
	it('opens a saved note with colon ranges and remains editable', async () => {
		const noteId = 'parser-reference-note';
		const storage = noteStorage(noteId, '# Nota com referência\n\nEstudo em João 4:4-7.');
		render(NotesEditorPage, { props: { data: { noteId }, storageOverride: storage } });
		const editor = await getNoteEditor();

		await expect.element(editor).toHaveTextContent('Estudo em João 4:4-7.');
		await editor.click();
		await userEvent.keyboard('{End} Continuação editável');
		await expect.element(editor).toHaveTextContent('Continuação editável');
	});

	// SPECSFY: US-001 FR-003 NFR-002 AC-013
	it('removes the legacy insert-verse button from the canvas route', async () => {
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		await getNoteEditor();
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
	it('reveals formatting actions only after the editor receives a cursor', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'test-note' } } });
		const editor = await getNoteEditor();
		await expect
			.element(page.getByRole('button', { name: 'Abrir ferramentas de formatação' }))
			.not.toBeInTheDocument();
		await editor.click();
		await expect
			.element(page.getByRole('button', { name: 'Abrir ferramentas de formatação' }))
			.toBeInTheDocument();
		await page.getByRole('button', { name: 'Abrir ferramentas de formatação' }).click();
		const toolbar = page.getByRole('toolbar', { name: 'Formatação da nota' });
		await expect.element(toolbar).toBeInTheDocument();
		for (const name of [
			'Negrito',
			'Itálico',
			'Título',
			'Lista',
			'Checklist',
			'Citação',
			'Versículo'
		]) {
			await expect.element(toolbar.getByRole('button', { name, exact: true })).toBeInTheDocument();
		}
	});

	// SPECSFY: US-003 FR-004 NFR-002 AC-003 AC-016
	it('shows the formatting toolbar below the desktop note header and collapses it with an arrow', async () => {
		await page.viewport(1440, 900);
		render(NotesEditorPage, { props: { data: { noteId: 'desktop-toolbar-note' } } });
		const editor = await getNoteEditor();
		await editor.click();

		const toolbar = page.getByRole('toolbar', { name: 'Formatação da nota' });
		await expect.element(toolbar).toBeInTheDocument();
		const collapse = page.getByRole('button', { name: 'Recolher barra de ferramentas' });
		await expect.element(collapse).toHaveAttribute('aria-expanded', 'true');
		await collapse.click();
		await expect
			.element(page.getByRole('button', { name: 'Abrir ferramentas de formatação' }))
			.toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-004 NFR-002 AC-016
	it('turns the current mobile block into an unchecked task', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'mobile-task-note' } } });
		const editor = await getNoteEditor();
		await editor.click();
		await userEvent.keyboard('{End}{Enter}Revisar nota');
		await page.getByRole('button', { name: 'Abrir ferramentas de formatação' }).click();
		await page
			.getByRole('toolbar', { name: 'Formatação da nota' })
			.getByRole('button', { name: 'Checklist' })
			.click();
		expect(
			editor.element().querySelector('li[data-item-type="task"][data-checked="false"]')
		).not.toBeNull();
	});

	// SPECSFY: US-001 US-002 FR-003 NFR-002 AC-001 AC-013
	it('applies the active slash command with Enter before the editor inserts a line', async () => {
		await page.viewport(1440, 900);
		render(NotesEditorPage, { props: { data: { noteId: 'slash-enter-note' } } });
		const editor = await getNoteEditor();
		await editor.click();
		await userEvent.keyboard('{End}{Enter}/h2');
		await expect
			.element(page.getByRole('listbox', { name: 'Comandos de bloco' }))
			.toBeInTheDocument();
		await userEvent.keyboard('{Enter}');

		const heading = page.getByRole('heading', { level: 2 });
		await expect.element(heading).toBeInTheDocument();
		expect(heading.element().textContent).not.toContain('/h2');
	});

	// SPECSFY: US-002 US-003 FR-003 FR-004 NFR-002 AC-002
	it('opens a searchable 90dvh command drawer on mobile', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'mobile-slash-note' } } });
		const editor = await getNoteEditor();
		await editor.click();
		await userEvent.keyboard('{End}{Enter}/');
		const drawer = page.getByRole('dialog', { name: 'Comandos' });
		await expect.element(drawer).toBeInTheDocument();
		await expect.element(drawer.getByPlaceholder('Buscar comandos')).toBeInTheDocument();
		expect(drawer.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(750);
	});

	// SPECSFY: US-002 FR-003 NFR-002 AC-002 AC-013
	it('blurs the editor before opening the mobile slash drawer', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'mobile-slash-keyboard-note' } } });
		const editor = await getNoteEditor();
		let drawerWasVisibleWhenEditorBlurred = false;
		editor.element().addEventListener('blur', () => {
			drawerWasVisibleWhenEditorBlurred = document.querySelector('[role="dialog"]') !== null;
		});

		await editor.click();
		await userEvent.keyboard('{End}{Enter}/');

		await expect.element(page.getByRole('dialog', { name: 'Comandos' })).toBeInTheDocument();
		expect(drawerWasVisibleWhenEditorBlurred).toBe(false);
		expect(document.activeElement).not.toBe(editor.element());
	});

	// SPECSFY: US-003 FR-004 NFR-002 NFR-003 AC-003 AC-016
	it('keeps the measured formatting toolbar inside the viewport', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'toolbar-position-note' } } });
		const editor = await getNoteEditor();
		const toolbar = page.getByRole('toolbar', { name: 'Formatação da nota' });
		await editor.click();
		await page.getByRole('button', { name: 'Abrir ferramentas de formatação' }).click();
		await expect.element(toolbar).toBeInTheDocument();

		const rect = toolbar.element().getBoundingClientRect();
		expect(rect.left).toBeGreaterThanOrEqual(0);
		expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
	});

	it('toggles task item to complete (checked: true) when task marker is clicked', async () => {
		await page.viewport(390, 844);
		render(NotesEditorPage, { props: { data: { noteId: 'task-toggle-note' } } });
		const editor = await getNoteEditor();
		await editor.click();
		await userEvent.keyboard('{End}{Enter}Tarefa teste');
		await page.getByRole('button', { name: 'Abrir ferramentas de formatação' }).click();
		await page
			.getByRole('toolbar', { name: 'Formatação da nota' })
			.getByRole('button', { name: 'Checklist', exact: true })
			.click();

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
		const editor = await getNoteEditor();
		await editor.click();
		await userEvent.keyboard('{End}{Enter}Estudando Gn 3.1 (ARA) e Jo 3.16.');

		await expect.poll(() => editor.element().querySelectorAll('.bible-reference').length).toBe(2);

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
