import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('preserva autoral quando rebuild falha', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-004 FR-008 NFR-001 NFR-002 NFR-004 AC-013
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const recovery = await api.openAfterIndexFailure?.(storage);
    expect(recovery, 'RED: a falha de índice ainda não preserva a abertura autoral').toMatchObject({ available: true, nextAction: expect.any(String) });
  });
});
