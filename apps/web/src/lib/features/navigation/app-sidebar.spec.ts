import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-003 FR-005 FR-006 NFR-001 AC-003
describe('shell persistente com Início primeiro', () => {
	it('lista Início antes das áreas do produto com rota atual identificada', () => {
		const sidebar = new URL('./AppSidebar.svelte', import.meta.url);
		const source = readFileSync(sidebar, 'utf8');
		expect(source).toContain('Início');
		expect(source).toContain('aria-current');
	});
});
