import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('rejeita caminhos inseguros e tipos especiais', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-004 FR-005 FR-006 NFR-002 AC-008
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const validation = api.validateRestoreEntry?.(storage, '../fora-do-staging');
    expect(validation, 'RED: o caminho inseguro ainda não é rejeitado').toMatchObject({ valid: false, reason: expect.any(String) });
  });
});
