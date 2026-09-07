import { describe, expect, it, vi } from 'vitest';
import {
	createIndexedDbSyncStorageAdapter,
	createNativeSqliteSyncStorageAdapter,
	syncRecordFromContent,
	type NativeSyncOperationalPort
} from './sync-storage-adapters';
import type { IndexedDbWorkspaceAdapter } from '$lib/storage/indexeddb-workspace-adapter';
import type { NativeWorkspaceContentPort } from '$lib/storage/backup/backup-adapters';
import type {
	WorkspaceContentContext,
	WorkspaceContentRecord
} from '$lib/storage/workspace-content-repository';

function storageKey(value: unknown): string {
	if (Array.isArray(value)) return JSON.stringify(value);
	if (!value || typeof value !== 'object') return JSON.stringify(value);
	const record = value as Record<string, unknown>;
	return JSON.stringify(
		['workspaceId', 'documentId', 'changeId', 'snapshotVersion']
			.filter((field) => field in record)
			.map((field) => record[field])
	);
}

function createIndexedDbAdapterDouble(): IndexedDbWorkspaceAdapter {
	const stores = new Map<string, Map<string, unknown>>();

	return {
		backend: 'indexeddb',
		capabilities: { backend: 'indexeddb', transactions: true, blobs: true },
		ensureSchema: async () => ({ backend: 'indexeddb', schemaVersion: 3 }),
		open: async () => ({ backend: 'indexeddb', schemaVersion: 3 }),
		transaction: async <T>(
			_storeNames: readonly string[],
			_mode: IDBTransactionMode,
			requestFactory: (transaction: IDBTransaction) => IDBRequest<T>
		) => {
			const transaction = {
				objectStore: (name: string) => {
					const values = stores.get(name) ?? new Map<string, unknown>();
					stores.set(name, values);
					return {
						put: (value: unknown) => {
							const key = storageKey(value);
							values.set(key, value);
							return { result: key as unknown as IDBValidKey };
						},
						get: (key: IDBValidKey) => ({ result: values.get(storageKey(key)) })
					};
				}
			} as unknown as IDBTransaction;
			const request = requestFactory(transaction) as unknown as { result: T };
			return request.result;
		},
		close: () => undefined,
		migrate: async () => ({ backend: 'indexeddb', schemaVersion: 3 }),
		readWorkspace: async () => null,
		writeWorkspace: async () => undefined,
		deleteWorkspace: async () => undefined,
		queryWorkspaces: async () => [],
		readActivePointer: async () => null,
		writeActivePointer: async () => undefined,
		readMigration: async () => null,
		writeMigration: async () => undefined,
		readBlob: async () => null,
		writeBlob: async () => undefined
	} as unknown as IndexedDbWorkspaceAdapter;
}

const indexedDbContext: WorkspaceContentContext = {
	workspaceId: 'workspace-a',
	generation: 1,
	backend: 'indexeddb'
};

const document = {
	documentId: 'note-1',
	workspaceId: 'workspace-a',
	kind: 'note' as const,
	backend: 'indexeddb' as const,
	backendRecordId: 'note-1',
	schemaVersion: 1,
	pending: true
};

describe('sync storage adapters', () => {
	it('persists IndexedDB sync metadata and keeps the workspace scope', async () => {
		const adapter = createIndexedDbSyncStorageAdapter(
			indexedDbContext,
			createIndexedDbAdapterDouble()
		);
		const queue = {
			workspaceId: 'workspace-a',
			documentId: 'note-1',
			pendingCount: 1,
			bytes: 3,
			retryAt: null,
			lastErrorCode: null,
			updatedAt: '2026-09-07T00:00:00.000Z'
		};

		expect(await adapter.ensureSchema()).toEqual({ backend: 'indexeddb', schemaVersion: 3 });
		await adapter.writeDocument(document);
		await adapter.writeSnapshot({
			workspaceId: 'workspace-a',
			documentId: 'note-1',
			snapshotVersion: 1,
			stateJson: '{}',
			headsJson: '[]',
			createdAt: '2026-09-07T00:00:00.000Z'
		});
		await adapter.appendChange({
			workspaceId: 'workspace-a',
			documentId: 'note-1',
			changeId: 'change-1',
			changeBlob: new Uint8Array([1, 2, 3]),
			byteSize: 3,
			applied: false,
			createdAt: '2026-09-07T00:00:00.000Z'
		});
		await adapter.writeQueue(queue);

		expect(await adapter.readQueue('workspace-a', 'note-1')).toEqual(queue);
		expect(await adapter.readQueue('workspace-b', 'note-1')).toBeNull();
	});

	it('delegates the native adapter to app.sqlite and preserves backend identity', async () => {
		const contentPort: NativeWorkspaceContentPort = {
			listContent: vi.fn(async () => []),
			writeContent: vi.fn(async () => undefined)
		};
		const operationalPort: NativeSyncOperationalPort = {
			ensureSchema: vi.fn(
				async (): Promise<{
					backend: 'sqlite';
					databaseName: 'app.sqlite';
					schemaVersion: number;
				}> => ({
					backend: 'sqlite',
					databaseName: 'app.sqlite',
					schemaVersion: 3
				})
			),
			writeDocument: vi.fn(async () => undefined),
			readState: vi.fn(async () => ({ note: null, snapshot: null, queue: null })),
			writeSnapshot: vi.fn(async () => undefined),
			appendChange: vi.fn(async () => undefined),
			readQueue: vi.fn(async () => null),
			writeQueue: vi.fn(async () => undefined)
		};
		const context: WorkspaceContentContext = {
			workspaceId: 'workspace-a',
			generation: 1,
			backend: 'sqlite'
		};
		const storage = createNativeSqliteSyncStorageAdapter(context, contentPort, operationalPort);
		const record: WorkspaceContentRecord = {
			kind: 'note',
			id: 'note-1',
			workspaceId: 'workspace-a',
			schemaVersion: 1,
			payload: {}
		};

		expect(storage.databaseName).toBe('app.sqlite');
		expect(await storage.ensureSchema()).toEqual({
			backend: 'sqlite',
			databaseName: 'app.sqlite',
			schemaVersion: 3
		});
		await storage.writeDocument({ ...document, backend: 'sqlite' });
		expect(operationalPort.writeDocument).toHaveBeenCalledWith({ ...document, backend: 'sqlite' });
		expect(syncRecordFromContent(record, 'sqlite')).toMatchObject({
			workspaceId: 'workspace-a',
			documentId: 'note-1',
			backend: 'sqlite'
		});
	});
});
