import { describe, expect, it } from 'vitest';
import { createNote, listNotes, readNote, saveNote, trashNote } from './notes-repository';
import type { WorkspaceStorage } from '$lib/storage/types';

function memoryStorage(): WorkspaceStorage & { fileWrites: string[] } {
	const fileWrites: string[] = [];
	return {
		kind: 'native',
		label: 'Memória de teste',
		fileWrites,
		async ensureDirectory() {},
		async writeFile(path) {
			fileWrites.push(path);
		},
		async readFile() {
			return null;
		},
		async fileExists() {
			return false;
		},
		async listFiles() {
			return [];
		}
	};
}

// SPECSFY: US-001 FR-001 FR-005 NFR-001 NFR-003 AC-001 AC-009 AC-014
describe('notes-repository no backend operacional', () => {
	it('persiste e relê o snapshot sem criar arquivos Markdown', async () => {
		const storage = memoryStorage();
		const created = await createNote(storage);

		expect(storage.fileWrites).toEqual([]);
		expect(await readNote(storage, created.id)).toMatchObject({
		id: created.id,
		body: '# Nova nota\n'
		});
		expect((await listNotes(storage)).map((note) => note.id)).toContain(created.id);
	});

	it('atualiza o mesmo registro e remove-o do backend ao apagar', async () => {
		const storage = memoryStorage();
		const created = await createNote(storage);
		const saved = await saveNote(storage, {
			...created,
			title: 'Estudo sobre João 3',
			meta: { ...created.meta, title: 'Estudo sobre João 3' }
		});

		expect(await readNote(storage, created.id)).toMatchObject({ title: saved.title });
		await trashNote(storage, created.id);
		expect(await readNote(storage, created.id)).toBeNull();
		expect((await listNotes(storage)).find((note) => note.id === created.id)).toBeUndefined();
		expect(storage.fileWrites).toEqual([]);
	});
});
