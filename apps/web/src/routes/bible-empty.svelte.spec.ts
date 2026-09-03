import { beforeAll, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import initSqlJs from 'sql.js';
import Page from './bible/+page.svelte';
import type { FileContent, WorkspaceStorage } from '$lib/storage/types';

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;

let SQL: SqlJs;

beforeAll(async () => {
	SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
});

function openLpBytes(): Uint8Array {
	const database = new SQL.Database();
	database.run(`
		CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT NOT NULL, abbreviation TEXT NOT NULL);
		CREATE TABLE metadata (key VARCHAR(255) PRIMARY KEY, value VARCHAR(255));
		CREATE TABLE verse (id INTEGER PRIMARY KEY, book_id INTEGER, chapter INTEGER, verse INTEGER, text TEXT);
		INSERT INTO metadata (key, value) VALUES ('name', 'Remota de Teste');
		INSERT INTO book (id, name, abbreviation) VALUES (1, 'Gênesis', 'Gn');
		INSERT INTO verse (id, book_id, chapter, verse, text) VALUES (1, 1, 1, 1, 'No princípio.');
	`);
	const bytes = database.export();
	database.close();
	return bytes;
}

function createStorage(): WorkspaceStorage {
	const files = new Map<string, Uint8Array>();
	return {
		kind: 'opfs',
		label: 'Armazenamento do navegador',
		async ensureDirectory() {},
		async writeFile(path: string, content: FileContent) {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
		},
		async readFile(path: string) {
			return files.get(path) ?? null;
		},
		async fileExists(path: string) {
			return files.has(path);
		},
		async listFiles(path: string) {
			const prefix = `${path.replace(/\/$/, '')}/`;
			return [...files.keys()]
				.filter((filePath) => filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/'))
				.map((filePath) => filePath.slice(prefix.length))
				.sort();
		}
	};
}

describe('/bible empty state', () => {
	it('shows an oriented empty state with import actions', async () => {
		// SPECSFY: US-002 FR-002 NFR-001 AC-003
		await render(Page, { props: { storageOverride: createStorage() } });

		await expect.element(page.getByText(/nenhuma bíblia instalada/i)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /importar arquivos/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /usar url do bucket/i })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /abrir configurações/i })).toBeInTheDocument();
		const configLink = (await page
			.getByRole('link', { name: /abrir configurações/i })
			.element()) as unknown as HTMLElement;
		expect(window.getComputedStyle(configLink).justifyContent).toBe('center');
	});

	it('keeps action buttons in a row on desktop', async () => {
		await page.viewport(1440, 900);
		await render(Page, { props: { storageOverride: createStorage() } });
		await expect.element(page.getByText(/nenhuma bíblia instalada/i)).toBeInTheDocument();

		const primary = (await page
			.getByRole('button', { name: /importar arquivos/i })
			.element()) as unknown as HTMLElement;
		const secondary = (await page
			.getByRole('button', { name: /usar url do bucket/i })
			.element()) as unknown as HTMLElement;
		const first = primary.getBoundingClientRect();
		const second = secondary.getBoundingClientRect();
		expect(
			Math.abs(first.y - second.y),
			`primary y=${first.y} h=${first.height} secondary y=${second.y} h=${second.height}`
		).toBeLessThanOrEqual(1);
	});

	it('opens local import in a dialog instead of the onboarding', async () => {
		// SPECSFY: US-002 FR-002 NFR-001 AC-003
		await render(Page, { props: { storageOverride: createStorage() } });
		await expect.element(page.getByText(/nenhuma bíblia instalada/i)).toBeInTheDocument();

		await page.getByRole('button', { name: /importar arquivos/i }).click();
		const dialog = page.getByRole('dialog');
		await expect.element(dialog.getByText(/importar arquivos sqlite/i)).toBeInTheDocument();
		await expect.element(dialog.getByRole('button', { name: /selecionar bíblias sqlite/i })).toBeInTheDocument();
		expect(page.getByRole('dialog', { name: /configurar o workspace/i })).not.toBeInTheDocument();
	});

	it('reveals remote import in a dialog and installs without leaving the route', async () => {
		// SPECSFY: US-002 FR-002 NFR-002 AC-004
		const storage = createStorage();
		const bytes = openLpBytes();
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string) => {
				if (typeof url === 'string' && url.endsWith('.sqlite')) {
					return new Response(bytes, { status: 200 });
				}
				return new Response(
					JSON.stringify({
						files: [{ name: 'remota.sqlite', url: 'https://cdn.exemplo.com/biblias/remota.sqlite' }]
					}),
					{ status: 200 }
				);
			})
		);
		try {
			await render(Page, { props: { storageOverride: storage } });
			await expect.element(page.getByText(/nenhuma bíblia instalada/i)).toBeInTheDocument();

			await page.getByRole('button', { name: /usar url do bucket/i }).click();
			const dialog = page.getByRole('dialog');
			await expect.element(dialog.getByText(/importar do bucket r2/i)).toBeInTheDocument();
			expect(dialog.getByText('Bucket R2', { exact: true })).not.toBeInTheDocument();

			await dialog.getByRole('textbox', { name: /url do bucket/i }).fill('https://cdn.exemplo.com/biblias/');
			await dialog.getByRole('button', { name: /^carregar$/i }).click();
			await expect.element(dialog.getByText('remota.sqlite')).toBeInTheDocument();
			await dialog.getByRole('button', { name: /instalar selecionadas/i }).click();
			await expect.element(page.getByRole('heading', { name: /gênesis 1/i })).toBeInTheDocument();
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
