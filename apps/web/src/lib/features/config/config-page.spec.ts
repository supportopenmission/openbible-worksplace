import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-003 FR-006 NFR-003 AC-010
describe('config sem tela inicial', () => {
	it('remove qualquer controle de tela inicial da configuração', () => {
		const config = new URL('./ConfigPage.svelte', import.meta.url);
		const source = readFileSync(config, 'utf8');
		expect(source).not.toContain('Tela inicial');
	});
});
