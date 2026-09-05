import { expect, it } from 'vitest';
import { createSyncFixture, executeSync } from './sync-test-fixtures';

// SPECSFY: US-002 FR-004 NFR-001 AC-008
it('AC-008 records both independent changes in the same document', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'merge', fields: ['title', 'body'] });
  const document = manifest.documents?.find((item) => item.documentId === 'note-concurrent-001');
  expect(document).toBeDefined();
  expect(document?.heads).toBeDefined();
  expect(document?.heads.length).toBeGreaterThanOrEqual(2);
  expect(document?.mergedFields).toEqual(expect.arrayContaining(['title', 'body']));
});

// SPECSFY: US-002 FR-004 NFR-004 AC-009
it('AC-009 accepts out-of-order changes through document heads', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'merge-out-of-order' });
  expect(manifest.merge).toMatchObject({ orderIndependent: true, missingChanges: 0 });
});

// SPECSFY: US-002 FR-004 NFR-002 AC-010
it('AC-010 marks incompatible concurrent edits instead of dropping one', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'merge-conflict', path: 'notes/studies/concurrent.md' });
  expect(manifest.conflicts).toBeDefined();
  expect(manifest.conflicts).toContainEqual({ documentId: 'note-concurrent-001', status: 'needs-review', recoverable: true });
});

// SPECSFY: US-002 FR-004 NFR-003 AC-023
it('AC-023 declares a recoverable compacted snapshot', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'compact' });
  expect(manifest.compaction).toMatchObject({ sourceRetained: true });
  expect(manifest.compaction?.snapshotVersion).toBeGreaterThan(0);
  expect(manifest.compaction?.maxBytes).toBeGreaterThan(0);
});

// SPECSFY: US-001 FR-003 NFR-001 AC-029
it('AC-029 allows editing after removing the remote endpoint', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'disable-remote' });
  expect(manifest.endpoint?.enabled).toBe(false);
  expect(manifest.localOnly).toBe(true);
});
