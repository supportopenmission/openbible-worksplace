import { createAuthClient } from 'better-auth/client';

export function getDefaultSyncServerBaseUrl(): string {
	const envUrl = (import.meta as any).env?.PUBLIC_SYNC_SERVER_URL;
	if (typeof envUrl === 'string' && envUrl.trim()) {
		return envUrl.trim();
	}
	return 'http://localhost:8787';
}

export function getSyncServerBaseUrl(): string {
	if (typeof window !== 'undefined') {
		const configured = window.localStorage.getItem('openbible:sync-server-url');
		if (configured && configured.trim()) {
			return configured.trim();
		}
	}
	return getDefaultSyncServerBaseUrl();
}

export function isCustomSyncServerConfigured(): boolean {
	if (typeof window !== 'undefined') {
		const configured = window.localStorage.getItem('openbible:sync-server-url');
		return Boolean(configured && configured.trim());
	}
	return false;
}

let internalClient = createAuthClient({
	baseURL: getSyncServerBaseUrl()
});

export function refreshAuthClient(): void {
	internalClient = createAuthClient({
		baseURL: getSyncServerBaseUrl()
	});
}

export function setSyncServerBaseUrl(url: string | null): void {
	if (typeof window !== 'undefined') {
		if (url && url.trim()) {
			window.localStorage.setItem('openbible:sync-server-url', url.trim());
		} else {
			window.localStorage.removeItem('openbible:sync-server-url');
		}
		refreshAuthClient();
	}
}

export const authClient = new Proxy({} as ReturnType<typeof createAuthClient>, {
	get(_target, prop) {
		return (internalClient as any)[prop];
	}
});

/**
 * Realiza o logout do usuário da sessão remota, garantindo que
 * 100% dos dados locais (SQLite, IndexedDB, notas e configurações)
 * permaneçam absolutamente intactos (princípio Local-First / Files-Over-Apps).
 */
export async function logoutAndPreserveLocalData(): Promise<{ success: boolean }> {
	try {
		await authClient.signOut();
	} catch {
		// Se a rede falhar, continua e limpa credenciais locais
	}

	if (typeof window !== 'undefined') {
		// Limpa apenas chaves de autenticação, jamais tocando em dados locais de workspace
		window.localStorage.removeItem('better-auth.session_token');
		window.localStorage.removeItem('openbible:auth-user');
	}

	return { success: true };
}

export { createAuthClient };
