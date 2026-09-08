import type { D1Database } from '@cloudflare/workers-types';
import {
	applyPush,
	pullChanges,
	SyncCoreError,
	type SyncChange,
	type SyncConflict,
	type SyncDocument,
	type SyncOperation,
	type SyncStore
} from './sync-core';

export interface Env {
	DB: D1Database;
	SYNC_TOKEN?: string;
	MAX_BATCH_SIZE?: string;
	MAX_PAYLOAD_BYTES?: string;
}

interface ApiConfig {
	store: SyncStore;
	token?: string;
	maxBatchSize?: number;
	maxPayloadBytes?: number;
}

const DEFAULT_MAX_BATCH_SIZE = 50;
const DEFAULT_MAX_PAYLOAD_BYTES = 256 * 1024;

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
	const body = status === 204 || status === 205 || status === 304 ? null : JSON.stringify(data);
	return new Response(body, {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'access-control-allow-origin': '*',
			'access-control-allow-headers': 'authorization, content-type',
			'access-control-allow-methods': 'GET, POST, OPTIONS',
			...headers
		}
	});
}

function errorResponse(error: unknown): Response {
	if (error instanceof SyncCoreError) {
		const status =
			error.code === 'batch_limit_exceeded' || error.code === 'payload_limit_exceeded' ? 413 : 400;
		return json({ error: error.code, message: error.message }, status);
	}
	return json({ error: 'internal_error', message: 'Falha ao processar a sincronização.' }, 500);
}

function idFromPath(value: string): string {
	return decodeURIComponent(value);
}

