import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// SPECSFY: US-002 FR-002 FR-004 NFR-003 AC-020
describe('PermissionRecovery interface contract', () => {
	it('expõe schema, persistência e migração como causas recuperáveis', () => {
		const source = readFileSync(new URL('./PermissionRecovery.svelte', import.meta.url), 'utf8');

		expect(source).toContain("'schema-unavailable'");
		expect(source).toContain("'persistence-unavailable'");
		expect(source).toContain("'migration'");
		expect(source).toContain('O banco local precisa de atenção');
		expect(source).toContain('Finalize a migração do workspace');
	});

	it('oferece retry, retomada, restauração e escolha alternativa com anúncios', () => {
		const source = readFileSync(new URL('./PermissionRecovery.svelte', import.meta.url), 'utf8');

		expect(source).toContain('Tentar novamente');
		expect(source).toContain('Retomar migração');
		expect(source).toContain('Restaurar fonte legada');
		expect(source).toContain('Escolher outro workspace');
		expect(source).toContain('aria-live="assertive"');
		expect(source).toContain('Pressione Escape');
	});
});
