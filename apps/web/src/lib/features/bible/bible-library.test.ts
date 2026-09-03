import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { resolve } from 'node:path';
import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';
import { deleteBibleVersion, listLibraryEntries } from './bible-library';

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;

class MemoryStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	constructor(
		readonly kind: StorageKind = 'opfs',
		readonly label = 'Armazenamento do navegador'
	) {}
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
			.filter((filePath) => filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/'))
			.map((filePath) => filePath.slice(prefix.length))
			.sort();
	}
	async deleteFile(path: string) {
		this.files.delete(path);
	}
}

let SQL: SqlJs;
beforeAll(async () => {
	SQL = await initSqlJs({ locateFile: (file) => resolve(process.cwd(), '../../node_modules/sql.js/dist', file) });
});

function openLpBytes(versionName: string): Uint8Array {
	const database = new SQL.Database();
	database.run(`
		CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT NOT NULL, abbreviation TEXT);
		CREATE TABLE metadata (key VARCHAR(255) PRIMARY KEY, value VARCHAR(255));
		CREATE TABLE verse (id INTEGER PRIMARY KEY, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, text TEXT NOT NULL);
		INSERT INTO metadata (key, value) VALUES ('name', ?);
		INSERT INTO book (id, name, abbreviation) VALUES (1, 'Gênesis', 'Gn'), (2, 'João', 'Jo');
		INSERT INTO verse (id, book_id, chapter, verse, text) VALUES (1, 1, 1, 1, 'No princípio.');
	`);
	database.run('UPDATE metadata SET value = ? WHERE key = ?', [versionName, 'name']);
	const bytes = database.export();
	database.close();
	return bytes;
}

function configJson(status = 'complete') {
	return JSON.stringify({ version: 1, storage: 'opfs', configuredAt: new Date().toISOString(), bibleImportStatus: status });
}

describe('bible library', () => {
	it('lists installed versions with books, size and diagnostics', async () => {
		// SPECSFY: US-003 FR-003 NFR-002 AC-005
		const storage = new MemoryStorage();
		await storage.writeFile('bibles/nvi.sqlite', openLpBytes('Nova Versão Internacional'));
		await storage.writeFile('bibles/quebrada.sqlite', new TextEncoder().encode('SQLite format 3\0lixo'));

		const entries = await listLibraryEntries(storage);

		expect(entries.map((entry) => entry.fileName).sort()).toEqual(['nvi.sqlite', 'quebrada.sqlite']);
		const valid = entries.find((entry) => entry.fileName === 'nvi.sqlite');
		expect(valid).toMatchObject({ name: 'Nova Versão Internacional', status: 'installed' });
		expect(valid!.books).toBe(2);
		expect(valid!.size).toBeGreaterThan(0);
		const invalid = entries.find((entry) => entry.fileName === 'quebrada.sqlite');
		expect(invalid?.status).toBe('invalid');
		expect(invalid?.diagnostic).toBeTruthy();
	});

	it('deletes a version and updates the import status', async () => {
		// SPECSFY: US-003 FR-003 NFR-002 AC-006
		const storage = new MemoryStorage();
		await storage.writeFile('.openbible/config.json', configJson('complete'));
		await storage.writeFile('bibles/nvi.sqlite', openLpBytes('Nova Versão Internacional'));
		await storage.writeFile('bibles/acf.sqlite', openLpBytes('Almeida Corrigida e Fiel'));

		const result = await deleteBibleVersion(storage, 'nvi.sqlite');

		expect(result).toMatchObject({ name: 'nvi.sqlite', status: 'deleted' });
		expect(await storage.fileExists('bibles/nvi.sqlite')).toBe(false);
		expect(await storage.fileExists('bibles/acf.sqlite')).toBe(true);
	});

	it('returns to pending when the last version is deleted', async () => {
		// SPECSFY: US-003 FR-003 NFR-002 AC-006
		const storage = new MemoryStorage();
		await storage.writeFile('.openbible/config.json', configJson('complete'));
		await storage.writeFile('bibles/nvi.sqlite', openLpBytes('Nova Versão Internacional'));

		await deleteBibleVersion(storage, 'nvi.sqlite');

		const config = JSON.parse(new TextDecoder().decode((await storage.readFile('.openbible/config.json'))!));
		expect(config.bibleImportStatus).toBe('pending');
		expect(await listLibraryEntries(storage)).toEqual([]);
	});

	it('keeps the file when deletion is unsupported or fails', async () => {
		// SPECSFY: US-003 FR-003 NFR-002 AC-007
		const readOnly = {
			kind: 'opfs',
			label: 'Somente leitura',
			async ensureDirectory() {},
			async writeFile() {},
			async readFile() {
				return null;
			},
			async fileExists() {
				return true;
			},
			async listFiles() {
				return ['nvi.sqlite'];
			}
		} as unknown as WorkspaceStorage;

		await expect(deleteBibleVersion(readOnly, 'nvi.sqlite')).rejects.toMatchObject({
			code: 'delete-unsupported'
		});

		const storage = new MemoryStorage();
		await expect(deleteBibleVersion(storage, 'ausente.sqlite')).rejects.toMatchObject({
			code: 'not-found'
		});
	});
});
