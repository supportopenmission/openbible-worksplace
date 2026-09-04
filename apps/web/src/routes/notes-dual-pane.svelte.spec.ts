import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NotesSecondarySidebar from '$lib/features/notes/NotesSecondarySidebar.svelte';
import NotesEmptyState from '$lib/features/notes/NotesEmptyState.svelte';
import { notesState } from '$lib/features/notes/notes-state.svelte';
import type { WorkspaceStorage } from '$lib/storage/types';
import type { Note } from '$lib/features/notes/note-types';

function createMockStorage(): WorkspaceStorage {
	return {
		kind: 'opfs',
		label: 'Teste',
		async ensureDirectory() {},
		async writeFile() {},
		async readFile() {
			return null;
		},
		async fileExists() {
			return true;
		},
		async listFiles() {
			return [];
		},
		async deleteFile() {}
	};
}

const mockNotes: Note[] = [
	{
		id: 'nota-1',
		title: 'Primeira nota de estudo',
		body: '\n# Primeira nota de estudo\nTexto sobre o evangelho de João.\n',
		content: '\n# Primeira nota de estudo\nTexto sobre o evangelho de João.\n',
		path: 'notes/nota-1.md',
		createdAt: '2026-09-04T10:00:00.000Z',
		updatedAt: '2026-09-04T10:00:00.000Z',
		meta: {
			id: 'nota-1',
			title: 'Primeira nota de estudo',
			createdAt: '2026-09-04T10:00:00.000Z',
			updatedAt: '2026-09-04T10:00:00.000Z',
			type: 'note',
			path: 'notes/nota-1.md'
		}
	},
	{
		id: 'nota-2',
		title: 'Notas sobre Romanos',
		body: '\n# Notas sobre Romanos\nReflexões teológicas sobre graça e fé.\n',
		content: '\n# Notas sobre Romanos\nReflexões teológicas sobre graça e fé.\n',
		path: 'notes/nota-2.md',
		createdAt: '2026-09-04T11:00:00.000Z',
		updatedAt: '2026-09-04T11:00:00.000Z',
		meta: {
			id: 'nota-2',
			title: 'Notas sobre Romanos',
			createdAt: '2026-09-04T11:00:00.000Z',
			updatedAt: '2026-09-04T11:00:00.000Z',
			type: 'note',
			path: 'notes/nota-2.md'
		}
	}
];

