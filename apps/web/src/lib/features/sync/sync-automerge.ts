import * as Automerge from '@automerge/automerge';
import bs58check from 'bs58check';
import { Repo, type DocHandle, type DocumentId, type PeerId } from '@automerge/automerge-repo';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import type { WorkspaceStorage } from '$lib/storage/types';
import { isTauriRuntime } from '$lib/storage/tauri-runtime';
import { createNativeSqliteContentPort } from '$lib/storage/backup/backup-adapters';
import { createIndexedDbWorkspaceAdapter } from '$lib/storage/indexeddb-workspace-adapter';
import { invokeWorkspaceCommand } from '$lib/storage/tauri-bridge';
import {
	createIndexedDbSyncStorageAdapter,
	createNativeSqliteSyncStorageAdapter,
	type SyncOperationalStorageAdapter,
	type SyncStoredState
} from './sync-storage-adapters';
import { syncRecordFromContent } from './sync-storage-adapters';
import type { SyncDocumentRef } from './sync-document-registry';
import type {
	WorkspaceContentContext,
	WorkspaceContentRecord
} from '$lib/storage/workspace-content-repository';

type AutomergeWorkspaceDocument = {
	workspaceId: string;
	id: string;
	kind: 'note' | 'highlight';
	schemaVersion: number;
	payload: Record<string, unknown>;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string;
};

type DocumentProjection = {
	record: WorkspaceContentRecord;
	deletedAt?: string;
};

type SnapshotEnvelope = {
	format: 'automerge-repo-export-v1';
	data: string;
};

export interface SyncRuntimeDiagnostics {
	status: 'local' | 'connecting' | 'online' | 'retrying' | 'blocked';
	endpoint: string | null;
	lastSuccessAt: string | null;
	lastErrorCode: string | null;
}

interface RepoStorageAdapter {
	load(key: readonly string[]): Promise<Uint8Array | undefined>;
	save(key: readonly string[], data: Uint8Array): Promise<void>;
	remove(key: readonly string[]): Promise<void>;
	loadRange(prefix: readonly string[]): Promise<Array<{ key: string[]; data: Uint8Array }>>;
	removeRange(prefix: readonly string[]): Promise<void>;
}

class MemoryRepoStorage implements RepoStorageAdapter {
	private readonly values = new Map<string, Uint8Array>();

	private key(parts: readonly string[]): string {
		return JSON.stringify(parts);
	}

	async load(key: readonly string[]): Promise<Uint8Array | undefined> {
		const value = this.values.get(this.key(key));
		return value ? value.slice() : undefined;
	}

	async save(key: readonly string[], data: Uint8Array): Promise<void> {
		this.values.set(this.key(key), data.slice());
	}

	async remove(key: readonly string[]): Promise<void> {
		this.values.delete(this.key(key));
	}

	async loadRange(prefix: readonly string[]): Promise<Array<{ key: string[]; data: Uint8Array }>> {
		return [...this.values.entries()]
			.map(([serialized, data]) => ({
				key: JSON.parse(serialized) as string[],
				data: data.slice()
			}))
			.filter(({ key }) => prefix.every((part, index) => key[index] === part));
	}

	async removeRange(prefix: readonly string[]): Promise<void> {
		for (const serialized of this.values.keys()) {
			const key = JSON.parse(serialized) as string[];
			if (prefix.every((part, index) => key[index] === part)) this.values.delete(serialized);
		}
	}
}

function contextFor(storage: WorkspaceStorage): WorkspaceContentContext {
	return {
		workspaceId: storage.workspaceId ?? `local-${storage.kind}`,
		generation: 0,
		backend: storage.kind === 'native' ? 'sqlite' : 'indexeddb'
	};
}

