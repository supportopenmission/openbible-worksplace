import { emptyIndexSqlite, isSQLite } from './empty-sqlite';
import { saveLocalWorkspaceHandle } from './local-storage';
import { loadWorkspacePreferences, PREFERENCES_PATH } from './preferences';
import type { ImportResult, ProgressCallback, WorkspaceConfig, WorkspaceStorage } from './types';
import { enumerateBackupEntries } from './backup/backup-enumerator';
import {
	attachCatalogMethods,
	ensureManifest,
	getCatalogEntry,
	setActiveWorkspace,
	upsertCatalogEntry
} from './workspace-catalog';
import { bindWorkspaceStorage } from './workspace-content-storage';
import { ensureNativeWorkspace, initializeNativeWorkspace } from './tauri-storage';
import { isTauriRuntime } from './tauri-runtime';
export { validateBackupManifest, validateRestoreEntry } from './backup/backup-contract';
export {
	enumerateBackupEntries,
	enumerateWorkspaceContent,
	readBackupExclusions,
	readWorkspaceContentExclusions,
	resolveBibleBackupPolicy
} from './backup/backup-enumerator';
export { readBackupArchive, readBackupManifest, writeBackupArchive } from './backup/backup-archive';
export {
	createRestoredWorkspace,
	findRestoreConflicts,
	validateRestoreArchive
} from './backup/backup-restore';
export {
	commitRestoreStaging,
	discardStaging,
	getRestoreStaging,
	recoverStaging,
	restoreIntoStaging,
	rollbackRestoreStaging
} from './backup/backup-staging';
export {
	createIndexedDbContentDriver,
	createIndexedDbContentRepository,
	createNativeSqliteContentDriver,
	createNativeSqliteContentPort,
	createNativeSqliteContentRepository,
	createWorkspaceStorageBackupSink
} from './backup/backup-adapters';
export {
	buildOperationReport,
	buildOperationReportAsync,
	openAfterIndexFailure,
	rebuildDerivedIndex
} from './backup/backup-report';
type SyncWorkspaceCommand =
	import('$lib/features/sync/sync-document-registry').SyncWorkspaceCommand;
type SyncWorkspaceManifest =
	import('$lib/features/sync/sync-document-registry').SyncWorkspaceManifest;

/**
 * Mantém o runtime de sincronização fora do bootstrap da aplicação. O módulo
 * de sincronização inicializa Automerge/WASM e só é necessário ao executar um
 * comando de sync.
 */
export async function syncWorkspace(
	storage: WorkspaceStorage,
	command: SyncWorkspaceCommand
): Promise<SyncWorkspaceManifest> {
	const { syncWorkspace: runSyncWorkspace } =
		await import('$lib/features/sync/sync-document-registry');
	return runSyncWorkspace(storage, command);
}
export { executeAgent } from '$lib/features/ai/agent-command';
export {
	createIndexedDbSyncStorageAdapter,
	createNativeSqliteSyncStorageAdapter,
	syncRecordFromContent
} from '$lib/features/sync/sync-storage-adapters';
export { createSyncMaterializer, SyncMaterializer } from '$lib/features/sync/sync-materializer';
export { createSyncPeerPolicy, SyncPeerPolicy } from '$lib/features/sync/peer-policy';

const BACKUP_STREAM_CHUNK_BYTES = 16 * 1024 * 1024;

/** Compatibility seam for the original snapshot RED; the current backup flow uses BackupRestorePanel. */
export async function createBackupSnapshot(
	storage: WorkspaceStorage
): Promise<{ generation: number; files: number }> {
	let files = 0;
	for await (const entry of enumerateBackupEntries(storage)) {
		if (entry.path) files += 1;
	}
	return { generation: 1, files };
}

/** Compatibility seam for the original streaming RED, bounded to the backup memory contract. */
export async function* streamBackupEntry(
	storage: WorkspaceStorage,
	path: string
): AsyncIterable<Uint8Array> {
	const bytes = await storage.readFile(path);
	if (!bytes) return;
	for (let offset = 0; offset < bytes.byteLength; offset += BACKUP_STREAM_CHUNK_BYTES) {
		yield bytes.slice(offset, offset + BACKUP_STREAM_CHUNK_BYTES);
	}
}

