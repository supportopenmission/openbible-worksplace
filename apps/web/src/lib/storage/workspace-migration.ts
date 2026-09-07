import {
	createIndexedDbWorkspaceAdapter,
	INDEXEDDB_WORKSPACE_SCHEMA_VERSION,
	type IndexedDbLegacyMigration,
	type IndexedDbWorkspaceRecord
} from './indexeddb-workspace-adapter';
import { WORKSPACE_MANIFEST_PATH, type WorkspaceManifest } from './workspace-catalog';
import type { WorkspaceStorage } from './types';

const MIGRATION_SOURCE_TYPE = 'legacy-workspace-config';
const MIGRATION_CURSOR_SOURCE_READ = 'source-read';
const MIGRATION_CURSOR_RECORD_WRITE = 'workspace-record';
const MIGRATION_CURSOR_COMPLETED = 'completed';

export interface LegacyWorkspaceSnapshot {
	readonly bytes: Uint8Array;
	readonly value: Record<string, unknown>;
	readonly sourceRef: string;
	readonly sourcePreserved: true;
}

/**
 * Read-only view over the old workspace source. It deliberately exposes no
 * write operation: the migration creates the new record without rewriting
 * `.openbible/config.json` or any other authorial file.
 */
export class LegacyWorkspaceSource {
	constructor(private readonly storage: WorkspaceStorage) {}

	async read(): Promise<LegacyWorkspaceSnapshot | null> {
		const bytes = await this.storage.readFile(WORKSPACE_MANIFEST_PATH);
		if (!bytes) return null;

		let value: unknown;
		try {
			value = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
		} catch {
			return null;
		}
		if (!isRecord(value) || !isLegacyConfig(value)) return null;

		return {
			bytes,
			value,
			sourceRef: WORKSPACE_MANIFEST_PATH,
			sourcePreserved: true
		};
	}
}

export interface LegacyWorkspaceMigrationResult {
	record: IndexedDbWorkspaceRecord;
	/** Compatibilidade de leitura para consumidores do bootstrap anterior. */
	manifest: WorkspaceManifest;
	sourcePreserved: true;
	migrated: boolean;
}

export class WorkspaceMigrationError extends Error {
	readonly code = 'MIGRATION_REQUIRED' as const;
	readonly reasonCode = 'MIGRATION_REQUIRED' as const;
	readonly recoverable = true as const;

	constructor(message: string, cause?: unknown) {
		super(message, { cause });
		this.name = 'WorkspaceMigrationError';
	}
}

type MemoryMigrationState = {
	record: IndexedDbWorkspaceRecord;
	manifest: WorkspaceManifest;
	migration: IndexedDbLegacyMigration;
};

// SSR/Vitest do not provide IndexedDB. This is an ephemeral test/runtime
// double only; the browser path below always uses the versioned adapter.
const memoryMigrations = new Map<string, MemoryMigrationState>();

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isLegacyConfig(value: Record<string, unknown>): boolean {
	return (
		value.version === 1 ||
		typeof value.workspaceId === 'string' ||
		typeof value.label === 'string' ||
		typeof value.name === 'string' ||
		value.storage === 'native' ||
		value.storage === 'local' ||
		value.storage === 'opfs'
	);
}

function nonEmptyString(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const result = value.trim();
	return result.length > 0 ? result : null;
}