function parsePositiveInteger(value: string | null, fallback: number): number {
	if (value === null || value === '') return fallback;
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function numberEnv(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseD1Document(row: Record<string, unknown> | null): SyncDocument | null {
	if (!row) return null;
	return {
		workspaceId: String(row.workspace_id),
		documentId: String(row.document_id),
		kind: row.kind === 'highlight' ? 'highlight' : 'note',
		revision: Number(row.revision),
		payload: row.payload_json
			? (JSON.parse(String(row.payload_json)) as Record<string, unknown>)
			: null,
		deletedAt: row.deleted_at ? String(row.deleted_at) : null,
		updatedAt: String(row.updated_at),
		updatedBy: String(row.updated_by)
	};
}

function parseD1Change(row: Record<string, unknown> | null): SyncChange | null {
	const document = parseD1Document(row);
	if (!document || !row) return null;
	return {
		...document,
		cursor: Number(row.cursor),
		operationId: String(row.operation_id),
		createdAt: String(row.created_at)
	};
}

function parseD1Conflict(row: Record<string, unknown> | null): SyncConflict | null {
	if (!row) return null;
	return {
		conflictId: Number(row.conflict_id ?? row.id),
		workspaceId: String(row.workspace_id),
		documentId: String(row.document_id),
		operationId: String(row.operation_id),
		baseRevision: Number(row.base_revision),
		currentRevision: Number(row.current_revision),
		deviceId: String(row.device_id),
		payload: row.payload_json
			? (JSON.parse(String(row.payload_json)) as Record<string, unknown>)
			: null,
		deletedAt: row.deleted_at ? String(row.deleted_at) : null,
		createdAt: String(row.created_at)
	};
}

class D1SyncStore implements SyncStore {
	constructor(private readonly db: D1Database) {}

	async findChange(workspaceId: string, operationId: string): Promise<SyncChange | null> {
		const row = await this.db
			.prepare(
				'SELECT c.*, c.id AS cursor FROM sync_changes c WHERE workspace_id = ? AND operation_id = ? LIMIT 1'
			)
			.bind(workspaceId, operationId)
			.first<Record<string, unknown>>();
		return parseD1Change(row);
	}

	async findConflict(workspaceId: string, operationId: string): Promise<SyncConflict | null> {
		const row = await this.db
			.prepare('SELECT * FROM sync_conflicts WHERE workspace_id = ? AND operation_id = ? LIMIT 1')
			.bind(workspaceId, operationId)
			.first<Record<string, unknown>>();
		return parseD1Conflict(row);
	}

	async getDocument(workspaceId: string, documentId: string): Promise<SyncDocument | null> {
		const row = await this.db
			.prepare('SELECT * FROM sync_documents WHERE workspace_id = ? AND document_id = ? LIMIT 1')
			.bind(workspaceId, documentId)
			.first<Record<string, unknown>>();
		return parseD1Document(row);
	}

	async appendChange(change: Omit<SyncChange, 'cursor'>): Promise<number> {
		const result = await this.db
			.prepare(
				`INSERT INTO sync_changes
				(workspace_id, document_id, kind, revision, operation_id, payload_json, deleted_at, updated_by, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				change.workspaceId,
				change.documentId,
				change.kind,
				change.revision,
				change.operationId,
				change.payload === null ? null : JSON.stringify(change.payload),
				change.deletedAt,
				change.updatedBy,
				change.createdAt
			)
			.run();
		return Number(result.meta.last_row_id);
	}

	async putDocument(document: SyncDocument): Promise<void> {
		await this.db
			.prepare(
				`INSERT INTO sync_documents
				(workspace_id, document_id, kind, revision, payload_json, deleted_at, updated_at, updated_by)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				ON CONFLICT(workspace_id, document_id) DO UPDATE SET
				kind = excluded.kind,
				revision = excluded.revision,
				payload_json = excluded.payload_json,
				deleted_at = excluded.deleted_at,
				updated_at = excluded.updated_at,
				updated_by = excluded.updated_by`
			)
			.bind(
				document.workspaceId,
				document.documentId,
				document.kind,
				document.revision,
				document.payload === null ? null : JSON.stringify(document.payload),
				document.deletedAt,
				document.updatedAt,
				document.updatedBy
			)
			.run();
	}

	async putConflict(conflict: Omit<SyncConflict, 'conflictId'>): Promise<number> {
		const result = await this.db
			.prepare(
				`INSERT INTO sync_conflicts
				(workspace_id, document_id, operation_id, base_revision, current_revision, payload_json, deleted_at, device_id, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				conflict.workspaceId,
				conflict.documentId,
				conflict.operationId,
				conflict.baseRevision,
				conflict.currentRevision,
				conflict.payload === null ? null : JSON.stringify(conflict.payload),
				conflict.deletedAt,
				conflict.deviceId,
				conflict.createdAt
			)
			.run();
		return Number(result.meta.last_row_id);
	}

	async listChanges(
		workspaceId: string,
		afterCursor: number,
		limit: number
	): Promise<SyncChange[]> {
		const result = await this.db
			.prepare(
				`SELECT c.*, c.id AS cursor
				 FROM sync_changes c
				 WHERE c.workspace_id = ? AND c.id > ?
				 ORDER BY c.id ASC
				 LIMIT ?`
			)
			.bind(workspaceId, afterCursor, limit)
			.all<Record<string, unknown>>();
		return result.results
			.map(parseD1Change)
			.filter((change): change is SyncChange => change !== null);
	}
}

export function createSyncApi(config: ApiConfig): { fetch(request: Request): Promise<Response> } {
	const maxBatchSize = config.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
	const maxPayloadBytes = config.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES;

	return {
		async fetch(request) {
			if (request.method === 'OPTIONS') return json(null, 204);
			const url = new URL(request.url);
			if (url.pathname === '/health' && request.method === 'GET') {
				return json({ ok: true, service: 'openbible-sync-api', version: 1 });
			}
			if (!url.pathname.startsWith('/v1/workspaces/')) return json({ error: 'not_found' }, 404);
			if (config.token && request.headers.get('authorization') !== `Bearer ${config.token}`) {
				return json({ error: 'unauthorized' }, 401);
			}

			const match = /^\/v1\/workspaces\/([^/]+)\/sync\/(push|pull)$/.exec(url.pathname);
			if (!match) return json({ error: 'not_found' }, 404);
			const workspaceId = idFromPath(match[1]);
			try {
				if (match[2] === 'pull' && request.method === 'GET') {
					const after = parsePositiveInteger(url.searchParams.get('after'), 0);
					const limit = parsePositiveInteger(url.searchParams.get('limit'), 50);
					if (!Number.isInteger(after) || !Number.isInteger(limit)) {
						return json({ error: 'invalid_cursor' }, 400);
					}
					return json(await pullChanges(config.store, workspaceId, after, limit));
				}
				if (match[2] === 'push' && request.method === 'POST') {
					const body = await request.text();
					if (new TextEncoder().encode(body).byteLength > maxPayloadBytes) {
						return json({ error: 'payload_limit_exceeded' }, 413);
					}
					const payload = JSON.parse(body) as { operations: SyncOperation[] };
					return json(
						await applyPush(config.store, workspaceId, payload, {
							maxBatchSize,
							maxPayloadBytes
						})
					);
				}
				return json({ error: 'method_not_allowed' }, 405);
			} catch (error) {
				return errorResponse(error);
			}
		}
	};
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return createSyncApi({
			store: new D1SyncStore(env.DB),
			token: env.SYNC_TOKEN,
			maxBatchSize: numberEnv(env.MAX_BATCH_SIZE, DEFAULT_MAX_BATCH_SIZE),
			maxPayloadBytes: numberEnv(env.MAX_PAYLOAD_BYTES, DEFAULT_MAX_PAYLOAD_BYTES)
		}).fetch(request);
	}
};
