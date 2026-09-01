import { describe, expect, it } from 'vitest';
import {
	clearHomeRoute,
	HOME_ROUTE_STORAGE_KEY,
	readHomeRoute,
	saveHomeRoute
} from './home-preference';

function createStorage(initial?: string): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
	let value = initial ?? null;
	return {
		getItem: () => value,
		setItem: (...args: [string, string]) => {
			value = args[1];
		},
		removeItem: () => {
			value = null;
		}
	};
}

describe('home preference', () => {
	it('saves and reads an available home route', () => {
		const storage = createStorage();

		expect(saveHomeRoute('bible', storage)).toBe(true);
		expect(readHomeRoute(storage)).toBe('bible');
	});

	it('clears the selected route', () => {
		const storage = createStorage('sermons');

		expect(clearHomeRoute(storage)).toBe(true);
		expect(readHomeRoute(storage)).toBeNull();
	});

	it('rejects an unknown stored value', () => {
		const storage = createStorage('study');

		expect(readHomeRoute(storage)).toBeNull();
		expect(storage.getItem(HOME_ROUTE_STORAGE_KEY)).toBeNull();
	});
});
