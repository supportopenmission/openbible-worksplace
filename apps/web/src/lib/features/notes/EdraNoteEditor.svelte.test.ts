import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import EdraNoteEditor from './EdraNoteEditor.svelte';
import type { Note } from './note-types';
import { readNote } from './notes-repository';
import type { WorkspaceStorage } from '$lib/storage/types';

const VERSE_FENCE = [
	':::verse{versionId="ara.sqlite" version="ARA" bookId="1" book="Gênesis" chapter="1" verseStart="1" verseEnd="1"}',
	'No princípio Deus criou os céus e a terra.',
	':::'
].join('\n');

const MERMAID_FENCE = [':::mermaid', 'graph TD', '  A[Início] --> B[Fim]', ':::'].join('\n');

function memoryStorage(workspaceId: string): WorkspaceStorage {
	const files = new Map<string, Uint8Array>();
	return {
		kind: 'opfs',
		label: 'Teste Edra',
		workspaceId,
		async ensureDirectory() {},
		async writeFile(path, content) {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
		},
		async readFile(path) {
			return files.get(path) ?? null;
		},
		async fileExists(path) {
			return files.has(path);
		},
		async listFiles() {
			return [];
		}
	};
}

function testNote(id: string, body: string): Note {
	const now = new Date().toISOString();
	return {
		id,
		title: 'Nota Edra',
		description: 'Descrição Edra',
		createdAt: now,
		updatedAt: now,
		meta: { id, title: 'Nota Edra', description: 'Descrição Edra', createdAt: now, updatedAt: now, type: 'note', path: `notes/${id}.md` },
		body,
		content: body,
		path: `notes/${id}.md`
	};
}

function prosemirror(container: HTMLElement): HTMLElement {
	const element = container.querySelector('.ProseMirror');
	if (!(element instanceof HTMLElement)) throw new Error('ProseMirror ausente');
	return element;
}

