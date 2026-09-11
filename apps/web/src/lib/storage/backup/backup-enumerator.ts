import {
	BACKUP_LIMITS,
	normalizeBackupPath
} from './backup-contract';
import type { WorkspaceStorage, WorkspaceStorageEntry } from '../types';
import { serializePortableNote } from '$lib/features/notes/portable-markdown';
import type { NoteFile, NoteMeta } from '$lib/features/notes/note-types';
import type {
	WorkspaceContentContext,
	WorkspaceContentRecord,
	WorkspaceContentRepository
} from '../workspace-content-repository';

const BACKUP_ROOTS = ['bibles', 'notes', 'sermons', 'studies', 'templates', 'attachments', 'trash', 'media'] as const;
const MEDIA_CATALOG_BACKUP_PATH = 'media/catalog.json';

type RecursiveStorage = WorkspaceStorage & {
	listEntries?: (path: string) => Promise<WorkspaceStorageEntry[]>;
};

type BackupEnumerationOptions = {
	includeBibles?: boolean;
};

export type BackupEntry = {
	path: string;
	size: number;
	sha256: string;
	mediaType: string;
	role: 'authorial' | 'bible' | 'media';
	bytes: Uint8Array;
};

export type LogicalBackupSource = {
	repository: Pick<WorkspaceContentRepository, 'list'>;
	context: WorkspaceContentContext;
};

function isLogicalBackupSource(value: WorkspaceStorage | LogicalBackupSource): value is LogicalBackupSource {
	return (
		typeof value === 'object' &&
		value !== null &&
		'repository' in value &&
		'context' in value
	);
}

