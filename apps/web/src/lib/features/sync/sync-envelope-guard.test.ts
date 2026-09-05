import { expect, it } from 'vitest';
import { createSyncFixture, executeSync } from './sync-test-fixtures';

// SPECSFY: US-003 FR-006 NFR-002 AC-014
it('AC-014 excludes absolute paths, handles and catalogs from envelopes', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'serialize-envelope', path: '/private/workspace/note.md' });
  expect(manifest).not.toHaveProperty('absolutePath');
  expect(manifest).not.toHaveProperty('handle');
  expect(manifest).not.toHaveProperty('catalog');
  expect(manifest.envelope).toMatchObject({ portable: true });
});

// SPECSFY: US-004 FR-006 NFR-002 AC-015
it('AC-015 binds every sync document to one workspace scope', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'scope', workspaceId: 'workspace-fixture-001' });
  expect(manifest.workspaceId).toBe('workspace-fixture-001');
  expect(manifest.documents?.every((document) => document.workspaceId === manifest.workspaceId)).toBe(true);
});

// SPECSFY: US-004 FR-006 NFR-002 AC-018
it('AC-018 keeps relay credentials outside portable workspace data', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'credentials' });
  expect(manifest).not.toHaveProperty('token');
  expect(manifest).not.toHaveProperty('apiKey');
  expect(manifest.credentials).toMatchObject({ storage: 'secure-device-only', exported: false });
});

// SPECSFY: US-004 FR-006 NFR-002 AC-024
it('AC-024 rejects unknown executable fields in an incoming envelope', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'reject-payload', fields: ['command', 'sql', 'path'] });
  expect(manifest.envelope).toMatchObject({ rejectedFields: ['command', 'sql', 'path'], rejectReason: 'schema-guard' });
});

// SPECSFY: US-003 FR-006 NFR-004 AC-028
it('AC-028 excludes the disposable SQLite index from synchronization', async () => {
  const manifest = await executeSync(await createSyncFixture(), { type: 'portable-payload' });
  expect(manifest.excludedPaths).toBeDefined();
  expect(manifest.excludedPaths).toContain('.openbible/index.sqlite');
  expect(manifest.sourceFiles).not.toContain('.openbible/index.sqlite');
});
