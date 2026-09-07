import { describe, expect, it } from 'vitest';
import source from './WorkspaceBackups.svelte?raw';

// SPECSFY: US-001 US-003 FR-001 FR-004 FR-008 NFR-004 AC-001 AC-005 AC-014
describe('ações de backup na aba de backup e restauração', () => {
	it('expõe criar/restaurar fora da gestão de workspaces', () => {
		expect(source).toContain('backup-actions');
		expect(source).toContain('Criar backup');
		expect(source).toContain('Restaurar backup');
		expect(source).toContain('openbible:backup-requested');
		expect(source).toContain('BackupRestorePanel');
		expect(source).toContain("'create'");
		expect(source).toContain("'restore'");
	});

	it('explica os backends lógicos e mantém a ação anunciada por teclado', () => {
		expect(source).toContain('IndexedDB no PWA');
		expect(source).toContain('SQLite nativo no desktop');
		expect(source).toContain('aria-live="polite"');
		expect(source).toContain('data-backup-action="create"');
		expect(source).toContain('data-backup-action="restore"');
	});
});
