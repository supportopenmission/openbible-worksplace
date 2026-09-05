import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('rejeita divergência de tamanho ou SHA-256', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-003 FR-003 FR-006 NFR-001 NFR-002 AC-006
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const validation = await api.validateBackupManifest?.(storage, new Uint8Array());
    expect(validation, 'RED: o manifesto ainda não é validado').toMatchObject({ valid: false, errors: expect.arrayContaining([expect.any(String)]) });
  });
});
