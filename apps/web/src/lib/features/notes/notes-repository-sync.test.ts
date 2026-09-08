import { describe, expect, it, vi } from 'vitest';
import type { WorkspaceStorage } from '$lib/storage/types';

const syncMock = vi.hoisted(() => ({
	persistSyncRecord: vi.fn(),
	removeSyncRecord: vi.fn()
}));

vi.mock('$lib/features/sync/sync-automerge', () => syncMock);

import { createNote, readNote, saveNote } from './notes-repository';

function memoryStorage(): WorkspaceStorage {
	return {
		kind: 'native',
		label: 'Memória de teste',
		async ensureDirectory() {},
		async writeFile() {},
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

describe('notes repository sync boundary', () => {
	it('keeps the primary note when Automerge sync fails during creation', async () => {
		syncMock.persistSyncRecord.mockRejectedValueOnce(new Error('sync_unavailable'));
		const storage = memoryStorage();

		const created = await createNote(storage);

		expect(await readNote(storage, created.id)).toMatchObject({
			id: created.id,
			body: '# Nova nota\n'
		});
	});

	it('keeps edited note content when Automerge sync fails during save', async () => {
		const storage = memoryStorage();
		const created = await createNote(storage);
		syncMock.persistSyncRecord.mockRejectedValueOnce(new Error('sync_unavailable'));

		const saved = await saveNote(storage, {
			...created,
			body: '# Estudo salvo\n',
			content: '# Estudo salvo\n',
			title: 'Estudo salvo',
			meta: { ...created.meta, title: 'Estudo salvo' }
		});

		expect(saved.body).toBe('# Estudo salvo\n');
		expect(await readNote(storage, created.id)).toMatchObject({
			title: 'Estudo salvo',
			body: '# Estudo salvo\n'
		});
	});
});
