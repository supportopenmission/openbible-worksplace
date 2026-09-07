import { describe, expect, it } from 'vitest';
import { removeWorkspaceEntry, upsertCatalogEntry } from './workspace-catalog';
import type { WorkspaceStorage } from './types';

const storage: WorkspaceStorage = {
	kind: 'native',
	label: 'A',
	readFile: async () =>
		new TextEncoder().encode(
			JSON.stringify({
				workspaceId: 'workspace-a',
				formatVersion: 2,
				name: 'A',
				managedRoot: true,
				storage: 'native',
				bibleImportStatus: 'pending'
			})
		),
	writeFile: async () => undefined,
	ensureDirectory: async () => undefined,
	fileExists: async () => true,
	listFiles: async () => []
};

// SPECSFY: US-003 FR-003 FR-004 NFR-002 NFR-003 AC-018
describe('workspace repository contract', () => {
	it('returns a detached state without deleting the persisted records', async () => {
		upsertCatalogEntry({
			workspaceId: 'workspace-a',
			nameCache: 'A',
			storageKind: 'native',
			lastOpenedAt: null,
			status: 'ready'
		});

		const result = await removeWorkspaceEntry(storage, 'workspace-a');

		expect(result).toMatchObject({ status: 'detached', dataRetained: true });
	});
});
