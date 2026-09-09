import {
	getWorkspaceContentRepository,
	workspaceContentContext
} from '$lib/storage/workspace-content-storage';
import type {
	WorkspaceContentKind,
	WorkspaceContentRecord
} from '$lib/storage/workspace-content-repository';
import type { WorkspaceStorage } from '$lib/storage/types';
import { extractTitleFromMarkdown } from '$lib/features/notes/portable-markdown';

export interface HttpSyncSettings {
	endpoint: string;
	token: string;
	deviceId: string;
	fetcher?: typeof fetch;
}

interface HttpSyncOperation {
	deviceId: string;
	operationId: string;
	documentId: string;
	kind: WorkspaceContentKind;
	baseRevision: number;
	payload: Record<string, unknown> | null;
	deletedAt?: string | null;
}

interface HttpSyncChange {
	cursor: number;
	operationId: string;
	documentId: string;
	kind: WorkspaceContentKind;
	revision: number;
	payload: Record<string, unknown> | null;
	deletedAt: string | null;
	updatedAt: string;
	updatedBy: string;
	createdAt: string;
}

interface HttpSyncConflict {
	conflictId: number;
	operationId: string;
	documentId: string;
	baseRevision: number;
	currentRevision: number;
}

interface HttpSyncState {
	cursor: number;
	revisions: Record<string, number>;
	payloads: Record<string, string>;
	pending: Record<string, HttpSyncOperation>;
	conflicts: Record<string, HttpSyncConflict>;
}

export interface HttpSyncResult {
	cursor: number;
	accepted: number;
	conflicts: number;
	pulled: number;
}

export class HttpSyncError extends Error {
	constructor(
		readonly code: string,
		message: string,
		readonly status?: number
	) {
		super(message);
		this.name = 'HttpSyncError';
	}
}

const sessions = new Map<string, HttpSyncSettings>();
const running = new Map<string, Promise<HttpSyncResult>>();
const memoryStates = new Map<string, HttpSyncState>();
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
const DELETED_PAYLOAD = '__deleted__';

function isBrowserStorageAvailable(): boolean {
	return typeof globalThis.localStorage !== 'undefined';
}

function stateKey(workspaceId: string): string {
	return `openbible:sync-http-state:${workspaceId}`;
}

function emptyState(): HttpSyncState {
	return { cursor: 0, revisions: {}, payloads: {}, pending: {}, conflicts: {} };
}

function readState(workspaceId: string): HttpSyncState {
	const fallback = memoryStates.get(workspaceId) ?? emptyState();
	if (!isBrowserStorageAvailable()) return structuredClone(fallback);
	try {
		const parsed = JSON.parse(
			localStorage.getItem(stateKey(workspaceId)) ?? 'null'
		) as Partial<HttpSyncState> | null;
		if (!parsed || typeof parsed !== 'object') return structuredClone(fallback);
		return {
			cursor:
				typeof parsed.cursor === 'number' && Number.isInteger(parsed.cursor) && parsed.cursor >= 0
					? parsed.cursor
					: 0,
			revisions: parsed.revisions ?? {},
			payloads: parsed.payloads ?? {},
			pending: parsed.pending ?? {},
			conflicts: parsed.conflicts ?? {}
		};
	} catch {
		return structuredClone(fallback);
	}
}

function writeState(workspaceId: string, state: HttpSyncState): void {
	const snapshot = structuredClone(state);
	memoryStates.set(workspaceId, snapshot);
	if (!isBrowserStorageAvailable()) return;
	try {
		localStorage.setItem(stateKey(workspaceId), JSON.stringify(snapshot));
	} catch {
		// A restricted browser keeps sync progress in this process only.
	}
}

function keyFor(kind: WorkspaceContentKind, documentId: string): string {
	return `${kind}:${documentId}`;
}

function randomId(prefix: string): string {
	const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
	return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function getHttpSyncDeviceId(): string {
	const key = 'openbible:sync-device-id';
	if (isBrowserStorageAvailable()) {
		try {
			const current = localStorage.getItem(key);
			if (current) return current;
			const created = randomId('device');
			localStorage.setItem(key, created);
			return created;
		} catch {
			// Fall through to a process-local identifier.
		}
	}
	return randomId('device');
}

export function validateHttpSyncEndpoint(value: string): boolean {
	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' ||
			(url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'))
		);
	} catch {
		return false;
	}
}

export function configureHttpSync(workspaceId: string, settings: HttpSyncSettings | null): void {
	if (settings)
		sessions.set(workspaceId, { ...settings, endpoint: settings.endpoint.replace(/\/$/, '') });
	else sessions.delete(workspaceId);
}

