import { describe, expect, it } from 'vitest';
import { chooseNativeWorkspace } from './workspace-choice';

describe('native workspace choice', () => {
	// SPECSFY: US-001 FR-001 NFR-002 AC-002
	it('accepts a validated alternative folder', async () => {
		const result = await chooseNativeWorkspace('/Users/test/OpenBible');

		expect(result).toMatchObject({ kind: 'native', path: '/Users/test/OpenBible' });
	});
});
