import { describe, expect, it } from 'vitest';
import { initializeNativeWorkspace } from './tauri-storage';

describe('native workspace errors', () => {
	// SPECSFY: US-002 FR-001 FR-003 NFR-003 AC-008
	it('maps permission failures to a recoverable state', async () => {
		await expect(initializeNativeWorkspace({ path: '/protected' })).rejects.toMatchObject({
			code: 'permission_denied',
			recoverable: true
		});
	});
});
