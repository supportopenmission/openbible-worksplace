import {
	createIndexedDbContentRepository,
	createNativeSqliteContentRepository,
	type NativeWorkspaceContentPort
} from '$lib/storage/backup/backup-adapters';
import {
	createIndexedDbWorkspaceAdapter,
	INDEXEDDB_WORKSPACE_DATABASE,
	INDEXEDDB_WORKSPACE_STORES,
	type IndexedDbSchemaStatus,
	type IndexedDbSyncChange,
	type IndexedDbSyncDocument,
	type IndexedDbSyncQueue,
	type IndexedDbSyncSnapshot,
	IndexedDbWorkspaceAdapter
} from '$lib/storage/indexeddb-workspace-adapter';
import type {
	WorkspaceContentContext,
	WorkspaceContentRecord,
	WorkspaceContentRepository
} from '$lib/storage/workspace-content-repository';
import type { SyncBackend, SyncDocumentRef } from './sync-document-registry';

export interface SyncSnapshotRecord {
	workspaceId: string;
	documentId: string;
	snapshotVersion: number;
	stateJson: string;
	headsJson: string;
	createdAt: string;
}

export interface SyncQueueRecord {
	workspaceId: string;
	documentId: string;
	pendingCount: number;
	bytes: number;
	retryAt: string | null;
	lastErrorCode: string | null;
	updatedAt: string;
}

export interface SyncStoredState {
	note: WorkspaceContentRecord | null;
	snapshot: SyncSnapshotRecord | null;
	queue: SyncQueueRecord | null;
}

export interface SyncOperationalStorageAdapter {
	readonly backend: SyncBackend;
	readonly databaseName: 'app.sqlite' | 'openbible-workspace';
	readonly content: WorkspaceContentRepository;
	ensureSchema(): Promise<{ backend: SyncBackend; schemaVersion: number }>;
	writeDocument(document: SyncDocumentRef): Promise<void>;
	readState(workspaceId: string, documentId: string): Promise<SyncStoredState>;
	writeSnapshot(snapshot: SyncSnapshotRecord): Promise<void>;
	appendChange(change: IndexedDbSyncChange): Promise<void>;
	readQueue(workspaceId: string, documentId: string): Promise<SyncQueueRecord | null>;
	writeQueue(queue: SyncQueueRecord): Promise<void>;
}

export interface NativeSyncOperationalPort {
	ensureSchema(): Promise<{ backend: 'sqlite'; databaseName: 'app.sqlite'; schemaVersion: number }>;
	writeDocument(document: SyncDocumentRef): Promise<void>;
	readState(workspaceId: string, documentId: string): Promise<SyncStoredState>;
	writeSnapshot(snapshot: SyncSnapshotRecord): Promise<void>;
	appendChange(change: IndexedDbSyncChange): Promise<void>;
	readQueue(workspaceId: string, documentId: string): Promise<SyncQueueRecord | null>;
	writeQueue(queue: SyncQueueRecord): Promise<void>;
}

function requireWorkspaceId(workspaceId: string): string {
	const normalized = workspaceId.trim();
	if (!normalized) throw new Error('workspace_id_required');
	return normalized;
}

function requireDocumentId(documentId: string): string {
	const normalized = documentId.trim();
	if (!normalized) throw new Error('document_id_required');
	return normalized;
}

function validateDocument(document: SyncDocumentRef): void {
	if (!document.workspaceId.trim()) throw new Error('workspace_id_required');
	if (!document.documentId.trim()) throw new Error('document_id_required');
	if (!document.backendRecordId.trim()) throw new Error('backend_record_id_required');
	if (!Number.isInteger(document.schemaVersion) || document.schemaVersion < 1) {
		throw new Error('sync_schema_version_invalid');
	}
}

function validateQueue(queue: SyncQueueRecord): void {
	requireWorkspaceId(queue.workspaceId);
	requireDocumentId(queue.documentId);
	if (!Number.isInteger(queue.pendingCount) || queue.pendingCount < 0) {
		throw new Error('sync_queue_count_invalid');
	}
	if (!Number.isInteger(queue.bytes) || queue.bytes < 0)
		throw new Error('sync_queue_bytes_invalid');
}

