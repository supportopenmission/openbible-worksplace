import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { resolve } from 'node:path';
import type { WorkspaceStorage } from '$lib/storage/types';
import {
	getAdjacentChapter,
	loadBibleCatalog,
	readBibleChapter,
	searchBible
} from './bible-reader';

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;

class MemoryBibleStorage implements WorkspaceStorage {
	readonly kind = 'opfs' as const;
	readonly label = 'Armazenamento do navegador';

	constructor(readonly files = new Map<string, Uint8Array>()) {}

	async ensureDirectory() {}

	async writeFile(path: string, content: string | Uint8Array) {
		this.files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
	}

	async readFile(path: string) {
		return this.files.get(path) ?? null;
	}

	async fileExists(path: string) {
		return this.files.has(path);
	}

	async listFiles(path: string) {
		const prefix = `${path.replace(/\/$/, '')}/`;
		return [...this.files.keys()]
			.filter(
				(filePath) => filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/')
			)
			.map((filePath) => filePath.slice(prefix.length))
			.sort();
	}
}

let SQL: SqlJs;

beforeAll(async () => {
	SQL = await initSqlJs({
		locateFile: (file) => resolve(process.cwd(), '../../node_modules/sql.js/dist', file)
	});
});

function openLpBytes(includeSearchRows = false): Uint8Array {
	const database = new SQL.Database();
	database.run(`
		CREATE TABLE book (
			id INTEGER PRIMARY KEY,
			testament_id INTEGER,
			name TEXT NOT NULL,
			abbreviation TEXT NOT NULL
		);
		CREATE TABLE verse (
			id INTEGER PRIMARY KEY,
			book_id INTEGER NOT NULL,
			chapter INTEGER NOT NULL,
			verse INTEGER NOT NULL,
			text TEXT NOT NULL
		);
		INSERT INTO book (id, testament_id, name, abbreviation) VALUES
			(1, 1, 'Gênesis', 'Gn'),
			(2, 2, 'João', 'Jo');
		INSERT INTO verse (id, book_id, chapter, verse, text) VALUES
			(2, 1, 1, 2, 'A terra era sem forma e vazia.'),
			(1, 1, 1, 1, 'No princípio, criou Deus os céus e a terra.'),
			(3, 1, 2, 1, 'Assim foram concluídos os céus e a terra.'),
			(4, 2, 1, 1, 'No princípio era o Verbo.');
	`);

	if (includeSearchRows) {
		for (let verse = 1; verse <= 55; verse += 1) {
			database.run(`INSERT INTO verse (id, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?)`, [
				100 + verse,
				1,
				3,
				verse,
				`O'Reilly resultado ${verse}`
			]);
		}
	}

	const bytes = database.export();
	database.close();
	return bytes;
}

function openLpBytesWithoutAbbreviation(): Uint8Array {
	const database = new SQL.Database();
	database.run(`
		CREATE TABLE book (
			id INTEGER PRIMARY KEY,
			book_reference_id INTEGER,
			testament_reference_id INTEGER,
			name VARCHAR(50)
		);
		CREATE TABLE metadata (key VARCHAR(255) PRIMARY KEY, value VARCHAR(255));
		CREATE TABLE verse (
			id INTEGER PRIMARY KEY,
			book_id INTEGER,
			chapter INTEGER,
			verse INTEGER,
			text TEXT
		);
		INSERT INTO metadata (key, value) VALUES ('name', 'Almeida Corrigida e Fiel');
		INSERT INTO book (id, book_reference_id, testament_reference_id, name)
			VALUES (1, 1, 1, 'Gênesis');
		INSERT INTO verse (id, book_id, chapter, verse, text)
			VALUES (1, 1, 1, 1, 'No princípio criou Deus os céus e a terra.');
	`);
	const bytes = database.export();
	database.close();
	return bytes;
}

function invalidSchemaBytes(): Uint8Array {
	const database = new SQL.Database();
	database.run('CREATE TABLE unrelated (id INTEGER PRIMARY KEY, value TEXT)');
	const bytes = database.export();
	database.close();
	return bytes;
}

function storageWith(...files: [string, Uint8Array][]): MemoryBibleStorage {
	return new MemoryBibleStorage(new Map(files));
}

