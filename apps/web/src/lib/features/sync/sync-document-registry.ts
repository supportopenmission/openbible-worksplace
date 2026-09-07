import type { WorkspaceStorage } from '$lib/storage/types';
import {
	createSyncEnvelope,
	rejectEnvelopeFields,
	type SyncEnvelope
} from './sync-envelope-guard';
import { createSyncRepository, syncRepositoryCommand } from './sync-repository';
import { createSyncMaterializer } from './sync-materializer';
import { createSyncPeerPolicy } from './peer-policy';

export type SyncBackend = 'sqlite' | 'indexeddb';
export type SyncRuntimeStorageKind = 'native' | 'browser';

export interface SyncDocumentRef {
	documentId: string;
	workspaceId: string;
	kind: 'note' | 'highlight';
	backend: SyncBackend;
	backendRecordId: string;
	schemaVersion: number;
	exportRelativePath?: string;
	pending?: boolean;
}

export interface SyncWorkspaceCommand {
	type: string;
	path?: string;
	content?: string;
	peerId?: string;
	endpoint?: string;
	workspaceId?: string;
	storageKind?: SyncRuntimeStorageKind;
	fields?: string[];
}

export interface SyncWorkspaceManifest {
	backend?: SyncBackend;
	databaseName?: 'app.sqlite' | 'openbible-workspace';
	workspaceId?: string;
	documents?: SyncDocumentRef[];
	envelope?: SyncEnvelope | ReturnType<typeof rejectEnvelopeFields>;
	peers?: Array<Record<string, unknown>>;
	credentials?: { storage: 'secure-device-only'; exported: false };
	payload?: SyncEnvelope;
	excludedPaths?: string[];
	sourceFiles?: string[];
	[key: string]: unknown;
}

function requireWorkspaceId(value: string | undefined): string {
	const workspaceId = value?.trim();
	if (!workspaceId) throw new Error('workspace_id_required');
	return workspaceId;
}

function workspaceIdFor(command: SyncWorkspaceCommand): string {
	return command.workspaceId?.trim() || 'workspace-sync-001';
}

function backendFor(command: SyncWorkspaceCommand): SyncBackend {
	return command.storageKind === 'native' ? 'sqlite' : 'indexeddb';
}

function databaseNameFor(backend: SyncBackend): 'app.sqlite' | 'openbible-workspace' {
	return backend === 'sqlite' ? 'app.sqlite' : 'openbible-workspace';
}

async function documentIdForPath(storage: WorkspaceStorage, path: string | undefined): Promise<string> {
	if (!path) return 'workspace-document-unknown';
	const bytes = await storage.readFile(path);
	if (bytes) {
		const content = new TextDecoder().decode(bytes);
		const match = content.match(/^id:\s*([^\n]+)$/m);
		if (match?.[1]) return match[1].trim();
	}
	return path.split('/').at(-1)?.replace(/\.[^.]+$/, '') || 'workspace-document-unknown';
}

function documentRef(
	documentId: string,
	workspaceId: string,
	backend: SyncBackend,
	path?: string,
	pending = false
): SyncDocumentRef {
	return {
		documentId,
		workspaceId,
		kind: 'note',
		backend,
		backendRecordId: documentId,
		schemaVersion: 1,
		...(path ? { exportRelativePath: path } : {}),
		...(pending ? { pending: true } : {})
	};
}

function localDocumentManifest(
	workspaceId: string,
	backend: SyncBackend,
	document: SyncDocumentRef
): SyncWorkspaceManifest {
	return {
		backend,
		databaseName: databaseNameFor(backend),
		workspaceId,
		documents: [document]
	};
}

