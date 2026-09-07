import { expect, it } from 'vitest';
import { createSyncFixture, executeSync, readText } from './sync-test-fixtures';

// SPECSFY: US-003 FR-005 NFR-004 AC-011
it('AC-011 records an external generation for reconciliation', async () => {
  const storage = await createSyncFixture();
  const original = await readText(storage, 'notes/studies/offline.md');
  await storage.writeFile('notes/studies/offline.md', original.replace('legível', 'externamente alterada'));
  const manifest = await executeSync(storage, {
    type: 'external-edit',
    path: 'notes/studies/offline.md',
    workspaceId: 'workspace-browser-001',
    storageKind: 'browser'
  });
  expect(manifest.externalEdits?.[0]).toMatchObject({
    documentId: 'note-offline-001',
    workspaceId: 'workspace-browser-001',
    backend: 'indexeddb',
    proposal: 'review',
    overwrite: false,
    persistedRecordPreserved: true
  });
  expect(manifest.externalEdits?.[0]?.baseHash).toHaveLength(64);
});

// SPECSFY: US-003 FR-005 NFR-002 AC-012
it('AC-012 preserves both sides when external merge is unproven', async () => {
  const manifest = await executeSync(await createSyncFixture(), {
    type: 'reconcile-external',
    path: 'notes/studies/offline.md',
    workspaceId: 'workspace-browser-001',
    storageKind: 'browser'
  });
  expect(manifest.conflicts).toBeDefined();
  expect(manifest.conflicts).toContainEqual(expect.objectContaining({
    documentId: 'note-offline-001',
    workspaceId: 'workspace-browser-001',
    backend: 'indexeddb',
    localPath: 'notes/studies/offline.md',
    externalPath: 'conflicts/note-offline-001.external.md',
    status: 'needs-review',
    localVersionRecoverable: true,
    externalVersionRecoverable: true,
    overwrite: false
  }));
});

// SPECSFY: US-003 FR-005 NFR-001 AC-013
it('AC-013 opens materialized content while index rebuild is pending', async () => {
  const storage = await createSyncFixture();
  const manifest = await executeSync(storage, {
    type: 'rebuild-index',
    workspaceId: 'workspace-browser-001',
    storageKind: 'browser'
  });
  expect(await readText(storage, 'notes/studies/offline.md')).toContain('Estudo offline');
  expect(manifest).toMatchObject({
    backend: 'indexeddb',
    workspaceId: 'workspace-browser-001',
    noteAvailable: true,
    projectionDependency: null
  });
  expect(manifest.index).toMatchObject({ status: 'pending', retryable: true, source: 'operational-backend' });
  expect(manifest.indexPath).toBeUndefined();
});
