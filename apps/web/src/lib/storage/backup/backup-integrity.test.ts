import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import { createPreparedBackupStorage, type BackupWorkspaceApi } from './backup-test-fixture';
import { createIncrementalSha256, hashSha256 } from './backup-hash';

describe('rejeita divergência de tamanho ou SHA-256', () => {
  it('exercita a seam pública prevista para o comportamento do BDD', async () => {
    // SPECSFY: US-002 US-003 FR-003 FR-006 NFR-001 NFR-002 AC-006
    const storage = await createPreparedBackupStorage();
    const api = workspaceApi as unknown as Partial<BackupWorkspaceApi>;
		const validation = await api.validateBackupManifest?.(storage, new Uint8Array());
		expect(validation, 'RED: o manifesto ainda não é validado').toMatchObject({ valid: false, errors: expect.arrayContaining([expect.any(String)]) });
	});

	it('mantém o mesmo SHA-256 ao receber chunks menores que o limite de memória', async () => {
		// SPECSFY: US-001 US-002 FR-003 FR-005 NFR-001 NFR-003 AC-006 AC-007
		const encoder = new TextEncoder();
		const incremental = createIncrementalSha256();
		incremental.update(encoder.encode('a')).update(encoder.encode('b')).update(encoder.encode('c'));

		async function* chunks(): AsyncIterable<Uint8Array> {
			yield encoder.encode('a');
			yield encoder.encode('b');
			yield encoder.encode('c');
		}

		expect(incremental.digest()).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
		expect(await hashSha256(chunks())).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
	});
});
