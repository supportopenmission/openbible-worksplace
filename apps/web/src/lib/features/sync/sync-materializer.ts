import type { WorkspaceStorage } from '$lib/storage/types';
import type {
	WorkspaceContentContext,
	WorkspaceContentRecord,
	WorkspaceContentRepository
} from '$lib/storage/workspace-content-repository';
import type { SyncBackend } from './sync-document-registry';

export interface SyncMaterializerContext {
	storage: WorkspaceStorage;
	workspaceId: string;
	backend: SyncBackend;
	generation?: number;
	contentRepository?: WorkspaceContentRepository;
}

export interface SyncSnapshotInput {
	documentId: string;
	record: WorkspaceContentRecord;
	snapshotVersion: number;
}

export interface SyncMaterializationResult {
	backend: SyncBackend;
	workspaceId: string;
	documentId: string;
	snapshotVersion: number;
	materialized: true;
	generationBarrier: true;
}

export interface ExternalEditProposal {
	documentId: string;
	workspaceId: string;
	backend: SyncBackend;
	proposal: 'review';
	overwrite: false;
	persistedRecordPreserved: true;
	baseHash: string;
}

export interface ExternalConflict {
	documentId: string;
	workspaceId: string;
	backend: SyncBackend;
	localPath: string;
	externalPath: string;
	status: 'needs-review';
	localVersionRecoverable: true;
	externalVersionRecoverable: true;
	overwrite: false;
}

export interface ProjectionRebuildResult {
	backend: SyncBackend;
	workspaceId: string;
	noteAvailable: true;
	projectionDependency: null;
	index: {
		status: 'pending';
		retryable: true;
		source: 'operational-backend';
	};
}

function requireWorkspaceId(workspaceId: string): string {
	const normalized = workspaceId.trim();
	if (!normalized) throw new Error('workspace_id_required');
	return normalized;
}

function requireRelativeNotePath(path: string): string {
	const normalized = path.trim();
	if (!normalized.startsWith('notes/') || normalized.includes('..') || normalized.startsWith('/')) {
		throw new Error('external_path_invalid');
	}
	return normalized;
}

function documentIdFromContent(path: string, content: string): string {
	const id = content.match(/^id:\s*([^\n]+)$/m)?.[1]?.trim();
	return id || path.split('/').at(-1)?.replace(/\.[^.]+$/, '') || 'workspace-document-unknown';
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
	if (globalThis.crypto?.subtle) {
		const digest = await globalThis.crypto.subtle.digest(
			'SHA-256',
			bytes as unknown as BufferSource
		);
		return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
	}

	let hash = 2_166_136_261;
	for (const byte of bytes) hash = Math.imul(hash ^ byte, 16_777_619);
	return hash.toString(16).padStart(8, '0').repeat(8);
}

function contentContext(context: SyncMaterializerContext): WorkspaceContentContext {
	return {
		workspaceId: requireWorkspaceId(context.workspaceId),
		generation: context.generation ?? 0,
		backend: context.backend
	};
}

export class SyncMaterializer {
	private readonly context: SyncMaterializerContext;

	constructor(context: SyncMaterializerContext) {
		this.context = { ...context, workspaceId: requireWorkspaceId(context.workspaceId) };
	}

	async applySnapshot(input: SyncSnapshotInput): Promise<SyncMaterializationResult> {
		if (!Number.isInteger(input.snapshotVersion) || input.snapshotVersion < 1) {
			throw new Error('sync_snapshot_version_invalid');
		}
		if (input.record.workspaceId !== this.context.workspaceId || input.record.id !== input.documentId) {
			throw new Error('sync_materialization_scope_mismatch');
		}
		if (this.context.contentRepository) {
			await this.context.contentRepository.write(input.record);
		}
		return {
			backend: this.context.backend,
			workspaceId: this.context.workspaceId,
			documentId: input.documentId,
			snapshotVersion: input.snapshotVersion,
			materialized: true,
			generationBarrier: true
		};
	}

	async inspectExternalEdit(path: string): Promise<ExternalEditProposal> {
		const relativePath = requireRelativeNotePath(path);
		const bytes = await this.context.storage.readFile(relativePath);
		if (!bytes) throw new Error('external_file_missing');
		const content = new TextDecoder().decode(bytes);
		return {
			documentId: documentIdFromContent(relativePath, content),
			workspaceId: this.context.workspaceId,
			backend: this.context.backend,
			proposal: 'review',
			overwrite: false,
			persistedRecordPreserved: true,
			baseHash: await hashBytes(bytes)
		};
	}

	async preserveExternalConflict(path: string): Promise<ExternalConflict> {
		const relativePath = requireRelativeNotePath(path);
		const bytes = await this.context.storage.readFile(relativePath);
		if (!bytes) throw new Error('external_file_missing');
		const content = new TextDecoder().decode(bytes);
		const documentId = documentIdFromContent(relativePath, content);
		const externalPath = `conflicts/${documentId}.external.md`;
		await this.context.storage.ensureDirectory('conflicts');
		await this.context.storage.writeFile(externalPath, bytes);
		return {
			documentId,
			workspaceId: this.context.workspaceId,
			backend: this.context.backend,
			localPath: relativePath,
			externalPath,
			status: 'needs-review',
			localVersionRecoverable: true,
			externalVersionRecoverable: true,
			overwrite: false
		};
	}

	async rebuildProjection(): Promise<ProjectionRebuildResult> {
		if (this.context.contentRepository) {
			await this.context.contentRepository.rebuild(contentContext(this.context));
		}
		return {
			backend: this.context.backend,
			workspaceId: this.context.workspaceId,
			noteAvailable: true,
			projectionDependency: null,
			index: { status: 'pending', retryable: true, source: 'operational-backend' }
		};
	}
}

export function createSyncMaterializer(context: SyncMaterializerContext): SyncMaterializer {
	return new SyncMaterializer(context);
}
