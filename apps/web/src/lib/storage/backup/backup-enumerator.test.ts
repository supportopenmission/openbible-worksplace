import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('enumera arquivos autorais recursivamente', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-001 FR-001 FR-002 NFR-003 AC-002
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const entries = api.enumerateBackupEntries?.(storage);
    expect(entries, 'RED: a enumeração autoral ainda não é produzida').toBeDefined();
  });
});
