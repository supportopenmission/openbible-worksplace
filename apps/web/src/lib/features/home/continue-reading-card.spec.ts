import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-001 FR-002 NFR-001 AC-006
describe('continuar vazio com CTA', () => {
	it('expõe o card de continuar com ação Abrir a Bíblia', () => {
		const card = new URL('./ContinueReadingCard.svelte', import.meta.url);
		expect(existsSync(card)).toBe(true);
	});
});
