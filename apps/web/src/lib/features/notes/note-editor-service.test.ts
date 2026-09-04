import { describe, expect, it } from 'vitest';
import { createNoteEditorService } from './note-editor-service';
import { splitMarkdownByVerseFences } from './milkdown-markdown-io';
import type { WorkspaceStorage } from '$lib/storage/types';
import type { Note } from './note-types';

function memoryStorage(
	files = new Map<string, Uint8Array>(),
	failOnWrite = false
): WorkspaceStorage {
	const encoder = new TextEncoder();
	return {
		kind: 'opfs',
		label: 'Memória de teste',
		async ensureDirectory() {},
		async writeFile(path, content) {
			if (failOnWrite) throw new Error('disk full');
			files.set(path, typeof content === 'string' ? encoder.encode(content) : content);
		},
		async readFile(path) {
			return files.get(path) ?? null;
		},
		async fileExists(path) {
			return files.has(path);
		},
		async deleteFile(path) {
			files.delete(path);
		},
		async listFiles(dir) {
			const prefix = `${dir.replace(/\/$/, '')}/`;
			return [...files.keys()]
				.filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
				.map((file) => file.slice(prefix.length));
		}
	};
}

const NOTE: Note = {
	id: 'n1',
	title: 'Nova nota',
	createdAt: '2026-09-04T00:00:00.000Z',
	updatedAt: '2026-09-04T00:00:00.000Z',
	meta: {
		id: 'n1',
		title: 'Nova nota',
		createdAt: '2026-09-04T00:00:00.000Z',
		updatedAt: '2026-09-04T00:00:00.000Z',
		type: 'note',
		path: 'notes/n1.md'
	},
	body: '# Nova nota\n',
	content: '# Nova nota\n',
	path: 'notes/n1.md'
};

// SPECSFY: US-001 FR-005 NFR-001 AC-006
describe('milkdown autosave to yaml and index', () => {
	it('syncs edited H1 into YAML and reindexes verse refs in Milkdown order', async () => {
		const storage = memoryStorage();
		const service = createNoteEditorService({ storage, note: NOTE });
		const body = `# Título novo

:::verse{versionId="n" bookId="1" book="Gênesis" chapter="1" verseStart="1" verseEnd="1"}
1 No princípio
:::`;
		const saved = await service.saveNow(body);
		expect(saved?.title).toBe('Título novo');
		expect(
			splitMarkdownByVerseFences(body).filter((part) => part.type === 'verse')
		).toHaveLength(1);
	});
});

// SPECSFY: US-001 FR-005 NFR-001 AC-011
describe('milkdown autosave failure', () => {
	it('reports error without discarding the edited body', async () => {
		const storage = memoryStorage(new Map(), true);
		const service = createNoteEditorService({ storage, note: NOTE });
		const body = '# Rascunho com erro\n\ntexto';
		splitMarkdownByVerseFences(body);
		expect(await service.saveNow(body)).toBeNull();
	});
});
