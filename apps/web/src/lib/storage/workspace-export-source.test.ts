import { describe, expect, it } from 'vitest';
import { createWorkspaceExportSource } from './workspace-export-source';
import { getCatalogEntry, upsertCatalogEntry } from './workspace-catalog';
import type { WorkspaceStorage } from './types';

// SPECSFY: US-001 FR-002 FR-006 NFR-002 AC-021
describe('workspace export source contract', () => {
	it('exposes a read-only snapshot boundary for future Markdown and PDF exporters', () => {
		upsertCatalogEntry({
			workspaceId: 'workspace-a',
			nameCache: 'A',
			storageKind: 'native',
			lastOpenedAt: null,
			status: 'ready'
		});

		expect(getCatalogEntry('workspace-a')).toHaveProperty('exportSource');
	});

	it('exposes a consistent read-only snapshot without selecting Markdown or PDF format', async () => {
		const storage: WorkspaceStorage = {
			kind: 'native',
			label: 'A',
			readFile: async (path) => {
				if (path === '.openbible/config.json') {
					return new TextEncoder().encode(
						JSON.stringify({ workspaceId: 'workspace-a', name: 'A', label: 'A' })
					);
				}
				return new TextEncoder().encode('# Note');
			},
			writeFile: async () => {
				throw new Error('export source must not write');
			},
			ensureDirectory: async () => undefined,
			fileExists: async () => true,
			listFiles: async () => ['draft.md', 'index.txt']
		};
		const source = createWorkspaceExportSource(storage, 'workspace-a');

		expect(await source.snapshot()).toMatchObject({
			workspaceId: 'workspace-a',
			version: 1,
			name: 'A'
		});
		expect(await source.listNotes()).toEqual(['notes/draft.md']);
		expect(await source.readNote('notes/draft.md')).toBeInstanceOf(Uint8Array);
		await expect(source.readNote('../outside.md')).rejects.toThrow('export_path_outside_notes');
	});
});
