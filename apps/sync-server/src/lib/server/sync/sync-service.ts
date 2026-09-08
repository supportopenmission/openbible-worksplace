import type { D1Database } from '@cloudflare/workers-types';

export type SyncDocumentKind = 'note' | 'highlight';

export interface SyncOperation {
	deviceId: string;
	operationId: string;
	documentId: string;
	kind: SyncDocumentKind;
	baseRevision: number;
	payload: Record<string, unknown> | null;
	deletedAt?: string | null;
}

export interface SyncDocument {
	workspaceId: string;
	documentId: string;
	kind: SyncDocumentKind;
	revision: number;
	payload: Record<string, unknown> | null;
	deletedAt: string | null;
	updatedAt: string;
	updatedBy: string;
}

export interface SyncChange extends SyncDocument {
	cursor: number;
	operationId: string;
	createdAt: string;
}

export interface SyncConflict {
	conflictId: number;
	workspaceId: string;
	documentId: string;
	operationId: string;
	baseRevision: number;
	currentRevision: number;
	deviceId: string;
	payload: Record<string, unknown> | null;
	deletedAt: string | null;
	createdAt: string;
}

export interface SyncStore {
	findChange(workspaceId: string, operationId: string): Promise<SyncChange | null>;
	findConflict(workspaceId: string, operationId: string): Promise<SyncConflict | null>;
	getDocument(workspaceId: string, documentId: string): Promise<SyncDocument | null>;
	appendChange(change: Omit<SyncChange, 'cursor'>): Promise<number>;
	putDocument(document: SyncDocument): Promise<void>;
	putConflict(conflict: Omit<SyncConflict, 'conflictId'>): Promise<number>;
	listChanges(workspaceId: string, afterCursor: number, limit: number): Promise<SyncChange[]>;
}

export interface PushRequest {
	operations: SyncOperation[];
}

export interface PushResult {
	accepted: Array<{
		operationId: string;
		documentId: string;
		revision: number;
		cursor: number;
		duplicate?: boolean;
	}>;
	conflicts: Array<{
		conflictId: number;
		operationId: string;
		documentId: string;
		baseRevision: number;
		currentRevision: number;
	}>;
	cursor: number;
}

export interface PushLimits {
	maxBatchSize: number;
	maxPayloadBytes: number;
}

export interface PullResult {
	changes: SyncChange[];
	nextCursor: number;
	hasMore: boolean;
}

export interface WorkspaceRecord {
	workspaceId: string;
	ownerId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

const DEFAULT_LIMITS: PushLimits = {
	maxBatchSize: 50,
	maxPayloadBytes: 256 * 1024
};

const ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const FORBIDDEN_KEYS = new Set([
	'path',
	'absolutePath',
	'filePath',
	'handle',
	'catalog',
	'indexSqlite',
	'credentials',
	'token'
]);

function clone<T>(value: T): T {
	return structuredClone(value);
}

function assertId(value: unknown, label: string): asserts value is string {
	if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
		throw new SyncCoreError('invalid_id', `${label} inválido.`);
	}
}

function assertSafePayload(
	value: unknown,
	keyPath = 'payload'
): asserts value is Record<string, unknown> | null {
	if (value === null) return;
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new SyncCoreError('invalid_payload', `${keyPath} deve ser um objeto ou nulo.`);
	}
	for (const [key, nested] of Object.entries(value)) {
		if (FORBIDDEN_KEYS.has(key)) {
			throw new SyncCoreError(
				'forbidden_payload_field',
				`${keyPath}.${key} não pode ser sincronizado.`
			);
		}
		if (nested && typeof nested === 'object') {
			assertSafePayload(nested, `${keyPath}.${key}`);
		}
	}
}

function assertOperation(operation: SyncOperation): void {
	if (!operation || typeof operation !== 'object') {
		throw new SyncCoreError('invalid_operation', 'Operação inválida.');
	}
	assertId(operation.deviceId, 'deviceId');
	assertId(operation.operationId, 'operationId');
	assertId(operation.documentId, 'documentId');
	if (operation.kind !== 'note' && operation.kind !== 'highlight') {
		throw new SyncCoreError('invalid_kind', 'kind inválido.');
	}
	if (!Number.isInteger(operation.baseRevision) || operation.baseRevision < 0) {
		throw new SyncCoreError('invalid_revision', 'baseRevision inválida.');
	}
	assertSafePayload(operation.payload);
	if (operation.deletedAt !== undefined && operation.deletedAt !== null) {
		if (typeof operation.deletedAt !== 'string' || !operation.deletedAt.trim()) {
			throw new SyncCoreError('invalid_deleted_at', 'deletedAt inválido.');
		}
	}
}

