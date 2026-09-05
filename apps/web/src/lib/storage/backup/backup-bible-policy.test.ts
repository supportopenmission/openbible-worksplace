import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('respeita inclusão explícita de Bíblias', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-001 US-003 FR-002 FR-004 NFR-002 NFR-003 AC-005
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const policy = await api.resolveBibleBackupPolicy?.(storage, false);
    expect(policy, 'RED: a política de Bíblias ainda não produz decisão').toMatchObject({ included: [], omitted: expect.any(Array) });
  });
});
