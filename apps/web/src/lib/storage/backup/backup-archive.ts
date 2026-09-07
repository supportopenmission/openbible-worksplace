import {
	BACKUP_FORMAT,
	BACKUP_LIMITS,
	BACKUP_FORMAT_VERSION,
	canonicalizeBackupManifest,
	normalizeBackupPath,
	type BackupManifest,
	validateBackupManifestValue,
	type BackupFileRole
} from './backup-contract';
import {
	enumerateBackupEntries,
	type BackupEntry,
	type LogicalBackupSource
} from './backup-enumerator';
import type { WorkspaceStorage } from '../types';

const ZIP_LOCAL_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_SIGNATURE = 0x02014b50;
const ZIP_END_SIGNATURE = 0x06054b50;
const ZIP64_END_SIGNATURE = 0x06064b50;
const ZIP64_LOCATOR_SIGNATURE = 0x07064b50;
const ZIP64_EXTRA_ID = 0x0001;
const ZIP64_LIMIT = 0xffffffff;
const MANIFEST_PATH = 'openbible-backup.json';

export interface BackupArchiveEntry {
	path: string;
	bytes: Uint8Array;
	mediaType: string;
	role: BackupFileRole;
}

export interface BackupArchiveManifest {
	manifest: BackupManifest;
	entries: BackupArchiveEntry[];
}

function isLogicalBackupSource(value: WorkspaceStorage | LogicalBackupSource): value is LogicalBackupSource {
	return typeof value === 'object' && value !== null && 'repository' in value && 'context' in value;
}

function backendOf(source: WorkspaceStorage | LogicalBackupSource): 'indexeddb' | 'sqlite' {
	if (isLogicalBackupSource(source)) return source.context.backend;
	return source.kind === 'native' ? 'sqlite' : 'indexeddb';
}

function workspaceIdOf(source: WorkspaceStorage | LogicalBackupSource): string | undefined {
	return isLogicalBackupSource(source) ? source.context.workspaceId : undefined;
}

function mediaTypeFor(path: string): string {
	if (path.endsWith('.md')) return 'text/markdown';
	if (path.endsWith('.json')) return 'application/json';
	if (path.endsWith('.sqlite')) return 'application/vnd.sqlite3';
	return 'application/octet-stream';
}

function roleFor(path: string): BackupFileRole {
	return path.startsWith('bibles/') ? 'bible' : 'authorial';
}

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function zip64Extra(values: bigint[]): Uint8Array {
	if (values.length === 0) return new Uint8Array();
	const extra = new Uint8Array(4 + values.length * 8);
	const view = new DataView(extra.buffer);
	view.setUint16(0, ZIP64_EXTRA_ID, true);
	view.setUint16(2, values.length * 8, true);
	values.forEach((value, index) => view.setBigUint64(4 + index * 8, value, true));
	return extra;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
	const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
	if (!Number.isSafeInteger(total)) throw new Error('backup_archive_limit_exceeded');
	const output = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return output;
}

function localHeader(entry: BackupArchiveEntry, offset: number): Uint8Array {
	const name = new TextEncoder().encode(entry.path);
	const size = BigInt(entry.bytes.byteLength);
	const offsetValue = BigInt(offset);
	const sizeZip64 = size > BigInt(ZIP64_LIMIT);
	const extra = zip64Extra(sizeZip64 ? [size, size] : []);
	const header = new Uint8Array(30 + name.byteLength + extra.byteLength);
	const view = new DataView(header.buffer);
	view.setUint32(0, ZIP_LOCAL_SIGNATURE, true);
	view.setUint16(4, sizeZip64 ? 45 : 20, true);
	view.setUint16(6, 0, true);
	view.setUint16(8, 0, true);
	view.setUint16(10, 0, true);
	view.setUint16(12, 0, true);
	view.setUint32(14, crc32(entry.bytes), true);
	view.setUint32(18, sizeZip64 ? ZIP64_LIMIT : entry.bytes.byteLength, true);
	view.setUint32(22, sizeZip64 ? ZIP64_LIMIT : entry.bytes.byteLength, true);
	view.setUint16(26, name.byteLength, true);
	view.setUint16(28, extra.byteLength, true);
	header.set(name, 30);
	header.set(extra, 30 + name.byteLength);
	void offsetValue;
	return header;
}

