import type { WorkspaceStorage } from '../types';

export const BACKUP_FORMAT = 'openbible-backup' as const;
export const BACKUP_FORMAT_VERSION = 1 as const;
export const BACKUP_ARCHIVE_EXTENSION = '.openbible-backup.zip' as const;
export const BACKUP_MIME_TYPE = 'application/vnd.openbible.backup+zip' as const;

export const BACKUP_LIMITS = {
	maxEntries: 100_000,
	maxUncompressedBytes: 10 * 1024 * 1024 * 1024,
	maxEntryBytes: 4 * 1024 * 1024 * 1024,
	maxManifestBytes: 8 * 1024 * 1024,
	maxActiveBufferBytes: 16 * 1024 * 1024,
	maxPathCodePoints: 1_024,
	maxPathBytes: 4_096
} as const;

export type BackupFileRole = 'authorial' | 'bible';
export type BackupBiblePolicy = 'excluded' | 'included';
export type BackupContentBackend = 'indexeddb' | 'sqlite';

export interface BackupManifestEntry {
	path: string;
	size: number;
	sha256: string;
	mediaType: string;
	role: BackupFileRole;
}

export interface BackupManifest {
	format: typeof BACKUP_FORMAT;
	formatVersion: typeof BACKUP_FORMAT_VERSION;
	createdAt: string;
	source: {
		workspaceId?: string;
		displayName?: string;
		backend: BackupContentBackend;
		workspaceFormatVersion: number;
	};
	policy: {
		bibles: BackupBiblePolicy;
		index: 'excluded';
		deviceState: 'excluded';
	};
	limits: {
		maxEntries: number;
		maxUncompressedBytes: number;
		maxEntryBytes: number;
	};
	totals: {
		entries: number;
		uncompressedBytes: number;
	};
	files: BackupManifestEntry[];
}

export interface BackupValidationResult {
	valid: boolean;
	errors: string[];
	manifest?: BackupManifest;
}