function toIndexedDbDocument(document: SyncDocumentRef): IndexedDbSyncDocument {
	return {
		workspaceId: document.workspaceId,
		documentId: document.documentId,
		kind: document.kind,
		backendRecordId: document.backendRecordId,
		...(document.exportRelativePath ? { exportRelativePath: document.exportRelativePath } : {}),
		schemaVersion: document.schemaVersion,
		status: document.pending ? 'pending' : 'clean',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

function toIndexedDbSnapshot(snapshot: SyncSnapshotRecord): IndexedDbSyncSnapshot {
	return { ...snapshot };
}

function toIndexedDbQueue(queue: SyncQueueRecord): IndexedDbSyncQueue {
	return { ...queue };
}

function isSyncSnapshot(value: unknown): value is IndexedDbSyncSnapshot {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<IndexedDbSyncSnapshot>;
	return (
		typeof candidate.workspaceId === 'string' &&
		typeof candidate.documentId === 'string' &&
		Number.isInteger(candidate.snapshotVersion) &&
		typeof candidate.stateJson === 'string' &&
		typeof candidate.headsJson === 'string' &&
		typeof candidate.createdAt === 'string'
	);
}

function isSyncQueue(value: unknown): value is IndexedDbSyncQueue {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<IndexedDbSyncQueue>;
	return (
		typeof candidate.workspaceId === 'string' &&
		typeof candidate.documentId === 'string' &&
		Number.isInteger(candidate.pendingCount) &&
		Number.isInteger(candidate.bytes) &&
		typeof candidate.updatedAt === 'string'
	);
}

export function createIndexedDbSyncStorageAdapter(
	context: WorkspaceContentContext,
	adapter: IndexedDbWorkspaceAdapter = createIndexedDbWorkspaceAdapter()
): SyncOperationalStorageAdapter {
	if (context.backend !== 'indexeddb') throw new Error('sync_backend_mismatch');
	const content = createIndexedDbContentRepository(adapter, context);

	return {
		backend: 'indexeddb',
		databaseName: INDEXEDDB_WORKSPACE_DATABASE,
		content,
		async ensureSchema(): Promise<IndexedDbSchemaStatus> {
			return adapter.ensureSchema();
		},
		async writeDocument(document) {
			validateDocument(document);
			await adapter.transaction(
				[INDEXEDDB_WORKSPACE_STORES.syncDocuments],
				'readwrite',
				(transaction) =>
					transaction
						.objectStore(INDEXEDDB_WORKSPACE_STORES.syncDocuments)
						.put(toIndexedDbDocument(document))
			);
		},
		async readState(workspaceId, documentId) {
			requireWorkspaceId(workspaceId);
			requireDocumentId(documentId);
			const [records, snapshots, queue] = await Promise.all([
				content.list(context),
				adapter.transaction([INDEXEDDB_WORKSPACE_STORES.syncSnapshots], 'readonly', (transaction) =>
					transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.syncSnapshots).getAll()
				),
				adapter.transaction([INDEXEDDB_WORKSPACE_STORES.syncQueue], 'readonly', (transaction) =>
					transaction
						.objectStore(INDEXEDDB_WORKSPACE_STORES.syncQueue)
						.get([workspaceId, documentId])
				)
			]);
			const snapshot =
				(Array.isArray(snapshots) ? snapshots : [])
					.filter(isSyncSnapshot)
					.filter(
						(candidate) =>
							candidate.workspaceId === workspaceId && candidate.documentId === documentId
					)
					.sort((left, right) => right.snapshotVersion - left.snapshotVersion)[0] ?? null;
			const note =
				records.find(
					(record) =>
						record.workspaceId === workspaceId && record.id === documentId && record.kind === 'note'
				) ?? null;
			return {
				note,
				snapshot,
				queue: isSyncQueue(queue) ? queue : null
			};
		},
		async writeSnapshot(snapshot) {
			requireWorkspaceId(snapshot.workspaceId);
			requireDocumentId(snapshot.documentId);
			if (!Number.isInteger(snapshot.snapshotVersion) || snapshot.snapshotVersion < 1) {
				throw new Error('sync_snapshot_version_invalid');
			}
			await adapter.transaction(
				[INDEXEDDB_WORKSPACE_STORES.syncSnapshots],
				'readwrite',
				(transaction) =>
					transaction
						.objectStore(INDEXEDDB_WORKSPACE_STORES.syncSnapshots)
						.put(toIndexedDbSnapshot(snapshot))
			);
		},
		async appendChange(change) {
			requireWorkspaceId(change.workspaceId);
			requireDocumentId(change.documentId);
			if (
				!change.changeId.trim() ||
				change.byteSize < 0 ||
				change.byteSize !== change.changeBlob.byteLength
			) {
				throw new Error('sync_change_invalid');
			}
			await adapter.transaction(
				[INDEXEDDB_WORKSPACE_STORES.syncChanges],
				'readwrite',
				(transaction) => transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.syncChanges).put(change)
			);
		},
		async readQueue(workspaceId, documentId) {
			const value = await adapter.transaction(
				[INDEXEDDB_WORKSPACE_STORES.syncQueue],
				'readonly',
				(transaction) =>
					transaction
						.objectStore(INDEXEDDB_WORKSPACE_STORES.syncQueue)
						.get([workspaceId, documentId])
			);
			return value && typeof value === 'object' ? (value as SyncQueueRecord) : null;
		},
		async writeQueue(queue) {
			validateQueue(queue);
			await adapter.transaction(
				[INDEXEDDB_WORKSPACE_STORES.syncQueue],
				'readwrite',
				(transaction) =>
					transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.syncQueue).put(toIndexedDbQueue(queue))
			);
		}
	};
}

export function createNativeSqliteSyncStorageAdapter(
	context: WorkspaceContentContext,
	contentPort: NativeWorkspaceContentPort,
	operationalPort: NativeSyncOperationalPort
): SyncOperationalStorageAdapter {
	if (context.backend !== 'sqlite') throw new Error('sync_backend_mismatch');
	return {
		backend: 'sqlite',
		databaseName: 'app.sqlite',
		content: createNativeSqliteContentRepository(context, contentPort),
		ensureSchema: () => operationalPort.ensureSchema(),
		writeDocument: (document) => {
			validateDocument(document);
			return operationalPort.writeDocument(document);
		},
		readState: (workspaceId, documentId) => operationalPort.readState(workspaceId, documentId),
		writeSnapshot: (snapshot) => operationalPort.writeSnapshot(snapshot),
		appendChange: (change) => operationalPort.appendChange(change),
		readQueue: (workspaceId, documentId) => operationalPort.readQueue(workspaceId, documentId),
		writeQueue: (queue) => {
			validateQueue(queue);
			return operationalPort.writeQueue(queue);
		}
	};
}

export function syncRecordFromContent(
	record: WorkspaceContentRecord,
	backend: SyncBackend
): SyncDocumentRef {
	return {
		documentId: record.id,
		workspaceId: record.workspaceId,
		kind: record.kind,
		backend,
		backendRecordId: record.id,
		schemaVersion: record.schemaVersion,
		pending: false
	};
}
