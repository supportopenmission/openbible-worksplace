import { describe, expect, it } from 'vitest';
import { persistHighlight, readAllReaderHighlights } from '$lib/features/bible/reader-highlights-repository';
import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';

class MemoryStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	readonly directories = new Set<string>();
	readonly kind: StorageKind = 'opfs';
	readonly label = 'Memória de teste';

	async ensureDirectory(path: string) { this.directories.add(path); }
	async writeFile(path: string, content: string | Uint8Array) {
		this.files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
	}
	async readFile(path: string) { return this.files.get(path) ?? null; }
	async fileExists(path: string) { return this.files.has(path); }
	async listFiles(path: string) {
		const prefix = `${path.replace(/\/$/, '')}/`;
		return [...this.files.keys()].filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/')).map((file) => file.slice(prefix.length)).sort();
	}
}

const record = {
	highlightId: 'highlight-uuid', schemaVersion: 1,
	versionId: 'nvi.sqlite', bookId: 43, chapter: 3,
	verseStart: 16, verseEnd: 16, styleId: 'pen-gold'
};

// SPECSFY: US-003 FR-004 NFR-001 NFR-002 NFR-003 AC-009
describe('authorial highlight sidecars', () => {
	it('persists one JSON source file per highlight before projecting the index', async () => {
		const storage = new MemoryStorage();
		await persistHighlight(storage, record);

		expect(storage.files.has('highlights/highlight-uuid.json')).toBe(true);
		expect(await readAllReaderHighlights(storage)).toEqual([
			expect.objectContaining({ versionId: record.versionId, bookId: record.bookId, chapter: 3 })
		]);
	});
});

// SPECSFY: US-003 US-004 FR-004 FR-005 NFR-002 NFR-003 AC-014
describe('highlight identity portability', () => {
	it('keeps the sidecar identity independent from the SQLite row id', async () => {
		const storage = new MemoryStorage();
		await persistHighlight(storage, record);

		const sidecars = [...storage.files.keys()].filter((path) => path.startsWith('highlights/'));
		expect(sidecars).toHaveLength(1);
		expect(sidecars[0]).toMatch(/^highlights\/[^/]+\.json$/);
	});
});