const FORBIDDEN_SOURCE_KEYS = new Set([
	'path',
	'root',
	'rootPath',
	'handle',
	'opfsKey',
	'catalog',
	'operationalState',
	'secret',
	'token'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function addError(errors: string[], message: string): void {
	if (!errors.includes(message)) errors.push(message);
}

function compareCodeUnits(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function foldPath(path: string): string {
	return path.normalize('NFC').toLowerCase();
}

function isReservedPath(path: string): boolean {
	const candidate = path.startsWith('files/') ? path.slice('files/'.length) : path;
	if (candidate === '.openbible/index.sqlite') return true;
	return /^\.openbible\/(?:staging|recovery|locks|logs|tmp|catalog)(?:\/|$)/.test(candidate);
}

function hasControlCharacter(value: string): boolean {
	for (const character of value) {
		const codePoint = character.codePointAt(0) ?? 0;
		if ((codePoint >= 0 && codePoint <= 0x1f) || (codePoint >= 0x7f && codePoint <= 0x9f)) {
			return true;
		}
	}
	return false;
}

export function normalizeBackupPath(path: unknown): string | null {
	if (typeof path !== 'string' || path.length === 0) return null;

	const normalized = path.normalize('NFC');
	const segments = normalized.split('/');
	const bytes = new TextEncoder().encode(normalized).byteLength;
	if (
		normalized.startsWith('/') ||
		normalized.includes('\\') ||
		/^[A-Za-z]:(?:[\\/]|$)/.test(normalized) ||
		hasControlCharacter(normalized) ||
		segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..') ||
		Array.from(normalized).length > BACKUP_LIMITS.maxPathCodePoints ||
		bytes > BACKUP_LIMITS.maxPathBytes ||
		isReservedPath(normalized)
	) {
		return null;
	}

	return normalized;
}

function validateManifestValue(value: unknown): BackupValidationResult {
	const errors: string[] = [];
	if (!isRecord(value)) return { valid: false, errors: ['manifest_not_object'] };

	if (value.format !== BACKUP_FORMAT) addError(errors, 'manifest_format_invalid');
	if (value.formatVersion !== BACKUP_FORMAT_VERSION) addError(errors, 'manifest_version_unsupported');
	if (typeof value.createdAt !== 'string' || Number.isNaN(Date.parse(value.createdAt))) {
		addError(errors, 'manifest_created_at_invalid');
	}

	const source = value.source;
	if (!isRecord(source)) {
		addError(errors, 'manifest_source_invalid');
	} else {
		for (const key of FORBIDDEN_SOURCE_KEYS) {
			if (key in source) addError(errors, `manifest_source_${key}_forbidden`);
		}
		if (source.workspaceId !== undefined && typeof source.workspaceId !== 'string') {
			addError(errors, 'manifest_workspace_id_invalid');
		}
		if (source.displayName !== undefined && typeof source.displayName !== 'string') {
			addError(errors, 'manifest_display_name_invalid');
		}
		if (source.backend !== 'indexeddb' && source.backend !== 'sqlite') {
			addError(errors, 'manifest_backend_invalid');
		}
		if (!isNonNegativeSafeInteger(source.workspaceFormatVersion)) {
			addError(errors, 'manifest_workspace_format_version_invalid');
		}
	}

	const policy = value.policy;
	if (!isRecord(policy)) {
		addError(errors, 'manifest_policy_invalid');
	} else {
		if (policy.bibles !== 'excluded' && policy.bibles !== 'included') {
			addError(errors, 'manifest_bible_policy_invalid');
		}
		if (policy.index !== 'excluded') addError(errors, 'manifest_index_policy_invalid');
		if (policy.deviceState !== 'excluded') addError(errors, 'manifest_device_state_policy_invalid');
	}

	const limits = value.limits;
	if (!isRecord(limits)) {
		addError(errors, 'manifest_limits_invalid');
	} else {
		if (!isNonNegativeSafeInteger(limits.maxEntries) || limits.maxEntries > BACKUP_LIMITS.maxEntries) {
			addError(errors, 'manifest_max_entries_invalid');
		}
		if (
			!isNonNegativeSafeInteger(limits.maxUncompressedBytes) ||
			limits.maxUncompressedBytes > BACKUP_LIMITS.maxUncompressedBytes
		) {
			addError(errors, 'manifest_max_bytes_invalid');
		}
		if (!isNonNegativeSafeInteger(limits.maxEntryBytes) || limits.maxEntryBytes > BACKUP_LIMITS.maxEntryBytes) {
			addError(errors, 'manifest_max_entry_bytes_invalid');
		}
	}

	const totals = value.totals;
	if (!isRecord(totals)) {
		addError(errors, 'manifest_totals_invalid');
	} else {
		if (!isNonNegativeSafeInteger(totals.entries) || totals.entries > BACKUP_LIMITS.maxEntries) {
			addError(errors, 'manifest_total_entries_invalid');
		}
		if (!isNonNegativeSafeInteger(totals.uncompressedBytes) || totals.uncompressedBytes > BACKUP_LIMITS.maxUncompressedBytes) {
			addError(errors, 'manifest_total_bytes_invalid');
		}
	}

	const files = value.files;
	if (!Array.isArray(files)) {
		addError(errors, 'manifest_files_invalid');
	} else {
		if (files.length > BACKUP_LIMITS.maxEntries) addError(errors, 'manifest_entry_limit_exceeded');
		const seen = new Set<string>();
		let previousPath: string | null = null;
		let totalBytes = 0;

		for (const [index, file] of files.entries()) {
			if (!isRecord(file)) {
				addError(errors, `manifest_file_${index}_invalid`);
				continue;
			}
			const path = normalizeBackupPath(file.path);
			if (!path || path !== file.path) addError(errors, `manifest_file_${index}_path_invalid`);
			if (path) {
				const foldedPath = foldPath(path);
				if (seen.has(foldedPath)) addError(errors, 'manifest_duplicate_path');
				seen.add(foldedPath);
				if (previousPath !== null && compareCodeUnits(previousPath, path) >= 0) {
					addError(errors, 'manifest_paths_not_sorted');
				}
				previousPath = path;
			}
			if (!isNonNegativeSafeInteger(file.size) || file.size > BACKUP_LIMITS.maxEntryBytes) {
				addError(errors, `manifest_file_${index}_size_invalid`);
			} else {
				totalBytes += file.size;
			}
			if (typeof file.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(file.sha256)) {
				addError(errors, `manifest_file_${index}_sha256_invalid`);
			}
			if (typeof file.mediaType !== 'string' || !/^[^\s/]+\/[^\s]+$/.test(file.mediaType)) {
				addError(errors, `manifest_file_${index}_media_type_invalid`);
			}
			if (file.role !== 'authorial' && file.role !== 'bible') {
				addError(errors, `manifest_file_${index}_role_invalid`);
			}
		}

		if (isRecord(totals) && totals.entries !== files.length) addError(errors, 'manifest_total_entries_mismatch');
		if (isRecord(totals) && totals.uncompressedBytes !== totalBytes) {
			addError(errors, 'manifest_total_bytes_mismatch');
		}
	}

	if (errors.length > 0) return { valid: false, errors };
	return { valid: true, errors, manifest: value as unknown as BackupManifest };
}

export function canonicalizeBackupManifest(manifest: BackupManifest): string {
	return `${stableStringify(manifest)}\n`;
}

function stableStringify(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
	if (!isRecord(value)) return JSON.stringify(value);
	return `{${Object.keys(value)
		.sort(compareCodeUnits)
		.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
		.join(',')}}`;
}

export function validateBackupManifestValue(value: unknown): BackupValidationResult {
	return validateManifestValue(value);
}

export async function validateBackupManifest(
	_storage: WorkspaceStorage,
	archive: Uint8Array
): Promise<BackupValidationResult> {
	if (archive.byteLength === 0) return { valid: false, errors: ['backup_archive_empty'] };
	if (archive.byteLength > BACKUP_LIMITS.maxManifestBytes) {
		return { valid: false, errors: ['backup_manifest_limit_exceeded'] };
	}

	const text = new TextDecoder().decode(archive);
	try {
		return validateManifestValue(JSON.parse(text));
	} catch {
		return { valid: false, errors: ['backup_manifest_unavailable_or_invalid'] };
	}
}

export function validateRestoreEntry(
	_storage: WorkspaceStorage,
	path: string
): { valid: boolean; reason?: string } {
	if (normalizeBackupPath(path) === null) {
		return { valid: false, reason: 'path_invalid_or_reserved' };
	}
	return { valid: true };
}
