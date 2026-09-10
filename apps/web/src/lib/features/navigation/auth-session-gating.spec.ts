import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: sincronização opt-in — sem conta usada, nenhum fetch de sessão
// (evita o ERR_CONNECTION_REFUSED contra o sync-server local).
describe('auth session gating', () => {
	it('gates the mobile drawer refresh behind local auth context', () => {
		const source = readFileSync(new URL('./MobileMoreDrawer.svelte', import.meta.url), 'utf8');
		expect(source).toContain('hasLocalAuthContext');
		expect(source).toContain('if (!hasLocalAuthContext()) return;');
	});

	it('gates the sidebar mount refresh behind local auth context', () => {
		const source = readFileSync(new URL('./AppSidebar.svelte', import.meta.url), 'utf8');
		expect(source).toContain('hasLocalAuthContext');
		expect(source).toContain('if (hasLocalAuthContext()) {');
	});
});
