import { describe, expect, it } from 'vitest';
import { deleteManagedRootEntry } from './workspace-catalog';
import type { WorkspaceStorage } from './types';

// SPECSFY: US-003 FR-003 NFR-001 NFR-002 NFR-004 AC-019
describe('workspace delete contract', () => {
	it('returns a typed transaction conflict instead of a backend-specific guard', async () => {
		const storage = {
			kind: 'local',
			label: 'A',
			readFile: async () =>
				new TextEncoder().encode(
					JSON.stringify({
						workspaceId: 'workspace-a',
						formatVersion: 2,
						name: 'A',
						managedRoot: true,
						storage: 'local',
						bibleImportStatus: 'pending'
					})
				),
			writeFile: async () => undefined,
			ensureDirectory: async () => undefined,
			fileExists: async () => true,
			listFiles: async () => []
		} satisfies WorkspaceStorage;

		await expect(deleteManagedRootEntry(storage, 'workspace-a')).rejects.toMatchObject({
			code: 'PERSISTENCE_CONFLICT'
		});
	});
});
