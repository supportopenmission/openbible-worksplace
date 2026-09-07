import { describe, expect, it } from 'vitest';
import { describeAdapter } from './storage-registry';

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 FR-003 FR-006 NFR-001 NFR-004 AC-017
describe('workspace adapter contract', () => {
	it('declares transaction and blob capabilities for both runtimes', () => {
		const native = describeAdapter('native');
		const pwa = describeAdapter('opfs');

		expect(native.capabilities).toMatchObject({ transactions: true, blobs: true });
		expect(pwa.capabilities).toMatchObject({ transactions: true, blobs: true });
	});
});
