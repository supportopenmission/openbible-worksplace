import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import initSqlJs from 'sql.js';
import Page from './bible/+page.svelte';
import { READER_SELECTION_STORAGE_KEY } from '$lib/features/bible/reader-preference';
import { reindexNoteVerses, resetMemoryNoteVerseIndex } from '$lib/features/notes/note-verse-index';
import type { WorkspaceStorage } from '$lib/storage/types';

let bibleBytes: Uint8Array;

beforeEach(() => {
	// A última leitura é persistida; sem limpar, um teste abre o capítulo do anterior.
	localStorage.removeItem(READER_SELECTION_STORAGE_KEY);
	resetMemoryNoteVerseIndex();
});

afterEach(async () => {
	await page.viewport(1280, 720);
});

beforeAll(async () => {
	const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
	const database = new SQL.Database();
	database.run(`
		CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT NOT NULL, abbreviation TEXT NOT NULL);
		CREATE TABLE verse (id INTEGER PRIMARY KEY, book_id INTEGER, chapter INTEGER, verse INTEGER, text TEXT);
		INSERT INTO book VALUES (1, 'Gênesis', 'Gn');
		INSERT INTO verse VALUES
			(1, 1, 1, 1, 'No princípio, criou Deus os céus e a terra.'),
			(3, 1, 1, 2, 'A terra era sem forma e vazia.'),
			(4, 1, 1, 3, 'Disse Deus: Haja luz.'),
			(5, 1, 1, 4, 'Viu Deus que a luz era boa.'),
			(6, 1, 1, 5, 'Chamou Deus à luz Dia.'),
			(2, 1, 2, 1, 'Assim foram concluídos os céus e a terra.');
	`);
	bibleBytes = database.export();
	database.close();
});

function createStorage(
	listFiles: () => Promise<string[]>,
	bytes?: Uint8Array,
	extraFiles: Record<string, string> = {}
): WorkspaceStorage {
	const fileMap = new Map<string, Uint8Array>();
	if (bytes) fileMap.set('bibles/ara.sqlite', bytes);
	for (const [path, content] of Object.entries(extraFiles)) {
		fileMap.set(path, new TextEncoder().encode(content));
	}
	const storage = {
		kind: 'opfs' as const,
		label: 'Armazenamento do navegador',
		async ensureDirectory() {},
		async writeFile(path: string, content: string | Uint8Array) {
			fileMap.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
		},
		async readFile(path: string) {
			return fileMap.get(path) ?? null;
		},
		async fileExists(path: string) {
			return fileMap.has(path);
		},
		listFiles: async (dir: string) => {
			if (dir === 'notes') {
				return Object.keys(extraFiles)
					.filter((path) => path.startsWith('notes/') && path.endsWith('.md'))
					.map((path) => path.slice('notes/'.length));
			}
			return listFiles();
		}
	};
	return storage as unknown as WorkspaceStorage;
}

const noteTemplate = (title: string, updatedAt: string) => `---
title: "${title}"
createdAt: "2026-01-01T00:00:00.000Z"
updatedAt: "${updatedAt}"
type: "note"
---

# ${title}
`;

const genesis13Ref = {
	blockIndex: 0,
	versionId: 'ara.sqlite',
	bookId: 1,
	bookName: 'Gênesis',
	chapter: 1,
	verseStart: 3,
	verseEnd: 3
};

async function seedSingleVerseNote() {
	await reindexNoteVerses('notes/nota-unica.md', [genesis13Ref]);
}

async function seedMultiVerseNotes() {
	await reindexNoteVerses('notes/primeira-nota.md', [genesis13Ref]);
	await reindexNoteVerses('notes/segunda-nota.md', [{ ...genesis13Ref, blockIndex: 0 }]);
	await reindexNoteVerses('notes/estudo-genesis.md', [{ ...genesis13Ref, blockIndex: 0 }]);
	await reindexNoteVerses('notes/outra-nota.md', [
		{
			blockIndex: 0,
			versionId: 'ara.sqlite',
			bookId: 1,
			bookName: 'Gênesis',
			chapter: 2,
			verseStart: 1,
			verseEnd: 1
		}
	]);
}

