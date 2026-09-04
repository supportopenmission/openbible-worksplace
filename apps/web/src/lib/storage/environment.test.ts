import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clearStoragePreference,
	readStoragePreference,
	rememberStoragePreference
} from './environment';

function createLocalStorage() {
	const values = new Map<string, string>();
	return {
		getItem: vi.fn((key: string) => values.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => values.set(key, value)),
		removeItem: vi.fn((key: string) => values.delete(key))
	};
}

describe('storage preference', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createLocalStorage());
	});

	it('remembers and reads an explicit OPFS fallback', () => {
		rememberStoragePreference('opfs');

		expect(readStoragePreference()).toBe('opfs');
	});

	it('clears the fallback when local storage is selected again', () => {
		rememberStoragePreference('opfs');
		clearStoragePreference();

		expect(readStoragePreference()).toBeNull();
	});
});