export const WORKSPACE_DIRECTORIES = [
	'.openbible',
	'bibles',
	'sermons/drafts',
	'sermons/preached',
	'sermons/series',
	'studies/characters',
	'studies/themes',
	'studies/books',
	'templates',
	'attachments/images',
	'attachments/audio',
	'attachments/pdf',
	'attachments/files'
] as const;

const template = (type: string, heading: string) =>
	`---\ntitle: ""\ncreatedAt: ""\nupdatedAt: ""\ntype: "${type}"\n---\n\n# ${heading}\n`;

export const WORKSPACE_FILES = [
	{
		path: '.openbible/sync.json',
		content: '{\n  "version": 1,\n  "enabled": false,\n  "lastSyncAt": null\n}\n'
	},
	{ path: 'templates/sermon.md', content: template('sermon', 'Novo sermão') },
	{ path: 'templates/study.md', content: template('study', 'Novo estudo') }
] as const;

function decodeJson<T>(bytes: Uint8Array | null): T | null {
	if (!bytes) return null;
	try {
		return JSON.parse(new TextDecoder().decode(bytes)) as T;
	} catch {
		return null;
	}
}

export async function prepareWorkspace(
	storage: WorkspaceStorage,
	onProgress: ProgressCallback = () => undefined
): Promise<void> {
	if (storage.kind === 'native') {
		const record = await ensureNativeWorkspace({
			workspaceId: storage.workspaceId,
			name: storage.label,
			status: 'ready'
		});
		storage.workspaceId = record.workspaceId;
		storage.label = record.name;
		bindWorkspaceStorage(storage, record.workspaceId);
		upsertCatalogEntry({
			workspaceId: record.workspaceId,
			nameCache: record.name,
			storageKind: 'native',
			lastOpenedAt: record.lastOpenedAt,
			status: 'ready'
		});
		setActiveWorkspace(record.workspaceId);
		attachCatalogMethods(storage);
		// Bíblias SQLite são recursos compatíveis armazenados na área interna da
		// instalação; a identidade e o conteúdo autoral continuam no app.sqlite.
		if (isTauriRuntime()) await initializeNativeWorkspace();
		onProgress(1);
		return;
	}

	const steps = WORKSPACE_DIRECTORIES.length + WORKSPACE_FILES.length + 4;
	let completed = 0;
	const advance = () => {
		completed += 1;
		onProgress(completed / steps);
	};

	for (const directory of WORKSPACE_DIRECTORIES) {
		await storage.ensureDirectory(directory);
		advance();
	}

	// Manifesto v2 idempotente: cria ou migra sem mover conteúdo autoral.
	const manifest = await ensureManifest(storage);
	if (manifest) {
		bindWorkspaceStorage(storage, manifest.workspaceId);
		if (storage.kind === 'local' && storage.localHandle) {
			// Um handle por workspace evita que a última pasta escolhida substitua
			// as demais após um reload. O bootstrap sem ID continua usando a chave
			// legada `default` até ler o manifesto.
			await saveLocalWorkspaceHandle(storage.localHandle, manifest.workspaceId);
		}
		if (!getCatalogEntry(manifest.workspaceId)) {
			upsertCatalogEntry({
				workspaceId: manifest.workspaceId,
				nameCache: manifest.name,
				storageKind: storage.kind,
				localRef: storage.kind === 'local' ? storage.localHandle : undefined,
				lastOpenedAt: new Date().toISOString(),
				status: 'ready'
			});
		}
	}
	attachCatalogMethods(storage);
	advance();

	const indexPath = '.openbible/index.sqlite';
	const indexBytes = await storage.readFile(indexPath);
	if (!indexBytes || !isSQLite(indexBytes)) {
		await storage.writeFile(indexPath, emptyIndexSqlite());
	}
	advance();

	if (!(await storage.fileExists(PREFERENCES_PATH))) {
		await loadWorkspacePreferences(storage);
	}
	advance();

	for (const file of WORKSPACE_FILES) {
		if (!(await storage.fileExists(file.path))) await storage.writeFile(file.path, file.content);
		advance();
	}

	try {
		const { rebuildWorkspaceIndex } = await import('$lib/features/notes/index-rebuilder');
		await rebuildWorkspaceIndex(storage);
	} catch {
		// A rebuild failure leaves primary records and the legacy source untouched.
	}
	advance();
}

