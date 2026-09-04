import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-003 FR-005 NFR-002 NFR-003 AC-002
describe('onboarding antes da home sem workspace', () => {
	it('mantém o onboarding e remove o redirect automático da rota /', () => {
		const page = new URL('../../../routes/+page.svelte', import.meta.url);
		const source = readFileSync(page, 'utf8');
		expect(source).toContain('OnboardingModal');
		expect(source).not.toContain('redirectToPreferredHome');
	});
});