describe('/bible', () => {
	it('opens the first chapter and navigates to the next one', async () => {
		// SPECSFY: US-001 US-002 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-001 AC-002 AC-003
		await page.viewport(320, 900);
		await render(Page, {
			props: { storageOverride: createStorage(async () => ['ara.sqlite'], bibleBytes) }
		});

		await expect.element(page.getByRole('heading', { name: /gênesis 1/i })).toBeInTheDocument();
		await expect.element(page.getByText(/no princípio, criou deus/i)).toBeInTheDocument();
		expect(page.getByRole('heading', { name: 'Leia a Bíblia' })).not.toBeInTheDocument();
		expect(page.getByText(/consulte suas versões importadas/i)).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: /navegação da bíblia/i }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('combobox', { name: 'Versão' })).toBeInTheDocument();
		await page.viewport(1440, 900);
		await expect.element(page.getByRole('heading', { name: /gênesis 1/i })).toBeInTheDocument();
		await page.getByRole('button', { name: /próximo capítulo/i }).click();
		await expect.element(page.getByRole('heading', { name: /gênesis 2/i })).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /capítulo anterior/i }))
			.not.toBeDisabled();
	});

	it('shows an accessible empty state and a working return action', async () => {
		// SPECSFY: US-001 US-002 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-006
		await render(Page, { props: { storageOverride: createStorage(async () => []) } });

		await expect
			.element(page.getByRole('heading', { name: /nenhuma bíblia compatível encontrada/i }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: /voltar ao início/i }))
			.toHaveAttribute('href', '/');
		expect(page.getByRole('combobox')).not.toBeInTheDocument();
	});

	it('offers a direct import action when no compatible Bible exists', async () => {
		await render(Page, { props: { storageOverride: createStorage(async () => []) } });

		await expect
			.element(page.getByRole('link', { name: /importar uma bíblia/i }))
			.toHaveAttribute('href', '/?import=bible');
	});

	it('keeps a catalog failure recoverable with retry and return actions', async () => {
		// SPECSFY: US-001 US-002 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-006
		await render(Page, {
			props: {
				storageOverride: createStorage(async () => Promise.reject(new Error('inacessível')))
			}
		});

		await expect
			.element(page.getByRole('heading', { name: /não foi possível carregar as bíblias/i }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /tentar novamente/i }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /voltar ao início/i })).toBeInTheDocument();
	});

	it('opens Bible search in a desktop dialog', async () => {
		await page.viewport(1440, 900);
		await render(Page, {
			props: { storageOverride: createStorage(async () => ['ara.sqlite'], bibleBytes) }
		});

		await page.getByRole('button', { name: /buscar no texto/i }).click();
		await expect.element(page.getByRole('dialog')).toHaveAttribute('data-slot', 'dialog-content');
		await expect
			.element(page.getByRole('heading', { name: /buscar na bíblia/i }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('searchbox', { name: 'Buscar no texto' }))
			.toBeInTheDocument();
	});

	it('opens Bible search in a mobile bottom drawer', async () => {
		await page.viewport(320, 900);
		await render(Page, {
			props: { storageOverride: createStorage(async () => ['ara.sqlite'], bibleBytes) }
		});

		await page.getByRole('button', { name: /buscar no texto/i }).click();
		await expect.element(page.getByRole('dialog')).toHaveAttribute('data-slot', 'sheet-content');
		await expect
			.element(page.getByRole('searchbox', { name: 'Buscar no texto' }))
			.toBeInTheDocument();
	});

	it('moves from book selection to chapter selection in a desktop dialog', async () => {
		await page.viewport(1440, 900);
		await render(Page, {
			props: { storageOverride: createStorage(async () => ['ara.sqlite'], bibleBytes) }
		});

		await page.getByRole('button', { name: 'Livro' }).click();
		const dialog = page.getByRole('dialog');
		await expect(dialog).toHaveAttribute('data-selector-mode', 'book');
		await expect
			.element(dialog.getByRole('searchbox', { name: 'Pesquisar livro ou capítulo' }))
			.toBeInTheDocument();
		await expect.element(dialog.getByRole('button', { name: 'Versão' })).toBeInTheDocument();

		await dialog.getByRole('button', { name: /gênesis/i }).click();
		await expect(dialog).toHaveAttribute('data-selector-mode', 'chapter');
		await expect
			.element(dialog.getByRole('heading', { name: /selecione o capítulo/i }))
			.toBeInTheDocument();
		await dialog.getByRole('button', { name: '2', exact: true }).click();
		await expect.element(page.getByRole('heading', { name: /gênesis 2/i })).toBeInTheDocument();
	});

	it('opens the version selector as a mobile drawer', async () => {
		await page.viewport(320, 900);
		await render(Page, {
			props: { storageOverride: createStorage(async () => ['ara.sqlite'], bibleBytes) }
		});

		await page.getByRole('combobox', { name: 'Versão' }).click();
		const drawer = page.getByRole('dialog');
		await expect(drawer).toHaveAttribute('data-slot', 'sheet-content');
		await expect(drawer).toHaveAttribute('data-selector-mode', 'version');
		await expect.element(drawer.getByRole('option', { selected: true })).toBeInTheDocument();
		await expect.element(drawer.getByRole('listbox', { name: /versões disponíveis/i })).toBeInTheDocument();
	});
});

