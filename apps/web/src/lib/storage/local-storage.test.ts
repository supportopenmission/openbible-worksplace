import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	loadLocalWorkspaceHandle,
	queryLocalHandlePermission,
	requestLocalHandlePermission,
	saveLocalWorkspaceHandle,
	type DirectoryPermissionHandle
} from './local-storage';

function createIndexedDbDouble() {
	const values = new Map<string, unknown>();
	const database = {
		createObjectStore: () => undefined,
		transaction: () => {
			const transaction: {
				oncomplete?: () => void;
				onerror?: () => void;
				objectStore: () => {
					put: (value: unknown, key: string) => void;
					get: (key: string) => { result?: unknown; onsuccess?: () => void; onerror?: () => void };
				};
			} = {
				oncomplete: undefined,
				onerror: undefined,
				objectStore: () => ({
					put: (value, key) => {
						values.set(key, value);
						queueMicrotask(() => transaction.oncomplete?.());
					},
					get: (key) => {
						const request: {
							result?: unknown;
							onsuccess?: () => void;
							onerror?: () => void;
						} = { result: values.get(key) };
						queueMicrotask(() => request.onsuccess?.());
						return request;
					}
				})
			};
			return transaction;
		},
		close: () => undefined
	};

	return {
		open: () => {
			const request: {
				result: typeof database;
				onupgradeneeded?: () => void;
				onsuccess?: () => void;
			} = { result: database };
			queueMicrotask(() => request.onupgradeneeded?.());
			queueMicrotask(() => request.onsuccess?.());
			return request;
		}
	};
}

describe('local folder permission', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('keeps one folder handle per workspace after reopening', async () => {
		vi.stubGlobal('indexedDB', createIndexedDbDouble());
		const first = { name: 'Primeiro workspace' } as FileSystemDirectoryHandle;
		const second = { name: 'Segundo workspace' } as FileSystemDirectoryHandle;

		await saveLocalWorkspaceHandle(first, 'workspace-first');
		await saveLocalWorkspaceHandle(second, 'workspace-second');

		expect(await loadLocalWorkspaceHandle('workspace-first')).toBe(first);
		expect(await loadLocalWorkspaceHandle('workspace-second')).toBe(second);
	});

	it('reports prompt without requesting a new permission', async () => {
		const handle = {
			queryPermission: async () => 'prompt' as const,
			requestPermission: async () => 'granted' as const
		};

		expect(await queryLocalHandlePermission(handle)).toBe('prompt');
	});

	it('requests write permission on a user gesture', async () => {
		const handle = {
			queryPermission: async () => 'prompt' as const,
			requestPermission: async () => 'granted' as const
		};

		expect(await requestLocalHandlePermission(handle)).toBe('granted');
	});

	it('treats missing permission methods as unsupported', async () => {
		const handle = {} as DirectoryPermissionHandle;

		expect(await queryLocalHandlePermission(handle)).toBe('unsupported');
	});
});
