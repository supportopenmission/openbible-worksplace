import { beforeAll, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import initSqlJs from 'sql.js';
import Page from './bible/+page.svelte';
import type { WorkspaceStorage } from '$lib/storage/types';

let bibleBytes: Uint8Array;

beforeAll(async () => {
	const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
	const database = new SQL.Database();
	database.run(`
		CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT NOT NULL, abbreviation TEXT NOT NULL);
		CREATE TABLE verse (id INTEGER PRIMARY KEY, book_id INTEGER, chapter INTEGER, verse INTEGER, text TEXT);
		INSERT INTO book VALUES (1, 'Gênesis', 'Gn');
		INSERT INTO verse VALUES
			(1, 1, 1, 1, 'No princípio, criou Deus os céus e a terra.'),
			(2, 1, 2, 1, 'Assim foram concluídos os céus e a terra.');
	`);
	bibleBytes = database.export();
	database.close();
});

function createStorage(listFiles: () => Promise<string[]>, bytes?: Uint8Array): WorkspaceStorage {
	const storage = {
		kind: 'opfs' as const,
		label: 'Armazenamento do navegador',
		async ensureDirectory() {},
		async writeFile() {},
		async readFile(path: string) {
			return path === 'bibles/ara.sqlite' ? (bytes ?? null) : null;
		},
		async fileExists() {
			return false;
		},
		listFiles
	};
	return storage as unknown as WorkspaceStorage;
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
