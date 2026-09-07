import { describe, expect, it } from 'vitest';
import backupsSource from './WorkspaceBackups.svelte?raw';

const panelModules = import.meta.glob('./BackupRestorePanel.svelte', {
	eager: true,
	import: 'default',
	query: '?raw'
}) as Record<string, string>;
const panelSource = panelModules['./BackupRestorePanel.svelte'] ?? '';

// SPECSFY: US-001 US-003 US-004 FR-001 FR-002 FR-004 FR-005 NFR-001 NFR-002 NFR-003 NFR-004 AC-001 AC-002 AC-004 AC-005 AC-007 AC-014
describe('dialog de criação de backup', () => {
	it('abre pelo evento da configuração e oferece a política de Bíblias', () => {
		expect(panelSource).toContain('openbible:backup-requested');
		expect(panelSource).toContain('Incluir Bíblias importadas');
		expect(panelSource).toContain('Criar backup');
		expect(panelSource).toContain('Cancelar');
		expect(panelSource).toContain('flushActive');
		expect(panelSource).toContain('backup_generation_changed');
		expect(panelSource).toContain('writeBackupArchive');
		expect(backupsSource).toContain('<BackupRestorePanel {storage} />');
	});

	it('expõe estimativa, progresso acessível e o formato portátil', () => {
		expect(panelSource).toContain('Estimativa');
		expect(panelSource).toContain('aria-live="polite"');
		expect(panelSource).toContain('role="progressbar"');
		expect(panelSource).toContain('BACKUP_ARCHIVE_EXTENSION');
		expect(panelSource).toContain('BACKUP_MIME_TYPE');
	});
});