function createMemorySyncStorage(context: WorkspaceContentContext): SyncOperationalStorageAdapter {
	const repo = new MemoryRepoStorage();
	const documentRecords = new Map<string, WorkspaceContentRecord>();
	const snapshots = new Map<string, SyncStoredState['snapshot']>();
	const queues = new Map<string, SyncStoredState['queue']>();
	const contentRepository = {
		backend: context.backend,
		write: async (record: WorkspaceContentRecord) => {
			documentRecords.set(`${record.kind}:${record.id}`, structuredClone(record));
		},
		list: async (activeContext: WorkspaceContentContext) =>
			[...documentRecords.values()]
				.filter((record) => record.workspaceId === activeContext.workspaceId)
				.map((record) => structuredClone(record)),
		remove: async (
			_activeContext: WorkspaceContentContext,
			kind: 'note' | 'highlight',
			id: string
		) => {
			documentRecords.delete(`${kind}:${id}`);
		},
		rebuild: async (activeContext: WorkspaceContentContext) => ({
			backend: activeContext.backend,
			workspaceId: activeContext.workspaceId,
			generation: activeContext.generation,
			projectionVersion: 1,
			status: 'ready' as const,
			records: [...documentRecords.values()].filter(
				(record) => record.workspaceId === activeContext.workspaceId
			)
		})
	};
	return {
		backend: context.backend,
		databaseName: context.backend === 'sqlite' ? 'app.sqlite' : 'openbible-workspace',
		content: contentRepository,
		ensureSchema: async () => ({ backend: context.backend, schemaVersion: 3 }),
		writeDocument: async () => undefined,
		readState: async (_workspaceId, documentId) => ({
			note: documentRecords.get(`note:${documentId}`) ?? null,
			snapshot: snapshots.get(documentId) ?? null,
			queue: queues.get(documentId) ?? null
		}),
		writeSnapshot: async (snapshot) => {
			snapshots.set(snapshot.documentId, structuredClone(snapshot));
		},
		appendChange: async (change) => {
			await repo.save(
				['changes', change.workspaceId, change.documentId, change.changeId],
				change.changeBlob
			);
		},
		readQueue: async (_workspaceId, documentId) => queues.get(documentId) ?? null,
		writeQueue: async (queue) => {
			queues.set(queue.documentId, structuredClone(queue));
		}
	};
}

function documentIdFor(workspaceId: string, kind: string, recordId: string): DocumentId {
	let hashA = 2166136261;
	let hashB = 2166136261;
	const input = `${workspaceId}\u0000${kind}\u0000${recordId}`;
	for (let index = 0; index < input.length; index += 1) {
		const code = input.charCodeAt(index);
		hashA = Math.imul(hashA ^ code, 16777619);
		hashB = Math.imul(hashB ^ (code + index), 16777619);
	}
	const words = [hashA, hashB, hashA ^ 0x9e3779b9, hashB ^ 0x7f4a7c15].map((value) =>
		(value >>> 0).toString(16).padStart(8, '0')
	);
	const hex = words.join('').slice(0, 32);
	const bytes = new Uint8Array(hex.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
	return bs58check.encode(bytes) as DocumentId;
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return globalThis.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
	const binary = globalThis.atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

function snapshotEnvelope(value: string): Uint8Array | null {
	try {
		const parsed = JSON.parse(value) as Partial<SnapshotEnvelope>;
		if (parsed.format !== 'automerge-repo-export-v1' || typeof parsed.data !== 'string')
			return null;
		return base64ToBytes(parsed.data);
	} catch {
		return null;
	}
}

function asDocument(record: WorkspaceContentRecord): AutomergeWorkspaceDocument {
	return {
		workspaceId: record.workspaceId,
		id: record.id,
		kind: record.kind,
		schemaVersion: record.schemaVersion,
		payload: cloneAutomergeValue(record.payload) as Record<string, unknown>,
		...(record.createdAt ? { createdAt: record.createdAt } : {}),
		...(record.updatedAt ? { updatedAt: record.updatedAt } : {})
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneAutomergeValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(cloneAutomergeValue);
	if (isRecord(value)) {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, nested]) => nested !== undefined)
				.map(([key, nested]) => [key, cloneAutomergeValue(nested)])
		);
	}
	return value;
}

function projectionFromDocument(document: unknown): DocumentProjection | null {
	if (!isRecord(document)) return null;
	if (
		typeof document.workspaceId !== 'string' ||
		typeof document.id !== 'string' ||
		(document.kind !== 'note' && document.kind !== 'highlight') ||
		!Number.isInteger(document.schemaVersion) ||
		!isRecord(document.payload)
	) {
		return null;
	}
	return {
		record: {
			workspaceId: document.workspaceId,
			id: document.id,
			kind: document.kind,
			schemaVersion: Number(document.schemaVersion),
			payload: structuredClone(document.payload),
			...(typeof document.createdAt === 'string' ? { createdAt: document.createdAt } : {}),
			...(typeof document.updatedAt === 'string' ? { updatedAt: document.updatedAt } : {})
		},
		...(typeof document.deletedAt === 'string' ? { deletedAt: document.deletedAt } : {})
	};
}

