import { beforeAll, describe, expect, it, vi } from 'vitest';
import initSqlJs from 'sql.js';
import { resolve } from 'node:path';
import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';
import { installRemoteBibles } from './remote-install';

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
}

let SQL: SqlJs;
beforeAll(async () => {
	SQL = await initSqlJs({ locateFile: (file) => resolve(process.cwd(), '../../node_modules/sql.js/dist', file) });
});

function openLpBytes(): Uint8Array {
	const database = new SQL.Database();
	database.run(`
		CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT NOT NULL, abbreviation TEXT);
		CREATE TABLE verse (id INTEGER PRIMARY KEY, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, text TEXT NOT NULL);
		INSERT INTO book (id, name, abbreviation) VALUES (1, 'Gênesis', 'Gn');
		INSERT INTO verse (id, book_id, chapter, verse, text) VALUES (1, 1, 1, 1, 'No princípio.');
	`);
	const bytes = database.export();
	database.close();
	return bytes;
}

function invalidBytes(): Uint8Array {
	return new TextEncoder().encode('not a sqlite file at all..............');
}

function binaryResponse(bytes: Uint8Array) {
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(bytes);
			controller.close();
		}
	});
	return new Response(stream, { status: 200, headers: { 'Content-Length': String(bytes.length) } });
}

describe('remote install', () => {
	it('installs valid remotes without overwriting duplicates', async () => {
		// SPECSFY: US-002 FR-003 FR-004 FR-005 NFR-002 AC-006
		const storage = new MemoryStorage();
		await storage.writeFile('.openbible/config.json', JSON.stringify({ version: 1, storage: 'opfs', configuredAt: new Date().toISOString(), bibleImportStatus: 'pending' }));
		await storage.writeFile('bibles/acf.sqlite', openLpBytes());
		const valid = openLpBytes();
		const fetchMock = vi.fn(async (url: string) => {
			if (url.includes('nova.sqlite')) return binaryResponse(valid);
			return binaryResponse(valid);
		});
		const progress: string[] = [];
		const results = await installRemoteBibles(
			storage,
			[
				{ name: 'nova.sqlite', url: 'https://cdn.exemplo.com/biblias/nova.sqlite', size: valid.length },
				{ name: 'acf.sqlite', url: 'https://cdn.exemplo.com/biblias/acf.sqlite', size: valid.length }
			],
			{
				fetchImpl: fetchMock as typeof fetch,
				onFileProgress: (name) => progress.push(name),
				onBatchProgress: () => undefined
			}
		);
		expect(results.find((result) => result.name === 'nova.sqlite')).toMatchObject({ status: 'imported' });
		expect(results.find((result) => result.name === 'acf.sqlite')).toMatchObject({ status: 'rejected', reason: 'duplicate' });
		expect(await storage.fileExists('bibles/nova.sqlite')).toBe(true);
		expect(progress).toContain('nova.sqlite');
	});

	it('rejects invalid sqlite and schema without writing', async () => {
		// SPECSFY: US-002 FR-004 FR-005 NFR-002 AC-007
		const storage = new MemoryStorage();
		const bad = invalidBytes();
		const fetchMock = vi.fn(async () => binaryResponse(bad));
		const results = await installRemoteBibles(
			storage,
			[{ name: 'ruim.sqlite', url: 'https://cdn.exemplo.com/biblias/ruim.sqlite' }],
			{ fetchImpl: fetchMock as typeof fetch }
		);
		expect(results[0]).toMatchObject({ status: 'rejected' });
		expect(await storage.fileExists('bibles/ruim.sqlite')).toBe(false);
	});
});
