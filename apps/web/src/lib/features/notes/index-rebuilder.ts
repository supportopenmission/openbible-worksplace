import { readManifest, type WorkspaceManifest } from '$lib/storage/workspace-catalog';
import type { WorkspaceStorage } from '$lib/storage/types';
import { parseNoteFile } from './portable-markdown';
import {
	type WorkspaceContentContext,
	type WorkspaceContentProjection,
	type WorkspaceContentRecord
} from '$lib/storage/workspace-content-repository';
import { getWorkspaceContentRepository } from '$lib/storage/workspace-content-storage';

export interface IndexRebuildOptions {
	onProgress?: (processed: number, total: number) => void;
	context?: WorkspaceContentContext;
	signal?: AbortSignal;
}

export class WorkspaceIndexRebuildCancelledError extends Error {
	readonly code = 'INDEX_REBUILD_CANCELLED';

	constructor() {
		super('A reconstrução do índice foi cancelada antes do commit.');
		this.name = 'WorkspaceIndexRebuildCancelledError';
	}
}

const projections = new Map<string, WorkspaceContentProjection>();

function backendFor(storage: WorkspaceStorage): 'sqlite' | 'indexeddb' {
	return storage.kind === 'native' ? 'sqlite' : 'indexeddb';
}

function fallbackManifest(storage: WorkspaceStorage): WorkspaceManifest {
	return {
		workspaceId: `legacy-${backendFor(storage)}`,
		formatVersion: 2,
		name: storage.label,
		managedRoot: false,
		version: 1,
		storage: storage.kind,
		configuredAt: new Date(0).toISOString(),
		bibleImportStatus: 'pending',
		label: storage.label,
		migrationState: 'not_started'
	};
}

function projectionKey(context: Pick<WorkspaceContentContext, 'backend' | 'workspaceId'>): string {
	return `${context.backend}:${context.workspaceId}`;
}

function isNotFoundError(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'name' in error &&
		error.name === 'NotFoundError'
	);
}

function asHighlightRecord(
	value: unknown,
	workspaceId: string,
	path: string
): WorkspaceContentRecord | null {
	if (!value || typeof value !== 'object') return null;
	const raw = value as Record<string, unknown>;
	const highlightId =
		typeof raw.highlightId === 'string' ? raw.highlightId : path.replace(/\.json$/i, '');
	const payload = {
		versionId: raw.versionId,
		bookId: raw.bookId,
		chapter: raw.chapter,
		verseStart: raw.verseStart,
		verseEnd: raw.verseEnd,
		styleId: raw.styleId,
		...raw
	};
	if (
		!highlightId ||
		typeof payload.versionId !== 'string' ||
		![payload.bookId, payload.chapter, payload.verseStart, payload.verseEnd].every(
			(value) => typeof value === 'number' && Number.isInteger(value)
		) ||
		typeof payload.styleId !== 'string'
	) {
		return null;
	}
	return {
		kind: 'highlight',
		id: highlightId,
		workspaceId,
		schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1,
		payload
	};
}

function asNoteRecord(
	value: ReturnType<typeof parseNoteFile>,
	workspaceId: string
): WorkspaceContentRecord {
	return {
		kind: 'note',
		id: value.meta.id,
		workspaceId,
		schemaVersion: value.meta.schemaVersion,
		payload: {
			meta: value.meta,
			body: value.body
		},
		createdAt: value.meta.createdAt || undefined,
		updatedAt: value.meta.updatedAt || undefined
	};
}

async function listOptionalFiles(
	storage: WorkspaceStorage,
	directory: string,
	extension: string
): Promise<string[]> {
	try {
		return (await storage.listFiles(directory))
			.filter((name) => name.endsWith(extension))
			.sort();
	} catch (error) {
		if (!isNotFoundError(error)) throw error;
		return [];
	}
}

function cloneProjection(projection: WorkspaceContentProjection): WorkspaceContentProjection {
	return {
		...projection,
		records: projection.records.map((record) => ({
			...record,
			payload: structuredClone(record.payload)
		}))
	};
}

export async function rebuildWorkspaceIndex(
	storage: WorkspaceStorage,
	options: IndexRebuildOptions = {}
): Promise<WorkspaceContentProjection> {
	const manifest = (await readManifest(storage)) ?? fallbackManifest(storage);
	const context = options.context ?? {
		workspaceId: manifest.workspaceId,
		generation: 0,
		backend: backendFor(storage)
	};
	const repository = getWorkspaceContentRepository(storage, context);
	const noteNames = await listOptionalFiles(storage, 'notes', '.md');
	const highlightNames = await listOptionalFiles(storage, 'highlights', '.json');
	const sources = [
		...noteNames.map((name) => ({ kind: 'note' as const, name })),
		...highlightNames.map((name) => ({ kind: 'highlight' as const, name }))
	];
	const total = sources.length;
	let processed = 0;
	const persistedRecords = await repository.list(context);
	const pendingRecords: WorkspaceContentRecord[] = [...persistedRecords];
	const persistedKeys = new Set(persistedRecords.map((record) => `${record.kind}:${record.id}`));

	for (const source of sources) {
		if (options.signal?.aborted) throw new WorkspaceIndexRebuildCancelledError();
		const directory = source.kind === 'note' ? 'notes' : 'highlights';
		const bytes = await storage.readFile(`${directory}/${source.name}`);
		if (bytes) {
			try {
				const decoded = new TextDecoder().decode(bytes);
				const record =
					source.kind === 'note'
						? asNoteRecord(
							parseNoteFile(decoded, `notes/${source.name}`),
							context.workspaceId
						)
						: asHighlightRecord(
							JSON.parse(decoded) as unknown,
							context.workspaceId,
							source.name
						);
				if (record && !persistedKeys.has(`${record.kind}:${record.id}`)) {
					pendingRecords.push(record);
				}
			} catch {
				// Registros inválidos permanecem disponíveis como fonte e não viram projeção.
			}
		}
		processed += 1;
		options.onProgress?.(processed, total);
	}
	if (options.signal?.aborted) throw new WorkspaceIndexRebuildCancelledError();
	for (const record of pendingRecords) {
		if (!persistedKeys.has(`${record.kind}:${record.id}`)) await repository.write(record);
	}

	const projection = await repository.rebuild(context);
	projections.set(projectionKey(context), cloneProjection(projection));
	return cloneProjection(projection);
}

export function getWorkspaceIndexProjection(
	context: Pick<WorkspaceContentContext, 'backend' | 'workspaceId'>
): WorkspaceContentProjection | null {
	const projection = projections.get(projectionKey(context));
	return projection ? cloneProjection(projection) : null;
}

export function resetWorkspaceIndexProjections(): void {
	projections.clear();
}
