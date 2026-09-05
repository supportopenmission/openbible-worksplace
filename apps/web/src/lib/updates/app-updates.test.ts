import { describe, expect, it } from 'vitest';
import { checkForAppUpdate, getAppUpdateState, markPwaUpdateAvailable } from './app-updates.svelte';

describe('app updates', () => {
	it('uses the PWA reload path outside the native shell', async () => {
		const result = await checkForAppUpdate();

		expect(result.status).toBe('up-to-date');
		expect(result.notes).toContain('PWA');
		expect(getAppUpdateState().status).toBe('up-to-date');
	});

	it('exposes a PWA update as an available app update', () => {
		const result = markPwaUpdateAvailable();

		expect(result.status).toBe('available');
		expect(result.version).toBeNull();
		expect(result.notes).toContain('CSS');
		expect(result.notes).toContain('JavaScript');
	});
});