function hashBytes(bytes: Uint8Array): string {
	// FNV-1a gives a stable identity for legacy sources that predate
	// workspaceId. It is used only for migration idempotency, not security.
	let hash = 2166136261;
	for (const byte of bytes) {
		hash ^= byte;
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

function workspaceIdFor(
	value: Record<string, unknown>,
	bytes: Uint8Array,
	storage: WorkspaceStorage
): string {
	const explicitId = nonEmptyString(value.workspaceId);
	if (explicitId) return explicitId;
	return `legacy-${storage.kind}-${hashBytes(bytes)}`;
}

function isoDate(value: unknown, fallback: string): string {
	const candidate = nonEmptyString(value);
	if (!candidate) return fallback;
	const timestamp = Date.parse(candidate);
	return Number.isNaN(timestamp) ? fallback : new Date(timestamp).toISOString();
}

function metadataFor(
	value: Record<string, unknown>,
	storage: WorkspaceStorage,
	sourceRef: string
): string {
	return JSON.stringify({
		sourceType: MIGRATION_SOURCE_TYPE,
		sourceRef,
		sourcePreserved: true,
		legacyVersion: typeof value.version === 'number' ? value.version : null,
		storageKind: storage.kind,
		legacyLabel: nonEmptyString(value.label) ?? storage.label
	});
}

function buildRecord(
	snapshot: LegacyWorkspaceSnapshot,
	storage: WorkspaceStorage
): IndexedDbWorkspaceRecord {
	const now = new Date().toISOString();
	const configuredAt = isoDate(snapshot.value.configuredAt, now);
	return {
		workspaceId: workspaceIdFor(snapshot.value, snapshot.bytes, storage),
		name:
			nonEmptyString(snapshot.value.name) ??
			nonEmptyString(snapshot.value.label) ??
			storage.label,
		status: 'ready',
		schemaVersion: INDEXEDDB_WORKSPACE_SCHEMA_VERSION,
		createdAt: configuredAt,
		updatedAt: now,
		lastOpenedAt: now,
		metadataJson: metadataFor(snapshot.value, storage, snapshot.sourceRef)
	};
}

function buildCompatibilityManifest(
	snapshot: LegacyWorkspaceSnapshot,
	record: IndexedDbWorkspaceRecord,
	storage: WorkspaceStorage
): WorkspaceManifest {
	const bibleImportStatus =
		snapshot.value.bibleImportStatus === 'complete' ||
		snapshot.value.bibleImportStatus === 'partial'
			? snapshot.value.bibleImportStatus
			: 'pending';
	return {
		workspaceId: record.workspaceId,
		formatVersion: 2,
		name: record.name,
		managedRoot: storage.kind !== 'local',
		version: 1,
		storage: storage.kind,
		configuredAt: record.createdAt,
		bibleImportStatus,
		label: record.name
	};
}

function migrationKey(record: IndexedDbWorkspaceRecord): string {
	return `${MIGRATION_SOURCE_TYPE}:${record.workspaceId}`;
}

function migrationRecord(
	record: IndexedDbWorkspaceRecord,
	state: IndexedDbLegacyMigration['state'],
	cursor: string,
	errorCode: string | null = null,
	previous?: IndexedDbLegacyMigration
): IndexedDbLegacyMigration {
	const now = new Date().toISOString();
	return {
		migrationKey: migrationKey(record),
		sourceType: MIGRATION_SOURCE_TYPE,
		sourceRef: WORKSPACE_MANIFEST_PATH,
		workspaceId: record.workspaceId,
		state,
		cursor,
		errorCode,
		createdAt: previous?.createdAt ?? now,
		updatedAt: now
	};
}

function completedResult(
	record: IndexedDbWorkspaceRecord,
	manifest: WorkspaceManifest,
	migrated: boolean
): LegacyWorkspaceMigrationResult {
	return { record, manifest, sourcePreserved: true, migrated };
}

async function migrateInMemory(
	record: IndexedDbWorkspaceRecord,
	manifest: WorkspaceManifest
): Promise<LegacyWorkspaceMigrationResult> {
	const key = migrationKey(record);
	const previous = memoryMigrations.get(key);
	if (previous?.migration.state === 'completed') {
		return completedResult(previous.record, previous.manifest, false);
	}

	const running = migrationRecord(
		record,
		'running',
		MIGRATION_CURSOR_RECORD_WRITE,
		null,
		previous?.migration
	);
	memoryMigrations.set(key, { record, manifest, migration: running });
	const completed = migrationRecord(
		record,
		'completed',
		MIGRATION_CURSOR_COMPLETED,
		null,
		running
	);
	memoryMigrations.set(key, { record, manifest, migration: completed });
	return completedResult(record, manifest, true);
}

async function migrateInIndexedDb(
	record: IndexedDbWorkspaceRecord,
	manifest: WorkspaceManifest
): Promise<LegacyWorkspaceMigrationResult> {
	const adapter = createIndexedDbWorkspaceAdapter();
	await adapter.ensureSchema();
	const key = migrationKey(record);
	const previous = await adapter.readMigration(key);
	if (previous?.state === 'completed' && previous.workspaceId) {
		const existing = await adapter.readWorkspace(previous.workspaceId);
		if (existing) return completedResult(existing, manifest, false);
	}

	const existing = await adapter.readWorkspace(record.workspaceId);
	if (existing) {
		const completed = migrationRecord(
			existing,
			'completed',
			MIGRATION_CURSOR_COMPLETED,
			null,
			previous ?? undefined
		);
		await adapter.writeMigration(completed);
		return completedResult(existing, manifest, false);
	}

	const running = migrationRecord(
		record,
		'running',
		MIGRATION_CURSOR_RECORD_WRITE,
		null,
		previous ?? undefined
	);
	await adapter.writeMigration(running);
	await adapter.writeWorkspace(record);
	const completed = migrationRecord(
		record,
		'completed',
		MIGRATION_CURSOR_COMPLETED,
		null,
		running
	);
	await adapter.writeMigration(completed);
	return completedResult(record, manifest, true);
}

export async function migrateLegacyWorkspaceSource(
	storage: WorkspaceStorage
): Promise<LegacyWorkspaceMigrationResult | null> {
	const source = new LegacyWorkspaceSource(storage);
	const snapshot = await source.read();
	if (!snapshot) return null;
	const record = buildRecord(snapshot, storage);
	const manifest = buildCompatibilityManifest(snapshot, record, storage);

	if (typeof globalThis.indexedDB === 'undefined') {
		return migrateInMemory(record, manifest);
	}

	try {
		return await migrateInIndexedDb(record, manifest);
	} catch (error) {
		// Keep the failed cursor available for a later retry when the adapter
		// itself could be opened. The source remains untouched in every case.
		try {
			const adapter = createIndexedDbWorkspaceAdapter();
			await adapter.ensureSchema();
			const previous = await adapter.readMigration(migrationKey(record));
			await adapter.writeMigration(
				migrationRecord(
					record,
					'error',
					previous?.cursor ?? MIGRATION_CURSOR_SOURCE_READ,
					error instanceof Error ? error.name : 'MIGRATION_FAILED',
					previous ?? undefined
				)
			);
		} catch {
			// A schema failure is reported by the caller; do not touch the source.
		}
		throw new WorkspaceMigrationError(
			'A migração do workspace não pôde concluir. A fonte legada foi preservada; tente novamente.',
			error
		);
	}
}