function updateDocument(
	target: AutomergeWorkspaceDocument,
	source: AutomergeWorkspaceDocument
): void {
	target.workspaceId = source.workspaceId;
	target.id = source.id;
	target.kind = source.kind;
	target.schemaVersion = source.schemaVersion;
	if (source.createdAt) target.createdAt = source.createdAt;
	else delete target.createdAt;
	if (source.updatedAt) target.updatedAt = source.updatedAt;
	else delete target.updatedAt;
	delete target.deletedAt;
	for (const key of Object.keys(target.payload)) {
		if (!(key in source.payload)) delete target.payload[key];
	}
	for (const [key, value] of Object.entries(source.payload)) {
		target.payload[key] = cloneAutomergeValue(value);
	}
}

function snapshotRecord(
	state: SyncStoredState,
	workspaceId: string,
	documentId: string,
	exported: Uint8Array,
	heads: string[]
) {
	return {
		workspaceId,
		documentId,
		snapshotVersion: (state.snapshot?.snapshotVersion ?? 0) + 1,
		stateJson: JSON.stringify({
			format: 'automerge-repo-export-v1',
			data: bytesToBase64(exported)
		} satisfies SnapshotEnvelope),
		headsJson: JSON.stringify(heads),
		createdAt: new Date().toISOString()
	};
}

export class SyncWorkspaceRuntime {
	readonly repo: Repo;
	readonly workspaceId: string;
	private readonly handles = new Map<string, DocHandle<AutomergeWorkspaceDocument>>();
	private readonly previousDocs = new Map<string, Automerge.Doc<AutomergeWorkspaceDocument>>();
	private readonly pendingPersistence = new Map<string, Promise<void>>();
	private readonly localMutations = new Set<string>();
	private readonly storage: SyncOperationalStorageAdapter;
	private remoteAdapter: WebSocketClientAdapter | null = null;
	private diagnosticsState: SyncRuntimeDiagnostics;

	constructor(
		storage: SyncOperationalStorageAdapter,
		workspaceId: string,
		options: { peerId?: string; endpoint?: string } = {}
	) {
		this.storage = storage;
		this.workspaceId = workspaceId;
		this.diagnosticsState = {
			status: options.endpoint ? 'connecting' : 'local',
			endpoint: options.endpoint ?? null,
			lastSuccessAt: null,
			lastErrorCode: null
		};
		if (options.endpoint) {
			if (!options.endpoint.startsWith('wss://')) {
				this.diagnosticsState = {
					...this.diagnosticsState,
					status: 'blocked',
					lastErrorCode: 'sync_endpoint_requires_tls'
				};
			} else {
				this.remoteAdapter = new WebSocketClientAdapter(options.endpoint);
			}
		}
		this.repo = new Repo({
			peerId: (options.peerId ?? `openbible-${workspaceId}`) as PeerId,
			storage: new MemoryRepoStorage(),
			network: this.remoteAdapter ? [this.remoteAdapter] : [],
			sharePolicy: async () => true
		});
		this.observeRemoteAdapter(this.remoteAdapter);
		void this.storage.ensureSchema();
		void this.connectNetwork();
		this.repo.on('document', ({ handle }) => {
			this.bindHandle(handle as DocHandle<AutomergeWorkspaceDocument>);
		});
	}

	private observeRemoteAdapter(adapter: WebSocketClientAdapter | null): void {
		adapter?.on('peer-candidate', () => {
			this.diagnosticsState = {
				...this.diagnosticsState,
				status: 'online',
				lastSuccessAt: new Date().toISOString(),
				lastErrorCode: null
			};
		});
		adapter?.on('close', () => {
			if (this.remoteAdapter) {
				this.diagnosticsState = {
					...this.diagnosticsState,
					status: 'retrying',
					lastErrorCode: 'sync_transport_closed'
				};
			}
		});
	}

	private async connectNetwork(): Promise<void> {
		if (!this.remoteAdapter) return;
		try {
			await this.repo.networkSubsystem.whenReady();
			if (this.diagnosticsState.status === 'connecting') return;
		} catch {
			this.diagnosticsState = {
				...this.diagnosticsState,
				status: 'retrying',
				lastErrorCode: 'sync_transport_unavailable'
			};
		}
	}

