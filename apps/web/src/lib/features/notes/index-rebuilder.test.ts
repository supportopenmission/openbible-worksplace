import { describe, expect, it } from 'vitest';
import { prepareWorkspace } from '$lib/storage/workspace';
import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';
import { readAllReaderHighlights } from '$lib/features/bible/reader-highlights-repository';

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

const HIGHLIGHT = {
	highlightId: 'highlight-nvi-3-16', schemaVersion: 1, versionId: 'nvi.sqlite',
	bookId: 43, chapter: 3, verseStart: 16, verseEnd: 16, styleId: 'pen-gold'
};

async function seedCanonicalFiles(storage: MemoryStorage) {
	await storage.writeFile('notes/portable.md', '---\nid: note-1\ntype: note\nschemaVersion: 1\n---\n\n# Estudo\n');
	await storage.writeFile('highlights/highlight-nvi-3-16.json', JSON.stringify(HIGHLIGHT));
	await storage.writeFile('.openbible/index.sqlite', new TextEncoder().encode('corrupt-index'));
}

// SPECSFY: US-003 FR-004 NFR-001 NFR-003 AC-010
describe('workspace index rebuild', () => {
	it('prepares canonical Markdown/JSON files and rebuilds logical highlight rows', async () => {
		const storage = new MemoryStorage();
		await seedCanonicalFiles(storage);

		await prepareWorkspace(storage);
		const rows = await readAllReaderHighlights(storage);

		expect(rows).toEqual([
			expect.objectContaining({ versionId: 'nvi.sqlite', bookId: 43, chapter: 3, verseStart: 16 })
		]);
	});
});

// SPECSFY: US-003 FR-004 FR-005 NFR-001 NFR-003 AC-011
describe('Bible source isolation during rebuild', () => {
	it('preserves Bible bytes while generating the workspace projection', async () => {
		const storage = new MemoryStorage();
		await seedCanonicalFiles(storage);
		const bibleBytes = new Uint8Array([...new TextEncoder().encode('SQLite format 3\0'), 1, 2, 3]);
		await storage.writeFile('bibles/nvi.sqlite', bibleBytes);
		const before = new Uint8Array(storage.files.get('bibles/nvi.sqlite')!);

		await prepareWorkspace(storage);
		const rows = await readAllReaderHighlights(storage);
		const after = storage.files.get('bibles/nvi.sqlite');

		expect(rows.length).toBeGreaterThan(0);
		expect(after).toEqual(before);
	});
});
