import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';

describe('omite áreas operacionais e relata categorias', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-001 FR-002 NFR-002 AC-004
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const exclusions = await api.readBackupExclusions?.(storage);
    expect(exclusions, 'RED: as exclusões operacionais ainda não são relatadas').toEqual(expect.arrayContaining([expect.objectContaining({ category: expect.any(String) })]));
  });
});