describe('Bible reader SQLite catalog', () => {
	it('loads an OpenLP version and opens its first book and chapter', async () => {
		// SPECSFY: US-001 FR-001 FR-002 NFR-001 NFR-002 AC-001
		const catalog = await loadBibleCatalog(storageWith(['bibles/ara.sqlite', openLpBytes()]));

		expect(catalog.diagnostics).toEqual([]);
		expect(catalog.versions[0]).toMatchObject({
			id: 'ara.sqlite',
			fileName: 'ara.sqlite',
			name: 'ara.sqlite',
			books: [
				{ id: 1, name: 'Gênesis', abbreviation: 'Gn', chapters: [1, 2] },
				{ id: 2, name: 'João', abbreviation: 'Jo', chapters: [1] }
			]
		});

		const chapter = await readBibleChapter(catalog.versions[0], 1, 1);
		expect(chapter).toEqual([
			{ number: 1, text: 'No princípio, criou Deus os céus e a terra.' },
			{ number: 2, text: 'A terra era sem forma e vazia.' }
		]);
	});

	it('loads the OpenLP SQLite schema used by imported Bible files', async () => {
		const catalog = await loadBibleCatalog(
			storageWith(['bibles/bibles_ACF.sqlite', openLpBytesWithoutAbbreviation()])
		);

		expect(catalog.diagnostics).toEqual([]);
		expect(catalog.versions[0]).toMatchObject({
			name: 'Almeida Corrigida e Fiel',
			books: [{ id: 1, name: 'Gênesis', abbreviation: '', chapters: [1] }]
		});
	});

	it('reads only the selected book and chapter in numeric verse order', async () => {
		// SPECSFY: US-001 US-002 FR-001 FR-002 NFR-001 NFR-002 AC-002
		const catalog = await loadBibleCatalog(storageWith(['bibles/ara.sqlite', openLpBytes()]));

		expect(await readBibleChapter(catalog.versions[0], 1, 2)).toEqual([
			{ number: 1, text: 'Assim foram concluídos os céus e a terra.' }
		]);
		expect(await readBibleChapter(catalog.versions[0], 2, 1)).toEqual([
			{ number: 1, text: 'No princípio era o Verbo.' }
		]);
	});

	it('moves across available chapters and disables both sequence limits', async () => {
		// SPECSFY: US-001 US-002 FR-002 FR-003 NFR-001 NFR-002 AC-003
		const catalog = await loadBibleCatalog(storageWith(['bibles/ara.sqlite', openLpBytes()]));
		const version = catalog.versions[0];

		expect(getAdjacentChapter(version, { bookId: 1, chapter: 1 }, 'next')).toEqual({
			bookId: 1,
			chapter: 2
		});
		expect(getAdjacentChapter(version, { bookId: 1, chapter: 1 }, 'previous')).toBeNull();
		expect(getAdjacentChapter(version, { bookId: 2, chapter: 1 }, 'next')).toBeNull();
	});

	it('searches locally with parameters and caps results at fifty rows', async () => {
		// SPECSFY: US-002 FR-003 NFR-001 NFR-002 AC-004
		const catalog = await loadBibleCatalog(storageWith(['bibles/ara.sqlite', openLpBytes(true)]));

		const results = await searchBible(catalog.versions[0], "O'Reilly");

		expect(results).toHaveLength(50);
		expect(results[0]).toEqual({
			bookId: 1,
			bookName: 'Gênesis',
			chapter: 3,
			verse: 1,
			text: "O'Reilly resultado 1"
		});
	});

	it('keeps valid versions when another SQLite has an incompatible schema', async () => {
		// SPECSFY: US-001 US-002 FR-001 NFR-001 NFR-002 AC-005
		const catalog = await loadBibleCatalog(
			storageWith(
				['bibles/broken.sqlite', invalidSchemaBytes()],
				['bibles/ara.sqlite', openLpBytes()]
			)
		);

		expect(catalog.versions).toHaveLength(1);
		expect(catalog.versions[0].fileName).toBe('ara.sqlite');
		expect(catalog.diagnostics).toEqual([
			{ fileName: 'broken.sqlite', message: expect.stringMatching(/book|verse|schema/i) }
		]);
	});
});
