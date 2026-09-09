import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./SyncStatus.svelte', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('./SyncSettings.svelte', import.meta.url), 'utf8');

// SPECSFY: US-002 US-004 FR-003 NFR-001 NFR-003 AC-005 AC-007 AC-027
describe('SyncStatus interface contract', () => {
	it('expõe estados de conexão, fila e último sucesso', () => {
		expect(source).toContain("'offline'");
		expect(source).toContain("'connecting'");
		expect(source).toContain("'syncing'");
		expect(source).toContain("'synced'");
		expect(source).toContain('Alterações pendentes');
		expect(source).toContain('Última sincronização');
	});

	it('expõe falha recuperável e respeita acessibilidade', () => {
		expect(source).toContain('role="status"');
		expect(source).toContain('role="alert"');
		expect(source).toContain('Tentar novamente');
		expect(source).toContain('prefers-reduced-motion');
	});

	it('é composto pela tela de configuração', () => {
		expect(settingsSource).toContain("import SyncStatus from './SyncStatus.svelte';");
		expect(settingsSource).toContain('<SyncStatus');
	});
});
