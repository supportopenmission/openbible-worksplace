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
			| 'payload_limit_exceeded',
		message: string
	) {
		super(message);
		this.name = 'SyncCoreError';
	}
}

function payloadBytes(value: unknown): number {
	return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export async function applyPush(
	store: SyncStore,
	workspaceId: string,
	request: PushRequest,
	limits: PushLimits,
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

export async function pullChanges(
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
