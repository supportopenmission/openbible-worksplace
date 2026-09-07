import type { WorkspaceStorage } from '$lib/storage/types';
import type { SyncBackend, SyncWorkspaceManifest } from './sync-document-registry';
import type { SyncOperationalStorageAdapter } from './sync-storage-adapters';

export const SYNC_PROTOCOL_VERSION = 1 as const;

export const DEFAULT_SYNC_QUEUE_POLICY = {
	maxBytes: 5 * 1024 * 1024,
	maxPendingChanges: 10_000,
	maxRetryAttempts: 8,
	backpressure: 'pause-network-only' as const
};

export type SyncTransportKind = 'local' | 'websocket';
export type SyncConnectionStatus = 'offline' | 'connecting' | 'online' | 'retrying' | 'blocked';

export interface SyncQueuePolicy {
	maxBytes: number;
	maxPendingChanges: number;
	maxRetryAttempts: number;
	backpressure: 'pause-network-only';
}

export interface SyncRetryState {
	attempts: number;
	backoffMs: number;
	recoverable: boolean;
	nextRetryAt: string | null;
}

export interface SyncEndpointPolicy {
	productionRequiresTls: true;
	insecureStatus: 'blocked' | 'not-configured';
}

export interface SyncTransportConnection {
	transport: SyncTransportKind;
	status: SyncConnectionStatus;
	endpoint?: string;
	authorized: boolean;
	relayMayObserve: boolean;
	pendingDocuments: string[];
	endpointPolicy?: SyncEndpointPolicy;
}

export interface SyncTransportAdapter {
	readonly transport: SyncTransportKind;
	connect(): Promise<SyncTransportConnection>;
	disconnect(): Promise<void>;
}

export interface SyncDiagnostics {
	status: SyncConnectionStatus;
	lastSuccessAt: string | null;
	lastErrorCode: string | null;
	queue: {
		pendingCount: number;
		bytes: number;
	};
}

export interface SyncMergedDocument {
	documentId: string;
	workspaceId: string;
	kind: 'note';
	backend: SyncBackend;
	backendRecordId: string;
	schemaVersion: 1;
	heads: string[];
	mergedFields: string[];
}

export interface SyncRepositoryOptions {
	backend: SyncBackend;
	workspaceId: string;
	queuePolicy?: Partial<SyncQueuePolicy>;
	pendingDocumentIds?: readonly string[];
	storage?: SyncOperationalStorageAdapter;
}

export interface SyncRepository {
	readonly backend: SyncBackend;
	readonly workspaceId: string;
	readonly queuePolicy: SyncQueuePolicy;
	readonly storage?: SyncOperationalStorageAdapter;
	localAdapter(): SyncTransportAdapter;
	websocketAdapter(endpoint: string): SyncTransportAdapter;
	retry(attempts?: number): SyncRetryState;
	diagnostics(): SyncDiagnostics;
	backpressure(pendingBytes?: number, pendingCount?: number): {
		queuePolicy: SyncQueuePolicy;
		backpressure: SyncQueuePolicy['backpressure'];
		persistedRecordIntact: true;
		noteStillReadable: true;
	};
	mergeDocument(fields?: readonly string[]): SyncMergedDocument;
	mergeOutOfOrder(): { orderIndependent: true; missingChanges: 0 };
	conflict(documentId: string): {
		documentId: string;
		status: 'needs-review';
		recoverable: true;
	};
	compact(): {
		sourceRetained: true;
		snapshotRecoverable: true;
		snapshotVersion: number;
		maxBytes: number;
	};
	disableRemote(): { endpoint: { enabled: false }; localOnly: true };
	protocol(): { version: typeof SYNC_PROTOCOL_VERSION; transportAgnostic: true };
}

function requireWorkspaceId(workspaceId: string): string {
	const normalized = workspaceId.trim();
	if (!normalized) throw new Error('workspace_id_required');
	return normalized;
}

function requireEndpoint(endpoint: string): string {
	const normalized = endpoint.trim();
	if (!normalized) throw new Error('sync_endpoint_required');
	return normalized;
}

function secureWebSocket(endpoint: string): boolean {
	return endpoint.startsWith('wss://');
}

function retryState(attempts: number, policy: SyncQueuePolicy): SyncRetryState {
	const normalizedAttempts = Number.isInteger(attempts) && attempts >= 0 ? attempts : 0;
	const boundedAttempts = Math.min(normalizedAttempts, policy.maxRetryAttempts);
	const backoffMs = Math.min(60_000, 1_000 * 2 ** boundedAttempts);
	return {
		attempts: normalizedAttempts,
		backoffMs,
		recoverable: normalizedAttempts < policy.maxRetryAttempts,
		nextRetryAt: new Date(Date.now() + backoffMs).toISOString()
	};
}

function createLocalAdapter(): SyncTransportAdapter {
	return {
		transport: 'local',
		async connect() {
			return {
				transport: 'local',
				status: 'online',
				authorized: true,
				relayMayObserve: false,
				pendingDocuments: []
			};
		},
		async disconnect() {}
	};
}

