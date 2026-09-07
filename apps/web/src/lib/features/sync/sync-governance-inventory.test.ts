import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rulesDoc = readFileSync(new URL('../../../../../../.specsfy/RULES.md', import.meta.url), 'utf8');
const projectDoc = readFileSync(new URL('../../../../../../PROJECT.md', import.meta.url), 'utf8');

// SPECSFY: FR-002 FR-003 FR-006 NFR-001 NFR-002 AC-006 AC-018 AC-029
describe('sync governance inventory', () => {
	it('registra sincronização opt-in, backends locais e ausência de relay obrigatório', () => {
		expect(rulesDoc).toContain('## Sincronização');
		expect(rulesDoc).toContain('opt-in por workspace e por dispositivo');
		expect(rulesDoc).toContain('app.sqlite no Tauri');
		expect(rulesDoc).toContain('IndexedDB versionado no PWA');
		expect(rulesDoc).toContain('Nenhum relay é obrigatório');
		expect(projectDoc).toContain('A fonte legada de pasta/manifesto é mantida');
		expect(projectDoc).toContain('sem relay obrigatório');
	});
});
