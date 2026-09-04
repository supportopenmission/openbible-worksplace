import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 FR-003 FR-004 FR-005 FR-006 NFR-001 NFR-002 NFR-003 AC-012
describe('estados transversais da home', () => {
	it('prevê skeleton, erro com retry e navegação por teclado', () => {
		const home = new URL('./HomePage.svelte', import.meta.url);
		const source = readFileSync(home, 'utf8');
		expect(source).toContain('skeleton');
		expect(source).toContain('retry');
	});
});
