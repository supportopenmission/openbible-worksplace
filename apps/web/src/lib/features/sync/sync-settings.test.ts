import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./SyncSettings.svelte', import.meta.url), 'utf8');
const configPage = readFileSync(
	new URL('../config/ConfigPage.svelte', import.meta.url),
	'utf8'
);
const interfaceDoc = readFileSync(new URL('../../../../../../INTERFACE.md', import.meta.url), 'utf8');

// SPECSFY: US-004 FR-003 FR-006 NFR-002 NFR-004 AC-016 AC-018 AC-025
describe('SyncSettings interface contract', () => {
	it('expõe backend, escopo e transporte seguro sem persistir credenciais', () => {
		expect(source).toContain('app.sqlite');
		expect(source).toContain('openbible-workspace');
		expect(source).toContain('Documentos elegíveis');
		expect(source).toContain('wss://');
		expect(source).toContain('Tokens não são digitados nem salvos nesta tela.');
	});

	it('declara pairing, revogação e estados acessíveis', () => {
		expect(source).toContain('Vincular dispositivo');
		expect(source).toContain('Revogar');
		expect(source).toContain('role="status"');
		expect(source).toContain('role="alert"');
		expect(source).toContain('prefers-reduced-motion');
	});

	it('é composto na configuração de Storage/Workspace e documentado', () => {
		expect(configPage).toContain("import SyncSettings from '$lib/features/sync/SyncSettings.svelte';");
		expect(configPage).toContain('<SyncSettings />');
		expect(interfaceDoc).toContain('| `SyncSettings`');
		expect(interfaceDoc).toContain('`SyncSettings`');
	});
});
