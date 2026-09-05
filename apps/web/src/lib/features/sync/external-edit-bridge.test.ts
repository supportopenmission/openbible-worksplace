import { expect, it } from 'vitest';
import { createSyncFixture, executeSync, readText } from './sync-test-fixtures';

// SPECSFY: US-003 FR-005 NFR-004 AC-011
it('AC-011 records an external generation for reconciliation', async () => {
  const storage = await createSyncFixture();
  const original = await readText(storage, 'notes/studies/offline.md');
  await storage.writeFile('notes/studies/offline.md', original.replace('legível', 'externamente alterada'));
  const manifest = await executeSync(storage, { type: 'external-edit', path: 'notes/studies/offline.md' });
  expect(manifest.externalEdits?.[0]).toMatchObject({ documentId: 'note-offline-001', proposal: 'review' });
  expect(manifest.externalEdits?.[0]?.baseHash).toHaveLength(64);
});

// SPECSFY: US-003 FR-005 NFR-002 AC-012
it('AC-012 preserves both sides when external merge is unproven', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'reconcile-external', path: 'notes/studies/offline.md' });
  expect(manifest.conflicts).toBeDefined();
  expect(manifest.conflicts).toContainEqual({ documentId: 'note-offline-001', localPath: 'notes/studies/offline.md', externalPath: 'conflicts/note-offline-001.external.md', status: 'needs-review' });
});

// SPECSFY: US-003 FR-005 NFR-001 AC-013
it('AC-013 opens materialized content while index rebuild is pending', async () => {
  const storage = await createSyncFixture();
  const manifest = await executeSync(storage, { type: 'rebuild-index' });
  expect(await readText(storage, 'notes/studies/offline.md')).toContain('Estudo offline');
  expect(manifest.index).toMatchObject({ status: 'pending', retryable: true });
});
