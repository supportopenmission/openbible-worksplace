import type { WorkspaceStorage } from '$lib/storage/types';
import {
	getWorkspaceContentRepository,
	workspaceContentContext
} from '$lib/storage/workspace-content-storage';
import type { WorkspaceContentRecord } from '$lib/storage/workspace-content-repository';
import type { Note, NoteMeta } from './note-types';
import { parseNoteFile } from './note-markdown';
import { persistSyncRecord, removeSyncRecord } from '$lib/features/sync/sync-automerge';

const defaultStorage: WorkspaceStorage = {
	kind: 'opfs',
	label: 'Memória de teste',
	ensureDirectory: async () => undefined,
	writeFile: async () => undefined,
	readFile: async () => null,
	fileExists: async () => false,
	listFiles: async () => []
};

const TEMPLATE = '# Nova nota\n';

function virtualNotePath(id: string): string {
	return `notes/${id}.md`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMeta(
	value: unknown,
	id: string,
	fallback: { createdAt: string; updatedAt: string }
): NoteMeta | null {
	if (!isRecord(value)) return null;
	if (typeof value.id !== 'string' || typeof value.title !== 'string' || value.type !== 'note') {
		return null;
	}
	const schemaVersion = Number.isInteger(value.schemaVersion)
		? Number(value.schemaVersion)
		: undefined;
	const pinned = typeof value.pinned === 'boolean' ? value.pinned : undefined;
	const description = typeof value.description === 'string' ? value.description : undefined;
	const unknownFields = isRecord(value.unknownFields)
		? (Object.fromEntries(
				Object.entries(value.unknownFields).filter(
					([, field]) => field === null || ['string', 'number', 'boolean'].includes(typeof field)
				)
			) as NoteMeta['unknownFields'])
		: undefined;
	return {
		id,
		title: value.title,
		description,
		pinned,
		schemaVersion,
		...(unknownFields ? { unknownFields } : {}),
		createdAt: typeof value.createdAt === 'string' ? value.createdAt : fallback.createdAt,
		updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : fallback.updatedAt,
		type: 'note',
		path: virtualNotePath(id)
	};
}

function toNote(record: WorkspaceContentRecord): Note | null {
	if (record.kind !== 'note' || !isRecord(record.payload)) return null;
	const now = new Date().toISOString();
	const meta = parseMeta(record.payload.meta, record.id, {
		createdAt: record.createdAt ?? now,
		updatedAt: record.updatedAt ?? now
	});
	if (!meta || typeof record.payload.body !== 'string') return null;
	return {
		...meta,
		meta,
		body: record.payload.body,
		content: record.payload.body,
		path: virtualNotePath(record.id),
		id: record.id,
		title: meta.title,
		description: meta.description,
		pinned: meta.pinned,
		createdAt: meta.createdAt,
		updatedAt: meta.updatedAt
	};
}

function noteRecord(storage: WorkspaceStorage, note: Note): WorkspaceContentRecord {
	const meta: NoteMeta = {
		...note.meta,
		id: note.id,
		path: virtualNotePath(note.id),
		title: note.title,
		description: note.description,
		pinned: note.pinned,
		createdAt: note.createdAt,
		updatedAt: note.updatedAt,
		type: 'note'
	};
	return {
		kind: 'note',
		id: note.id,
		workspaceId: workspaceContentContext(storage).workspaceId,
		schemaVersion: meta.schemaVersion ?? 1,
		payload: { meta, body: note.body ?? note.content ?? '' },
		createdAt: meta.createdAt,
		updatedAt: meta.updatedAt
	};
}

function resolvedStorage(storage?: WorkspaceStorage): WorkspaceStorage {
	return storage ?? defaultStorage;
}

async function listRecords(storage: WorkspaceStorage): Promise<WorkspaceContentRecord[]> {
	const context = workspaceContentContext(storage);
	const primary = await getWorkspaceContentRepository(storage, context).list(context);
	const knownIds = new Set(
		primary.filter((record) => record.kind === 'note').map((record) => record.id)
	);
	let legacyNames: string[] = [];
	if (!storage.workspaceId) {
		try {
			legacyNames = (await storage.listFiles('notes')).filter((name) => name.endsWith('.md'));
		} catch {
			// A workspace without the legacy folder is the normal new-workspace path.
		}
	}
	const legacyRecords: WorkspaceContentRecord[] = [];
	for (const name of legacyNames) {
		const bytes = await storage.readFile(`notes/${name}`);
		if (!bytes) continue;
		try {
			const parsed = parseNoteFile(new TextDecoder().decode(bytes), `notes/${name}`);
			if (knownIds.has(parsed.meta.id)) continue;
			legacyRecords.push({
				kind: 'note',
				id: parsed.meta.id,
				workspaceId: context.workspaceId,
				schemaVersion: parsed.meta.schemaVersion ?? 1,
				payload: { meta: parsed.meta, body: parsed.body },
				createdAt: parsed.meta.createdAt,
				updatedAt: parsed.meta.updatedAt
			});
		} catch {
			// Invalid legacy Markdown remains untouched and is omitted from the list.
		}
	}
	return [...primary, ...legacyRecords];
}

async function findNote(storage: WorkspaceStorage, id: string): Promise<Note | null> {
	const record = (await listRecords(storage)).find(
		(candidate) => candidate.kind === 'note' && candidate.id === id
	);
	return record ? toNote(record) : null;
}

export async function listNotes(storage?: WorkspaceStorage): Promise<Note[]> {
	const resolved = resolvedStorage(storage);
	const notes = (await listRecords(resolved))
		.filter((record) => record.kind === 'note')
		.map(toNote)
		.filter((note): note is Note => note !== null);
	return notes.sort((a, b) => {
		const pinA = a.pinned ? 1 : 0;
		const pinB = b.pinned ? 1 : 0;
		if (pinB !== pinA) return pinB - pinA;
		return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
	});
}

export async function createNote(storage?: WorkspaceStorage): Promise<Note> {
	const resolved = resolvedStorage(storage);
	const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	const now = new Date().toISOString();
	const note: Note = {
		id,
		title: 'Nova nota',
		createdAt: now,
		updatedAt: now,
		meta: {
			id,
			title: 'Nova nota',
			createdAt: now,
			updatedAt: now,
			type: 'note',
			path: virtualNotePath(id)
		},
		body: TEMPLATE,
		content: TEMPLATE,
		path: virtualNotePath(id)
	};
	const record = noteRecord(resolved, note);
	await getWorkspaceContentRepository(resolved).write(record);
	await persistSyncRecord(resolved, record);
	return note;
}

export async function readNote(storage: WorkspaceStorage, id: string): Promise<Note | null>;
export async function readNote(id: string): Promise<Note | null>;
export async function readNote(
	storageOrId: WorkspaceStorage | string,
	id?: string
): Promise<Note | null> {
	const storage = typeof storageOrId === 'string' ? defaultStorage : storageOrId;
	const noteId = typeof storageOrId === 'string' ? storageOrId : (id ?? '');
	return noteId ? findNote(storage, noteId) : null;
}

export async function saveNote(storage: WorkspaceStorage, note: Note): Promise<Note>;
export async function saveNote(note: Note): Promise<Note>;
export async function saveNote(
	storageOrNote: WorkspaceStorage | Note,
	noteArg?: Note
): Promise<Note> {
	const storage = 'kind' in storageOrNote ? storageOrNote : defaultStorage;
	const note = 'kind' in storageOrNote ? noteArg : storageOrNote;
	if (!note) throw new Error('nota_required');
	const now = new Date().toISOString();
	const body = note.body ?? note.content ?? '';
	const saved: Note = {
		...note,
		meta: {
			...note.meta,
			id: note.id,
			path: virtualNotePath(note.id),
			updatedAt: now,
			title: note.title,
			type: 'note'
		},
		body,
		content: body,
		path: virtualNotePath(note.id),
		updatedAt: now
	};
	const record = noteRecord(storage, saved);
	await getWorkspaceContentRepository(storage).write(record);
	await persistSyncRecord(storage, record);
	return saved;
}

export type NoteSummary = {
	notePath: string;
	id: string;
	title: string;
	updatedAt: string;
};

export async function loadNoteSummariesForPaths(
	storage: WorkspaceStorage,
	paths: string[]
): Promise<NoteSummary[]> {
	const summaries: NoteSummary[] = [];
	for (const notePath of paths) {
		const match = /^notes\/([^/]+)\.md$/.exec(notePath);
		if (!match) continue;
		const note = await readNote(storage, decodeURIComponent(match[1]));
		if (!note) continue;
		summaries.push({
			notePath: note.path,
			id: note.id,
			title: note.title,
			updatedAt: note.updatedAt
		});
	}
	return summaries;
}

export async function trashNote(storage: WorkspaceStorage, id: string): Promise<void>;
export async function trashNote(id: string): Promise<void>;
export async function trashNote(
	storageOrId: WorkspaceStorage | string,
	id?: string
): Promise<void> {
	const storage = typeof storageOrId === 'string' ? defaultStorage : storageOrId;
	const noteId = typeof storageOrId === 'string' ? storageOrId : (id ?? '');
	if (!noteId) throw new Error('Nota não encontrada.');
	const context = workspaceContentContext(storage);
	const current = await findNote(storage, noteId);
	if (current) await removeSyncRecord(storage, noteRecord(storage, current));
	await getWorkspaceContentRepository(storage, context).remove(context, 'note', noteId);
}
