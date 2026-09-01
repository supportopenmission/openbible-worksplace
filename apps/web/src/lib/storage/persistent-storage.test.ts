import { describe, expect, it } from 'vitest';
import { isStoragePersisted, requestPersistentStorage } from './persistent-storage';

function fakeStorage(options: { persisted?: boolean; persist?: boolean; fail?: boolean }) {
	return {
		persisted: async () => {
			if (options.fail) throw new Error('denied');
			return options.persisted ?? false;
		},
		persist: async () => {
			if (options.fail) throw new Error('denied');
			return options.persist ?? false;
		}
	};
}

describe('persistent origin storage', () => {
	it('returns null when the API is unavailable', async () => {
		expect(await isStoragePersisted(null)).toBeNull();
		expect(await requestPersistentStorage(null)).toBe(false);
	});

	it('does not request persist when the origin is already persisted', async () => {
		expect(await isStoragePersisted(fakeStorage({ persisted: true }))).toBe(true);
		expect(await requestPersistentStorage(fakeStorage({ persisted: true, persist: false }))).toBe(
			true
		);
	});

	it('requests persist when the origin is still evictable', async () => {
		expect(await requestPersistentStorage(fakeStorage({ persisted: false, persist: true }))).toBe(
			true
		);
		expect(await requestPersistentStorage(fakeStorage({ persisted: false, persist: false }))).toBe(
			false
		);
	});
});