describe('dual pane notes secondary sidebar and empty state', () => {
	beforeEach(() => {
		notesState.notes = [...mockNotes];
		notesState.searchQuery = '';
		notesState.loading = false;
	});

	it('renders secondary sidebar with title, note count, and search input', async () => {
		const storage = createMockStorage();
		render(NotesSecondarySidebar, {
			props: {
				storage,
				activeNoteId: null,
				onSelect: () => {},
				onCreate: () => {}
			}
		});

		await expect.element(page.getByRole('heading', { name: 'Todas as notas' })).toBeInTheDocument();
		await expect.element(page.getByText('2')).toBeInTheDocument();
		await expect.element(page.getByPlaceholder('Buscar notas...')).toBeInTheDocument();
		await expect.element(page.getByText('Primeira nota de estudo', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Notas sobre Romanos', { exact: true })).toBeInTheDocument();
	});

	it('renders empty state when no note is selected', async () => {
		const handleCreate = vi.fn();
		render(NotesEmptyState, {
			props: {
				onCreate: handleCreate,
				creating: false
			}
		});

		await expect
			.element(page.getByRole('heading', { name: 'Nenhuma nota selecionada' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByText(/selecione uma nota na barra lateral/i))
			.toBeInTheDocument();

		const button = page.getByRole('button', { name: /nova nota/i });
		await expect.element(button).toBeInTheDocument();
		await button.click();
		expect(handleCreate).toHaveBeenCalledTimes(1);
	});

	it('filters notes in secondary sidebar in real time', async () => {
		const storage = createMockStorage();
		render(NotesSecondarySidebar, {
			props: {
				storage,
				activeNoteId: null,
				onSelect: () => {},
				onCreate: () => {}
			}
		});

		const searchInput = page.getByPlaceholder('Buscar notas...');
		await searchInput.click();
		await userEvent.keyboard('Romanos');

		await expect.element(page.getByText('Notas sobre Romanos', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Primeira nota de estudo', { exact: true })).not.toBeInTheDocument();
	});

	it('marks the active note as selected and triggers onSelect when clicked', async () => {
		const storage = createMockStorage();
		const handleSelect = vi.fn();
		render(NotesSecondarySidebar, {
			props: {
				storage,
				activeNoteId: 'nota-1',
				onSelect: handleSelect,
				onCreate: () => {}
			}
		});

		const option1 = page.getByRole('option', { name: /primeira nota de estudo/i });
		await expect.element(option1).toHaveAttribute('aria-selected', 'true');

		const option2 = page.getByRole('option', { name: /notas sobre romanos/i });
		await expect.element(option2).toHaveAttribute('aria-selected', 'false');

		await option2.click();
		expect(handleSelect).toHaveBeenCalledWith('nota-2');
	});

	it('displays note description in the card when description property is present', async () => {
		notesState.notes = [
			{
				id: 'nota-desc',
				title: 'Nota com descrição',
				description: 'Descrição definida no frontmatter',
				body: '# Nota com descrição\nCorpo longo que não deve aparecer',
				content: '# Nota com descrição\nCorpo longo que não deve aparecer',
				path: 'notes/nota-desc.md',
				createdAt: '2026-09-04T12:00:00.000Z',
				updatedAt: '2026-09-04T12:00:00.000Z',
				meta: {
					id: 'nota-desc',
					title: 'Nota com descrição',
					description: 'Descrição definida no frontmatter',
					createdAt: '2026-09-04T12:00:00.000Z',
					updatedAt: '2026-09-04T12:00:00.000Z',
					type: 'note',
					path: 'notes/nota-desc.md'
				}
			}
		];

		const storage = createMockStorage();
		render(NotesSecondarySidebar, {
			props: {
				storage,
				activeNoteId: null,
				onSelect: () => {},
				onCreate: () => {}
			}
		});

		await expect
			.element(page.getByText('Descrição definida no frontmatter'))
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Corpo longo que não deve aparecer'))
			.not.toBeInTheDocument();
	});

	it('displays pin indicator on pinned note and sorts it to top', async () => {
		notesState.notes = [
			{
				id: 'nota-1',
				title: 'Nota Comum',
				body: '# Nota Comum',
				content: '# Nota Comum',
				path: 'notes/nota-1.md',
				createdAt: '2026-09-04T12:00:00.000Z',
				updatedAt: '2026-09-04T12:00:00.000Z',
				meta: {
					id: 'nota-1',
					title: 'Nota Comum',
					createdAt: '2026-09-04T12:00:00.000Z',
					updatedAt: '2026-09-04T12:00:00.000Z',
					type: 'note',
					path: 'notes/nota-1.md'
				}
			},
			{
				id: 'nota-pin',
				title: 'Nota Fixada',
				pinned: true,
				body: '# Nota Fixada',
				content: '# Nota Fixada',
				path: 'notes/nota-pin.md',
				createdAt: '2026-09-01T12:00:00.000Z',
				updatedAt: '2026-09-01T12:00:00.000Z',
				meta: {
					id: 'nota-pin',
					title: 'Nota Fixada',
					pinned: true,
					createdAt: '2026-09-01T12:00:00.000Z',
					updatedAt: '2026-09-01T12:00:00.000Z',
					type: 'note',
					path: 'notes/nota-pin.md'
				}
			}
		];

		const storage = createMockStorage();
		render(NotesSecondarySidebar, {
			props: {
				storage,
				activeNoteId: null,
				onSelect: () => {},
				onCreate: () => {}
			}
		});

		const items = page.getByRole('option');
		await expect.element(items.first()).toHaveTextContent(/Nota Fixada/);
		await expect.element(page.getByTitle('Nota fixada')).toBeInTheDocument();
	});
});
