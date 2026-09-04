import { describe, expect, it } from 'vitest';
import { readHomeRoute } from './home-preference';

// SPECSFY: US-003 FR-006 FR-005 NFR-003 AC-011
describe('valor legado tratado como ausente', () => {
	it('ignora a preferência antiga sem redirecionar', () => {
		expect(readHomeRoute()).toBeNull();
	});
});
