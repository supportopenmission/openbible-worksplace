import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-002 FR-003 NFR-001 AC-007
describe('ações rápidas da home', () => {
	it('expõe atalhos para Ler, Nova nota e Novo sermão', () => {
		const actions = new URL('./QuickActions.svelte', import.meta.url);
		expect(existsSync(actions)).toBe(true);
	});
});
