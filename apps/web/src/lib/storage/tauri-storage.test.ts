import { describe, expect, it } from 'vitest';
import { createTauriStorage } from './tauri-storage';

describe('Tauri workspace storage', () => {
	// SPECSFY: US-001 FR-001 FR-005 NFR-002 AC-001
	it('uses the Application Support workspace by default', () => {
		const storage = createTauriStorage();

		expect(storage.defaultWorkspacePath()).toBe(
			'~/Library/Application Support/OpenBible/workspace'
		);
	});
});
