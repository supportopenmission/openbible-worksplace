import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('workspace startup preference contract', () => {
	it('persists the opt-in screen preference outside the workspace database', () => {
		const source = readFileSync(new URL('./workspace-startup-preference.ts', import.meta.url), 'utf8');

		expect(source).toContain("openbible:workspace-startup-screen");
		expect(source).toContain("localStorage.getItem(WORKSPACE_STARTUP_SCREEN_KEY) !== 'hidden'");
		expect(source).toContain('localStorage.setItem(WORKSPACE_STARTUP_SCREEN_KEY');
		expect(source).toContain('WORKSPACE_STARTUP_SCREEN_EVENT');
	});

	it('exposes a way to reopen the screen from settings', () => {
		const source = readFileSync(new URL('./WorkspaceSettings.svelte', import.meta.url), 'utf8');

		expect(source).toContain('Sempre mostrar ao iniciar');
		expect(source).toContain('Abrir tela agora');
		expect(source).toContain('requestWorkspaceStartupScreen');
	});
});
