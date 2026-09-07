import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	createIndexedDbWorkspaceAdapter,
	INDEXEDDB_WORKSPACE_SCHEMA_VERSION,
	INDEXEDDB_WORKSPACE_STORES,
	type IndexedDbWorkspaceRecord
} from './indexeddb-workspace-adapter';

type FakeRequest<T> = {
	result: T;
	error: DOMException | null;
	onupgradeneeded?: () => void;
	onsuccess?: () => void;
	onerror?: () => void;
};

function key(value: IDBValidKey): string {
	return JSON.stringify(value);
}

function createIndexedDbDouble() {
	const databases = new Map<string, ReturnType<typeof createDatabase>>();

	function createDatabase() {
		const stores = new Map<string, Map<string, unknown>>();
		const database = {
			version: INDEXEDDB_WORKSPACE_SCHEMA_VERSION,
			objectStoreNames: {
				contains: (name: string) => stores.has(name)
			},
			createObjectStore: (name: string) => {
				const values = new Map<string, unknown>();
				stores.set(name, values);
				return { createIndex: () => undefined };
			},
			transaction: (names: string[], _mode: IDBTransactionMode) => {
				const transaction: {
					oncomplete?: () => void;
					onerror?: () => void;
					onabort?: () => void;
					error: DOMException | null;
					objectStore: (name: string) => {
						get: (requestedKey: IDBValidKey) => FakeRequest<unknown>;
						getAll: () => FakeRequest<unknown[]>;
						put: (value: unknown) => FakeRequest<IDBValidKey>;
					};
				} = {
					error: null,
					objectStore: (name) => {
						const values = stores.get(name);
						if (!values) throw new Error(`Unknown fake store: ${name}`);
						return {
							get: (requestedKey) => {
								const request: FakeRequest<unknown> = {
									result: values.get(key(requestedKey)),
									error: null
								};
								queueMicrotask(() => {
									request.onsuccess?.();
									queueMicrotask(() => transaction.oncomplete?.());
								});
								return request;
							},
							getAll: () => {
								const request: FakeRequest<unknown[]> = {
									result: [...values.values()],
									error: null
								};
								queueMicrotask(() => {
									request.onsuccess?.();
									queueMicrotask(() => transaction.oncomplete?.());
								});
								return request;
							},
							put: (value) => {
								const record = value as Record<string, unknown>;
								const requestedKey =
									name === 'workspaces'
										? record.workspaceId
										: name === 'active_workspace_pointer'
											? record.pointerId
											: name === 'legacy_workspace_migrations'
												? record.migrationKey
												: [record.workspaceId, record.blobKey];
								values.set(key(requestedKey as IDBValidKey), value);
								const request: FakeRequest<IDBValidKey> = {
									result: requestedKey as IDBValidKey,
									error: null
								};
								queueMicrotask(() => {
									request.onsuccess?.();
									queueMicrotask(() => transaction.oncomplete?.());
								});
								return request;
							}
						};
					}
				};
				for (const name of names) {
					if (!stores.has(name)) throw new Error(`Unknown fake store: ${name}`);
				}
				return transaction;
			},
			close: () => undefined,
			onversionchange: undefined as (() => void) | undefined
		};
		return database;
	}

	const factory = {
		open: (name: string) => {
			const database = databases.get(name) ?? createDatabase();
			databases.set(name, database);
			const request: FakeRequest<typeof database> = { result: database, error: null };
			const upgrade = !database.objectStoreNames.contains('workspaces');
			queueMicrotask(() => {
				if (upgrade) request.onupgradeneeded?.();
				queueMicrotask(() => request.onsuccess?.());
			});
			return request;
		}
	} as unknown as IDBFactory;

	return {
		factory,
		hasStore: (name: string) =>
			databases.get('test-workspaces')?.objectStoreNames.contains(name) ?? false
	};
}

describe('IndexedDB workspace adapter', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('creates versioned stores and keeps records scoped across reopen', async () => {
		const indexedDb = createIndexedDbDouble();
		vi.stubGlobal('indexedDB', indexedDb.factory);
		const adapter = createIndexedDbWorkspaceAdapter('test-workspaces');

		expect(await adapter.ensureSchema()).toEqual({
			backend: 'indexeddb',
			schemaVersion: INDEXEDDB_WORKSPACE_SCHEMA_VERSION
		});
		for (const store of Object.values(INDEXEDDB_WORKSPACE_STORES)) {
			expect(indexedDb.hasStore(store)).toBe(true);
		}
		const record: IndexedDbWorkspaceRecord = {
			workspaceId: 'workspace-a',
			name: 'A',
			status: 'ready',
			schemaVersion: 1,
			createdAt: '2026-09-06T00:00:00.000Z',
			updatedAt: '2026-09-06T00:00:00.000Z',
			lastOpenedAt: null,
			metadataJson: '{}'
		};

		await adapter.writeWorkspace(record);
		await adapter.writeBlob('workspace-a', 'cover', new Blob(['cover']));
		expect(await adapter.readWorkspace('workspace-a')).toEqual(record);
		expect(await adapter.readWorkspace('workspace-b')).toBeNull();
		expect(await adapter.readBlob('workspace-a', 'cover')).toBeInstanceOf(Blob);

		adapter.close();
		const reopened = createIndexedDbWorkspaceAdapter('test-workspaces');
		expect(await reopened.queryWorkspaces()).toEqual([record]);
	});
});
