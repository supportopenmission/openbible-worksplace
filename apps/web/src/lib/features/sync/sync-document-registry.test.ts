import { expect, it } from 'vitest';
import { createSyncFixture, executeSync, offlineNote } from './sync-test-fixtures';

// SPECSFY: US-001 FR-001 NFR-001 AC-001
it('AC-001 persists an offline note in the runtime backend', async () => {
  const storage = await createSyncFixture();
  const manifest = await executeSync(storage, {
    type: 'save',
    path: 'notes/studies/offline.md',
    content: offlineNote.replace('legível', 'preservada'),
    workspaceId: 'workspace-sync-001',
    storageKind: 'browser'
  });
  expect(manifest).toMatchObject({
    backend: 'indexeddb',
    workspaceId: 'workspace-sync-001',
    localSaveConfirmed: true
  });
  expect(manifest.documents).toContainEqual({
    documentId: 'note-offline-001',
    workspaceId: 'workspace-sync-001',
    pending: true
  });
});

// SPECSFY: US-001 FR-001 NFR-004 AC-002
it('AC-002 records the portable source independently from CRDT state', async () => {
  const storage = await createSyncFixture();
  const manifest = await executeSync(storage, { type: 'snapshot', path: 'notes/studies/offline.md' });
  expect(manifest.documents).toBeDefined();
  expect(manifest.documents).toContainEqual({ documentId: 'note-offline-001', source: 'markdown' });
  expect(manifest.sources).toContainEqual({ documentId: 'note-offline-001', source: 'markdown' });
});

// SPECSFY: US-001 FR-002 NFR-001 AC-003
it('AC-003 reports a recoverable local persistence failure', async () => {
  const storage = await createSyncFixture();
  storage.failWrites = true;
  const manifest = await executeSync(storage, { type: 'save', path: 'notes/studies/offline.md', content: offlineNote });
  expect(manifest).toMatchObject({ lastErrorCode: 'storage_write_failed', recovery: 'retry' });
});

// SPECSFY: US-001 FR-002 NFR-003 AC-004
it('AC-004 exposes bounded pending queue state after offline edits', async () => {
  const storage = await createSyncFixture();
  const manifest = await executeSync(storage, { type: 'queue', path: 'notes/studies/offline.md', content: offlineNote.replace('legível', 'preservada') });
  expect(manifest.queue).toMatchObject({ pendingCount: 1, bounded: true });
  expect(manifest.queue?.bytes).toBeGreaterThan(0);
});

// SPECSFY: US-001 FR-001 NFR-001 AC-019
it('AC-019 reopens the latest local generation without a relay', async () => {
  const storage = await createSyncFixture();
  const manifest = await executeSync(storage, { type: 'open' });
  expect(manifest.localGeneration).toBeDefined();
  expect(manifest.localGeneration).toBeGreaterThan(0);
  expect(manifest.relayRequired).toBe(false);
});

// SPECSFY: US-001 FR-002 NFR-004 AC-020
it('AC-020 keeps native adapter state under the workspace boundary', async () => {
  const storage = await createSyncFixture();
  const manifest = await executeSync(storage, { type: 'open', storageKind: 'native' });
  expect(manifest.storageAdapter).toBe('workspace-local');
  expect(manifest.absolutePath).toBeUndefined();
});

// SPECSFY: US-001 FR-002 NFR-004 AC-021
it('AC-021 identifies browser-local persistence without a device path', async () => {
  const storage = await createSyncFixture();
  const manifest = await executeSync(storage, { type: 'open', storageKind: 'browser' });
  expect(manifest.storageAdapter).toBe('browser-local');
  expect(manifest.handle).toBeUndefined();
});

// SPECSFY: US-001 FR-002 NFR-003 AC-026
it('AC-026 confirms local save independently of remote latency', async () => {
  const storage = await createSyncFixture();
  const started = performance.now();
  const manifest = await executeSync(storage, { type: 'save', path: 'notes/studies/offline.md', content: offlineNote.replace('legível', 'preservada') });
  expect(manifest.localSaveConfirmed).toBe(true);
  expect(performance.now() - started).toBeLessThan(500);
});
