import { describe, expect, it } from 'vitest';

const panelModules = import.meta.glob('./BackupRestorePanel.svelte', {
	eager: true,
	import: 'default',
	query: '?raw'
}) as Record<string, string>;
const panelSource = panelModules['./BackupRestorePanel.svelte'] ?? '';

// SPECSFY: US-002 US-004 FR-003 FR-006 FR-007 NFR-001 NFR-002 NFR-004 AC-003 AC-006 AC-008 AC-009 AC-010 AC-011
describe('dialog de validação e restauração de backup', () => {
	it('aceita apenas o pacote portátil e valida antes do staging', () => {
		expect(panelSource).toContain('type="file"');
		expect(panelSource).toContain('accept={BACKUP_ARCHIVE_EXTENSION}');
		expect(panelSource).toContain('validateRestoreArchive');
		expect(panelSource).toContain('restoreIntoStaging');
		expect(panelSource).toContain('openbible-backup.json');
		expect(panelSource).toContain('Nenhum arquivo foi gravado');
	});

	it('expõe novo workspace, conflito explícito e estados acessíveis', () => {
		expect(panelSource).toContain('Novo workspace');
		expect(panelSource).toContain('Workspace existente');
		expect(panelSource).toContain('findRestoreConflicts');
		expect(panelSource).toContain('role="alert"');
		expect(panelSource).toContain('aria-live="polite"');
		expect(panelSource).toContain('openbible:backup-requested');
	});
});