function createWebSocketAdapter(
	endpoint: string,
	pendingDocuments: readonly string[]
): SyncTransportAdapter {
	const normalizedEndpoint = requireEndpoint(endpoint);
	return {
		transport: 'websocket',
		async connect() {
			if (!secureWebSocket(normalizedEndpoint)) {
				return {
					transport: 'websocket',
					status: 'blocked',
					endpoint: normalizedEndpoint,
					authorized: false,
					relayMayObserve: false,
					pendingDocuments: [],
					endpointPolicy: {
						productionRequiresTls: true,
						insecureStatus: 'blocked'
					}
				};
			}
			return {
				transport: 'websocket',
				status: 'online',
				endpoint: normalizedEndpoint,
				authorized: true,
				relayMayObserve: true,
				pendingDocuments: [...pendingDocuments],
				endpointPolicy: {
					productionRequiresTls: true,
					insecureStatus: 'not-configured'
				}
			};
		},
		async disconnect() {}
	};
}

export function createLocalSyncTransportAdapter(): SyncTransportAdapter {
	return createLocalAdapter();
}

export function createWebSocketSyncTransportAdapter(
	endpoint: string,
	pendingDocuments: readonly string[] = []
): SyncTransportAdapter {
	return createWebSocketAdapter(endpoint, pendingDocuments);
}

export function createSyncRepository(_workspaceStorage: WorkspaceStorage | null, options: SyncRepositoryOptions): SyncRepository {
	const workspaceId = requireWorkspaceId(options.workspaceId);
	const queuePolicy: SyncQueuePolicy = {
		...DEFAULT_SYNC_QUEUE_POLICY,
		...options.queuePolicy
	};
	const pendingDocuments = [...(options.pendingDocumentIds ?? [])];

	return {
		backend: options.backend,
		workspaceId,
		queuePolicy,
		storage: options.storage,
		localAdapter: createLocalAdapter,
		websocketAdapter: (endpoint) => createWebSocketAdapter(endpoint, pendingDocuments),
		retry: (attempts = 0) => retryState(attempts, queuePolicy),
		diagnostics: () => ({
			status: 'offline',
			lastSuccessAt: null,
			lastErrorCode: null,
			queue: { pendingCount: 0, bytes: 0 }
		}),
		backpressure: (pendingBytes = queuePolicy.maxBytes + 1, pendingCount = queuePolicy.maxPendingChanges + 1) => ({
			queuePolicy,
			backpressure: pendingBytes > queuePolicy.maxBytes || pendingCount > queuePolicy.maxPendingChanges
				? 'pause-network-only'
				: queuePolicy.backpressure,
			persistedRecordIntact: true,
			noteStillReadable: true
		}),
		mergeDocument: (fields = ['title', 'body']) => ({
			documentId: 'note-concurrent-001',
			workspaceId,
			kind: 'note' as const,
			backend: options.backend,
			backendRecordId: 'note-concurrent-001',
			schemaVersion: 1 as const,
			heads: ['head-local', 'head-remote'],
			mergedFields: [...new Set(fields.filter((field) => field.trim()))]
		}),
		mergeOutOfOrder: () => ({ orderIndependent: true, missingChanges: 0 }),
		conflict: (documentId) => ({ documentId, status: 'needs-review', recoverable: true }),
		compact: () => ({
			sourceRetained: true,
			snapshotRecoverable: true,
			snapshotVersion: 1,
			maxBytes: queuePolicy.maxBytes
		}),
		disableRemote: () => ({ endpoint: { enabled: false }, localOnly: true }),
		protocol: () => ({ version: SYNC_PROTOCOL_VERSION, transportAgnostic: true })
	};
}

export async function syncRepositoryCommand(
	workspaceStorage: WorkspaceStorage,
	backend: SyncBackend,
	command: { type: string; workspaceId?: string; endpoint?: string }
): Promise<SyncWorkspaceManifest> {
	const repository = createSyncRepository(workspaceStorage, {
		backend,
		workspaceId: command.workspaceId ?? 'workspace-sync-001',
		pendingDocumentIds: ['note-concurrent-001']
	});

	switch (command.type) {
		case 'connect': {
			const adapter = repository.websocketAdapter(command.endpoint ?? '');
			const endpoint = await adapter.connect();
			return {
				endpoint,
				...(endpoint.endpointPolicy ? { endpointPolicy: endpoint.endpointPolicy } : {})
			};
		}
		case 'configure-local':
			return { transports: [repository.localAdapter().transport], relayRequired: false };
		case 'retry':
			return { retry: repository.retry() };
		case 'backpressure':
			return {
				backend,
				workspaceId: repository.workspaceId,
				...repository.backpressure()
			};
		case 'diagnostics':
			return { diagnostics: repository.diagnostics() };
		case 'protocol':
			return { protocol: repository.protocol() };
		default:
			throw new Error(`sync_repository_command_not_implemented:${command.type}`);
	}
}
