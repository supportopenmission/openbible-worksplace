import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// SPECSFY: US-001 US-003 FR-001 FR-003 FR-004 NFR-003 AC-013 AC-018
describe('WorkspaceSelector forms contract', () => {
	it('mantém criar, adicionar e abrir como ações distintas', () => {
		const source = readFileSync(new URL('./WorkspaceSelector.svelte', import.meta.url), 'utf8');

		expect(source).toContain('Criar espaço de estudo');
		expect(source).toContain('Adicionar pasta existente');
		expect(source).toContain('submitCreate');
		expect(source).toContain('submitAdd');
		expect(source).toContain('selectWorkspace');
		expect(source).toContain('aria-label="Ações do espaço de estudo"');
		expect(source).toContain("variant === 'start'");
		expect(source).toContain('Criar novo workspace');
		expect(source).toContain('Abrir pasta existente');
		expect(source).toContain('selector-avatar');
		expect(source).not.toContain('ArrowLeftRight');
	});

	it('valida trim, colisão, loading e recovery sem fallback silencioso', () => {
		const source = readFileSync(new URL('./WorkspaceSelector.svelte', import.meta.url), 'utf8');

		expect(source).toContain('const trimmed = createName.trim()');
		expect(source).toContain('Colisão de identidade');
		expect(source).toContain('aria-busy={createSaving || undefined}');
		expect(source).toContain('aria-busy={addBusy || undefined}');
		expect(source).toContain('MIGRATION_REQUIRED');
		expect(source).toContain('RECONNECT_REQUIRED');
		expect(source).toContain('aria-live="assertive"');
	});
});
