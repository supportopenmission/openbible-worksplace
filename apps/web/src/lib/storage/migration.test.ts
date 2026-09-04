import { describe, expect, it } from 'vitest';
import { migrateOpfsWorkspace } from './migration';

describe('OPFS workspace migration', () => {
	// SPECSFY: US-002 FR-003 NFR-003 AC-006
	it('copies a valid source and preserves it after validation', async () => {
		const result = await migrateOpfsWorkspace({ source: 'opfs://workspace', destination: '/tmp/openbible' });

		expect(result).toMatchObject({ state: 'completed', sourcePreserved: true });
	});

	// SPECSFY: US-002 FR-003 NFR-003 AC-007
	it('keeps the source intact when the copy is interrupted', async () => {
		const result = await migrateOpfsWorkspace({
			source: 'opfs://workspace',
			destination: '/tmp/openbible',
			interruptAfter: '.openbible/index.sqlite'
		});

		expect(result).toMatchObject({ state: 'error', sourcePreserved: true, retryable: true });
	});
});
