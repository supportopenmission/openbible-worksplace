import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('preserva destino durante falha em staging', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-004 FR-001 FR-005 FR-007 NFR-001 NFR-003 AC-009
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const staged = await api.restoreIntoStaging?.(storage, new Uint8Array());
    expect(staged, 'RED: o restore ainda não oferece staging recuperável').toMatchObject({ status: expect.stringMatching(/staged|recoverable/) });
  });
});
