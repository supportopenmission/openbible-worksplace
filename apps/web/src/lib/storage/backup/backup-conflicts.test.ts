import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('bloqueia conflito de conteúdo diferente', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-004 FR-006 FR-007 NFR-001 NFR-002 AC-011
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const conflicts = await api.findRestoreConflicts?.(storage, new Uint8Array());
    expect(conflicts, 'RED: conflitos ainda não são reportados antes do commit').toEqual(expect.arrayContaining([expect.objectContaining({ path: expect.any(String), reason: expect.any(String) })]));
  });
});