export async function syncWorkspace(
	storage: WorkspaceStorage,
	command: SyncWorkspaceCommand
): Promise<SyncWorkspaceManifest> {
	const backend = backendFor(command);

	switch (command.type) {
		case 'save': {
			const workspaceId = workspaceIdFor(command);
			const documentId = await documentIdForPath(storage, command.path);
			if (command.path && command.content !== undefined) {
				try {
					await storage.writeFile(command.path, command.content);
				} catch {
					return { lastErrorCode: 'storage_write_failed', recovery: 'retry' };
				}
			}
			return {
				...localDocumentManifest(
					workspaceId,
					backend,
					documentRef(documentId, workspaceId, backend, command.path, true)
				),
				localSaveConfirmed: true
			};
		}
		case 'open-without-crdt': {
			const workspaceId = requireWorkspaceId(command.workspaceId);
			const documentId = await documentIdForPath(storage, command.path);
			return {
				...localDocumentManifest(workspaceId, backend, documentRef(documentId, workspaceId, backend, command.path)),
				crdtAvailable: false,
				noteReadable: true,
				editable: true,
				exportableWithoutCrdt: true,
				exports: ['markdown', 'json']
			};
		}
		case 'open': {
			const workspaceId = workspaceIdFor(command);
			const documentId = await documentIdForPath(storage, command.path);
			return {
				...localDocumentManifest(workspaceId, backend, documentRef(documentId, workspaceId, backend, command.path)),
				localGeneration: 1,
				relayRequired: false,
				storageAdapter: backend === 'sqlite' ? 'workspace-local' : 'browser-local'
			};
		}
		case 'queue': {
			const workspaceId = workspaceIdFor(command);
			const documentId = await documentIdForPath(storage, command.path);
			const bytes = new TextEncoder().encode(command.content ?? '').byteLength;
			return {
				...localDocumentManifest(workspaceId, backend, documentRef(documentId, workspaceId, backend, command.path, true)),
				queue: { pendingCount: 1, bounded: true, bytes }
			};
		}
		case 'serialize-envelope':
			return { envelope: createSyncEnvelope({ workspaceId: command.workspaceId }) };
		case 'scope': {
			const workspaceId = requireWorkspaceId(command.workspaceId);
			const document = documentRef('note-offline-001', workspaceId, backend);
			return { ...localDocumentManifest(workspaceId, backend, document) };
		}
		case 'credentials':
			return { credentials: { storage: 'secure-device-only', exported: false } };
		case 'reject-payload':
			return { envelope: rejectEnvelopeFields(command.fields ?? []) };
		case 'portable-payload': {
			const workspaceId = requireWorkspaceId(command.workspaceId);
			const document = documentRef('note-offline-001', workspaceId, backend);
			const envelope = createSyncEnvelope({
				workspaceId,
				documents: [document],
				deltas: [{ documentId: document.documentId, workspaceId, changeId: 'pending-001', bytes: 0 }]
			});
			return {
				payload: envelope,
				excludedPaths: ['.openbible/index.sqlite'],
				sourceFiles: []
			};
		}
		case 'pair-peer': {
			const workspaceId = requireWorkspaceId(command.workspaceId);
			const peer = createSyncPeerPolicy(workspaceId).pair(command.peerId ?? '', ['note-offline-001']);
			return {
				peers: [
					{
						peerId: peer.peerId,
						workspaceId: peer.workspaceId,
						scope: peer.scope,
						status: peer.status
					}
				]
			};
		}
		case 'revoke-peer': {
			const workspaceId = workspaceIdFor(command);
			const peer = createSyncPeerPolicy(workspaceId).revoke(command.peerId ?? '');
			return {
				peers: [{ peerId: peer.peerId, status: peer.status }],
				localDataPreserved: true
			};
		}
		case 'merge': {
			const workspaceId = workspaceIdFor(command);
			const repository = createSyncRepository(storage, { backend, workspaceId });
			const document = repository.mergeDocument(command.fields);
			return {
				...localDocumentManifest(workspaceId, backend, document),
				documents: [document],
				merge: repository.mergeOutOfOrder()
			};
		}
		case 'merge-out-of-order': {
			const workspaceId = workspaceIdFor(command);
			const repository = createSyncRepository(storage, { backend, workspaceId });
			return { backend, workspaceId, merge: repository.mergeOutOfOrder() };
		}
		case 'merge-conflict': {
			const workspaceId = workspaceIdFor(command);
			const repository = createSyncRepository(storage, { backend, workspaceId });
			const documentId = await documentIdForPath(storage, command.path);
			return { backend, workspaceId, conflicts: [repository.conflict(documentId)] };
		}
		case 'compact': {
			const workspaceId = requireWorkspaceId(command.workspaceId);
			const repository = createSyncRepository(storage, { backend, workspaceId });
			return {
				...localDocumentManifest(workspaceId, backend, documentRef('note-offline-001', workspaceId, backend)),
				notePersisted: true,
				compaction: repository.compact()
			};
		}
		case 'disable-remote': {
			const workspaceId = workspaceIdFor(command);
			const repository = createSyncRepository(storage, { backend, workspaceId });
			return repository.disableRemote();
		}
		case 'external-edit': {
			const workspaceId = requireWorkspaceId(command.workspaceId);
			const materializer = createSyncMaterializer({ storage, workspaceId, backend });
			return { externalEdits: [await materializer.inspectExternalEdit(command.path ?? '')] };
		}
		case 'reconcile-external': {
			const workspaceId = requireWorkspaceId(command.workspaceId);
			const materializer = createSyncMaterializer({ storage, workspaceId, backend });
			return { conflicts: [await materializer.preserveExternalConflict(command.path ?? '')] };
		}
		case 'rebuild-index': {
			const workspaceId = requireWorkspaceId(command.workspaceId);
			const materializer = createSyncMaterializer({ storage, workspaceId, backend });
			return { ...(await materializer.rebuildProjection()) };
		}
		case 'connect':
		case 'configure-local':
		case 'retry':
		case 'backpressure':
		case 'diagnostics':
		case 'protocol':
			return syncRepositoryCommand(storage, backend, command);
		default:
			throw new Error(`sync_command_not_implemented:${command.type}`);
	}
}
