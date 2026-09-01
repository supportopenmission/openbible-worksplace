import { describe, expect, it } from 'vitest';
import { emptyIndexSqlite, isSQLite } from './empty-sqlite';
import { importBibleFiles, prepareWorkspace } from './workspace';
import type { StorageKind, WorkspaceStorage } from './types';

class MemoryStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	readonly directories = new Set<string>();

	constructor(
		readonly kind: StorageKind,
		readonly label = kind === 'opfs' ? 'Armazenamento do navegador' : 'Pasta local'
	) {}

	async ensureDirectory(path: string) {
		this.directories.add(path);
	}

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

const sqliteFile = (name: string, bytes = new Uint8Array([1, 2, 3])) =>
	new File([new TextEncoder().encode('SQLite format 3\0'), bytes], name, {
		type: 'application/vnd.sqlite3'
	});

describe('workspace storage', () => {
	it('creates the local workspace tree, artifacts, templates, and progress', async () => {
		// SPECSFY: US-001 FR-001 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-001
		const storage = new MemoryStorage('local');
		const progress: number[] = [];

		await prepareWorkspace(storage, (value) => progress.push(value));

		expect(storage.directories).toContain('bibles');
		expect(storage.directories).toContain('sermons/series');
		expect(storage.files.has('.openbible/config.json')).toBe(true);
		expect(storage.files.has('.openbible/index.sqlite')).toBe(true);
		expect(storage.files.has('templates/sermon.md')).toBe(true);
		expect(progress.at(-1)).toBe(1);
	});

	it('creates the same tree for OPFS without selecting a system folder', async () => {
		// SPECSFY: US-001 FR-001 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-002
		const storage = new MemoryStorage('opfs');

		await prepareWorkspace(storage);

		const config = new TextDecoder().decode(storage.files.get('.openbible/config.json'));
		expect(JSON.parse(config)).toMatchObject({ storage: 'opfs', bibleImportStatus: 'pending' });
		expect(storage.directories).toContain('attachments/pdf');
	});

	it('imports a valid SQLite file with its original name', async () => {
		// SPECSFY: US-002 FR-004 FR-005 NFR-001 NFR-002 AC-005
		const storage = new MemoryStorage('local');

		const [result] = await importBibleFiles(storage, [sqliteFile('ara.sqlite')]);

		expect(result).toEqual({ name: 'ara.sqlite', status: 'imported' });
		expect(storage.files.has('bibles/ara.sqlite')).toBe(true);
	});

	it('rejects invalid and duplicate files while preserving the destination', async () => {
		// SPECSFY: US-002 FR-004 FR-005 NFR-001 NFR-002 AC-006
		const storage = new MemoryStorage('local');
		await storage.writeFile('bibles/ara.sqlite', new Uint8Array([9]));

		const results = await importBibleFiles(storage, [
			sqliteFile('ara.sqlite'),
			new File(['not sqlite'], 'broken.sqlite')
		]);

		expect(results).toEqual([
			{ name: 'ara.sqlite', status: 'rejected', reason: 'duplicate' },
			{ name: 'broken.sqlite', status: 'rejected', reason: 'invalid-sqlite' }
		]);
		expect(storage.files.get('bibles/ara.sqlite')).toEqual(new Uint8Array([9]));
	});

	it('keeps pending status when no selected Bible is imported', async () => {
		// SPECSFY: US-002 FR-003 FR-004 FR-005 NFR-002 AC-006
		const storage = new MemoryStorage('local');
		await prepareWorkspace(storage);

		await importBibleFiles(storage, [new File(['not sqlite'], 'broken.sqlite')]);

		const config = JSON.parse(
			new TextDecoder().decode(storage.files.get('.openbible/config.json'))
		);
		expect(config.bibleImportStatus).toBe('pending');
	});

	it('is idempotent and preserves an existing file', async () => {
		// SPECSFY: US-001 FR-002 FR-003 NFR-001 NFR-002 AC-008
		const storage = new MemoryStorage('local');
		const existing = new TextEncoder().encode('keep me');
		await storage.writeFile('templates/note.md', existing);

		await prepareWorkspace(storage);

		expect(storage.files.get('templates/note.md')).toEqual(existing);
	});

	it('writes a valid sqlite index and workspace preferences', async () => {
		const storage = new MemoryStorage('local');

		await prepareWorkspace(storage);

		expect(isSQLite(storage.files.get('.openbible/index.sqlite') ?? new Uint8Array())).toBe(true);
		expect(storage.files.has('.openbible/preferences.json')).toBe(true);
		expect(
			JSON.parse(new TextDecoder().decode(storage.files.get('.openbible/config.json')))
		).toMatchObject({
			label: 'Pasta local'
		});
	});

	it('repairs a zero-byte index sqlite without overwriting other files', async () => {
		const storage = new MemoryStorage('opfs');
		await storage.writeFile('.openbible/index.sqlite', new Uint8Array());
		const existing = new TextEncoder().encode('keep me');
		await storage.writeFile('templates/note.md', existing);

		await prepareWorkspace(storage);

		expect(isSQLite(storage.files.get('.openbible/index.sqlite') ?? new Uint8Array())).toBe(true);
		expect(storage.files.get('templates/note.md')).toEqual(existing);
	});
});
