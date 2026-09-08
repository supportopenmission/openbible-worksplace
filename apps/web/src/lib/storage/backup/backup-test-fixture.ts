import { prepareWorkspace } from '../workspace';
import type { FileContent, StorageKind, WorkspaceStorage, WorkspaceStorageEntry } from '../types';

export class BackupMemoryStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	readonly directories = new Set<string>();
	readonly label = 'Fixture de backup';

	constructor(readonly kind: StorageKind = 'opfs') {}

	async ensureDirectory(path: string) {
		this.directories.add(path);
	}

	async writeFile(path: string, content: FileContent) {
		this.files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
	}

	async readFile(path: string) {
		return this.files.get(path) ?? null;
	}

	async fileExists(path: string) {
		return this.files.has(path);
	}

	async listFiles(path: string) {
		const prefix = `${path.replace(/\/$/, '')}/`;
		return [...this.files.keys()]
			.filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
			.map((file) => file.slice(prefix.length))
			.sort();
	}

	async listEntries(path: string): Promise<WorkspaceStorageEntry[]> {
		const prefix = path ? `${path.replace(/\/$/, '')}/` : '';
		const entries = new Map<string, WorkspaceStorageEntry>();
		for (const directory of this.directories) {
			if (!directory.startsWith(prefix)) continue;
			const name = directory.slice(prefix.length).split('/')[0];
			if (name) entries.set(name, { name, kind: 'directory' });
		}
		for (const file of this.files.keys()) {
			if (!file.startsWith(prefix)) continue;
			const remaining = file.slice(prefix.length);
			const name = remaining.split('/')[0];
			const isDir = remaining.includes('/');
			if (name && !entries.has(name)) entries.set(name, { name, kind: isDir ? 'directory' : 'file' });
		}
		return [...entries.values()].sort((left, right) => left.name.localeCompare(right.name));
	}
}

export type BackupWorkspaceApi = {
	createBackupSnapshot: (storage: WorkspaceStorage) => Promise<{ generation: number; files: number }>;
	enumerateBackupEntries: (storage: WorkspaceStorage, options?: { includeBibles?: boolean }) => AsyncIterable<{
		path: string;
		size: number;
		sha256: string;
	}>;
	writeBackupArchive: (storage: WorkspaceStorage, options?: { includeBibles?: boolean }) => Promise<Uint8Array>;
	readBackupExclusions: (storage: WorkspaceStorage) => Promise<Array<{ category: string; count: number }>>;
	resolveBibleBackupPolicy: (storage: WorkspaceStorage, includeBibles: boolean) => Promise<{ included: string[]; omitted: string[] }>;
	validateBackupManifest: (storage: WorkspaceStorage, archive: Uint8Array) => Promise<{ valid: boolean; errors: string[] }>;
	streamBackupEntry: (storage: WorkspaceStorage, path: string) => AsyncIterable<Uint8Array>;
	validateRestoreEntry: (storage: WorkspaceStorage, path: string) => { valid: boolean; reason?: string };
	restoreIntoStaging: (storage: WorkspaceStorage, archive: Uint8Array) => Promise<{ status: 'staged' | 'recoverable' }>;
	createRestoredWorkspace: (storage: WorkspaceStorage, archive: Uint8Array) => Promise<{ workspaceId: string }>;
	findRestoreConflicts: (storage: WorkspaceStorage, archive: Uint8Array) => Promise<Array<{ path: string; reason: string }>>;
	rebuildDerivedIndex: (storage: WorkspaceStorage) => Promise<{ status: 'rebuilt' | 'deferred' }>;
	openAfterIndexFailure: (storage: WorkspaceStorage) => Promise<{ available: boolean; nextAction: string }>;
	buildOperationReport: (storage: WorkspaceStorage) => { phase: string; nextAction: string; omitted: string[] };
};

export async function createPreparedBackupStorage(kind: StorageKind = 'opfs') {
	const storage = new BackupMemoryStorage(kind);
	await prepareWorkspace(storage);
	await storage.writeFile('notes/theology/backup-fixture.md', '# Fixture\n');
	await storage.writeFile('notes/theology/nested/backup-fixture.json', '{"fixture":true}\n');
	return storage;
}
