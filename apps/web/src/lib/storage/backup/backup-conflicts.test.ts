import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';
import { validateRestoreArchive, findRestoreConflicts } from './backup-restore';

describe('bloqueia conflito de conteúdo diferente', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-004 FR-006 FR-007 NFR-001 NFR-002 AC-011
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
    const conflicts = await api.findRestoreConflicts?.(storage, new Uint8Array());
		expect(conflicts, 'RED: conflitos ainda não são reportados antes do commit').toEqual(expect.arrayContaining([expect.objectContaining({ path: expect.any(String), reason: expect.any(String) })]));
	});

	it('valida hashes antes de aceitar o conteúdo do pacote', async () => {
		// SPECSFY: US-002 US-004 FR-003 FR-006 FR-007 NFR-001 NFR-002 NFR-004 AC-006 AC-008 AC-011
		const storage = await createPreparedBackupStorage();
		const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
		const archive = await api.writeBackupArchive?.(storage);
		expect(archive).toBeInstanceOf(Uint8Array);
		if (!archive) return;

		const valid = validateRestoreArchive(archive);
		expect(valid).toMatchObject({ valid: true, errors: [] });
		const conflicts = await findRestoreConflicts(storage, archive);
		expect(conflicts).toEqual(expect.arrayContaining([
			expect.objectContaining({ path: 'notes/theology/backup-fixture.md', reason: 'identical' })
		]));
	});
});
