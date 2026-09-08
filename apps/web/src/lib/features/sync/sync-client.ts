import { authClient, getSyncServerBaseUrl } from '../auth/auth-client';
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
}

export async function syncWorkspaceWithAccount(options: SyncOptions): Promise<HttpSyncResult> {
	const endpoint = options.endpoint || getSyncServerBaseUrl();
	const session = await authClient.getSession().catch(() => null);
	const token = options.token || (session?.data?.session?.token ?? '');
	const deviceId = options.deviceId || 'browser-client';

	return syncWorkspaceHttp(options.storage, {
		endpoint,
		token,
		deviceId
	});
}

export * from './sync-http-client';
