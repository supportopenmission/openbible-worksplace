import type { WorkspaceStorage } from '../types';
import {
	INDEXEDDB_WORKSPACE_STORES,
	IndexedDbWorkspaceAdapter
} from '../indexeddb-workspace-adapter';
import {
	createWorkspaceContentRepository,
	type WorkspaceContentContext,
	type WorkspaceContentDriver,
	type WorkspaceContentRecord,
	type WorkspaceContentRepository
} from '../workspace-content-repository';
import { invokeWorkspaceCommand } from '../tauri-bridge';

type IndexedDbContentRow = {
	workspaceId: string;
	noteId?: string;
	highlightId?: string;
	noteType?: string;
	schemaVersion: number;
	payloadJson: string;
	createdAt: string;
	updatedAt: string;
};

function parsePayload(row: IndexedDbContentRow): Record<string, unknown> {
	try {
		const payload = JSON.parse(row.payloadJson) as unknown;
		if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) throw new Error('payload_not_object');
		return payload as Record<string, unknown>;
	} catch (error) {
		throw new Error('workspace_content_payload_invalid', { cause: error });
	}
}

function rowToRecord(row: IndexedDbContentRow, kind: 'note' | 'highlight'): WorkspaceContentRecord {
	const id = kind === 'note' ? row.noteId : row.highlightId;
	if (!id || !row.workspaceId) throw new Error('workspace_content_identity_invalid');
	return {
		kind,
		id,
		workspaceId: row.workspaceId,
		schemaVersion: row.schemaVersion,
		payload: parsePayload(row),
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

function recordToRow(record: WorkspaceContentRecord): IndexedDbContentRow {
	const timestamp = record.updatedAt ?? record.createdAt ?? new Date().toISOString();
	return {
		workspaceId: record.workspaceId,
		...(record.kind === 'note' ? { noteId: record.id, noteType: 'note' } : { highlightId: record.id }),
		schemaVersion: record.schemaVersion,
		payloadJson: JSON.stringify(record.payload),
		createdAt: record.createdAt ?? timestamp,
		updatedAt: timestamp
	};
}

async function listIndexedDbStore(
	adapter: IndexedDbWorkspaceAdapter,
	store: 'notes' | 'highlights',
	context: WorkspaceContentContext
): Promise<WorkspaceContentRecord[]> {
	const values = await adapter.transaction(
		[INDEXEDDB_WORKSPACE_STORES[store]],
		'readonly',
		(transaction) => transaction.objectStore(INDEXEDDB_WORKSPACE_STORES[store]).getAll()
	);
	if (!Array.isArray(values)) return [];
	return values
		.filter((value): value is IndexedDbContentRow => {
			if (typeof value !== 'object' || value === null) return false;
			const row = value as Partial<IndexedDbContentRow>;
			return row.workspaceId === context.workspaceId && typeof row.payloadJson === 'string';
		})
		.map((row) => rowToRecord(row, store === 'notes' ? 'note' : 'highlight'));
}

export function createIndexedDbContentDriver(adapter: IndexedDbWorkspaceAdapter): WorkspaceContentDriver {
	return {
		async write(record) {
			const store = record.kind === 'note'
				? INDEXEDDB_WORKSPACE_STORES.notes
				: INDEXEDDB_WORKSPACE_STORES.highlights;
			await adapter.transaction([store], 'readwrite', (transaction) =>
				transaction.objectStore(store).put(recordToRow(record))
			);
		},
		async list(context) {
			const [notes, highlights] = await Promise.all([
				listIndexedDbStore(adapter, 'notes', context),
				listIndexedDbStore(adapter, 'highlights', context)
			]);
			return [...notes, ...highlights].sort((left, right) => {
				const leftKey = `${left.kind}:${left.id}`;
				const rightKey = `${right.kind}:${right.id}`;
				return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
			});
		},
		async remove(context, kind, id) {
			const store = kind === 'note'
				? INDEXEDDB_WORKSPACE_STORES.notes
				: INDEXEDDB_WORKSPACE_STORES.highlights;
			await adapter.transaction([store], 'readwrite', (transaction) =>
				transaction.objectStore(store).delete([context.workspaceId, id])
			);
		}
	};
}

export function createIndexedDbContentRepository(
	adapter: IndexedDbWorkspaceAdapter,
	context: WorkspaceContentContext
): WorkspaceContentRepository {
	return createWorkspaceContentRepository(context, createIndexedDbContentDriver(adapter));
}

export interface NativeWorkspaceContentPort {
	listContent(workspaceId: string): Promise<WorkspaceContentRecord[]>;
	writeContent(record: WorkspaceContentRecord): Promise<void>;
	deleteContent?(workspaceId: string, kind: 'note' | 'highlight', id: string): Promise<void>;
}

export function createNativeSqliteContentPort(): NativeWorkspaceContentPort {
	return {
		async listContent(workspaceId) {
			const result = await invokeWorkspaceCommand<unknown[]>({ name: 'database.listContent', workspaceId });
			return Array.isArray(result.value) ? (result.value as WorkspaceContentRecord[]) : [];
		},
		async writeContent(record) {
			await invokeWorkspaceCommand({ name: 'database.writeContent', record });
		},
		async deleteContent(workspaceId, kind, id) {
			await invokeWorkspaceCommand({ name: 'database.deleteContent', workspaceId, kind, id });
		}
	};
}

export function createNativeSqliteContentDriver(port: NativeWorkspaceContentPort): WorkspaceContentDriver {
	return {
		write: (record) => port.writeContent(record),
		list: (context) => port.listContent(context.workspaceId),
		remove: async (context, kind, id) => {
			if (!port.deleteContent) throw new Error('workspace_content_delete_unavailable');
			await port.deleteContent(context.workspaceId, kind, id);
		}
	};
}

export function createNativeSqliteContentRepository(
	context: WorkspaceContentContext,
	port: NativeWorkspaceContentPort = createNativeSqliteContentPort()
): WorkspaceContentRepository {
	return createWorkspaceContentRepository(context, createNativeSqliteContentDriver(port));
}

export interface PhysicalBackupSink {
	write(path: string, bytes: Uint8Array): Promise<void>;
}

export function createWorkspaceStorageBackupSink(storage: WorkspaceStorage): PhysicalBackupSink {
	return {
		async write(path, bytes) {
			const segments = path.split('/');
			if (segments.length > 1) await storage.ensureDirectory(segments.slice(0, -1).join('/'));
			await storage.writeFile(path, bytes);
		}
	};
}
