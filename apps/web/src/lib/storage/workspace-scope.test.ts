import { describe, expect, it } from 'vitest';
import { getCatalogEntry, upsertCatalogEntry } from './workspace-catalog';

// SPECSFY: US-001 US-002 FR-002 NFR-002 AC-015
describe('workspace scope contract', () => {
	it('keeps each record attached to a normalized persistence backend', () => {
		const entry = upsertCatalogEntry({
			workspaceId: 'workspace-a',
			nameCache: 'A',
			storageKind: 'native',
			lastOpenedAt: null,
			status: 'ready'
		});

		expect(getCatalogEntry('workspace-a')).toMatchObject({
			workspaceId: entry.workspaceId,
			backend: 'sqlite'
		});
	});
});
