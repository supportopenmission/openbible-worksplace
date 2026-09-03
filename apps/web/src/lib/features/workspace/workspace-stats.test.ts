import { describe, expect, it } from 'vitest';
import type { WorkspaceStorage } from '$lib/storage/types';
import { collectWorkspaceStats } from './workspace-stats';

class MemoryStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	readonly kind = 'opfs' as const;
	readonly label = 'Armazenamento do navegador';
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

const note = (title: string) =>
	`---\ntitle: "${title}"\ncreatedAt: ""\nupdatedAt: ""\ntype: "note"\n---\n\n# ${title}\n`;

describe('workspace stats', () => {
	it('counts bibles, notes, trash, sermons and bytes', async () => {
		// SPECSFY: US-004 FR-004 NFR-002 AC-008
		const storage = new MemoryStorage();
		await storage.writeFile('bibles/nvi.sqlite', new Uint8Array(100));
		await storage.writeFile('bibles/acf.sqlite', new Uint8Array(50));
		await storage.writeFile('notes/a.md', note('A'));
		await storage.writeFile('notes/b.md', note('B'));
		await storage.writeFile('trash/velha.md', note('Velha'));
		await storage.writeFile('sermons/drafts/sermao.md', note('Sermão'));
		await storage.writeFile('sermons/preached/pregado.md', note('Pregado'));

		const stats = await collectWorkspaceStats(storage);

		expect(stats.bibles).toMatchObject({ count: 2, bytes: 150 });
		expect(stats.notes).toMatchObject({ active: 2, trash: 1 });
		expect(stats.sermons).toMatchObject({ count: 2 });
		expect(stats.bytesTotal).toBeGreaterThan(150);
	});

	it('reports zeros with guidance on a fresh workspace', async () => {
		// SPECSFY: US-004 FR-004 NFR-001 AC-009
		const storage = new MemoryStorage();

		const stats = await collectWorkspaceStats(storage);

		expect(stats).toEqual({
			bibles: { count: 0, bytes: 0 },
			notes: { active: 0, trash: 0 },
			sermons: { count: 0 },
			bytesTotal: 0
		});
	});
});
