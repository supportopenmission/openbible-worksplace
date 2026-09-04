export type HomeRoute = 'bible' | 'sermons';

export const HOME_ROUTE_STORAGE_KEY = 'openbible.initial-route';

/**
 * Preferência de tela inicial removida (SPEC-0012): a rota `/` é sempre a
 * home operacional. A leitura abaixo existe somente para migração tolerante
 * de valores legados e sempre resolve ausência.
 */
export function readHomeRoute(): HomeRoute | null {
	if (typeof window === 'undefined') return null;
	try {
		window.localStorage.removeItem(HOME_ROUTE_STORAGE_KEY);
	} catch {
		// Armazenamento indisponível não impede a home.
	}
	return null;
}

export function saveHomeRoute(): boolean {
	// Salvamento desativado: a home operacional não usa preferência.
	return false;
}

export function clearHomeRoute(): boolean {
	if (typeof window === 'undefined') return true;
	try {
		window.localStorage.removeItem(HOME_ROUTE_STORAGE_KEY);
		return true;
	} catch {
		return false;
	}
}

export function homeRoutePath(route: HomeRoute): `/${HomeRoute}` {
	return `/${route}`;
}
