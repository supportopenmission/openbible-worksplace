import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';
import { writeBackupArchive } from './backup-archive';
import { getRestoreStaging, recoverStaging, rollbackRestoreStaging, restoreIntoStaging } from './backup-staging';

describe('preserva destino durante falha em staging', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-004 FR-001 FR-005 FR-007 NFR-001 NFR-003 AC-009
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const staged = await api.restoreIntoStaging?.(storage, new Uint8Array());
		expect(staged, 'RED: o restore ainda não oferece staging recuperável').toMatchObject({ status: expect.stringMatching(/staged|recoverable/) });
	});

	it('registra commit marker e permite rollback antes da gravação no backend', async () => {
		// SPECSFY: US-002 US-004 FR-001 FR-005 FR-007 NFR-001 NFR-003 AC-001 AC-009 AC-010
		const storage = await createPreparedBackupStorage();
		const archive = await writeBackupArchive(storage);
		const staged = await restoreIntoStaging(storage, archive);

		expect(staged).toMatchObject({ status: 'staged', restoreId: expect.any(String), workspaceId: expect.any(String) });
		if (staged.status !== 'staged' || !staged.restoreId) return;
		expect(getRestoreStaging(staged.restoreId)).toMatchObject({ state: 'prepared', commitMarker: 'prepared' });
		expect(recoverStaging()).toEqual(expect.arrayContaining([
			expect.objectContaining({ restoreId: staged.restoreId, state: 'prepared' })
		]));
		expect(rollbackRestoreStaging(staged.restoreId)).toMatchObject({ state: 'rolled_back', commitMarker: 'rolled_back' });
	});
});
