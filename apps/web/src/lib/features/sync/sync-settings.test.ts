import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./SyncSettings.svelte', import.meta.url), 'utf8');
const accountSyncSection = readFileSync(
	new URL('../auth/AccountSyncSection.svelte', import.meta.url),
	'utf8'
);
const interfaceDoc = readFileSync(
	new URL('../../../../../../INTERFACE.md', import.meta.url),
	'utf8'
);

// SPECSFY: US-004 FR-003 FR-006 NFR-002 NFR-004 AC-016 AC-018 AC-025
describe('SyncSettings interface contract', () => {
	it('expõe backend e sincronização com servidor sem campos legados de transporte manual', () => {
		expect(source).toContain('app.sqlite');
		expect(source).toContain('openbible-workspace');
		expect(source).toContain('syncWorkspaceWithAccount');
		expect(source).not.toContain('https://sync.exemplo.workers.dev');
		expect(source).not.toContain('placeholder="Token do workspace"');
	});

	it('não possui seções legadas de pairing manual e expõe estados acessíveis', () => {
		expect(source).not.toContain('Vincular dispositivo');
		expect(source).not.toContain('Revogar');
		expect(source).toContain('role="status"');
		expect(source).toContain('role="alert"');
		expect(source).toContain('prefers-reduced-motion');
	});

	it('é composto na seção de Conta e Sincronização e documentado', () => {
		expect(accountSyncSection).toContain(
			"import SyncSettings from '../sync/SyncSettings.svelte';"
		);
		expect(accountSyncSection).toContain('<SyncSettings />');
		expect(interfaceDoc).toContain('| `SyncSettings`');
		expect(interfaceDoc).toContain('`SyncSettings`');
	});
});