function stableStringify(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
	if (typeof value !== 'object' || value === null) return JSON.stringify(value);
	const record = value as Record<string, unknown>;
	return `{${Object.keys(record)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
		.join(',')}}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function encodeJson(value: unknown): Uint8Array {
	return new TextEncoder().encode(`${stableStringify(value)}\n`);
}

function encodeRecord(record: WorkspaceContentRecord): { bytes: Uint8Array; mediaType: string; path: string } {
	const safeId = encodeURIComponent(record.id);
	if (record.kind === 'note') {
		const meta = record.payload.meta;
		const body = record.payload.body;
		if (
			isRecord(meta) &&
			typeof meta.id === 'string' &&
			typeof meta.title === 'string' &&
			typeof meta.createdAt === 'string' &&
			typeof meta.updatedAt === 'string' &&
			typeof meta.path === 'string' &&
			typeof body === 'string'
		) {
			const note: NoteFile = {
				meta: meta as unknown as NoteMeta,
				body
			};
			return {
				path: `notes/${safeId}.md`,
				bytes: new TextEncoder().encode(serializePortableNote(note)),
				mediaType: 'text/markdown'
			};
		}
		return {
			path: `notes/${safeId}.json`,
			bytes: encodeJson({ schemaVersion: record.schemaVersion, payload: record.payload }),
			mediaType: 'application/json'
		};
	}

	return {
		path: `highlights/${safeId}.json`,
		bytes: encodeJson({ schemaVersion: record.schemaVersion, payload: record.payload }),
		mediaType: 'application/json'
	};
}

function sortPaths(paths: Iterable<string>): string[] {
	return [...new Set(paths)].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

async function collectWithEntries(storage: RecursiveStorage, root: string): Promise<string[]> {
	if (!storage.listEntries) return [];
	const files: string[] = [];
	const visit = async (directory: string): Promise<void> => {
		const entries = await storage.listEntries!(directory);
		for (const entry of entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))) {
			const path = `${directory}/${entry.name}`;
			if (entry.kind === 'file') {
				files.push(path);
			} else if (entry.kind === 'directory') {
				await visit(path);
			}
		}
	};
	await visit(root);
	return files;
}

async function collectDirectFiles(storage: WorkspaceStorage, root: string): Promise<string[]> {
	try {
		return (await storage.listFiles(root)).map((name) => `${root}/${name}`);
	} catch {
		return [];
	}
}

async function collectFiles(storage: WorkspaceStorage): Promise<string[]> {
	const recursiveStorage = storage as RecursiveStorage;
	const files: string[] = [];
	for (const root of BACKUP_ROOTS) {
		const recursive = await collectWithEntries(recursiveStorage, root);
		files.push(...(recursive.length > 0 ? recursive : await collectDirectFiles(storage, root)));
	}
	return sortPaths(files);
}

async function collectBackupFiles(storage: WorkspaceStorage): Promise<string[]> {
	const files = await collectFiles(storage);
	if (storage.mediaCatalog && !files.includes(MEDIA_CATALOG_BACKUP_PATH)) {
		files.push(MEDIA_CATALOG_BACKUP_PATH);
	}
	return sortPaths(files);
}

function isBiblePath(path: string): boolean {
	return path.startsWith('bibles/');
}

function isMediaPath(path: string): boolean {
	return path.startsWith('media/');
}

function mediaTypeFor(path: string): string {
	if (path.endsWith('.md')) return 'text/markdown';
	if (path.endsWith('.json')) return 'application/json';
	if (path.endsWith('.sqlite')) return 'application/vnd.sqlite3';
	if (/\.png$/i.test(path)) return 'image/png';
	if (/\.(jpe?g)$/i.test(path)) return 'image/jpeg';
	if (/\.webp$/i.test(path)) return 'image/webp';
	if (/\.gif$/i.test(path)) return 'image/gif';
	if (/\.mp4$/i.test(path)) return 'video/mp4';
	if (/\.webm$/i.test(path)) return 'video/webm';
	if (/\.mp3$/i.test(path)) return 'audio/mpeg';
	if (/\.m4a$/i.test(path)) return 'audio/mp4';
	if (/\.ogg$/i.test(path)) return 'audio/ogg';
	return 'application/octet-stream';
}

function isBibleSource(path: string): boolean {
	return isBiblePath(path) && path.toLowerCase().endsWith('.sqlite');
}

async function sha256(bytes: Uint8Array): Promise<string> {
	if (!globalThis.crypto?.subtle) throw new Error('backup_hash_unavailable');
	const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource);
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function enumerateWorkspaceContent(
	source: LogicalBackupSource,
	_options: BackupEnumerationOptions = {}
): Promise<BackupEntry[]> {
	void _options;
	const records = await source.repository.list(source.context);
	const entries: BackupEntry[] = [];
	for (const record of records
		.filter((candidate) => candidate.workspaceId === source.context.workspaceId)
		.sort((left, right) => {
			const leftPath = encodeRecord(left).path;
			const rightPath = encodeRecord(right).path;
			return leftPath < rightPath ? -1 : leftPath > rightPath ? 1 : 0;
		})) {
		const encoded = encodeRecord(record);
		const path = normalizeBackupPath(encoded.path);
		if (!path) throw new Error('backup_logical_path_invalid');
		if (encoded.bytes.byteLength > BACKUP_LIMITS.maxEntryBytes) {
			throw new Error('backup_entry_limit_exceeded');
		}
		const hash = await sha256(encoded.bytes);
		entries.push({
			path,
			size: encoded.bytes.byteLength,
			sha256: hash,
			mediaType: encoded.mediaType,
			role: 'authorial',
			bytes: encoded.bytes
		});
	}

	if (entries.length > BACKUP_LIMITS.maxEntries) throw new Error('backup_entries_limit_exceeded');
	const totalBytes = entries.reduce((total, entry) => total + entry.size, 0);
	if (totalBytes > BACKUP_LIMITS.maxUncompressedBytes) {
		throw new Error('backup_total_size_limit_exceeded');
	}
	return entries;
}

export async function readWorkspaceContentExclusions(
	_source: LogicalBackupSource,
	includeBibles = false
): Promise<Array<{ category: string; count: number }>> {
	return [
		{ category: 'index', count: 1 },
		{ category: 'catalog', count: 1 },
		{ category: 'deviceState', count: 1 },
		...(includeBibles ? [] : [{ category: 'bibles', count: 1 }])
	];
}

export function resolveBibleBackupPolicy(
	source: LogicalBackupSource,
	includeBibles: boolean
): Promise<{ included: string[]; omitted: string[] }>;
export function resolveBibleBackupPolicy(
	storage: WorkspaceStorage,
	includeBibles: boolean
): Promise<{ included: string[]; omitted: string[] }>;
export async function resolveBibleBackupPolicy(
	storageOrSource: WorkspaceStorage | LogicalBackupSource,
	includeBibles: boolean
): Promise<{ included: string[]; omitted: string[] }> {
	if (isLogicalBackupSource(storageOrSource)) {
		// A Bible SQLite/WASM resource is separate from authorial repository records.
		// It is therefore never copied by this logical enumerator.
		return { included: [], omitted: includeBibles ? [] : [] };
	}
	const storage = storageOrSource;
	const biblePaths = (await collectBackupFiles(storage)).filter(isBiblePath);
	return {
		included: includeBibles ? biblePaths.filter(isBibleSource) : [],
		omitted: includeBibles ? biblePaths.filter((path) => !isBibleSource(path)) : biblePaths
	};
}

export async function readBackupExclusions(
	storage: WorkspaceStorage
): Promise<Array<{ category: string; count: number }>> {
	const excluded: string[] = [];
	const recursiveStorage = storage as RecursiveStorage;
	const operational = recursiveStorage.listEntries
		? await collectWithEntries(recursiveStorage, '.openbible')
		: await collectDirectFiles(storage, '.openbible');
	excluded.push(...operational);
	const biblePolicy = await resolveBibleBackupPolicy(storage, false);
	excluded.push(...biblePolicy.omitted);

	const categories = new Map<string, number>();
	for (const path of excluded) {
		const category = path === '.openbible/index.sqlite'
			? 'index'
			: isBiblePath(path)
				? 'bibles'
				: 'deviceState';
		categories.set(category, (categories.get(category) ?? 0) + 1);
	}
	return [...categories.entries()]
		.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
		.map(([category, count]) => ({ category, count }));
}

export async function* enumerateBackupEntries(
	storageOrSource: WorkspaceStorage | LogicalBackupSource,
	options: BackupEnumerationOptions = {}
): AsyncIterable<BackupEntry> {
	if (isLogicalBackupSource(storageOrSource)) {
		for (const entry of await enumerateWorkspaceContent(storageOrSource, options)) yield entry;
		return;
	}

	const storage = storageOrSource;
	const includeBibles = options.includeBibles === true;
	let totalBytes = 0;
	let count = 0;

	for (const candidate of await collectBackupFiles(storage)) {
		const path = normalizeBackupPath(candidate);
		if (!path || path.startsWith('.openbible/')) continue;
		if (isBiblePath(path) && (!includeBibles || !isBibleSource(path))) continue;

		const bytes =
			path === MEDIA_CATALOG_BACKUP_PATH && storage.mediaCatalog
				? encodeJson(await storage.mediaCatalog.list())
				: await storage.readFile(path);
		if (!bytes) continue;
		if (bytes.byteLength > BACKUP_LIMITS.maxEntryBytes) throw new Error('backup_entry_limit_exceeded');
		if (count >= BACKUP_LIMITS.maxEntries) throw new Error('backup_entries_limit_exceeded');
		if (totalBytes + bytes.byteLength > BACKUP_LIMITS.maxUncompressedBytes) {
			throw new Error('backup_total_size_limit_exceeded');
		}

		count += 1;
		totalBytes += bytes.byteLength;
		yield {
			path,
			size: bytes.byteLength,
			sha256: await sha256(bytes),
			mediaType: mediaTypeFor(path),
			role: isBiblePath(path) ? 'bible' : isMediaPath(path) ? 'media' : 'authorial',
			bytes
		};
	}
}
