import { beforeEach, describe, expect, it } from 'vitest';
import {
	WorkspaceRepository,
	type WorkspacePersistenceAdapter
} from './workspace-repository';
import type {
	IndexedDbActiveWorkspacePointer,
	IndexedDbWorkspaceRecord
} from './indexeddb-workspace-adapter';

const records = new Map<string, IndexedDbWorkspaceRecord>();
let pointer: IndexedDbActiveWorkspacePointer | null = null;

const adapter = {
	backend: 'indexeddb' as const,
	readWorkspace: async (workspaceId: string) => records.get(workspaceId) ?? null,
	writeWorkspace: async (record: IndexedDbWorkspaceRecord) => {
		records.set(record.workspaceId, record);
	},
	queryWorkspaces: async () => [...records.values()],
	readActivePointer: async () => pointer,
	writeActivePointer: async (next: IndexedDbActiveWorkspacePointer) => {
		pointer = next;
	},
	transaction: async () => undefined
} as unknown as WorkspacePersistenceAdapter;

// SPECSFY: US-001 US-002 FR-001 FR-002 NFR-002 AC-015
describe('workspace repository scope', () => {
	beforeEach(() => {
		records.clear();
		pointer = null;
	});

	it('keeps reads and writes bound to the requested workspaceId', async () => {
		const repository = new WorkspaceRepository(adapter);
		const first = await repository.create({ workspaceId: 'workspace-a', name: 'A' });
		const second = await repository.create({ workspaceId: 'workspace-b', name: 'B' });

		await repository.context(first.workspaceId).rename('A renomeado');

		expect(await repository.context('workspace-a').get()).toMatchObject({
			workspaceId: 'workspace-a',
			name: 'A renomeado'
		});
		expect(await repository.context('workspace-b').get()).toMatchObject({
			workspaceId: second.workspaceId,
			name: 'B'
		});
	});

	it('fails closed when a domain operation has no workspaceId', () => {
		const repository = new WorkspaceRepository(adapter);

		expect(() => repository.context('')).toThrowError('workspaceId é obrigatório');
	});
});
