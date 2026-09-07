import { describe, expect, it } from 'vitest';
import { getSyncWorkspaceRuntime, persistSyncRecord, removeSyncRecord } from './sync-automerge';
import type { WorkspaceStorage } from '$lib/storage/types';
import type { WorkspaceContentRecord } from '$lib/storage/workspace-content-repository';

function createStorage(): WorkspaceStorage {
	return {
		kind: 'local',
		label: 'Teste',
		workspaceId: 'workspace-automerge',
		ensureDirectory: async () => undefined,
		writeFile: async () => undefined,
		readFile: async () => null,
		fileExists: async () => false,
		listFiles: async () => []
	};
}

function note(body: string): WorkspaceContentRecord {
	return {
		kind: 'note',
		id: 'note-automerge',
		workspaceId: 'workspace-automerge',
		schemaVersion: 1,
		payload: {
			meta: {
				id: 'note-automerge',
				title: 'Nota sincronizável',
				type: 'note'
			},
			body
		},
		createdAt: '2026-09-07T00:00:00.000Z',
		updatedAt: '2026-09-07T00:00:00.000Z'
	};
}

describe('Automerge workspace runtime', () => {
	it('materializa o primeiro snapshot local sem criar arquivos Markdown', async () => {
		const storage = createStorage();
		await persistSyncRecord(storage, note('# Primeiro estado'));

		const diagnostics = getSyncWorkspaceRuntime(storage).diagnostics();
		expect(diagnostics.status).toBe('local');
		expect(diagnostics.lastSuccessAt).toBeTruthy();
		expect(await storage.readFile('notes/note-automerge.md')).toBeNull();
	});

	it('registra mudanças posteriores no mesmo documento CRDT', async () => {
		const storage = createStorage();
		await persistSyncRecord(storage, note('# Primeiro estado'));
		await persistSyncRecord(storage, {
			...note('# Segundo estado'),
			updatedAt: '2026-09-07T00:01:00.000Z'
		});

		const diagnostics = getSyncWorkspaceRuntime(storage).diagnostics();
		expect(diagnostics.lastErrorCode).toBeNull();
		expect(diagnostics.lastSuccessAt).toBeTruthy();
	});

	it('propaga exclusão como tombstone sem apagar um arquivo de exportação', async () => {
		const storage = createStorage();
		const record = note('# Estado removível');
		await persistSyncRecord(storage, record);
		await removeSyncRecord(storage, record);

		expect(await storage.readFile('notes/note-automerge.md')).toBeNull();
		expect(getSyncWorkspaceRuntime(storage).diagnostics().lastErrorCode).toBeNull();
	});
});