export class SyncCoreError extends Error {
	constructor(
		readonly code:
			| 'invalid_id'
			| 'invalid_operation'
			| 'invalid_kind'
			| 'invalid_revision'
			| 'invalid_payload'
			| 'forbidden_payload_field'
			| 'invalid_deleted_at'
			| 'batch_limit_exceeded'
			| 'payload_limit_exceeded'
			| 'invalid_name'
			| 'workspace_not_found',
		message: string
	) {
		super(message);
		this.name = 'SyncCoreError';
	}
}

export class SyncAuthError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'SyncAuthError';
	}
}

function payloadBytes(value: unknown): number {
	return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export async function applyPush(
	store: SyncStore,
	workspaceId: string,
	request: PushRequest,
	limits: PushLimits = DEFAULT_LIMITS,
	now: () => string = () => new Date().toISOString()
): Promise<PushResult> {
	assertId(workspaceId, 'workspaceId');
	if (!request || !Array.isArray(request.operations)) {
		throw new SyncCoreError('invalid_operation', 'operations deve ser uma lista.');
	}
	if (request.operations.length > limits.maxBatchSize) {
		throw new SyncCoreError('batch_limit_exceeded', 'O lote excede o limite configurado.');
	}
	if (payloadBytes(request) > limits.maxPayloadBytes) {
		throw new SyncCoreError('payload_limit_exceeded', 'O payload excede o limite configurado.');
	}

	const result: PushResult = { accepted: [], conflicts: [], cursor: 0 };
	for (const operation of request.operations) {
		assertOperation(operation);
		const previousChange = await store.findChange(workspaceId, operation.operationId);
		if (previousChange) {
			result.accepted.push({
				operationId: operation.operationId,
				documentId: previousChange.documentId,
				revision: previousChange.revision,
				cursor: previousChange.cursor,
				duplicate: true
			});
			result.cursor = Math.max(result.cursor, previousChange.cursor);
			continue;
		}
		const previousConflict = await store.findConflict(workspaceId, operation.operationId);
		if (previousConflict) {
			result.conflicts.push({
				conflictId: previousConflict.conflictId,
				operationId: operation.operationId,
				documentId: previousConflict.documentId,
				baseRevision: previousConflict.baseRevision,
				currentRevision: previousConflict.currentRevision
			});
			continue;
		}

		const current = await store.getDocument(workspaceId, operation.documentId);
		const currentRevision = current?.revision ?? 0;
		if (operation.baseRevision !== currentRevision) {
			const conflictId = await store.putConflict({
				workspaceId,
				documentId: operation.documentId,
				operationId: operation.operationId,
				baseRevision: operation.baseRevision,
				currentRevision,
				deviceId: operation.deviceId,
				payload: clone(operation.payload),
				deletedAt: operation.deletedAt ?? null,
				createdAt: now()
			});
			result.conflicts.push({
				conflictId,
				operationId: operation.operationId,
				documentId: operation.documentId,
				baseRevision: operation.baseRevision,
				currentRevision
			});
			continue;
		}

		const timestamp = now();
		const revision = currentRevision + 1;
		const document: SyncDocument = {
			workspaceId,
			documentId: operation.documentId,
			kind: operation.kind,
			revision,
			payload: clone(operation.payload),
			deletedAt: operation.deletedAt ?? null,
			updatedAt: timestamp,
			updatedBy: operation.deviceId
		};
		const cursor = await store.appendChange({
			...document,
			operationId: operation.operationId,
			createdAt: timestamp
		});
		await store.putDocument(document);
		result.accepted.push({
			operationId: operation.operationId,
			documentId: operation.documentId,
			revision,
			cursor
		});
		result.cursor = Math.max(result.cursor, cursor);
	}
	return result;
}

export async function pullChangesFromStore(
	store: SyncStore,
	workspaceId: string,
	afterCursor: number,
	limit: number
): Promise<PullResult> {
	assertId(workspaceId, 'workspaceId');
	if (!Number.isInteger(afterCursor) || afterCursor < 0) {
		throw new SyncCoreError('invalid_revision', 'Cursor inválido.');
	}
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
		throw new SyncCoreError('batch_limit_exceeded', 'limit deve estar entre 1 e 100.');
	}
	const changes = await store.listChanges(workspaceId, afterCursor, limit + 1);
	const hasMore = changes.length > limit;
	const visible = hasMore ? changes.slice(0, limit) : changes;
	return {
		changes: visible.map((change) => clone(change)),
		nextCursor: visible.at(-1)?.cursor ?? afterCursor,
		hasMore
	};
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
		updatedAt: String(row.updated_at ?? row.created_at ?? ''),
		updatedBy: String(row.updated_by ?? '')
	};
}

