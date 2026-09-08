import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getDefaultSyncServerBaseUrl,
	getSyncServerBaseUrl,
	isCustomSyncServerConfigured,
	setSyncServerBaseUrl,
	PROD_SYNC_SERVER_URL,
	DEV_SYNC_SERVER_URL
} from './auth-client';

describe('auth-client sync server configuration', () => {
	const storage = new Map<string, string>();

	beforeEach(() => {
		storage.clear();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, val: string) => storage.set(key, val),
			removeItem: (key: string) => storage.delete(key),
			clear: () => storage.clear()
		});
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (key: string) => storage.get(key) ?? null,
				setItem: (key: string, val: string) => storage.set(key, val),
				removeItem: (key: string) => storage.delete(key),
				clear: () => storage.clear()
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('tem a URL oficial de produção na Cloudflare e a URL local para desenvolvimento', () => {
		expect(PROD_SYNC_SERVER_URL).toBe('https://openbible-sync-server.contato-207.workers.dev');
		expect(DEV_SYNC_SERVER_URL).toBe('http://localhost:8787');
	});

	it('retorna a URL padrão dev/prod apropriada', () => {
		const defaultUrl = getDefaultSyncServerBaseUrl();
		expect([PROD_SYNC_SERVER_URL, DEV_SYNC_SERVER_URL]).toContain(defaultUrl);
	});

	it('permite customizar a URL do servidor no localStorage e depois restaurar o padrão', () => {
		expect(isCustomSyncServerConfigured()).toBe(false);

		const customUrl = 'https://custom-sync.example.com';
		setSyncServerBaseUrl(customUrl);

		expect(isCustomSyncServerConfigured()).toBe(true);
		expect(getSyncServerBaseUrl()).toBe(customUrl);

		setSyncServerBaseUrl(null);
		expect(isCustomSyncServerConfigured()).toBe(false);
		expect(getSyncServerBaseUrl()).toBe(getDefaultSyncServerBaseUrl());
	});
});
