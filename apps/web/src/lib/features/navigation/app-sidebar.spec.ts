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
		const selector = new URL('../workspace/WorkspaceSelector.svelte', import.meta.url);

		expect(source).toContain('WorkspaceSelector');
		expect(source).toContain('Gerenciar workspaces');
		expect(source).toContain('aria-label');
		const selectorSource = readFileSync(selector, 'utf8');
		expect(selectorSource).toContain('window.location.reload()');
		expect(selectorSource).toContain("goto(resolve('/'))");
		expect(selectorSource).toContain('Drawer.NestedRoot');
	});

	// SPECSFY: US-001 FR-004 NFR-003 AC-013
	it('mantém backend e retorno de foco no seletor mobile do shell', () => {
		const frame = new URL('../workspace/AppFrame.svelte', import.meta.url);
		const source = readFileSync(frame, 'utf8');

		expect(source).toContain('Drawer.Root bind:open={workspaceDrawerOpen}');
		expect(source).toContain('storageBackendLabel');
		expect(source).toContain('mobile-workspace-backend');
		expect(source).toContain('onAction={closeWorkspaceDrawer}');
	});
});
