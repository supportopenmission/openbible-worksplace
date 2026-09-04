import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	isStandaloneDisplay,
	resolveStorageKind,
	shouldOfferStorageChoice,
	supportsFileSystemAccess
} from './environment';

function stubLocalStorage(value: string | null) {
	const store = new Map<string, string>();
	if (value !== null) store.set('openbible:storage-kind', value);
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, next: string) => {
			store.set(key, next);
		},
		removeItem: (key: string) => {
			store.delete(key);
		}
	});
}

describe('storage kind resolution', () => {
	beforeEach(() => {
		stubLocalStorage(null);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	// SPECSFY: STORAGE-001
	it('prefere a escolha salva ao padrão por hostname', () => {
		stubLocalStorage('local');
		expect(resolveStorageKind({ hostname: 'app.exemplo.com' })).toBe('local');
	});

	// SPECSFY: STORAGE-001
	it('usa o padrão OPFS fora do localhost sem preferência', () => {
		expect(resolveStorageKind({ hostname: 'app.exemplo.com' })).toBe('opfs');
	});

	// SPECSFY: STORAGE-001
	it('usa pasta no localhost sem preferência', () => {
		expect(resolveStorageKind({ hostname: 'localhost' })).toBe('local');
	});

	// SPECSFY: STORAGE-001
	it('não detecta File System Access fora do navegador', () => {
		expect(supportsFileSystemAccess()).toBe(false);
		expect(isStandaloneDisplay()).toBe(false);
		expect(shouldOfferStorageChoice()).toBe(false);
	});
});