function parseD1Change(row: Record<string, unknown> | null): SyncChange | null {
	const document = parseD1Document(row);
	if (!document || !row) return null;
	return {
		...document,
		cursor: Number(row.cursor ?? row.id),
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

export class D1SyncStore implements SyncStore {
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
				change.payload ? JSON.stringify(change.payload) : null,
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
				document.payload ? JSON.stringify(document.payload) : null,
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
				(workspace_id, document_id, operation_id, base_revision, current_revision, device_id, payload_json, deleted_at, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				conflict.workspaceId,
				conflict.documentId,
				conflict.operationId,
				conflict.baseRevision,
				conflict.currentRevision,
				conflict.deviceId,
				conflict.payload ? JSON.stringify(conflict.payload) : null,
				conflict.deletedAt,
				conflict.createdAt
			)
			.run();
		return Number(result.meta.last_row_id);
	}

	async listChanges(workspaceId: string, afterCursor: number, limit: number): Promise<SyncChange[]> {
		const { results } = await this.db
			.prepare(
				`SELECT c.*, c.id AS cursor
				FROM sync_changes c
				WHERE workspace_id = ? AND id > ?
				ORDER BY id ASC
				LIMIT ?`
			)
			.bind(workspaceId, afterCursor, limit)
			.all<Record<string, unknown>>();

		return results
			.map((row) => parseD1Change(row))
			.filter((change): change is SyncChange => change !== null);
	}
}

export function createMemorySyncStore(): SyncStore {
	const documents = new Map<string, SyncDocument>();
	const changes: SyncChange[] = [];
	const conflicts: SyncConflict[] = [];
	let nextCursor = 1;
	let nextConflictId = 1;
	const key = (workspaceId: string, documentId: string) => `${workspaceId}\u0000${documentId}`;

	return {
		async findChange(workspaceId, operationId) {
			return clone(
				changes.find(
					(change) => change.workspaceId === workspaceId && change.operationId === operationId
				) ?? null
			);
		},
		async findConflict(workspaceId, operationId) {
			return clone(
				conflicts.find(
					(conflict) => conflict.workspaceId === workspaceId && conflict.operationId === operationId
				) ?? null
			);
		},
		async getDocument(workspaceId, documentId) {
			return clone(documents.get(key(workspaceId, documentId)) ?? null);
		},
		async appendChange(change) {
			const cursor = nextCursor++;
			changes.push({ ...clone(change), cursor });
			return cursor;
		},
		async putDocument(document) {
			documents.set(key(document.workspaceId, document.documentId), clone(document));
		},
		async putConflict(conflict) {
			const conflictId = nextConflictId++;
			conflicts.push({ ...clone(conflict), conflictId });
			return conflictId;
		},
		async listChanges(workspaceId, afterCursor, limit) {
			return clone(
				changes
					.filter((change) => change.workspaceId === workspaceId && change.cursor > afterCursor)
					.sort((left, right) => left.cursor - right.cursor)
					.slice(0, limit)
			);
		}
	};
}

// In-memory registry of workspaces for testing without D1
const memoryWorkspaces = new Map<string, WorkspaceRecord>();

export async function assertWorkspaceOwnership(
	d1: D1Database | undefined,
	workspaceId: string,
	userId: string
): Promise<WorkspaceRecord> {
	assertId(workspaceId, 'workspaceId');
	if (!userId) {
		throw new SyncAuthError(401, 'Usuário não autenticado.');
	}

	if (!d1) {
		const existing = memoryWorkspaces.get(workspaceId);
		if (!existing) {
			const now = new Date().toISOString();
			const created: WorkspaceRecord = {
				workspaceId,
				ownerId: userId,
				name: workspaceId,
				createdAt: now,
				updatedAt: now
			};
			memoryWorkspaces.set(workspaceId, created);
			return created;
		}
		if (existing.ownerId !== userId) {
			throw new SyncAuthError(403, 'Acesso negado: workspace pertence a outro usuário.');
		}
		return existing;
	}

	const row = await d1
		.prepare('SELECT * FROM sync_workspaces WHERE workspace_id = ? LIMIT 1')
		.bind(workspaceId)
		.first<Record<string, unknown>>();

	if (!row) {
		const now = new Date().toISOString();
		await d1
			.prepare(
				'INSERT INTO sync_workspaces (workspace_id, owner_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
			)
			.bind(workspaceId, userId, workspaceId, now, now)
			.run();

		return {
			workspaceId,
			ownerId: userId,
			name: workspaceId,
			createdAt: now,
			updatedAt: now
		};
	}

	if (String(row.owner_id) !== userId) {
		throw new SyncAuthError(403, 'Acesso negado: workspace pertence a outro usuário.');
	}

	return {
		workspaceId: String(row.workspace_id),
		ownerId: String(row.owner_id),
		name: String(row.name),
		createdAt: String(row.created_at),
		updatedAt: String(row.updated_at)
	};
}

export async function pushChanges(
	d1: D1Database | undefined,
	workspaceId: string,
	userId: string,
	request: PushRequest,
	limits?: PushLimits
): Promise<PushResult> {
	await assertWorkspaceOwnership(d1, workspaceId, userId);
	const store = d1 ? new D1SyncStore(d1) : createMemorySyncStore();
	const result = await applyPush(store, workspaceId, request, limits);

	const now = new Date().toISOString();
	if (d1) {
		await d1
			.prepare('UPDATE sync_workspaces SET updated_at = ? WHERE workspace_id = ?')
			.bind(now, workspaceId)
			.run();
	} else {
		const ws = memoryWorkspaces.get(workspaceId);
		if (ws) ws.updatedAt = now;
	}

	return result;
}

export async function pullChanges(
	d1: D1Database | undefined,
	workspaceId: string,
	userId: string,
	afterCursor: number,
	limit: number
): Promise<PullResult> {
	await assertWorkspaceOwnership(d1, workspaceId, userId);
	const store = d1 ? new D1SyncStore(d1) : createMemorySyncStore();
	return pullChangesFromStore(store, workspaceId, afterCursor, limit);
}

export async function listUserWorkspaces(
	d1: D1Database | undefined,
	userId: string
): Promise<{ workspaces: Array<{ workspaceId: string; name: string; createdAt: string; updatedAt: string }> }> {
	if (!userId) {
		throw new SyncAuthError(401, 'Usuário não autenticado.');
	}

	if (!d1) {
		const list = Array.from(memoryWorkspaces.values())
			.filter((ws) => ws.ownerId === userId)
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
			.map(({ workspaceId, name, createdAt, updatedAt }) => ({
				workspaceId,
				name,
				createdAt,
				updatedAt
			}));
		return { workspaces: list };
	}

	const { results } = await d1
		.prepare(
			'SELECT workspace_id, name, created_at, updated_at FROM sync_workspaces WHERE owner_id = ? ORDER BY updated_at DESC'
		)
		.bind(userId)
		.all<Record<string, unknown>>();

	return {
		workspaces: results.map((row) => ({
			workspaceId: String(row.workspace_id),
			name: String(row.name),
			createdAt: String(row.created_at),
			updatedAt: String(row.updated_at)
		}))
	};
}

export async function bindWorkspace(
	d1: D1Database | undefined,
	workspaceId: string,
	userId: string,
	name?: string
): Promise<{ workspaceId: string; name: string; bound: boolean }> {
	assertId(workspaceId, 'workspaceId');
	if (!userId) {
		throw new SyncAuthError(401, 'Usuário não autenticado.');
	}

	const wsName = name || workspaceId;
	const now = new Date().toISOString();

	if (!d1) {
		const existing = memoryWorkspaces.get(workspaceId);
		if (!existing) {
			memoryWorkspaces.set(workspaceId, {
				workspaceId,
				ownerId: userId,
				name: wsName,
				createdAt: now,
				updatedAt: now
			});
			return { workspaceId, name: wsName, bound: true };
		}
		if (existing.ownerId !== userId) {
			throw new SyncAuthError(403, 'Acesso negado: workspace pertence a outro usuário.');
		}
		if (name && name.trim() && name.trim() !== existing.name) {
			existing.name = name.trim();
			existing.updatedAt = now;
			return { workspaceId, name: existing.name, bound: true };
		}
		return { workspaceId, name: existing.name, bound: true };
	}

	const existing = await d1
		.prepare('SELECT * FROM sync_workspaces WHERE workspace_id = ? LIMIT 1')
		.bind(workspaceId)
		.first<Record<string, unknown>>();

	if (!existing) {
		await d1
			.prepare(
				'INSERT INTO sync_workspaces (workspace_id, owner_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
			)
			.bind(workspaceId, userId, wsName, now, now)
			.run();
		return { workspaceId, name: wsName, bound: true };
	}

	if (String(existing.owner_id) !== userId) {
		throw new SyncAuthError(403, 'Acesso negado: workspace pertence a outro usuário.');
	}

	if (name && name.trim() && name.trim() !== String(existing.name)) {
		const newName = name.trim();
		await d1
			.prepare('UPDATE sync_workspaces SET name = ?, updated_at = ? WHERE workspace_id = ? AND owner_id = ?')
			.bind(newName, now, workspaceId, userId)
			.run();
		return { workspaceId, name: newName, bound: true };
	}

	return { workspaceId, name: String(existing.name), bound: true };
}

export async function renameWorkspace(
	d1: D1Database | undefined,
	workspaceId: string,
	userId: string,
	name: string
): Promise<{ workspaceId: string; name: string }> {
	assertId(workspaceId, 'workspaceId');
	if (!userId) {
		throw new SyncAuthError(401, 'Usuário não autenticado.');
	}
	const trimmed = name.trim();
	if (!trimmed) {
		throw new SyncCoreError('invalid_name', 'Nome do workspace não pode ser vazio.');
	}
	const now = new Date().toISOString();

	if (!d1) {
		const existing = memoryWorkspaces.get(workspaceId);
		if (!existing) {
			throw new SyncCoreError('workspace_not_found', 'Workspace não encontrado.');
		}
		if (existing.ownerId !== userId) {
			throw new SyncAuthError(403, 'Acesso negado: workspace pertence a outro usuário.');
		}
		existing.name = trimmed;
		existing.updatedAt = now;
		return { workspaceId, name: trimmed };
	}

	const existing = await d1
		.prepare('SELECT * FROM sync_workspaces WHERE workspace_id = ? LIMIT 1')
		.bind(workspaceId)
		.first<Record<string, unknown>>();

	if (!existing) {
		throw new SyncCoreError('workspace_not_found', 'Workspace não encontrado.');
	}
	if (String(existing.owner_id) !== userId) {
		throw new SyncAuthError(403, 'Acesso negado: workspace pertence a outro usuário.');
	}

	await d1
		.prepare('UPDATE sync_workspaces SET name = ?, updated_at = ? WHERE workspace_id = ? AND owner_id = ?')
		.bind(trimmed, now, workspaceId, userId)
		.run();

	return { workspaceId, name: trimmed };
}

export async function deleteWorkspace(
	d1: D1Database | undefined,
	workspaceId: string,
	userId: string
): Promise<{ deleted: boolean }> {
	assertId(workspaceId, 'workspaceId');
	if (!userId) {
		throw new SyncAuthError(401, 'Usuário não autenticado.');
	}

	if (!d1) {
		const existing = memoryWorkspaces.get(workspaceId);
		if (!existing) {
			return { deleted: false };
		}
		if (existing.ownerId !== userId) {
			throw new SyncAuthError(403, 'Acesso negado: workspace pertence a outro usuário.');
		}
		memoryWorkspaces.delete(workspaceId);
		return { deleted: true };
	}

	const existing = await d1
		.prepare('SELECT * FROM sync_workspaces WHERE workspace_id = ? LIMIT 1')
		.bind(workspaceId)
		.first<Record<string, unknown>>();

	if (!existing) {
		return { deleted: false };
	}
	if (String(existing.owner_id) !== userId) {
		throw new SyncAuthError(403, 'Acesso negado: workspace pertence a outro usuário.');
	}

	await d1.prepare('DELETE FROM sync_changes WHERE workspace_id = ?').bind(workspaceId).run();
	await d1.prepare('DELETE FROM sync_conflicts WHERE workspace_id = ?').bind(workspaceId).run();
	await d1.prepare('DELETE FROM sync_documents WHERE workspace_id = ?').bind(workspaceId).run();
	await d1.prepare('DELETE FROM sync_workspaces WHERE workspace_id = ? AND owner_id = ?').bind(workspaceId, userId).run();

	return { deleted: true };
}
