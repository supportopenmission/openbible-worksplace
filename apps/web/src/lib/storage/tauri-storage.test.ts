import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	clearNativeWorkspacePath,
	createTauriStorage,
	readNativeWorkspacePath,
	rememberNativeWorkspacePath
} from './tauri-storage';

describe('Tauri workspace storage', () => {
	afterEach(() => vi.unstubAllGlobals());

	// SPECSFY: US-001 FR-001 FR-005 NFR-002 AC-001
	it('does not expose an app-owned default data directory', () => {
		expect(createTauriStorage().kind).toBe('native');
	});

	it('remembers only the selected absolute workspace path', () => {
		const values = new Map<string, string>();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => values.get(key) ?? null,
			setItem: (key: string, value: string) => values.set(key, value),
			removeItem: (key: string) => values.delete(key)
		});
		clearNativeWorkspacePath();
		rememberNativeWorkspacePath('/Users/test/OpenBible');
		expect(readNativeWorkspacePath()).toBe('/Users/test/OpenBible');

		rememberNativeWorkspacePath('relative/path');
		expect(readNativeWorkspacePath()).toBe('/Users/test/OpenBible');
		clearNativeWorkspacePath();
		expect(readNativeWorkspacePath()).toBeNull();
	});
});