	async connect(endpoint: string, peerId?: string): Promise<SyncRuntimeDiagnostics> {
		const normalized = endpoint.trim();
		if (!normalized.startsWith('wss://')) {
			this.diagnosticsState = {
				...this.diagnosticsState,
				status: 'blocked',
				endpoint: normalized || null,
				lastErrorCode: 'sync_endpoint_requires_tls'
			};
			return this.diagnostics();
		}
		if (this.remoteAdapter) {
			this.repo.networkSubsystem.removeNetworkAdapter(this.remoteAdapter);
			this.remoteAdapter.disconnect();
		}
		this.remoteAdapter = new WebSocketClientAdapter(normalized);
		this.diagnosticsState = {
			...this.diagnosticsState,
			status: 'connecting',
			endpoint: normalized,
			lastErrorCode: null
		};
		this.observeRemoteAdapter(this.remoteAdapter);
		this.repo.networkSubsystem.addNetworkAdapter(this.remoteAdapter);
		this.repo.networkSubsystem.reconnect();
		void peerId;
		await this.connectNetwork();
		return this.diagnostics();
	}

	private bindHandle(handle: DocHandle<AutomergeWorkspaceDocument>): void {
		if (this.handles.has(handle.documentId)) return;
		this.handles.set(handle.documentId, handle);
		if (handle.isReady()) this.previousDocs.set(handle.documentId, handle.doc());
		handle.on('change', ({ doc }) => {
			const local = this.localMutations.has(handle.documentId);
			const task = this.persistHandle(handle, doc, local);
			this.pendingPersistence.set(handle.documentId, task);
			const clearPending = () => {
				if (this.pendingPersistence.get(handle.documentId) === task) {
					this.pendingPersistence.delete(handle.documentId);
				}
			};
			void task.then(clearPending, clearPending);
		});
	}

	private async importHandle(
		record: WorkspaceContentRecord,
		state: SyncStoredState
	): Promise<DocHandle<AutomergeWorkspaceDocument>> {
		const documentId = documentIdFor(record.workspaceId, record.kind, record.id);
		const saved = state.snapshot ? snapshotEnvelope(state.snapshot.stateJson) : null;
		const handle = saved
			? this.repo.import<AutomergeWorkspaceDocument>(saved, { docId: documentId })
			: this.repo.import<AutomergeWorkspaceDocument>(
					Automerge.save(Automerge.from(asDocument(record))),
					{
						docId: documentId
					}
				);
		handle.doneLoading();
		this.bindHandle(handle);
		this.previousDocs.set(handle.documentId, handle.doc());
		return handle;
	}

	async save(record: WorkspaceContentRecord): Promise<void> {
		if (record.workspaceId !== this.workspaceId) throw new Error('sync_workspace_mismatch');
		const state = await this.storage.readState(record.workspaceId, record.id);
		const handle =
			this.handles.get(documentIdFor(record.workspaceId, record.kind, record.id)) ??
			(await this.importHandle(record, state));
		const previousPersistence = this.pendingPersistence.get(handle.documentId);
		if (previousPersistence) await previousPersistence;
		this.localMutations.add(handle.documentId);
		try {
			handle.change((document) => updateDocument(document, asDocument(record)));
			await this.pendingPersistence.get(handle.documentId);
			if (!this.pendingPersistence.has(handle.documentId)) {
				await this.persistHandle(handle, handle.doc(), true);
			}
		} finally {
			this.localMutations.delete(handle.documentId);
		}
	}

	async hydrate(): Promise<void> {
		const context: WorkspaceContentContext = {
			workspaceId: this.workspaceId,
			generation: 0,
			backend: this.storage.backend
		};
		const records = await this.storage.content.list(context);
		for (const record of records) {
			if (!this.handles.has(documentIdFor(record.workspaceId, record.kind, record.id))) {
				const handle = await this.importHandle(
					record,
					await this.storage.readState(record.workspaceId, record.id)
				);
				const projection = projectionFromDocument(handle.doc());
				if (projection?.deletedAt) {
					await this.storage.content.remove(
						{
							workspaceId: this.workspaceId,
							generation: 0,
							backend: this.storage.backend
						},
						projection.record.kind,
						projection.record.id
					);
				}
			}
		}
	}

