import { describe, expect, it } from 'vitest';
import { migrateLegacyWorkspace } from './workspace-catalog';
import type { WorkspaceStorage } from './types';

function legacyStorage(): WorkspaceStorage {
	const config = new TextEncoder().encode(
		JSON.stringify({ version: 1, storage: 'native', label: 'Legacy', bibleImportStatus: 'pending' })
	);
	return {
		kind: 'native',
		label: 'Legacy',
		readFile: async () => config,
		writeFile: async () => {
			throw new Error('legacy source is read-only');
		},
		ensureDirectory: async () => undefined,
		fileExists: async () => true,
		listFiles: async () => [],
		localHandle: undefined
	};
}

// SPECSFY: US-001 FR-001 FR-005 NFR-001 AC-014
describe('workspace migration contract', () => {
	it('returns a persisted record while preserving the legacy source', async () => {
		const storage = legacyStorage();
		const result = await migrateLegacyWorkspace(storage);
		const retry = await migrateLegacyWorkspace(storage);

		expect(result).toMatchObject({
			record: { name: 'Legacy', status: 'ready' },
			sourcePreserved: true
		});
		expect(result?.migrated).toBe(true);
		expect(retry).toMatchObject({
			record: { workspaceId: result?.record.workspaceId },
			sourcePreserved: true,
			migrated: false
		});
	});
});