function sanitizePayload(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sanitizePayload);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([key, nested]) => !FORBIDDEN_KEYS.has(key) && nested !== undefined)
				.map(([key, nested]) => [key, sanitizePayload(nested)])
		);
	}
	return value;
}

function payloadForRecord(record: WorkspaceContentRecord): Record<string, unknown> {
	return sanitizePayload(record.payload) as Record<string, unknown>;
}

function payloadFingerprint(payload: Record<string, unknown> | null): string {
	return payload === null ? DELETED_PAYLOAD : JSON.stringify(payload);
}

function toRecord(change: HttpSyncChange, workspaceId: string): WorkspaceContentRecord {
	const payload = change.payload ?? {};
	const rawMeta =
		payload.meta && typeof payload.meta === 'object' && !Array.isArray(payload.meta)
			? (payload.meta as Record<string, unknown>)
			: {};
	const body = typeof payload.body === 'string' ? payload.body : '';
	const title =
		typeof rawMeta.title === 'string' && rawMeta.title.trim()
			? rawMeta.title.trim()
			: extractTitleFromMarkdown(body) || 'Nova nota';
	const meta: Record<string, unknown> = {
		...rawMeta,
		id: typeof rawMeta.id === 'string' && rawMeta.id.trim() ? rawMeta.id.trim() : change.documentId,
		title,
		type: typeof rawMeta.type === 'string' && rawMeta.type.trim() ? rawMeta.type.trim() : 'note',
		createdAt:
			typeof rawMeta.createdAt === 'string' && rawMeta.createdAt
				? rawMeta.createdAt
				: change.createdAt ?? change.updatedAt,
		updatedAt:
			typeof rawMeta.updatedAt === 'string' && rawMeta.updatedAt
				? rawMeta.updatedAt
				: change.updatedAt
	};
	const schemaVersion = Number(payload.schemaVersion ?? meta.schemaVersion ?? 1);
	return {
		workspaceId,
		kind: change.kind,
		id: change.documentId,
		schemaVersion: Number.isInteger(schemaVersion) ? schemaVersion : 1,
		payload: {
			...payload,
			meta
		},
		createdAt: String(meta.createdAt),
		updatedAt: String(meta.updatedAt)
	};
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
	let body: unknown;
	try {
		body = await response.json();
	} catch {
		body = null;
	}
	if (!response.ok) {
		const error =
			body && typeof body === 'object' && 'error' in body ? String(body.error) : 'http_error';
		throw new HttpSyncError(
			error,
			`A API de sincronização respondeu ${response.status}.`,
			response.status
		);
	}
	if (!body || typeof body !== 'object')
		throw new HttpSyncError('invalid_response', 'Resposta de sync inválida.');
	return body as Record<string, unknown>;
}

async function push(
	workspaceId: string,
	settings: HttpSyncSettings,
	operations: HttpSyncOperation[]
): Promise<{
	accepted: Array<{ operationId: string; documentId: string; revision: number }>;
	conflicts: HttpSyncConflict[];
}> {
	const fetcher = settings.fetcher ?? fetch;
	const response = await fetcher(
		`${settings.endpoint.replace(/\/$/, '')}/v1/workspaces/${encodeURIComponent(workspaceId)}/sync/push`,
		{
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				...(settings.token ? { authorization: `Bearer ${settings.token}` } : {})
			},
			body: JSON.stringify({ operations })
		}
	);
	const body = await responseJson(response);
	return {
		accepted: Array.isArray(body.accepted)
			? (body.accepted as Array<{ operationId: string; documentId: string; revision: number }>)
			: [],
		conflicts: Array.isArray(body.conflicts) ? (body.conflicts as HttpSyncConflict[]) : []
	};
}

async function pull(
	workspaceId: string,
	settings: HttpSyncSettings,
	after: number
): Promise<{ changes: HttpSyncChange[]; nextCursor: number; hasMore: boolean }> {
	const fetcher = settings.fetcher ?? fetch;
	const response = await fetcher(
		`${settings.endpoint.replace(/\/$/, '')}/v1/workspaces/${encodeURIComponent(workspaceId)}/sync/pull?after=${after}&limit=50`,
		{
			headers: {
				accept: 'application/json',
				...(settings.token ? { authorization: `Bearer ${settings.token}` } : {})
			}
		}
	);
	const body = await responseJson(response);
	return {
		changes: Array.isArray(body.changes) ? (body.changes as HttpSyncChange[]) : [],
		nextCursor: Number.isInteger(body.nextCursor) ? Number(body.nextCursor) : after,
		hasMore: body.hasMore === true
	};
}

