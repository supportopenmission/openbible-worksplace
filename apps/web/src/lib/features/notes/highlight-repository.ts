import type {
	WorkspaceContentContext,
	WorkspaceContentRecord,
	WorkspaceContentRepository
} from '$lib/storage/workspace-content-repository';

export interface WorkspaceHighlightPayload {
	versionId: string;
	bookId: number;
	chapter: number;
	verseStart: number;
	verseEnd: number;
	styleId: string;
	[key: string]: unknown;
}

export interface WorkspaceHighlightRecord {
	highlightId: string;
	workspaceId: string;
	schemaVersion: number;
	payload: WorkspaceHighlightPayload;
	createdAt?: string;
	updatedAt?: string;
}

function contentRecord(record: WorkspaceHighlightRecord): WorkspaceContentRecord {
	return {
		kind: 'highlight',
		id: record.highlightId,
		workspaceId: record.workspaceId,
		schemaVersion: record.schemaVersion,
		payload: record.payload,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt
	};
}

function highlightRecord(record: WorkspaceContentRecord): WorkspaceHighlightRecord {
	return {
		highlightId: record.id,
		workspaceId: record.workspaceId,
		schemaVersion: record.schemaVersion,
		payload: record.payload as WorkspaceHighlightPayload,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt
	};
}

export async function writeHighlightRecord(
	repository: WorkspaceContentRepository,
	context: WorkspaceContentContext,
	record: WorkspaceHighlightRecord
): Promise<void> {
	if (record.workspaceId !== context.workspaceId) {
		throw new Error('workspace_context_mismatch');
	}
	await repository.write(contentRecord(record));
}

export async function listHighlightRecords(
	repository: WorkspaceContentRepository,
	context: WorkspaceContentContext
): Promise<WorkspaceHighlightRecord[]> {
	const records = await repository.list(context);
	return records.filter((record) => record.kind === 'highlight').map(highlightRecord);
}