function centralHeader(entry: BackupArchiveEntry, offset: number): Uint8Array {
	const name = new TextEncoder().encode(entry.path);
	const size = BigInt(entry.bytes.byteLength);
	const offsetValue = BigInt(offset);
	const sizeZip64 = size > BigInt(ZIP64_LIMIT);
	const offsetZip64 = offsetValue > BigInt(ZIP64_LIMIT);
	const extra = zip64Extra([
		...(sizeZip64 ? [size, size] : []),
		...(offsetZip64 ? [offsetValue] : [])
	]);
	const zip64 = sizeZip64 || offsetZip64;
	const header = new Uint8Array(46 + name.byteLength + extra.byteLength);
	const view = new DataView(header.buffer);
	view.setUint32(0, ZIP_CENTRAL_SIGNATURE, true);
	view.setUint16(4, 20, true);
	view.setUint16(6, zip64 ? 45 : 20, true);
	view.setUint16(8, 0, true);
	view.setUint16(10, 0, true);
	view.setUint16(12, 0, true);
	view.setUint16(14, 0, true);
	view.setUint32(16, crc32(entry.bytes), true);
	view.setUint32(20, sizeZip64 ? ZIP64_LIMIT : entry.bytes.byteLength, true);
	view.setUint32(24, sizeZip64 ? ZIP64_LIMIT : entry.bytes.byteLength, true);
	view.setUint16(28, name.byteLength, true);
	view.setUint16(30, extra.byteLength, true);
	view.setUint16(32, 0, true);
	view.setUint16(34, 0, true);
	view.setUint16(36, 0, true);
	view.setUint32(38, 0, true);
	view.setUint32(42, offsetZip64 ? ZIP64_LIMIT : offset, true);
	header.set(name, 46);
	header.set(extra, 46 + name.byteLength);
	return header;
}

function endOfCentralDirectory(entryCount: number, centralSize: number, centralOffset: number): Uint8Array {
	const requiresZip64 =
		entryCount > 0xffff || centralSize > ZIP64_LIMIT || centralOffset > ZIP64_LIMIT;
	if (!requiresZip64) {
		const end = new Uint8Array(22);
		const view = new DataView(end.buffer);
		view.setUint32(0, ZIP_END_SIGNATURE, true);
		view.setUint16(4, 0, true);
		view.setUint16(6, 0, true);
		view.setUint16(8, entryCount, true);
		view.setUint16(10, entryCount, true);
		view.setUint32(12, centralSize, true);
		view.setUint32(16, centralOffset, true);
		view.setUint16(20, 0, true);
		return end;
	}

	const zip64EndOffset = BigInt(centralOffset + centralSize);
	const zip64End = new Uint8Array(56);
	const zip64View = new DataView(zip64End.buffer);
	zip64View.setUint32(0, ZIP64_END_SIGNATURE, true);
	zip64View.setBigUint64(4, 44n, true);
	zip64View.setUint16(12, 45, true);
	zip64View.setUint16(14, 45, true);
	zip64View.setBigUint64(24, BigInt(entryCount), true);
	zip64View.setBigUint64(32, BigInt(entryCount), true);
	zip64View.setBigUint64(40, BigInt(centralSize), true);
	zip64View.setBigUint64(48, BigInt(centralOffset), true);

	const locator = new Uint8Array(20);
	const locatorView = new DataView(locator.buffer);
	locatorView.setUint32(0, ZIP64_LOCATOR_SIGNATURE, true);
	locatorView.setUint32(4, 0, true);
	locatorView.setBigUint64(8, zip64EndOffset, true);
	locatorView.setUint32(16, 1, true);

	const end = new Uint8Array(22);
	const endView = new DataView(end.buffer);
	endView.setUint32(0, ZIP_END_SIGNATURE, true);
	endView.setUint16(4, 0, true);
	endView.setUint16(6, 0, true);
	endView.setUint16(8, 0xffff, true);
	endView.setUint16(10, 0xffff, true);
	endView.setUint32(12, ZIP64_LIMIT, true);
	endView.setUint32(16, ZIP64_LIMIT, true);
	return concatBytes([zip64End, locator, end]);
}

function buildManifest(
	source: WorkspaceStorage | LogicalBackupSource,
	entries: BackupEntry[]
): BackupManifest {
	return {
		format: BACKUP_FORMAT,
		formatVersion: BACKUP_FORMAT_VERSION,
		createdAt: new Date().toISOString(),
		source: {
			...(workspaceIdOf(source) ? { workspaceId: workspaceIdOf(source) } : {}),
			backend: backendOf(source),
			workspaceFormatVersion: 2
		},
		policy: {
			bibles: entries.some((entry) => entry.role === 'bible') ? 'included' : 'excluded',
			index: 'excluded',
			deviceState: 'excluded'
		},
		limits: {
			maxEntries: BACKUP_LIMITS.maxEntries,
			maxUncompressedBytes: BACKUP_LIMITS.maxUncompressedBytes,
			maxEntryBytes: BACKUP_LIMITS.maxEntryBytes
		},
		totals: {
			entries: entries.length,
			uncompressedBytes: entries.reduce((sum, entry) => sum + entry.size, 0)
		},
		files: entries
			.map(({ path, size, sha256, mediaType, role }) => ({ path, size, sha256, mediaType, role }))
			.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
	};
}

