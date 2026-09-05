import { expect, it } from 'vitest';
import { createSyncFixture, executeSync } from './sync-test-fixtures';

// SPECSFY: US-002 FR-003 NFR-001 AC-005
it('AC-005 describes an authorized websocket document exchange', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'connect', endpoint: 'wss://relay.example.test' });
  expect(manifest.endpoint).toMatchObject({ transport: 'websocket', authorized: true, pendingDocuments: ['note-concurrent-001'] });
});

// SPECSFY: US-002 FR-003 NFR-004 AC-006
it('AC-006 permits a local adapter without a remote endpoint', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'configure-local' });
  expect(manifest.transports).toBeDefined();
  expect(manifest.transports).toContain('local');
  expect(manifest.relayRequired).toBe(false);
});

// SPECSFY: US-002 FR-003 NFR-003 AC-007
it('AC-007 records retry backoff when the relay times out', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'retry', endpoint: 'wss://relay.example.test' });
  expect(manifest.retry).toMatchObject({ attempts: 0, recoverable: true });
  expect(manifest.retry?.backoffMs).toBeGreaterThan(0);
});

// SPECSFY: US-002 FR-003 NFR-003 AC-022
it('AC-022 declares a bounded queue policy for transport backpressure', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'backpressure' });
  expect(manifest.queuePolicy).toBeDefined();
  expect(manifest.queuePolicy?.maxBytes).toBeGreaterThan(0);
  expect(manifest.queuePolicy?.backpressure).toBe('pause-network-only');
});

// SPECSFY: US-004 FR-003 NFR-002 AC-025
it('AC-025 rejects an insecure production endpoint before sending content', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'connect', endpoint: 'ws://insecure.example.test' });
  expect(manifest.endpointPolicy).toMatchObject({ productionRequiresTls: true, insecureStatus: 'blocked' });
});

// SPECSFY: US-004 FR-003 NFR-003 AC-027
it('AC-027 exposes observable connection status and last failure', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'diagnostics' });
  expect(manifest.diagnostics).toMatchObject({ status: 'offline', lastSuccessAt: null, lastErrorCode: null });
});

// SPECSFY: US-002 FR-003 NFR-004 AC-030
it('AC-030 keeps the document contract independent from transport names', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'protocol' });
  expect(manifest.protocol).toMatchObject({ version: 1, transportAgnostic: true });
});
