import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	CLIENT_RESET_STORAGE_KEY,
	ensureClientDataReset,
	reloadAfterClientReset
} from './client-reset';

function createStorage(): Storage {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key) => values.get(key) ?? null,
		key: (index) => [...values.keys()][index] ?? null,
		removeItem: (key) => values.delete(key),
		setItem: (key, value) => values.set(key, value)
	};
}

describe('client storage reset', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it('cleans application localStorage once and marks the migration', async () => {
		const storage = createStorage();
		storage.setItem('openbible:workspace-catalog', 'legacy');
		storage.setItem('openbible.theme', 'dark');
		vi.stubGlobal('window', { localStorage: storage });
		vi.stubGlobal('navigator', {});

		await expect(ensureClientDataReset()).resolves.toBe(true);
		expect(storage.getItem('openbible:workspace-catalog')).toBeNull();
		expect(storage.getItem('openbible.theme')).toBeNull();
		expect(storage.getItem(CLIENT_RESET_STORAGE_KEY)).toBe('done');
		await expect(ensureClientDataReset()).resolves.toBe(false);
	});

	it('requests at most one reload', () => {
		const reload = vi.fn();
		vi.stubGlobal('window', { location: { reload } });

		reloadAfterClientReset();
		reloadAfterClientReset();

		expect(reload).toHaveBeenCalledOnce();
	});
});
