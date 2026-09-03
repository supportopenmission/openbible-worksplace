import { beforeAll, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import initSqlJs from 'sql.js';
import Page from './bible/+page.svelte';
import type { WorkspaceStorage } from '$lib/storage/types';

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;

let SQL: SqlJs;

const BOOKS: Array<[number, string, string]> = [
	[1, 'Gênesis', 'Gn'],
	[2, 'Êxodo', 'Êx'],
	[3, 'Levítico', 'Lv'],
	[4, 'Números', 'Nm'],
	[5, 'Deuteronômio', 'Dt'],
	[6, 'Josué', 'Js'],
	[7, 'Juízes', 'Jz'],
	[8, 'Rute', 'Rt'],
	[9, '1 Samuel', '1Sm'],
	[10, '2 Samuel', '2Sm'],
	[11, '1 Reis', '1Rs'],
	[12, '2 Reis', '2Rs'],
	[13, '1 Crônicas', '1Cr'],
	[14, '2 Crônicas', '2Cr'],
	[15, 'Esdras', 'Ed'],
	[16, 'Neemias', 'Ne'],
	[17, 'Ester', 'Et'],
	[18, 'Jó', 'Jó'],
	[19, 'Salmos', 'Sl'],
	[20, 'Provérbios', 'Pv'],
	[21, 'Eclesiastes', 'Ec'],
	[22, 'Cântico dos Cânticos', 'Ct'],
	[23, 'Isaías', 'Is'],
	[24, 'Jeremias', 'Jr'],
	[25, 'Lamentações de Jeremias', 'Lm'],
	[26, 'Ezequiel', 'Ez'],
	[27, 'Daniel', 'Dn'],
	[28, 'Oseias', 'Os'],
	[29, 'Joel', 'Jl'],
	[30, 'Amós', 'Am'],
	[31, 'Obadias', 'Ob'],
	[32, 'Jonas', 'Jn'],
	[33, 'Miqueias', 'Mq'],
	[34, 'Naum', 'Na'],
	[35, 'Habacuque', 'Hc'],
	[36, 'Sofonias', 'Sf'],
	[37, 'Ageu', 'Ag'],
	[38, 'Zacarias', 'Zc'],
	[39, 'Malaquias', 'Ml'],
	[40, 'Mateus', 'Mt'],
	[41, 'Marcos', 'Mc'],
	[42, 'Lucas', 'Lc'],
	[43, 'João', 'Jo'],
	[44, 'Atos dos Apóstolos', 'At'],
	[45, 'Romanos', 'Rm'],
	[46, '1 Coríntios', '1Co'],
	[47, '2 Coríntios', '2Co'],
	[48, 'Gálatas', 'Gl'],
	[49, 'Efésios', 'Ef'],
	[50, 'Filipenses', 'Fp'],
	[51, 'Colossenses', 'Cl'],
	[52, '1 Tessalonicenses', '1Ts'],
	[53, '2 Tessalonicenses', '2Ts'],
	[54, '1 Timóteo', '1Tm'],
	[55, '2 Timóteo', '2Tm'],
	[56, 'Tito', 'Tt'],
	[57, 'Filemom', 'Fm'],
	[58, 'Hebreus', 'Hb'],
	[59, 'Tiago', 'Tg'],
	[60, '1 Pedro', '1Pe'],
	[61, '2 Pedro', '2Pe'],
	[62, '1 João', '1Jo'],
	[63, '2 João', '2Jo'],
	[64, '3 João', '3Jo'],
	[65, 'Judas', 'Jd'],
	[66, 'Apocalipse', 'Ap']
];

const VERSIONS = [
	{ file: 'ACF.sqlite', name: 'Almeida Corrigida e Fiel' },
	{ file: 'ARA.sqlite', name: 'Almeida Revista e Atualizada' },
	{ file: 'ARC.sqlite', name: 'Almeida Revista e Corrigida' },
	{ file: 'AS21.sqlite', name: 'Almeida Século 21' },
	{ file: 'JFAA.sqlite', name: 'João Ferreira de Almeida Atualizada' },
	{ file: 'KJA.sqlite', name: "King James Atualizada" },
	{ file: 'KJF.sqlite', name: 'King James Fiel' },
	{ file: 'MENS.sqlite', name: 'A Mensagem' },
	{ file: 'NAA.sqlite', name: 'Nova Almeida Atualizada' },
	{ file: 'NBV.sqlite', name: 'Nova Bíblia Viva' },
	{ file: 'NTLH.sqlite', name: 'Nova Tradução na Linguagem de Hoje' },
	{ file: 'NVI.sqlite', name: 'Nova Versão Internacional' },
	{ file: 'OL.sqlite', name: 'O Livro' },
	{ file: 'TB.sqlite', name: 'Tradução Brasileira' },
	{ file: 'VFL.sqlite', name: 'Versão Fácil de Ler' }
];

beforeAll(async () => {
	SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
});

function bibleBytes(versionName: string): Uint8Array {
	const database = new SQL.Database();
	database.run(`
		CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT NOT NULL, abbreviation TEXT NOT NULL);
		CREATE TABLE metadata (key VARCHAR(255) PRIMARY KEY, value VARCHAR(255));
		CREATE TABLE verse (id INTEGER PRIMARY KEY, book_id INTEGER, chapter INTEGER, verse INTEGER, text TEXT);
		INSERT INTO metadata (key, value) VALUES ('name', ?);
	`);
	for (const [id, name, abbr] of BOOKS) {
		database.run('INSERT INTO book (id, name, abbreviation) VALUES (?, ?, ?)', [id, name, abbr]);
		database.run('INSERT INTO verse (book_id, chapter, verse, text) VALUES (?, 1, 1, ?)', [
			id,
			`Texto de ${name}.`
		]);
	}
	const seed = database.export();
	database.close();
	// Reabre para gravar o nome da versão (evita interpolar texto no SQL).
	const reopened = new SQL.Database(seed);
	reopened.run('UPDATE metadata SET value = ? WHERE key = ?', [versionName, 'name']);
	const bytes = reopened.export();
	reopened.close();
	return bytes;
}

function createStorage(): WorkspaceStorage {
	const files = new Map<string, Uint8Array>();
	for (const version of VERSIONS) {
		files.set(`bibles/${version.file}`, bibleBytes(version.name));
	}
	return {
		kind: 'opfs',
		label: 'Armazenamento do navegador',
		async ensureDirectory() {},
		async writeFile(path: string, content: string | Uint8Array) {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
		},
		async readFile(path: string) {
			return files.get(path) ?? null;
		},
		async fileExists(path: string) {
			return files.has(path);
		},
		async listFiles(dir: string) {
			const prefix = `${dir.replace(/\/$/, '')}/`;
			return [...files.keys()]
				.filter((filePath) => filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/'))
				.map((filePath) => filePath.slice(prefix.length))
				.sort();
		}
	} as unknown as WorkspaceStorage;
}

async function assertNoHorizontalOverflow(label: string, query?: string) {
	const dialog = await page.getByRole('dialog').element();
	const root = dialog as unknown as HTMLElement;
	const target = (query ? root.querySelector(query) : root) as HTMLElement | null;
	expect(`${label}: elemento não encontrado`, target).not.toBeNull();
	const result = { scrollWidth: target!.scrollWidth, clientWidth: target!.clientWidth };
	expect(
		result.scrollWidth,
		`${label}: scrollWidth=${result.scrollWidth} clientWidth=${result.clientWidth}`
	).toBeLessThanOrEqual(result.clientWidth + 1);
}

describe('/bible selector overflow', () => {
	it('keeps the book selector inside the desktop dialog', async () => {
		await page.viewport(1440, 900);
		await render(Page, { props: { storageOverride: createStorage() } });
		await expect.element(page.getByText(/texto de gênesis/i)).toBeInTheDocument();

		await page.getByRole('button', { name: 'Livro' }).click();
		const dialog = page.getByRole('dialog');
		await expect(dialog).toHaveAttribute('data-selector-mode', 'book');

		await assertNoHorizontalOverflow('dialog');
		await assertNoHorizontalOverflow('book-grid', '.book-grid');
		await assertNoHorizontalOverflow('search', '.book-search-group');
	});

	it('keeps the version selector inside the desktop dialog', async () => {
		await page.viewport(1440, 900);
		await render(Page, { props: { storageOverride: createStorage() } });
		await expect.element(page.getByText(/texto de gênesis/i)).toBeInTheDocument();

		await page.getByRole('combobox', { name: 'Versão' }).click();
		const dialog = page.getByRole('dialog');
		await expect(dialog).toHaveAttribute('data-selector-mode', 'version');

		await assertNoHorizontalOverflow('dialog');
		await assertNoHorizontalOverflow('version-list', '.version-list');
	});

	it('keeps the book and version selectors inside the mobile drawer', async () => {
		await page.viewport(320, 900);
		await render(Page, { props: { storageOverride: createStorage() } });
		await expect.element(page.getByText(/texto de gênesis/i)).toBeInTheDocument();

		await page.getByRole('button', { name: 'Livro' }).click();
		let drawer = page.getByRole('dialog');
		await expect(drawer).toHaveAttribute('data-selector-mode', 'book');
		await assertNoHorizontalOverflow('drawer-book');
		await assertNoHorizontalOverflow('book-grid-mobile', '.book-grid');
		await userEvent.keyboard('{Escape}');

		await page.getByRole('combobox', { name: 'Versão' }).click();
		drawer = page.getByRole('dialog');
		await expect(drawer).toHaveAttribute('data-selector-mode', 'version');
		await assertNoHorizontalOverflow('drawer-version');
		await assertNoHorizontalOverflow('version-list-mobile', '.version-list');
	});
});
