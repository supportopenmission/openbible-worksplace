import type { SyncDocumentRef } from './sync-document-registry';

export const SYNC_ENVELOPE_SCHEMA_VERSION = 1 as const;

const FORBIDDEN_ENVELOPE_FIELDS = new Set([
	'absolutePath',
	'handle',
	'catalog',
	'rawDatabase',
	'projection',
	'token',
	'apiKey',
	'credential',
	'secret',
	'command',
	'sql',
	'path'
]);

export interface SyncDeltaEnvelope {
	documentId: string;
	workspaceId: string;
	changeId: string;
	bytes: number;
}

export interface SyncEnvelope {
	schemaVersion: typeof SYNC_ENVELOPE_SCHEMA_VERSION;
	portable: true;
	workspaceId?: string;
	documents: SyncDocumentRef[];
	deltas: SyncDeltaEnvelope[];
}

export interface RejectedEnvelopeFields {
	rejectedFields: string[];
	rejectReason: 'schema-guard';
}

function normalizedWorkspaceId(workspaceId: string | undefined): string | undefined {
	const normalized = workspaceId?.trim();
	return normalized || undefined;
}

export function createSyncEnvelope(input: {
	workspaceId?: string;
	documents?: SyncDocumentRef[];
	deltas?: SyncDeltaEnvelope[];
}): SyncEnvelope {
	const workspaceId = normalizedWorkspaceId(input.workspaceId);
	const documents = (input.documents ?? []).map((document) => ({ ...document }));
	const deltas = (input.deltas ?? []).map((delta) => ({ ...delta }));

	if (workspaceId) {
		for (const document of documents) {
			if (document.workspaceId !== workspaceId) {
				throw new Error('sync_workspace_scope_mismatch');
			}
		}
		for (const delta of deltas) {
			if (delta.workspaceId !== workspaceId) {
				throw new Error('sync_workspace_scope_mismatch');
			}
		}
	}

	return {
		schemaVersion: SYNC_ENVELOPE_SCHEMA_VERSION,
		portable: true,
		...(workspaceId ? { workspaceId } : {}),
		documents,
		deltas
	};
}

export function rejectEnvelopeFields(fields: readonly string[]): RejectedEnvelopeFields {
	const rejectedFields = [...new Set(fields.filter((field) => FORBIDDEN_ENVELOPE_FIELDS.has(field)))];
	return { rejectedFields, rejectReason: 'schema-guard' };
}

export function containsForbiddenEnvelopeField(value: unknown): boolean {
	if (!value || typeof value !== 'object') return false;
	if (Array.isArray(value)) return value.some(containsForbiddenEnvelopeField);

	return Object.entries(value).some(([key, nested]) => {
		return FORBIDDEN_ENVELOPE_FIELDS.has(key) || containsForbiddenEnvelopeField(nested);
	});
}
