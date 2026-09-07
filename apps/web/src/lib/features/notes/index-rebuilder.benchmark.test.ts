import { describe, expect, it } from 'vitest';
import { readNote } from './notes-repository';
import { rebuildWorkspaceIndex } from './index-rebuilder';
import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';

const encoder = new TextEncoder();

class BenchmarkStorage implements WorkspaceStorage {
	readonly kind: StorageKind = 'opfs';
	readonly label = 'Benchmark';
	readonly files = new Map<string, Uint8Array>();

	async ensureDirectory() {}
	async writeFile(path: string, content: string | Uint8Array) {
		this.files.set(path, typeof content === 'string' ? encoder.encode(content) : content);
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
			.filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
			.map((file) => file.slice(prefix.length))
			.sort();
	}
}

function manifest(workspaceId: string) {
	return JSON.stringify({
		workspaceId,
		formatVersion: 2,
		name: 'Benchmark',
		managedRoot: true,
		version: 1,
		storage: 'opfs',
		configuredAt: '2026-09-06T00:00:00.000Z',
		bibleImportStatus: 'complete',
		label: 'Benchmark'
	});
}

function noteSource(index: number): string {
	return [
		'---',
		`id: "note-${index}"`,
		'type: "note"',
		'schemaVersion: 1',
		`title: "Nota ${index}"`,
		'createdAt: "2026-09-06T00:00:00.000Z"',
		'updatedAt: "2026-09-06T00:00:00.000Z"',
		'---',
		'',
		`# Nota ${index}`,
		'',
		'Conteúdo de benchmark.',
		''
	].join('\n');
}

function highlightSource(index: number): string {
	return JSON.stringify({
		highlightId: `highlight-${index}`,
		schemaVersion: 1,
		versionId: 'nvi.sqlite',
		bookId: 43,
		chapter: (index % 150) + 1,
		verseStart: (index % 30) + 1,
		verseEnd: (index % 30) + 1,
		styleId: 'pen-gold'
	});
}

function seedBenchmark(storage: BenchmarkStorage, notes: number, highlights: number): void {
	storage.files.set('.openbible/config.json', encoder.encode(manifest('benchmark-workspace')));
	for (let index = 0; index < notes; index += 1) {
		storage.files.set(`notes/note-${index}.md`, encoder.encode(noteSource(index)));
	}
	for (let index = 0; index < highlights; index += 1) {
		storage.files.set(
			`highlights/highlight-${index}.json`,
			encoder.encode(highlightSource(index))
		);
	}
}

// SPECSFY: US-003 FR-004 FR-005 NFR-003 AC-010 AC-011 AC-014
describe('workspace index rebuild load benchmark', () => {
	it('rebuilds 1,000 notes and 10,000 highlights within 30 seconds with progress', async () => {
		const storage = new BenchmarkStorage();
		seedBenchmark(storage, 1_000, 10_000);
		const progress: number[] = [];
		const startedAt = performance.now();
		const rebuild = rebuildWorkspaceIndex(storage, {
			context: { workspaceId: 'benchmark-workspace', generation: 0, backend: 'indexeddb' },
			onProgress: (processed) => progress.push(processed)
		});

		const directNote = await readNote(storage, 'note-1');
		const projection = await rebuild;
		const elapsedMs = performance.now() - startedAt;

		expect(directNote?.id).toBe('note-1');
		expect(projection.records).toHaveLength(11_000);
		expect(projection.records.filter((record) => record.kind === 'note')).toHaveLength(1_000);
		expect(projection.records.filter((record) => record.kind === 'highlight')).toHaveLength(10_000);
		expect(progress).toHaveLength(11_000);
		expect(progress.every((value, index) => value === index + 1)).toBe(true);
		expect(elapsedMs).toBeLessThan(30_000);

		console.info(
			`workspace-index-benchmark records=11000 elapsedMs=${Math.round(elapsedMs)} progress=${progress.length}`
		);
	});
});
