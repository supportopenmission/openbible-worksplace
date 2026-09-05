import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('cria workspace novo com ID único', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 FR-007 NFR-004 AC-010
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const workspace = await api.createRestoredWorkspace?.(storage, new Uint8Array());
    expect(workspace, 'RED: o restore ainda não cria identidade de workspace').toMatchObject({ workspaceId: expect.any(String) });
  });
});
