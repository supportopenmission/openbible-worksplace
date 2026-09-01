export type HomeRoute = 'bible' | 'sermons';

export const HOME_ROUTE_STORAGE_KEY = 'openbible.initial-route';

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const isHomeRoute = (value: string | null): value is HomeRoute =>
	value === 'bible' || value === 'sermons';

function browserStorage(): PreferenceStorage | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export function readHomeRoute(
	storage: PreferenceStorage | null = browserStorage()
): HomeRoute | null {
	if (!storage) return null;
	try {
		const value = storage.getItem(HOME_ROUTE_STORAGE_KEY);
		if (isHomeRoute(value)) return value;
		if (value !== null) storage.removeItem(HOME_ROUTE_STORAGE_KEY);
	} catch {
		return null;
	}
	return null;
}

export function saveHomeRoute(
	route: HomeRoute,
	storage: PreferenceStorage | null = browserStorage()
): boolean {
	if (!storage || !isHomeRoute(route)) return false;
	try {
		storage.setItem(HOME_ROUTE_STORAGE_KEY, route);
		return true;
	} catch {
		return false;
	}
}

export function clearHomeRoute(storage: PreferenceStorage | null = browserStorage()): boolean {
	if (!storage) return false;
	try {
		storage.removeItem(HOME_ROUTE_STORAGE_KEY);
		return true;
	} catch {
		return false;
	}
}

export function homeRoutePath(route: HomeRoute): `/${HomeRoute}` {
	return `/${route}`;
}
