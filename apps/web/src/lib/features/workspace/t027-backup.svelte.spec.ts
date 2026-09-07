import { describe, expect, it } from 'vitest';

const panelModules = import.meta.glob('./BackupRestorePanel.svelte', {
	eager: true,
	import: 'default',
	query: '?raw'
}) as Record<string, string>;
const panelSource = panelModules['./BackupRestorePanel.svelte'] ?? '';

// SPECSFY: US-002 US-004 FR-007 FR-008 NFR-001 NFR-002 NFR-003 NFR-004 AC-009 AC-011 AC-012 AC-013 AC-014
describe('relatório e recovery visual de backup', () => {
	it('expõe relatório privado com fase, contagens, exclusões e próximo passo', () => {
		expect(panelSource).toContain('buildOperationReportAsync');
		expect(panelSource).toContain('BackupOperationReport');
		expect(panelSource).toContain('Fase');
		expect(panelSource).toContain('Entradas');
		expect(panelSource).toContain('Checksums');
		expect(panelSource).toContain('Exclusões');
		expect(panelSource).toContain('Conflitos');
		expect(panelSource).toContain('Próximo passo');
	});

	it('oferece commit, rollback, retry e rebuild do índice derivado', () => {
		expect(panelSource).toContain('commitRestoreStaging');
		expect(panelSource).toContain('discardStaging');
		expect(panelSource).toContain('rebuildDerivedIndex');
		expect(panelSource).toContain('openAfterIndexFailure');
		expect(panelSource).toContain('Tentar novamente');
		expect(panelSource).toContain('Descartar staging');
		expect(panelSource).toContain('Finalizar restauração');
		expect(panelSource).toContain('role="alert"');
	});
});
