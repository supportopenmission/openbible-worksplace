import { describe, expect, it } from 'vitest';
import source from './ConfigPage.svelte?raw';

// SPECSFY: US-001 US-003 FR-001 FR-004 FR-008 NFR-004 AC-001 AC-005 AC-014
describe('fluxo de armazenamento na configuração mobile', () => {
	it('reutiliza WorkspaceSettings no subfluxo mobile sem duplicar o backend', () => {
		expect(source).toContain('mobileSection === \'storage\'');
		expect(source).toContain('<WorkspaceSettings embedded view="storage" />');
		expect(source).toContain('mobileSection === \'workspaces\'');
		expect(source).toContain('<WorkspaceSettings embedded view="workspaces" />');
		expect(source).toContain('mobileSection === \'backups\'');
		expect(source).toContain('<WorkspaceBackups embedded />');
		expect(source).toContain('config-subpage-body');
	});

	it('expõe o painel mobile com relação semântica ao título da seção', () => {
		expect(source).toContain('config-mobile-panel-${mobileSection}');
		expect(source).toContain('config-mobile-heading-${mobileSection}');
	});
});
