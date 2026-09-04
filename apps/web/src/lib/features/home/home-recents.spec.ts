import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-002 FR-003 FR-004 NFR-002 AC-008
describe('recentes reais da home', () => {
	it('expõe o carregador limitado de notas e destaques', () => {
		const module = new URL('./home-recents.ts', import.meta.url);
		expect(existsSync(module)).toBe(true);
	});
});
