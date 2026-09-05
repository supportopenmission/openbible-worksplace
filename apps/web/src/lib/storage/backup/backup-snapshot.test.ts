import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('aguarda autosave e captura geração estável', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-001 US-004 FR-001 NFR-001 AC-001
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const snapshot = await api.createBackupSnapshot?.(storage);
    expect(snapshot, 'RED: o snapshot estável ainda não é produzido').toMatchObject({ generation: expect.any(Number), files: expect.any(Number) });
  });
});