	async remove(record: WorkspaceContentRecord): Promise<void> {
		if (record.workspaceId !== this.workspaceId) throw new Error('sync_workspace_mismatch');
		const state = await this.storage.readState(record.workspaceId, record.id);
		const handle =
			this.handles.get(documentIdFor(record.workspaceId, record.kind, record.id)) ??
			(await this.importHandle(record, state));
		this.localMutations.add(handle.documentId);
		try {
			handle.change((document) => {
				document.deletedAt = new Date().toISOString();
			});
			await this.pendingPersistence.get(handle.documentId);
			if (!this.pendingPersistence.has(handle.documentId)) {
				await this.persistHandle(handle, handle.doc(), true);
			}
		} finally {
			this.localMutations.delete(handle.documentId);
		}
	}

	private async persistHandle(
		handle: DocHandle<AutomergeWorkspaceDocument>,
		document: AutomergeWorkspaceDocument,
		local: boolean
	): Promise<void> {
		const projection = projectionFromDocument(document);
		if (!projection || projection.record.workspaceId !== this.workspaceId) return;
		const record = projection.record;
		const previous = this.previousDocs.get(handle.documentId);
		const changes = previous ? Automerge.getChanges(previous, document) : [];
		this.previousDocs.set(handle.documentId, document);
		const state = await this.storage.readState(record.workspaceId, record.id);
		const exported = await this.repo.export(handle.documentId);
		if (!exported) return;
		if (local) {
			for (const change of changes) {
				const changeId = Automerge.decodeChange(change).hash;
				await this.storage.appendChange({
					workspaceId: record.workspaceId,
					documentId: record.id,
					changeId,
					changeBlob: change,
					byteSize: change.byteLength,
					applied: false,
					createdAt: new Date().toISOString()
				});
			}
		}
		const queue = state.queue ?? {
			workspaceId: record.workspaceId,
			documentId: record.id,
			pendingCount: 0,
			bytes: 0,
			retryAt: null,
			lastErrorCode: null,
			updatedAt: new Date().toISOString()
		};
		const pendingCount = local ? queue.pendingCount + changes.length : queue.pendingCount;
		const pendingBytes = local
			? queue.bytes + changes.reduce((total, change) => total + change.byteLength, 0)
			: queue.bytes;
		await this.storage.writeDocument({
			...syncRecordFromContent(record, this.storage.backend),
			pending: pendingCount > 0
		});
		await this.storage.writeSnapshot(
			snapshotRecord(state, record.workspaceId, record.id, exported, handle.heads())
		);
		await this.storage.writeQueue({
			...queue,
			pendingCount,
			bytes: pendingBytes,
			updatedAt: new Date().toISOString()
		});
		if (projection.deletedAt) {
			await this.storage.content.remove(
				{
					workspaceId: this.workspaceId,
					generation: 0,
					backend: this.storage.backend
				},
				record.kind,
				record.id
			);
		} else {
			await this.storage.content.write(record);
		}
		this.diagnosticsState = {
			...this.diagnosticsState,
			lastSuccessAt: new Date().toISOString(),
			lastErrorCode: null
		};
	}

	async disconnect(): Promise<void> {
		if (this.remoteAdapter) {
			this.repo.networkSubsystem.removeNetworkAdapter(this.remoteAdapter);
			this.remoteAdapter.disconnect();
			this.remoteAdapter = null;
		}
		this.diagnosticsState = { ...this.diagnosticsState, status: 'local', endpoint: null };
	}

	diagnostics(): SyncRuntimeDiagnostics {
		return { ...this.diagnosticsState };
	}
}

const runtimes = new WeakMap<WorkspaceStorage, SyncWorkspaceRuntime>();

function createOperationalStorage(storage: WorkspaceStorage): SyncOperationalStorageAdapter {
	const context = contextFor(storage);
	if (context.backend === 'sqlite' && isTauriRuntime()) {
		return createNativeSqliteSyncStorageAdapter(
			context,
			createNativeSqliteContentPort(),
			createNativeOperationalPort()
		);
	}
	if (context.backend === 'indexeddb' && typeof globalThis.indexedDB !== 'undefined') {
		return createIndexedDbSyncStorageAdapter(context, createIndexedDbWorkspaceAdapter());
	}
	return createMemorySyncStorage(context);
}

