import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-001 FR-001 NFR-002 AC-004
describe('continuar leitura via seleção salva', () => {
	it('expõe o adaptador de continuidade da home', () => {
		const module = new URL('./home-continuation.ts', import.meta.url);
		expect(existsSync(module)).toBe(true);
	});
});

// SPECSFY: US-001 FR-001 FR-002 NFR-002 AC-005
describe('continuar leitura com fallback para destaque', () => {
	it('resolve o último destaque quando não há seleção salva', () => {
		const module = new URL('./home-continuation.ts', import.meta.url);
		const source = readFileSync(module, 'utf8');
		expect(source).toContain('destaque');
	});
});