// SPECSFY: migração gradual do editor (Edra) — UI completa persiste no backend operacional.
describe('edra note editor in browser', () => {
	it('renders title, content and the read-only verse fence', async () => {
		const storage = memoryStorage(`edra-browser-render-${Date.now()}`);
		const note = testNote('render-1', `Para **negrito**.\n\n${VERSE_FENCE}\n`);

		const screen = await render(EdraNoteEditor, {
			props: { note, storage, toolbarPinned: true }
		});

		await expect.element(screen.getByRole('heading', { name: 'Nota Edra' })).toBeInTheDocument();
		const canvas = prosemirror(screen.container);
		expect(canvas.textContent).toContain('Para negrito.');
		expect(canvas.textContent).toContain('ARA · Gênesis 1:1');
		expect(canvas.textContent).toContain('No princípio Deus criou os céus e a terra.');
	});

	it('shows the Edra toolbar and formats with a keyboard shortcut', async () => {
		const storage = memoryStorage(`edra-browser-toolbar-${Date.now()}`);
		const note = testNote('toolbar-1', 'Para formatar.\n');
		const onStatusChange = vi.fn();

		const screen = await render(EdraNoteEditor, { props: { note, storage, onStatusChange } });

		await expect
			.element(screen.container.querySelector('.edra-toolbar-full') as HTMLElement)
			.toBeInTheDocument();
		await screen.getByText('Para formatar.').click();
		await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
		await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}');
		expect(onStatusChange).toHaveBeenCalledWith('saving');
	});

	it('opens the slash menu with the app actions', async () => {
		const storage = memoryStorage(`edra-browser-slash-${Date.now()}`);
		const note = testNote('slash-1', 'Texto.\n');

		const screen = await render(EdraNoteEditor, { props: { note, storage } });

		await screen.getByText('Texto.').click();
		await userEvent.keyboard('{End}{Enter}/');
		await expect.element(page.getByText('Versículo')).toBeInTheDocument();
		await expect.element(page.getByText('Callout')).toBeInTheDocument();
	});

	it('opens the verse selector from the slash menu', async () => {
		const storage = memoryStorage(`edra-browser-verse-${Date.now()}`);
		const note = testNote('verse-1', 'Texto.\n');

		const screen = await render(EdraNoteEditor, { props: { note, storage } });

		await screen.getByText('Texto.').click();
		await userEvent.keyboard('{End}{Enter}/');
		await page.getByText('Versículo').click();
		await expect.element(page.getByRole('dialog')).toBeInTheDocument();
	});

	it('renders a saved mermaid diagram', async () => {
		const storage = memoryStorage(`edra-browser-mermaid-${Date.now()}`);
		const note = testNote('mermaid-1', `Antes.\n\n${MERMAID_FENCE}\n`);

		const screen = await render(EdraNoteEditor, { props: { note, storage } });

		await vi.waitFor(
			() => {
				expect(screen.container.querySelector('.mermaid-container svg')).not.toBe(null);
			},
			{ timeout: 15000 }
		);
	});

	it('renders the drag handle grip', async () => {
		const storage = memoryStorage(`edra-browser-drag-${Date.now()}`);
		const note = testNote('drag-1', 'Parágrafo para arrastar.\n');

		const screen = await render(EdraNoteEditor, { props: { note, storage } });

		await expect
			.element(screen.container.querySelector('.edra-canvaswrap svg.lucide-grip-vertical') as HTMLElement)
			.toBeInTheDocument();
	});

	it('persists typed markdown to IndexedDB under the same canonical body', async () => {
		const workspaceId = `edra-browser-save-${Date.now()}`;
		const storage = memoryStorage(workspaceId);
		const note = testNote('save-1', `Texto original.\n\n${VERSE_FENCE}\n`);
		const onSaved = vi.fn();

		const screen = await render(EdraNoteEditor, { props: { note, storage, onSaved } });

		await screen.getByText('Texto original.').click();
		await userEvent.keyboard('Olá ');
		await vi.waitFor(
			() => {
				expect(onSaved).toHaveBeenCalled();
			},
			{ timeout: 10000 }
		);

		const saved = onSaved.mock.calls.at(-1)?.[0] as Note;
		expect(saved.body).toContain('Olá');
		expect(saved.body).toContain(VERSE_FENCE);

		const reloaded = await readNote(storage, note.id);
		expect(reloaded?.body).toContain('Olá');
		expect(reloaded?.body).toContain(VERSE_FENCE);
	});

	it('inserts a native callout from the slash menu', async () => {
		const storage = memoryStorage(`edra-browser-callout-${Date.now()}`);
		const note = testNote('callout-1', 'Texto base.\n');

		const screen = await render(EdraNoteEditor, {
			props: { note, storage, toolbarPinned: true }
		});

		await screen.getByText('Texto base.').click();
		await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
		await userEvent.keyboard('/callout');
		await expect.element(page.getByText('Callout', { exact: true })).toBeInTheDocument();
		await userEvent.keyboard('{Enter}');

		const canvas = prosemirror(screen.container);
		await vi.waitFor(() => {
			expect(canvas.querySelector('[data-node-view-wrapper]')).not.toBe(null);
		});
		expect(canvas.textContent).not.toContain('/callout');
	});

	it('renders a saved native callout', async () => {
		const storage = memoryStorage(`edra-browser-callout-saved-${Date.now()}`);
		const note = testNote('callout-2', '$callout💡\nCuidado.\n$\n');

		const screen = await render(EdraNoteEditor, {
			props: { note, storage, toolbarPinned: true }
		});

		const canvas = prosemirror(screen.container);
		expect(canvas.querySelector('[data-node-view-wrapper]')).not.toBe(null);
		expect(canvas.textContent).toContain('Cuidado.');
		expect(canvas.textContent).not.toContain('$callout');
	});

	it('honors read-only mode without editor chrome', async () => {
		const storage = memoryStorage(`edra-browser-readonly-${Date.now()}`);
		const note = testNote('readonly-1', 'Somente leitura.\n');

		const screen = await render(EdraNoteEditor, {
			props: { note, storage, readOnly: true, toolbarPinned: true }
		});

		expect(prosemirror(screen.container).getAttribute('contenteditable')).toBe('false');
		expect(screen.container.querySelector('.edra-toolbar-full')).toBe(null);
		expect(screen.container.querySelector('.drag-handle-container')).toBe(null);
	});
});