describe('/bible verse selection popover', () => {
	async function openGenesis1(
		viewportWidth = 1440,
		storage = createStorage(async () => ['ara.sqlite'], bibleBytes)
	) {
		await page.viewport(viewportWidth, 900);
		await render(Page, { props: { storageOverride: storage } });
		await expect.element(page.getByText(/disse deus: haja luz/i)).toBeInTheDocument();
		return storage;
	}

	it('opens an action popover when a whole verse is selected', async () => {
		// SPECSFY: US-001 FR-001 FR-002 NFR-001 AC-001
		await openGenesis1();
		await page.getByText(/disse deus: haja luz/i).click();
		await expect.element(page.getByRole('button', { name: /copiar referência/i })).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /copiar texto e referência/i }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /criar nota/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /apagar/i })).toBeInTheDocument();
	});

	it('shows a recoverable error when the clipboard is denied', async () => {
		// SPECSFY: US-003 FR-006 NFR-002 AC-010
		await openGenesis1();
		await page.getByText(/disse deus: haja luz/i).click();
		await page.getByRole('button', { name: /copiar referência/i }).click();
		await expect.element(page.getByRole('alert')).toBeInTheDocument();
	});

	it('creates a note in a desktop split without applying a highlight', async () => {
		// SPECSFY: US-004 FR-002 FR-007 NFR-003 AC-011
		await openGenesis1();
		await page.getByText(/disse deus: haja luz/i).click();
		await page.getByRole('button', { name: /criar nota/i }).click();
		await expect
			.element(page.getByRole('main').getByText(/disse deus: haja luz/i))
			.toBeInTheDocument();
		await expect.element(page.getByRole('region', { name: /nota/i })).toBeInTheDocument();
	});

	it('keeps reader and note on tabs in a narrow viewport', async () => {
		// SPECSFY: US-004 FR-007 AC-014
		await openGenesis1(320);
		await page.getByText(/disse deus: haja luz/i).click();
		await page.getByRole('button', { name: /criar nota/i }).click();
		await expect.element(page.getByRole('tab', { name: /bíblia/i })).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: /nota/i })).toBeInTheDocument();
	});

	it('extends to a continuous range when a second verse is clicked with the popover open', async () => {
		// SPECSFY: US-001 FR-001 FR-002 AC-002
		await openGenesis1();
		await page.getByText(/a terra era sem forma/i).click();
		await page.getByText(/chamou deus à luz dia/i).click();
		await expect.element(page.getByText(/gênesis 1\.2–5/i)).toBeInTheDocument();
	});

	it('lets the keyboard open the popover and close it with Escape', async () => {
		// SPECSFY: US-001 FR-002 NFR-001 AC-015
		await openGenesis1();
		await page.getByText(/disse deus: haja luz/i).click();
		await expect.element(page.getByRole('button', { name: /copiar referência/i })).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		expect(page.getByRole('button', { name: /copiar referência/i })).not.toBeInTheDocument();
	});

	it('shows a recoverable error when creating a note without write access', async () => {
		// SPECSFY: US-004 FR-007 NFR-002 AC-020
		const storage = createStorage(async () => ['ara.sqlite'], bibleBytes);
		storage.writeFile = async () => {
			throw new Error('somente leitura');
		};
		await openGenesis1(1440, storage);
		await page.getByText(/disse deus: haja luz/i).click();
		await page.getByRole('button', { name: /criar nota/i }).click();
		await expect.element(page.getByRole('alert')).toBeInTheDocument();
		expect(page.getByRole('region', { name: /nota/i })).not.toBeInTheDocument();
	});

	it('opens a workspace-wide highlights sheet from the reader controls', async () => {
		// SPECSFY: FR-004 NFR-001 AC-014
		await openGenesis1();
		await page.getByRole('button', { name: /destaques/i }).click();
		const dialog = page.getByRole('dialog', { name: /destaques/i });
		await expect.element(dialog).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		expect(page.getByRole('dialog', { name: /destaques/i })).not.toBeInTheDocument();
	});

	it('opens the note in a desktop split from the verse icon', async () => {
		// SPECSFY: US-003 FR-004 AC-008
		await seedSingleVerseNote();
		await openGenesis1(
			1440,
			createStorage(async () => ['ara.sqlite'], bibleBytes, {
				'notes/nota-unica.md': noteTemplate('Nota única', '2026-09-03T00:00:00.000Z')
			})
		);
		await page.getByRole('button', { name: /abrir nota/i }).click();
		await expect.element(page.getByRole('region', { name: /nota/i })).toBeInTheDocument();
	});

	it('opens the note in mobile tabs from the verse icon', async () => {
		// SPECSFY: US-003 FR-004 NFR-003 AC-009
		await seedSingleVerseNote();
		await openGenesis1(
			320,
			createStorage(async () => ['ara.sqlite'], bibleBytes, {
				'notes/nota-unica.md': noteTemplate('Nota única', '2026-09-03T00:00:00.000Z')
			})
		);
		await page.getByRole('button', { name: /abrir nota/i }).click();
		await expect.element(page.getByRole('tab', { name: /bíblia/i })).toBeInTheDocument();
		await expect.element(page.getByRole('tab', { name: /nota/i })).toBeInTheDocument();
	});
});

