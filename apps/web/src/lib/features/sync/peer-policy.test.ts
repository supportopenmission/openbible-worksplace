import { expect, it } from 'vitest';
import { createSyncFixture, executeSync } from './sync-test-fixtures';

// SPECSFY: US-004 FR-006 NFR-004 AC-016
it('AC-016 records an explicit peer pairing scope', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'pair-peer', peerId: 'peer-device-002', workspaceId: 'workspace-fixture-001' });
  expect(manifest.peers).toBeDefined();
  expect(manifest.peers).toContainEqual({ peerId: 'peer-device-002', workspaceId: 'workspace-fixture-001', scope: ['note-offline-001'], status: 'active' });
});

// SPECSFY: US-004 FR-006 NFR-003 AC-017
it('AC-017 rejects a revoked peer while preserving local data', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'revoke-peer', peerId: 'peer-device-002' });
  expect(manifest.peers).toBeDefined();
  expect(manifest.peers).toContainEqual({ peerId: 'peer-device-002', status: 'revoked' });
  expect(manifest.localDataPreserved).toBe(true);
});
