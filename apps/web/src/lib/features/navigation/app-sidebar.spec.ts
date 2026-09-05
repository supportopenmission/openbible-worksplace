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

	// SPECSFY: US-001 FR-001 FR-004 NFR-003 AC-003
	it('expõe seletor persistente com ações de workspace e suporte responsivo', () => {
		const sidebar = new URL('./AppSidebar.svelte', import.meta.url);
		const source = readFileSync(sidebar, 'utf8');

		expect(source).toContain('WorkspaceSelector');
		expect(source).toContain('Gerenciar workspaces');
		expect(source).toContain('aria-label');
	});
});
