import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./PeerConflictPanel.svelte', import.meta.url), 'utf8');

// SPECSFY: US-003 FR-005 NFR-002 NFR-004 AC-011 AC-012 AC-013
describe('PeerConflictPanel interface contract', () => {
	it('preserva e identifica as duas versões antes da decisão', () => {
		expect(source).toContain('Versão local');
		expect(source).toContain('Edição externa');
		expect(source).toContain('as duas versões continuam recuperáveis');
		expect(source).toContain('overwrite: false');
		expect(source).toContain('app.sqlite');
		expect(source).toContain('openbible-workspace');
	});

	it('oferece ações explícitas e estados acessíveis', () => {
		expect(source).toContain('Manter versão local');
		expect(source).toContain('Revisar versão externa');
		expect(source).toContain('role="alert"');
		expect(source).toContain('role="status"');
		expect(source).toContain('prefers-reduced-motion');
	});
});
