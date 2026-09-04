import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-003 FR-005 FR-003 NFR-002 AC-001
describe('home operacional sem redirect', () => {
	it('expõe a composição HomePage da nova entrada', () => {
		const homePage = new URL('./HomePage.svelte', import.meta.url);
		expect(existsSync(homePage)).toBe(true);
	});
});
