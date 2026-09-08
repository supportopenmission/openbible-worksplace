import { authClient, getSyncServerBaseUrl, getStoredAuthToken, setStoredAuthToken } from '../auth/auth-client';
import { syncWorkspaceHttp, type HttpSyncResult } from './sync-http-client';

/**
 * Retorna true se a operação offline for suportada.
 * No OpenBible, a aplicação é offline-first por design:
 * todas as operações de leitura e escrita em notas e bíblias
 * funcionam perfeitamente sem conexão ou conta ativa.
 */
export function isOfflineSupported(): boolean {
	return true;
}

import type { WorkspaceStorage } from '$lib/storage/types';

export interface SyncOptions {
	storage: WorkspaceStorage;
	endpoint?: string;
	token?: string;
	deviceId?: string;
	fetcher?: typeof fetch;
}

export async function syncWorkspaceWithAccount(options: SyncOptions): Promise<HttpSyncResult> {
	const endpoint = options.endpoint || getSyncServerBaseUrl();
	const storedToken = getStoredAuthToken();
	let token = options.token || storedToken || '';

	if (!token) {
		const session = await authClient.getSession().catch(() => null);
		token = session?.data?.session?.token ?? '';
		if (token) {
			setStoredAuthToken(token);
		}
	}

	const deviceId = options.deviceId || 'browser-client';

	return syncWorkspaceHttp(options.storage, {
		endpoint,
		token,
		deviceId,
		fetcher: options.fetcher
	});
}

export * from './sync-http-client';