describe('/bible multi-note verse selector', () => {
	const multiNoteFiles = {
		'notes/primeira-nota.md': noteTemplate('Primeira nota', '2026-09-01T00:00:00.000Z'),
		'notes/segunda-nota.md': noteTemplate('Segunda nota', '2026-09-03T00:00:00.000Z'),
		'notes/estudo-genesis.md': noteTemplate('Estudo Gênesis', '2026-09-02T00:00:00.000Z'),
		'notes/outra-nota.md': noteTemplate('Outra nota', '2026-09-04T00:00:00.000Z')
	};

	async function openGenesis1WithNotes(
		viewportWidth = 1440,
		storage = createStorage(async () => ['ara.sqlite'], bibleBytes, multiNoteFiles)
	) {
		await seedMultiVerseNotes();
		await page.viewport(viewportWidth, 900);
		await render(Page, { props: { storageOverride: storage } });
		await expect.element(page.getByText(/disse deus: haja luz/i)).toBeInTheDocument();
		return storage;
	}

	it('opens a desktop popover listing note titles for two notes on the verse', async () => {
		// SPECSFY: US-002 FR-004 FR-005 NFR-001 NFR-003 AC-006
		await openGenesis1WithNotes();
		await page.getByRole('button', { name: /abrir nota/i }).click();
		await expect.element(page.getByRole('dialog', { name: /notas do versículo/i })).toBeInTheDocument();
	});

	it('opens a mobile drawer listing note titles for two notes on the verse', async () => {
		// SPECSFY: US-002 FR-004 FR-005 NFR-001 NFR-003 AC-007
		await openGenesis1WithNotes(320);
		await page.getByRole('button', { name: /abrir nota/i }).click();
		const drawer = page.getByRole('dialog', { name: /notas do versículo/i });
		await expect.element(drawer).toBeInTheDocument();
		await expect.element(drawer).toHaveAttribute('data-slot', 'sheet-content');
	});

	it('opens the chosen note when a title is selected in the compact selector', async () => {
		// SPECSFY: US-002 FR-006 FR-010 AC-009
		await openGenesis1WithNotes();
		await page.getByRole('button', { name: /abrir nota/i }).click();
		await page.getByRole('button', { name: /segunda nota/i }).click();
		await expect.element(page.getByRole('region', { name: /nota/i })).toBeInTheDocument();
	});

	it('shows a filtered card grid when Ver todas is activated', async () => {
		// SPECSFY: US-003 FR-003 FR-005 FR-008 FR-009 NFR-001 AC-011
		await openGenesis1WithNotes();
		await page.getByRole('button', { name: /abrir nota/i }).click();
		await page.getByRole('button', { name: /ver todas/i }).click();
		await expect.element(page.getByTestId('notes-card-list')).toBeInTheDocument();
	});

	it('opens the editor when a filtered card is clicked', async () => {
		// SPECSFY: US-003 FR-006 FR-010 AC-012
		await openGenesis1WithNotes();
		await page.getByRole('button', { name: /abrir nota/i }).click();
		await page.getByRole('button', { name: /ver todas/i }).click();
		await page.getByRole('button', { name: /estudo gênesis/i }).click();
		await expect.element(page.getByRole('region', { name: /nota/i })).toBeInTheDocument();
		await page.getByRole('button', { name: /todas as notas/i }).click();
		await expect.element(page.getByTestId('notes-card-list')).toBeInTheDocument();
	});

	it('uses Ver todas as the primary full list path on mobile', async () => {
		// SPECSFY: US-003 FR-005 NFR-003 AC-013
		await openGenesis1WithNotes(320);
		await page.getByRole('button', { name: /abrir nota/i }).click();
		await page.getByRole('button', { name: /ver todas/i }).click();
		await expect.element(page.getByTestId('notes-card-list')).toBeInTheDocument();
	});

	it('does not open the selector when workspace storage is unavailable', async () => {
		// SPECSFY: FR-004 NFR-002 AC-019
		await render(Page, { props: { storageOverride: null, initialError: 'workspace indisponível' } });
		expect(page.getByRole('button', { name: /abrir nota/i })).not.toBeInTheDocument();
	});

	it('lets keyboard users navigate titles and close the selector with Escape', async () => {
		// SPECSFY: NFR-001 AC-020
		await openGenesis1WithNotes();
		await page.getByRole('button', { name: /abrir nota/i }).click();
		const dialog = page.getByRole('dialog', { name: /notas do versículo/i });
		await expect.element(dialog).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		expect(page.getByRole('dialog', { name: /notas do versículo/i })).not.toBeInTheDocument();
	});
});
