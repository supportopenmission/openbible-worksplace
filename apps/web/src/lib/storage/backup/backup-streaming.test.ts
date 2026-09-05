import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('mantém buffers ativos abaixo de 16 MiB', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-001 US-002 FR-005 NFR-003 AC-007
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const chunks = api.streamBackupEntry?.(storage, 'notes/theology/backup-fixture.md');
    expect(chunks, 'RED: a entrada ainda não é exposta em fluxo').toBeDefined();
  });
});