export async function writeBackupArchive(
	source: WorkspaceStorage | LogicalBackupSource,
	options: { includeBibles?: boolean } = {}
): Promise<Uint8Array> {
	const contentEntries = [] as BackupEntry[];
	for await (const entry of enumerateBackupEntries(source, options)) contentEntries.push(entry);
	const manifest = buildManifest(source, contentEntries);
	const manifestBytes = new TextEncoder().encode(canonicalizeBackupManifest(manifest));
	const entries: BackupArchiveEntry[] = [
		{ path: MANIFEST_PATH, bytes: manifestBytes, mediaType: 'application/json', role: 'authorial' },
		...contentEntries.map((entry) => ({
			path: entry.path,
			bytes: entry.bytes,
			mediaType: entry.mediaType,
			role: entry.role
		}))
	];

	const localChunks: Uint8Array[] = [];
	const centralChunks: Uint8Array[] = [];
	const offsets: number[] = [];
	let offset = 0;
	for (const entry of entries) {
		offsets.push(offset);
		const header = localHeader(entry, offset);
		localChunks.push(header, entry.bytes);
		offset += header.byteLength + entry.bytes.byteLength;
	}
	const centralOffset = offset;
	entries.forEach((entry, index) => centralChunks.push(centralHeader(entry, offsets[index])));
	const central = concatBytes(centralChunks);
	return concatBytes([
		concatBytes(localChunks),
		central,
		endOfCentralDirectory(entries.length, central.byteLength, centralOffset)
	]);
}

function readZip64Values(extra: Uint8Array): bigint[] {
	let offset = 0;
	while (offset + 4 <= extra.byteLength) {
		const view = new DataView(extra.buffer, extra.byteOffset + offset, extra.byteLength - offset);
		const id = view.getUint16(0, true);
		const size = view.getUint16(2, true);
		if (id === ZIP64_EXTRA_ID) {
			const values: bigint[] = [];
			for (let cursor = 0; cursor + 8 <= size; cursor += 8) {
				values.push(view.getBigUint64(4 + cursor, true));
			}
			return values;
		}
		offset += 4 + size;
	}
	return [];
}

function numberFromZipValue(value: number, values: bigint[], index: number): number {
	const resolved = value === ZIP64_LIMIT ? values[index] : BigInt(value);
	if (resolved === undefined || resolved > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error('backup_archive_size_unsupported');
	}
	return Number(resolved);
}

export function readBackupArchive(archive: Uint8Array): BackupArchiveEntry[] {
	const entries: BackupArchiveEntry[] = [];
	let offset = 0;
	while (offset + 4 <= archive.byteLength) {
		const signature = new DataView(archive.buffer, archive.byteOffset + offset, 4).getUint32(0, true);
		if (signature === ZIP_CENTRAL_SIGNATURE || signature === ZIP_END_SIGNATURE || signature === ZIP64_END_SIGNATURE) break;
		if (signature !== ZIP_LOCAL_SIGNATURE || offset + 30 > archive.byteLength) {
			throw new Error('backup_archive_invalid');
		}

		const view = new DataView(archive.buffer, archive.byteOffset + offset, archive.byteLength - offset);
		const flags = view.getUint16(6, true);
		const method = view.getUint16(8, true);
		const compressedSize = view.getUint32(18, true);
		const uncompressedSize = view.getUint32(22, true);
		const nameLength = view.getUint16(26, true);
		const extraLength = view.getUint16(28, true);
		if (flags !== 0 || method !== 0) throw new Error('backup_archive_compression_unsupported');
		const nameStart = offset + 30;
		const extraStart = nameStart + nameLength;
		const dataStart = extraStart + extraLength;
		if (dataStart > archive.byteLength) throw new Error('backup_archive_invalid');
		const name = new TextDecoder().decode(archive.slice(nameStart, extraStart));
		const path = name === MANIFEST_PATH ? name : name;
		const values = readZip64Values(archive.slice(extraStart, dataStart));
		const size = numberFromZipValue(compressedSize, values, 0);
		const originalSize = numberFromZipValue(uncompressedSize, values, compressedSize === ZIP64_LIMIT ? 1 : 0);
		if (size !== originalSize || dataStart + size > archive.byteLength) throw new Error('backup_archive_invalid');
		const normalizedPath = path === MANIFEST_PATH ? path : path.replace(/^files\//, '');
		if (!normalizedPath || (path !== MANIFEST_PATH && !normalizeBackupPath(normalizedPath))) {
			throw new Error('backup_archive_path_invalid');
		}
		entries.push({
			path: normalizedPath,
			bytes: archive.slice(dataStart, dataStart + size),
			mediaType: mediaTypeFor(normalizedPath),
			role: roleFor(normalizedPath)
		});
		offset = dataStart + size;
	}
	if (entries.length === 0 || entries[0].path !== MANIFEST_PATH) throw new Error('backup_manifest_missing');
	return entries;
}

export function readBackupManifest(archive: Uint8Array): BackupArchiveManifest {
	const entries = readBackupArchive(archive);
	const manifestEntry = entries.find((entry) => entry.path === MANIFEST_PATH);
	if (!manifestEntry) throw new Error('backup_manifest_missing');
	let raw: unknown;
	try {
		raw = JSON.parse(new TextDecoder().decode(manifestEntry.bytes));
	} catch {
		throw new Error('backup_manifest_invalid');
	}
	const validation = validateBackupManifestValue(raw);
	if (!validation.valid || !validation.manifest) throw new Error('backup_manifest_invalid');
	return { manifest: validation.manifest, entries };
}
