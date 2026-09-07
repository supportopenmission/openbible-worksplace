import { describe, expect, it } from 'vitest';
import { describeAdapter } from './storage-registry';
import type { StorageKind } from './types';

type PersistenceDescriptor = ReturnType<typeof describeAdapter> & {
	backend?: 'sqlite' | 'indexeddb';
};

// SPECSFY: US-001 FR-001 FR-004 FR-005 FR-006 NFR-001 NFR-002 NFR-003 NFR-004 AC-013
describe('workspace persistence contract', () => {
	it('maps the native and PWA runtimes to their normative persistence backends', () => {
		const native = describeAdapter('native' as StorageKind) as PersistenceDescriptor;
		const pwa = describeAdapter('opfs' as StorageKind) as PersistenceDescriptor;

		expect(native.backend).toBe('sqlite');
		expect(pwa.backend).toBe('indexeddb');
	});
});
