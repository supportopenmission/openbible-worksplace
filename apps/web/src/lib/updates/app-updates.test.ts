import { describe, expect, it } from 'vitest';
import { checkForAppUpdate, getAppUpdateState } from './app-updates.svelte';

describe('app updates', () => {
	it('uses the PWA reload path outside the native shell', async () => {
		const result = await checkForAppUpdate();

		expect(result.status).toBe('up-to-date');
		expect(result.notes).toContain('PWA');
		expect(getAppUpdateState().status).toBe('up-to-date');
	});
});
