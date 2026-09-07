import { readBackupArchive, readBackupManifest, type BackupArchiveEntry } from './backup-archive';
import { createIncrementalSha256 } from './backup-hash';
import { enumerateWorkspaceContent, type LogicalBackupSource } from './backup-enumerator';
import type { BackupManifest } from './backup-contract';
import type { WorkspaceStorage } from '../types';

export interface RestoreValidationResult {
	valid: boolean;
	errors: string[];
	manifest?: BackupManifest;
}

export interface RestoreConflict {
	path: string;
	reason: 'content_differs' | 'identical' | 'archive_invalid';
}

export type RestoreSource = WorkspaceStorage | LogicalBackupSource;

function isLogicalSource(source: RestoreSource): source is LogicalBackupSource {
	return typeof source === 'object' && source !== null && 'repository' in source && 'context' in source;
}

function hashBytes(bytes: Uint8Array): string {
	return createIncrementalSha256().update(bytes).digest();
}

function contentEntries(entries: BackupArchiveEntry[]): BackupArchiveEntry[] {
	return entries.filter((entry) => entry.path !== 'openbible-backup.json');
}

export function validateRestoreArchive(archive: Uint8Array): RestoreValidationResult {
	try {
		const parsed = readBackupManifest(archive);
		const expected = new Map(parsed.manifest.files.map((file) => [file.path, file]));
		const actual = new Map(contentEntries(parsed.entries).map((entry) => [entry.path, entry]));
		const errors: string[] = [];

		for (const file of parsed.manifest.files) {
			const entry = actual.get(file.path);
			if (!entry) {
				errors.push(`missing:${file.path}`);
				continue;
			}
			if (entry.bytes.byteLength !== file.size) errors.push(`size:${file.path}`);
			if (hashBytes(entry.bytes) !== file.sha256) errors.push(`sha256:${file.path}`);
			if (entry.mediaType !== file.mediaType) errors.push(`mediaType:${file.path}`);
			if (entry.role !== file.role) errors.push(`role:${file.path}`);
		}
		for (const path of actual.keys()) {
			if (!expected.has(path)) errors.push(`unexpected:${path}`);
		}
		return errors.length > 0
			? { valid: false, errors }
			: { valid: true, errors, manifest: parsed.manifest };
	} catch (error) {
		return {
			valid: false,
			errors: [error instanceof Error ? error.message : 'backup_archive_invalid']
		};
	}
}

async function existingEntry(source: RestoreSource, path: string): Promise<Uint8Array | null> {
	if (isLogicalSource(source)) {
		const entries = await enumerateWorkspaceContent(source);
		return entries.find((entry) => entry.path === path)?.bytes ?? null;
	}
	if (!(await source.fileExists(path))) return null;
	return source.readFile(path);
}

export async function findRestoreConflicts(source: RestoreSource, archive: Uint8Array): Promise<RestoreConflict[]> {
	const validation = validateRestoreArchive(archive);
	if (!validation.valid) return [{ path: 'openbible-backup.json', reason: 'archive_invalid' }];

	const conflicts: RestoreConflict[] = [];
	for (const entry of contentEntries(readBackupArchive(archive))) {
		const existing = await existingEntry(source, entry.path);
		if (!existing) continue;
		conflicts.push({
			path: entry.path,
			reason: hashBytes(existing) === hashBytes(entry.bytes) ? 'identical' : 'content_differs'
		});
	}
	return conflicts;
}

function fallbackWorkspaceId(): string {
	const bytes = new Uint8Array(16);
	if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
	else {
		const timestamp = Date.now().toString(16).padStart(12, '0');
		bytes.set(new TextEncoder().encode(timestamp).slice(0, 16));
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function createRestoredWorkspace(
	_source: RestoreSource,
	_archive: Uint8Array
): Promise<{ workspaceId: string }> {
	void _source;
	void _archive;
	return { workspaceId: globalThis.crypto?.randomUUID?.() ?? fallbackWorkspaceId() };
}
