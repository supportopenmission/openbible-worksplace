import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('abre autoral e agenda rebuild sem índice', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-003 US-004 FR-004 FR-008 NFR-003 NFR-004 AC-012
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const index = await api.rebuildDerivedIndex?.(storage);
    expect(index, 'RED: o índice derivado ainda não é reconstruído ou adiado').toMatchObject({ status: expect.stringMatching(/rebuilt|deferred/) });
  });
});