export async function loadWorkspaceConfig(
	storage: WorkspaceStorage
): Promise<WorkspaceConfig | null> {
	const bytes = await storage.readFile('.openbible/config.json');
	const raw = decodeJson<
		WorkspaceConfig & {
			path?: string;
			storageKind?: string;
			formatVersion?: number;
			workspaceId?: string;
			name?: string;
			managedRoot?: boolean;
			migrationState?: string;
		}
	>(bytes);
	// Manifesto v2: identidade portátil + compatibilidade legada.
	if (raw && raw.formatVersion === 2 && typeof raw.workspaceId === 'string') {
		if (!raw.workspaceId || !raw.name || typeof raw.managedRoot !== 'boolean') return null;
		const storageKind =
			raw.storage === 'local' || raw.storage === 'opfs' || raw.storage === 'native'
				? raw.storage
				: storage.kind;
		if (storageKind !== storage.kind) return null;
		const bibleImportStatus =
			raw.bibleImportStatus === 'pending' ||
			raw.bibleImportStatus === 'complete' ||
			raw.bibleImportStatus === 'partial'
				? raw.bibleImportStatus
				: 'pending';
		return {
			version: 1,
			storage: storageKind,
			configuredAt:
				typeof raw.configuredAt === 'string' && raw.configuredAt.length > 0
					? raw.configuredAt
					: new Date().toISOString(),
			bibleImportStatus,
			label: typeof raw.label === 'string' && raw.label ? raw.label : (raw.name as string)
		};
	}
	const config = raw?.version
		? raw
		: raw?.formatVersion === 1 && raw.storageKind === 'native'
			? {
					version: 1 as const,
					storage: 'native' as const,
					configuredAt: new Date().toISOString(),
					bibleImportStatus: 'pending' as const,
					label: raw.path,
					migrationState: (raw.migrationState === 'completed' || raw.migrationState === 'error'
						? raw.migrationState
						: 'not_started') as 'not_started' | 'completed' | 'error'
				}
			: null;
	if (!config || config.version !== 1 || config.storage !== storage.kind) return null;
	if (!['pending', 'complete', 'partial'].includes(config.bibleImportStatus)) return null;
	return config;
}

export async function importBibleFiles(
	storage: WorkspaceStorage,
	files: File[],
	onProgress: ProgressCallback = () => undefined
): Promise<ImportResult[]> {
	const results: ImportResult[] = [];
	if (files.length === 0) return results;

	for (const [index, file] of files.entries()) {
		const name = file.name;
		const destination = `bibles/${name}`;
		let result: ImportResult;

		if (!name.toLowerCase().endsWith('.sqlite')) {
			result = { name, status: 'rejected', reason: 'invalid-sqlite' };
		} else if (await storage.fileExists(destination)) {
			result = { name, status: 'rejected', reason: 'duplicate' };
		} else {
			const bytes = new Uint8Array(await file.arrayBuffer());
			if (!isSQLite(bytes)) {
				result = { name, status: 'rejected', reason: 'invalid-sqlite' };
			} else {
				try {
					await storage.writeFile(destination, bytes);
					result = { name, status: 'imported' };
				} catch {
					result = { name, status: 'rejected', reason: 'copy-failed' };
				}
			}
		}

		results.push(result);
		onProgress((index + 1) / files.length);
	}

	const config = decodeJson<WorkspaceConfig>(await storage.readFile('.openbible/config.json'));
	if (config) {
		const imported = results.some((result) => result.status === 'imported');
		const status = imported
			? results.every((result) => result.status === 'imported')
				? 'complete'
				: 'partial'
			: config.bibleImportStatus;
		await storage.writeFile(
			'.openbible/config.json',
			`${JSON.stringify({ ...config, bibleImportStatus: status }, null, 2)}\n`
		);
	}

	if (results.some((result) => result.status === 'imported')) {
		try {
			const { populateTranslationsFromStorage } = await import('$lib/bible/parser/translations');
			await populateTranslationsFromStorage(storage);
		} catch {
			// Não bloqueia o resultado da importação se a leitura do catálogo falhar
		}
	}

	return results;
}
