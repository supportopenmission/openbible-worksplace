import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('produz relatório privado e acionável', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-001 US-003 US-004 FR-001 FR-003 FR-004 FR-008 NFR-002 NFR-004 AC-014
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const report = api.buildOperationReport?.(storage);
    expect(report, 'RED: o relatório da operação ainda não é produzido').toMatchObject({ phase: expect.any(String), nextAction: expect.any(String), omitted: expect.any(Array) });
  });
});
