import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('abre pacote portátil em adapters diferentes', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-001 US-002 US-003 FR-003 NFR-004 AC-003
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const archive = await api.writeBackupArchive?.(storage);
    expect(archive, 'RED: o pacote portátil ainda não é produzido').toBeInstanceOf(Uint8Array);
  });
});
