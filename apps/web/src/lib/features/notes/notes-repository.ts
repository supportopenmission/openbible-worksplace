import type { WorkspaceStorage } from '$lib/storage/types';
import { parseNoteFile, serializeNoteFile } from './note-markdown';
import type { Note, NoteFile } from './note-types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const TEMPLATE = `---
title: ""
createdAt: ""
updatedAt: ""
type: "note"
---

# Nova nota
`;

class MemoryStorage implements WorkspaceStorage {
	readonly kind = 'opfs' as const;
	readonly label = 'Memória de teste';
	private readonly files = new Map<string, Uint8Array>();

	async ensureDirectory() {}
	async writeFile(path: string, content: string | Uint8Array) {
		this.files.set(path, typeof content === 'string' ? encoder.encode(content) : content);
	}
	async readFile(path: string) {
		return this.files.get(path) ?? null;
	}
	async fileExists(path: string) {
		return this.files.has(path);
	}
	async deleteFile(path: string) {
		this.files.delete(path);
	}
	async listFiles(path: string) {
		const prefix = `${path.replace(/\/$/, '')}/`;
		return [...this.files.keys()]
			.filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
			.map((file) => file.slice(prefix.length))
			.sort();
	}
}

const defaultStorage = new MemoryStorage();
const defaultNoteCache = new Map<string, Note>();

function resolveStorage(storage?: WorkspaceStorage): WorkspaceStorage {
	return storage ?? defaultStorage;
}

function toNote(noteFile: NoteFile): Note {
	const { meta } = noteFile;
	return {
		...meta,
		meta,
		body: noteFile.body,
		content: noteFile.body,
		path: meta.path,
		id: meta.id,
		title: meta.title,
		description: meta.description,
		pinned: meta.pinned,
		createdAt: meta.createdAt,
		updatedAt: meta.updatedAt
	};
}

function noteFile(note: Note): NoteFile {
	return {
		meta: {
			id: note.id,
			title: note.title,
			description: note.description,
			pinned: note.pinned,
			createdAt: note.createdAt,
			updatedAt: note.updatedAt,
			type: 'note',
			path: note.path || `notes/${note.id}.md`
		},
		body: note.body ?? note.content ?? ''
	};
}

function readNoteArgs(
	storageOrId?: WorkspaceStorage | string,
	id?: string
): { storage: WorkspaceStorage; id: string } {
	return typeof storageOrId === 'string'
		? { storage: defaultStorage, id: storageOrId }
		: { storage: resolveStorage(storageOrId), id: id ?? '' };
}

export async function listNotes(storage?: WorkspaceStorage): Promise<Note[]> {
	const resolved = resolveStorage(storage);
	const names = await resolved.listFiles('notes');
	const notes: Note[] = [];
	for (const name of names.filter((file) => file.endsWith('.md'))) {
		const path = `notes/${name}`;
		const bytes = await resolved.readFile(path);
		if (!bytes) continue;
		try {
			const parsed = toNote(parseNoteFile(decoder.decode(bytes), path));
			notes.push(resolved === defaultStorage ? (defaultNoteCache.get(parsed.id) ?? parsed) : parsed);
		} catch {
			// A malformed note remains on disk but cannot enter the active list.
		}
	}
	return notes.sort((a, b) => {
		const pinA = a.pinned ? 1 : 0;
		const pinB = b.pinned ? 1 : 0;
		if (pinB !== pinA) return pinB - pinA;
		return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
	});
}

export async function createNote(storage?: WorkspaceStorage): Promise<Note> {
	const resolved = resolveStorage(storage);
	const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	const now = new Date().toISOString();
	const file = parseNoteFile(TEMPLATE, `notes/${id}.md`);
	const created = {
		...file,
		meta: { ...file.meta, id, path: `notes/${id}.md`, createdAt: now, updatedAt: now }
	};
	await resolved.ensureDirectory('notes');
	await resolved.writeFile(created.meta.path, serializeNoteFile(created));
	const result = toNote(created);
	if (resolved === defaultStorage) defaultNoteCache.set(result.id, result);
	return result;
}

export async function readNote(storage: WorkspaceStorage, id: string): Promise<Note | null>;
export async function readNote(id: string): Promise<Note | null>;
export async function readNote(
	storageOrId: WorkspaceStorage | string,
	id?: string
): Promise<Note | null> {
	const args = readNoteArgs(storageOrId, id);
	if (!args.id) return null;
	const path = `notes/${args.id}.md`;
	const bytes = await args.storage.readFile(path);
	return bytes ? toNote(parseNoteFile(decoder.decode(bytes), path)) : null;
}

export async function saveNote(storage: WorkspaceStorage, note: Note): Promise<Note>;
export async function saveNote(note: Note): Promise<Note>;
export async function saveNote(
	storageOrNote: WorkspaceStorage | Note,
	noteArg?: Note
): Promise<Note> {
	const storage = 'kind' in storageOrNote ? storageOrNote : defaultStorage;
	const note = 'kind' in storageOrNote ? noteArg! : storageOrNote;
	const current = noteFile(note);
	const saved: NoteFile = {
		...current,
		meta: {
			...current.meta,
			updatedAt: new Date().toISOString(),
			path: `notes/${current.meta.id}.md`
		}
	};
	await storage.ensureDirectory('notes');
	await storage.writeFile(saved.meta.path, serializeNoteFile(saved));
	const result = toNote(saved);
	if (storage === defaultStorage) defaultNoteCache.set(result.id, result);
	return result;
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
		const bytes = await storage.readFile(notePath);
		if (!bytes) continue;
		try {
			const parsed = parseNoteFile(decoder.decode(bytes), notePath);
			summaries.push({
				notePath: parsed.meta.path,
				id: parsed.meta.id,
				title: parsed.meta.title,
				updatedAt: parsed.meta.updatedAt
			});
		} catch {
			// Malformed notes stay on disk but are omitted from selector summaries.
		}
	}
	return summaries;
}

export async function trashNote(storage: WorkspaceStorage, id: string): Promise<void>;
export async function trashNote(id: string): Promise<void>;
export async function trashNote(storageOrId: WorkspaceStorage | string, id?: string): Promise<void> {
	const args = readNoteArgs(storageOrId, id);
	const source = `notes/${args.id}.md`;
	const bytes = await args.storage.readFile(source);
	if (!bytes) throw new Error(`Nota não encontrada: ${args.id}`);
	await args.storage.ensureDirectory('trash');
	await args.storage.writeFile(`trash/${args.id}.md`, bytes);
	if (!args.storage.deleteFile) throw new Error('Storage não suporta mover arquivos para a lixeira');
	await args.storage.deleteFile(source);
	if (args.storage === defaultStorage) defaultNoteCache.delete(args.id);
}
