import { createAuthClient } from 'better-auth/client';

export const PROD_SYNC_SERVER_URL = 'https://openbible-sync-server.contato-207.workers.dev';
export const DEV_SYNC_SERVER_URL = 'http://localhost:8787';

export function isDevEnvironment(): boolean {
	return Boolean(
		(import.meta as any).env?.DEV ||
		(import.meta as any).env?.MODE === 'development'
	);
}

export function getDefaultSyncServerBaseUrl(): string {
	const envUrl = (import.meta as any).env?.PUBLIC_SYNC_SERVER_URL;
	if (typeof envUrl === 'string' && envUrl.trim()) {
		return envUrl.trim();
	}
	return isDevEnvironment() ? DEV_SYNC_SERVER_URL : PROD_SYNC_SERVER_URL;
}

export function getSyncServerBaseUrl(): string {
	if (typeof window !== 'undefined') {
		const configured = window.localStorage.getItem('openbible:sync-server-url');
		if (configured && configured.trim()) {
			const clean = configured.trim();
			// Se estiver em produção mas o localStorage tiver o antigo padrão de dev (localhost),
			// limpa para apontar automaticamente para o servidor de produção publicado.
			if (!isDevEnvironment() && (clean === DEV_SYNC_SERVER_URL || clean === 'http://127.0.0.1:8787')) {
				window.localStorage.removeItem('openbible:sync-server-url');
				return PROD_SYNC_SERVER_URL;
			}
			return clean;
		}
	}
	return getDefaultSyncServerBaseUrl();
}

export function isCustomSyncServerConfigured(): boolean {
	if (typeof window !== 'undefined') {
		const configured = window.localStorage.getItem('openbible:sync-server-url');
		if (configured && configured.trim()) {
			const clean = configured.trim();
			if (!isDevEnvironment() && (clean === DEV_SYNC_SERVER_URL || clean === 'http://127.0.0.1:8787')) {
				return false;
			}
			return clean !== getDefaultSyncServerBaseUrl();
		}
	}
	return false;
}

const TOKEN_STORAGE_KEY = 'openbible:auth-token';
const USER_STORAGE_KEY = 'openbible:auth-user';

/**
 * True quando há motivo para falar com o servidor (a pessoa já usou uma
 * conta neste dispositivo). Sem opt-in, nenhum fetch de sessão é feito —
 * o app segue 100% local sem erros de conexão no console.
 */
export function hasLocalAuthContext(): boolean {
	return getStoredAuthToken() !== null || getStoredAuthUser() !== null;
}

export function getStoredAuthToken(): string | null {
	if (typeof window !== 'undefined') {
		const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
		if (token && token.trim()) return token.trim();
	}
	return null;
}

export function setStoredAuthToken(token: string | null): void {
	if (typeof window !== 'undefined') {
		if (token && token.trim()) {
			window.localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
		} else {
			window.localStorage.removeItem(TOKEN_STORAGE_KEY);
		}
	}
}

export interface AuthUserInfo {
	id?: string;
	name: string;
	email: string;
}

export function getStoredAuthUser(): AuthUserInfo | null {
	if (typeof window !== 'undefined') {
		try {
			const raw = window.localStorage.getItem(USER_STORAGE_KEY);
			if (raw) return JSON.parse(raw);
		} catch {
			return null;
		}
	}
	return null;
}

export function setStoredAuthUser(user: AuthUserInfo | null): void {
	if (typeof window !== 'undefined') {
		if (user) {
			window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
		} else {
			window.localStorage.removeItem(USER_STORAGE_KEY);
		}
		window.dispatchEvent(new CustomEvent('openbible:auth-changed', { detail: user }));
	}
}

function createInternalAuthClient(baseURL: string) {
	return createAuthClient({
		baseURL,
		fetchOptions: {
			onRequest(ctx) {
				const token = getStoredAuthToken();
				if (token) {
					ctx.headers.set('authorization', `Bearer ${token}`);
				}
			},
			onResponse(ctx) {
				const serverToken = ctx.response.headers.get('set-auth-token');
				if (serverToken) {
					setStoredAuthToken(serverToken);
				}
			}
		}
	});
}

let internalClient = createInternalAuthClient(getSyncServerBaseUrl());

export function refreshAuthClient(): void {
	internalClient = createInternalAuthClient(getSyncServerBaseUrl());
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
		setStoredAuthToken(null);
		setStoredAuthUser(null);
	}

	return { success: true };
}

export { createAuthClient };