export async function queueHttpSyncTombstone(
	storage: WorkspaceStorage,
	kind: WorkspaceContentKind,
	documentId: string
): Promise<void> {
	const workspaceId = storage.workspaceId;
	if (!workspaceId) return;
	const state = readState(workspaceId);
	const key = keyFor(kind, documentId);
	if (!state.conflicts[key]) {
		state.pending[key] = {
			deviceId: getHttpSyncDeviceId(),
			operationId: randomId('operation'),
			documentId,
			kind,
			baseRevision: state.revisions[key] ?? 0,
			payload: null,
			deletedAt: new Date().toISOString()
		};
		writeState(workspaceId, state);
	}
}

export function scheduleHttpSync(storage: WorkspaceStorage): void {
	const workspaceId = storage.workspaceId;
	const settings = workspaceId ? sessions.get(workspaceId) : undefined;
	if (!workspaceId || !settings || running.has(workspaceId)) return;
	const promise = syncWorkspaceHttp(storage, settings).finally(() => running.delete(workspaceId));
	running.set(workspaceId, promise);
	void promise.catch(() => undefined);
}

export async function syncWorkspaceHttp(
	storage: WorkspaceStorage,
	settings: HttpSyncSettings
): Promise<HttpSyncResult> {
	const workspaceId = storage.workspaceId;
	if (!workspaceId) throw new HttpSyncError('workspace_id_required', 'workspaceId é obrigatório.');
	if (!validateHttpSyncEndpoint(settings.endpoint)) {
		throw new HttpSyncError('invalid_endpoint', 'Use um endpoint HTTPS seguro.');
	}

	const context = workspaceContentContext(storage);
	const repository = getWorkspaceContentRepository(storage, context);
	const state = readState(workspaceId);
	const records = await repository.list(context);

	for (const record of records) {
		const key = keyFor(record.kind, record.id);
		if (state.conflicts[key]) continue;
		const payload = payloadForRecord(record);
		if (state.payloads[key] !== payloadFingerprint(payload) && !state.pending[key]) {
			state.pending[key] = {
				deviceId: settings.deviceId,
				operationId: randomId('operation'),
				documentId: record.id,
				kind: record.kind,
				baseRevision: state.revisions[key] ?? 0,
				payload,
				deletedAt: null
			};
		}
	}

	writeState(workspaceId, state);
	const operations = Object.values(state.pending);
	let acceptedCount = 0;
	let conflictCount = Object.keys(state.conflicts).length;
	if (operations.length > 0) {
		const result = await push(workspaceId, settings, operations);
		const byOperation = new Map(operations.map((operation) => [operation.operationId, operation]));
		for (const accepted of result.accepted) {
			const operation = byOperation.get(accepted.operationId);
			if (!operation) continue;
			const key = keyFor(operation.kind, operation.documentId);
			state.revisions[key] = accepted.revision;
			state.payloads[key] = payloadFingerprint(operation.payload);
			delete state.pending[key];
			acceptedCount += 1;
		}
		for (const conflict of result.conflicts) {
			const operation = byOperation.get(conflict.operationId);
			if (!operation) continue;
			const key = keyFor(operation.kind, operation.documentId);
			state.conflicts[key] = conflict;
			delete state.pending[key];
			conflictCount += 1;
		}
		writeState(workspaceId, state);
	}

	let pulled = 0;
	let hasMore = true;
	while (hasMore) {
		const page = await pull(workspaceId, settings, state.cursor);
		for (const change of page.changes) {
			const key = keyFor(change.kind, change.documentId);
			const conflict = state.conflicts[key];
			if (!conflict) {
				state.revisions[key] = change.revision;
				state.payloads[key] = payloadFingerprint(change.payload);
				if (change.deletedAt || change.payload === null) {
					await repository.remove(context, change.kind, change.documentId);
				} else {
					await repository.write(toRecord(change, workspaceId));
				}
			}
			pulled += 1;
		}
		state.cursor = page.nextCursor;
		hasMore = page.hasMore;
		writeState(workspaceId, state);
	}

	if (typeof window !== 'undefined' && (pulled > 0 || acceptedCount > 0)) {
		window.dispatchEvent(
			new CustomEvent('openbible:workspace-content-changed', {
				detail: { workspaceId, pulled, accepted: acceptedCount }
			})
		);
	}

	return { cursor: state.cursor, accepted: acceptedCount, conflicts: conflictCount, pulled };
}