function createNativeOperationalPort() {
	return {
		ensureSchema: async () => {
			const result = await invokeWorkspaceCommand<{
				backend: 'sqlite';
				databaseName: 'app.sqlite';
				schemaVersion: number;
			}>({ name: 'database.initialize' });
			return result.value;
		},
		writeDocument: async (_document: SyncDocumentRef) => undefined,
		readState: async (workspaceId: string, documentId: string): Promise<SyncStoredState> => {
			const result = await invokeWorkspaceCommand<{
				note?: WorkspaceContentRecord | null;
				snapshot?: {
					snapshotVersion: number;
					state: unknown;
					heads: unknown;
				};
				queue?: {
					pendingCount: number;
					bytes: number;
					lastErrorCode: string | null;
				};
			}>({ name: 'sync.readState', workspaceId, noteId: documentId });
			const value = result.value;
			return {
				note: value?.note ?? null,
				snapshot: value?.snapshot
					? {
							workspaceId,
							documentId,
							snapshotVersion: value.snapshot.snapshotVersion,
							stateJson: JSON.stringify(value.snapshot.state ?? {}),
							headsJson: JSON.stringify(
								Array.isArray(value.snapshot.heads) ? value.snapshot.heads : []
							),
							createdAt: new Date().toISOString()
						}
					: null,
				queue: value?.queue
					? {
							workspaceId,
							documentId,
							pendingCount: value.queue.pendingCount,
							bytes: value.queue.bytes,
							retryAt: null,
							lastErrorCode: value.queue.lastErrorCode,
							updatedAt: new Date().toISOString()
						}
					: null
			};
		},
		writeSnapshot: async (snapshot: {
			workspaceId: string;
			documentId: string;
			snapshotVersion: number;
			stateJson: string;
			headsJson: string;
		}) => {
			const stateJson = JSON.parse(snapshot.stateJson) as Record<string, unknown>;
			const heads = JSON.parse(snapshot.headsJson) as string[];
			await invokeWorkspaceCommand({
				name: 'sync.writeSnapshot',
				workspaceId: snapshot.workspaceId,
				noteId: snapshot.documentId,
				snapshotVersion: snapshot.snapshotVersion,
				stateJson,
				heads
			});
		},
		appendChange: async (change: {
			workspaceId: string;
			documentId: string;
			changeId: string;
			changeBlob: Uint8Array;
		}) => {
			await invokeWorkspaceCommand({
				name: 'sync.appendChange',
				workspaceId: change.workspaceId,
				noteId: change.documentId,
				changeId: change.changeId,
				changeBlob: change.changeBlob
			});
		},
		readQueue: async (workspaceId: string, documentId: string) =>
			(await createNativeOperationalPort().readState(workspaceId, documentId)).queue,
		writeQueue: async () => undefined
	};
}

export function getSyncWorkspaceRuntime(
	storage: WorkspaceStorage,
	options: { peerId?: string; endpoint?: string } = {}
): SyncWorkspaceRuntime {
	const existing = runtimes.get(storage);
	if (existing) return existing;
	const runtime = new SyncWorkspaceRuntime(
		createOperationalStorage(storage),
		contextFor(storage).workspaceId,
		options
	);
	runtimes.set(storage, runtime);
	return runtime;
}

export function scopeSyncWorkspaceStorage(
	storage: WorkspaceStorage,
	workspaceId: string
): WorkspaceStorage {
	if (storage.workspaceId === workspaceId) return storage;
	const scoped = Object.create(storage) as WorkspaceStorage;
	scoped.workspaceId = workspaceId;
	return scoped;
}

export async function persistSyncRecord(
	storage: WorkspaceStorage,
	record: WorkspaceContentRecord
): Promise<void> {
	await getSyncWorkspaceRuntime(storage).save(record);
}

export async function removeSyncRecord(
	storage: WorkspaceStorage,
	record: WorkspaceContentRecord
): Promise<void> {
	await getSyncWorkspaceRuntime(storage).remove(record);
}

export async function connectSyncWorkspace(
	storage: WorkspaceStorage,
	endpoint: string,
	peerId?: string
): Promise<SyncRuntimeDiagnostics> {
	const runtime = getSyncWorkspaceRuntime(storage, { endpoint, peerId });
	await runtime.hydrate();
	return runtime.connect(endpoint, peerId);
}

export async function disconnectSyncWorkspace(storage: WorkspaceStorage): Promise<void> {
	await getSyncWorkspaceRuntime(storage).disconnect();
}
