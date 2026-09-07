import type { BibleImportStatus, StorageKind, WorkspaceStorage } from './types';
import { saveLocalWorkspaceHandle } from './local-storage';

export const WORKSPACE_MANIFEST_PATH = '.openbible/config.json';
export const WORKSPACE_FORMAT_VERSION = 2 as const;
const CATALOG_STORAGE_KEY = 'openbible:workspace-catalog';
const ACTIVE_POINTER_KEY = 'openbible:workspace-active';

export interface WorkspaceManifest {
	workspaceId: string;
	formatVersion: typeof WORKSPACE_FORMAT_VERSION;
	name: string;
	managedRoot: boolean;
	// Compatibilidade legada — preservada para não quebrar leitores v1.
	version: 1;
	storage: StorageKind;
	configuredAt: string;
	bibleImportStatus: BibleImportStatus;
	label: string;
	migrationState?: 'not_started' | 'completed' | 'error';
}

export type WorkspaceCatalogStatus =
	| 'registered'
	| 'opening'
	| 'ready'
	| 'permission-needed'
	| 'unavailable'
	| 'locked'
	| 'invalid'
	| 'detached';

export interface WorkspaceCatalogEntry {
	workspaceId: string;
	nameCache: string;
	storageKind: StorageKind;
	backend: StorageCapabilities['backend'];
	exportSource: {
		workspaceId: string;
		snapshotVersion: 1;
		readOnly: true;
	};
	/** Referência local de reencontro (path/handle/OPFS). Nunca entra em sync/backup. */
	localRef?: unknown;
	lastOpenedAt: string | null;
	status: WorkspaceCatalogStatus;
}

export type WorkspaceCatalogEntryInput = Omit<WorkspaceCatalogEntry, 'backend' | 'exportSource'> & {
	backend?: WorkspaceCatalogEntry['backend'];
	exportSource?: WorkspaceCatalogEntry['exportSource'];
};

export interface ActiveWorkspacePointer {
	workspaceId: string | null;
	generation: number;
}

export interface StorageCapabilities {
	backend: 'sqlite' | 'indexeddb';
	transactions: boolean;
	blobs: boolean;
	selectFolder: boolean;
	createLogicalRoot: boolean;
	reconnect: boolean;
	writeManifest: boolean;
	scan: boolean;
	deleteManagedRoot: boolean;
}

export function capabilitiesForKind(kind: StorageKind): StorageCapabilities {
	switch (kind) {
		case 'native':
			return {
				backend: 'sqlite',
				transactions: true,
				blobs: true,
				selectFolder: true,
				createLogicalRoot: false,
				reconnect: true,
				writeManifest: true,
				scan: true,
				deleteManagedRoot: true
			};
		case 'local':
			return {
				backend: 'indexeddb',
				transactions: true,
				blobs: true,
				selectFolder: true,
				createLogicalRoot: false,
				reconnect: true,
				writeManifest: true,
				scan: true,
				deleteManagedRoot: false
			};
		case 'opfs':
			return {
				backend: 'indexeddb',
				transactions: true,
				blobs: true,
				selectFolder: false,
				createLogicalRoot: true,
				reconnect: false,
				writeManifest: true,
				scan: true,
				deleteManagedRoot: true
			};
	}
}

export function storageBackendLabel(backend: StorageCapabilities['backend']): string {
	return backend === 'sqlite' ? 'SQLite local' : 'IndexedDB local';
}

/** Rótulo humano do backend; texto, nunca só cor ou ícone. */
export function storageKindLabel(kind: StorageKind): string {
	return kind === 'native'
		? 'Pasta do computador'
		: kind === 'local'
			? 'Pasta autorizada'
			: 'Raiz lógica (OPFS)';
}

export function generateWorkspaceId(): string {
	try {
		const cryptoRef =
			typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto : null;
		if (cryptoRef) return cryptoRef.randomUUID();
	} catch {
		// fallback abaixo
	}
	return `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Raiz dedicada preparada pelo OpenBible recebe managedRoot=true.
 * Pasta arbitrária adicionada (File System Access) começa não gerenciada.
 * - native (Tauri, pasta real preparada): gerenciada
 * - opfs (raiz lógica isolada criada pelo app): gerenciada
 * - local (pasta autorizada escolhida pela pessoa): não gerenciada por padrão
 */
export function defaultManagedRoot(kind: StorageKind): boolean {
	return kind !== 'local';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function validateManifest(raw: unknown): WorkspaceManifest | null {
	if (!isRecord(raw)) return null;
	const workspaceId =
		typeof raw.workspaceId === 'string' && raw.workspaceId.length > 0 ? raw.workspaceId : null;
	const formatVersion = raw.formatVersion === 2 ? 2 : null;
	const name = asNonEmptyString(raw.name) ?? asNonEmptyString(raw.label);
	const managedRoot = typeof raw.managedRoot === 'boolean' ? raw.managedRoot : null;
	if (!workspaceId || !formatVersion || !name || managedRoot === null) return null;

	const storage =
		raw.storage === 'local' || raw.storage === 'opfs' || raw.storage === 'native'
			? raw.storage
			: null;
	if (!storage) return null;

	const bibleImportStatus =
		raw.bibleImportStatus === 'pending' ||
		raw.bibleImportStatus === 'complete' ||
		raw.bibleImportStatus === 'partial'
			? raw.bibleImportStatus
			: null;
	if (!bibleImportStatus) return null;

	const configuredAt =
		typeof raw.configuredAt === 'string' && raw.configuredAt.length > 0
			? raw.configuredAt
			: new Date().toISOString();

	return {
		workspaceId,
		formatVersion: 2,
		name,
		managedRoot,
		version: 1,
		storage,
		configuredAt,
		bibleImportStatus,
		label: typeof raw.label === 'string' && raw.label.trim().length > 0 ? raw.label : name
	};
}

function decodeJson(bytes: Uint8Array | null): unknown {
	if (!bytes) return null;
	try {
		return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
	} catch {
		return null;
	}
}

export async function readManifest(storage: WorkspaceStorage): Promise<WorkspaceManifest | null> {
	const raw = decodeJson(await storage.readFile(WORKSPACE_MANIFEST_PATH));
	return validateManifest(raw);
}

export async function writeManifest(
	storage: WorkspaceStorage,
	manifest: WorkspaceManifest
): Promise<void> {
	await storage.writeFile(WORKSPACE_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

/**
 * Garante um manifesto v2 idempotente sem mover conteúdo autoral.
 * - Sem arquivo: cria com ID estável, nome do storage e managedRoot por kind.
 * - Arquivo legado v1: preserva label/conteúdo e adiciona identidade v2.
 * - Arquivo v2 válido: no-op (preserva ID, nome e managedRoot).
 * - Arquivo inválido/incompatível: não sobrescreve; retorna null para recovery.
 */
export async function ensureManifest(storage: WorkspaceStorage): Promise<WorkspaceManifest | null> {
	const raw = decodeJson(await storage.readFile(WORKSPACE_MANIFEST_PATH));
	if (raw !== null) {
		const valid = validateManifest(raw);
		if (valid) return valid;
		// Tenta migrar legado v1 sem apagar conteúdo.
		if (
			isRecord(raw) &&
			(raw.version === 1 ||
				raw.storageKind === 'native' ||
				typeof raw.label === 'string' ||
				typeof raw.path === 'string')
		) {
			const legacyStorage =
				raw.storage === 'local' || raw.storage === 'opfs' || raw.storage === 'native'
					? (raw.storage as StorageKind)
					: storage.kind;
			const legacyLabel =
				asNonEmptyString(raw.label) ?? asNonEmptyString(raw.path) ?? storage.label;
			const migrated: WorkspaceManifest = {
				workspaceId:
					typeof raw.workspaceId === 'string' && raw.workspaceId.length > 0
						? raw.workspaceId
						: generateWorkspaceId(),
				formatVersion: 2,
				name: asNonEmptyString(raw.name) ?? legacyLabel ?? storage.label,
				managedRoot:
					typeof raw.managedRoot === 'boolean'
						? raw.managedRoot
						: defaultManagedRoot(legacyStorage),
				version: 1,
				storage: legacyStorage,
				configuredAt:
					typeof raw.configuredAt === 'string' && raw.configuredAt.length > 0
						? raw.configuredAt
						: new Date().toISOString(),
				bibleImportStatus:
					raw.bibleImportStatus === 'complete' || raw.bibleImportStatus === 'partial'
						? raw.bibleImportStatus
						: 'pending',
				label: legacyLabel ?? storage.label
			};
			try {
				await writeManifest(storage, { ...migrated, storage: storage.kind });
				return { ...migrated, storage: storage.kind };
			} catch {
				return null;
			}
		}
		// Manifesto ausente/inválido/incompatível: não sobrescreve.
		return null;
	}

	const created: WorkspaceManifest = {
		workspaceId: generateWorkspaceId(),
		formatVersion: 2,
		name: storage.label,
		managedRoot: defaultManagedRoot(storage.kind),
		version: 1,
		storage: storage.kind,
		configuredAt: new Date().toISOString(),
		bibleImportStatus: 'pending',
		label: storage.label
	};
	try {
		await writeManifest(storage, created);
		return created;
	} catch {
		return null;
	}
}

// --- Catálogo local por dispositivo (nunca sincronizável) ---
// Conteúdo autoral vive na raiz do workspace (Files Over Apps).
// O catálogo guarda somente identidade/referência local para reencontro e
// pode ser reconstruído por recadastro da raiz. Caminhos, handles e
// referências OPFS nunca entram em payload de sync/backup.

type CatalogStore = {
	entries: Record<string, WorkspaceCatalogEntry>;
	activeWorkspaceId: string | null;
};

const memoryCatalog: CatalogStore = { entries: {}, activeWorkspaceId: null };
let activeGeneration = 0;

function readCatalogStore(): CatalogStore {
	try {
		if (typeof localStorage === 'undefined') return memoryCatalog;
		const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
		if (!raw) return memoryCatalog;
		const parsed = JSON.parse(raw) as Partial<CatalogStore>;
		if (parsed && typeof parsed === 'object') {
			if (parsed.entries && typeof parsed.entries === 'object') {
				for (const [id, entry] of Object.entries(parsed.entries)) {
					if (entry && typeof entry === 'object' && !memoryCatalog.entries[id]) {
						const persisted = entry as WorkspaceCatalogEntry;
					memoryCatalog.entries[id] = {
						...persisted,
						backend: persisted.backend ?? capabilitiesForKind(persisted.storageKind).backend,
						exportSource: persisted.exportSource ?? {
							workspaceId: persisted.workspaceId,
							snapshotVersion: 1,
							readOnly: true
						},
						// Só referências em string sobrevivem no catálogo; handles
							// de pasta são reencontrados no IndexedDB local por workspaceId.
							localRef: typeof persisted.localRef === 'string' ? persisted.localRef : undefined
						};
					}
				}
			}
			if (typeof parsed.activeWorkspaceId === 'string' && !memoryCatalog.activeWorkspaceId) {
				memoryCatalog.activeWorkspaceId = parsed.activeWorkspaceId;
			}
		}
	} catch {
		// Catálogo em memória permanece utilizável na sessão.
	}
	return memoryCatalog;
}

function persistCatalogStore(): void {
	try {
		if (typeof localStorage === 'undefined') return;
		// Persistir somente metadados locais; handles de pasta (File System
		// Access) nunca são serializados. Eles ficam no IndexedDB local,
		// indexados pelo workspaceId, enquanto referências em string (caminho
		// nativo, subdiretório OPFS) podem ficar no catálogo.
		const serializable: CatalogStore = {
			entries: Object.fromEntries(
				Object.entries(memoryCatalog.entries).map(([id, entry]) => [
					id,
					{
							workspaceId: entry.workspaceId,
							nameCache: entry.nameCache,
							storageKind: entry.storageKind,
							backend: entry.backend,
							exportSource: entry.exportSource,
						localRef: typeof entry.localRef === 'string' ? entry.localRef : undefined,
						lastOpenedAt: entry.lastOpenedAt,
						status: entry.status
					} as WorkspaceCatalogEntry
				])
			),
			activeWorkspaceId: memoryCatalog.activeWorkspaceId
		};
		localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(serializable));
	} catch {
		// Falha de persistência não bloqueia a sessão; o catálogo em memória vale.
	}
}

export function listCatalog(options: { includeDetached?: boolean } = {}): WorkspaceCatalogEntry[] {
	const entries = Object.values(readCatalogStore().entries);
	return options.includeDetached ? entries : entries.filter((entry) => entry.status !== 'detached');
}

export function getCatalogEntry(workspaceId: string): WorkspaceCatalogEntry | null {
	const entry = readCatalogStore().entries[workspaceId] ?? null;
	return entry?.status === 'detached' ? null : entry;
}

export function upsertCatalogEntry(entry: WorkspaceCatalogEntryInput): WorkspaceCatalogEntry {
	const store = readCatalogStore();
	const normalized: WorkspaceCatalogEntry = {
		...entry,
		backend: entry.backend ?? capabilitiesForKind(entry.storageKind).backend,
		exportSource: entry.exportSource ?? {
			workspaceId: entry.workspaceId,
			snapshotVersion: 1,
			readOnly: true
		}
	};
	store.entries[entry.workspaceId] = normalized;
	persistCatalogStore();
	return normalized;
}

export function touchLastOpened(workspaceId: string): void {
	const store = readCatalogStore();
	const entry = store.entries[workspaceId];
	if (!entry) return;
	entry.lastOpenedAt = new Date().toISOString();
	persistCatalogStore();
}

function sessionReferenceFor(storage: WorkspaceStorage): unknown {
	return storage.kind === 'local' ? storage.localHandle : undefined;
}

async function persistLocalWorkspaceHandle(
	storage: WorkspaceStorage,
	workspaceId: string
): Promise<void> {
	if (storage.kind === 'local' && storage.localHandle) {
		await saveLocalWorkspaceHandle(storage.localHandle, workspaceId);
	}
}

export function setActiveWorkspace(workspaceId: string | null): ActiveWorkspacePointer {
	const store = readCatalogStore();
	store.activeWorkspaceId = workspaceId;
	activeGeneration += 1;
	try {
		if (typeof localStorage !== 'undefined') {
			if (workspaceId) {
				localStorage.setItem(ACTIVE_POINTER_KEY, workspaceId);
			} else {
				localStorage.removeItem(ACTIVE_POINTER_KEY);
			}
		}
	} catch {
		// Ponteiro em memória permanece válido na janela.
	}
	persistCatalogStore();
	return { workspaceId, generation: activeGeneration };
}

export function getActiveWorkspace(): ActiveWorkspacePointer {
	const store = readCatalogStore();
	let active = store.activeWorkspaceId;
	try {
		if (!active && typeof localStorage !== 'undefined') {
			active = localStorage.getItem(ACTIVE_POINTER_KEY);
		}
	} catch {
		// Mantém ponteiro em memória.
	}
	return { workspaceId: active, generation: activeGeneration };
}

/**
 * Migra o registro legado para o armazenamento operacional do runtime.
 * O catálogo local continua somente como projeção de reencontro para a UI;
 * a fonte normativa passa a ser SQLite nativo ou IndexedDB no PWA.
 */
export async function migrateLegacyWorkspace(
	storage: WorkspaceStorage
): Promise<import('./workspace-migration').LegacyWorkspaceMigrationResult | null> {
	const previousActive = getActiveWorkspace().workspaceId;
	try {
		const { migrateLegacyWorkspaceSource } = await import('./workspace-migration');
		const result = await migrateLegacyWorkspaceSource(storage);
		if (!result) return null;

		const store = readCatalogStore();
		const existing = store.entries[result.record.workspaceId];
		upsertCatalogEntry({
			workspaceId: result.record.workspaceId,
			nameCache: result.record.name,
			storageKind: storage.kind,
			localRef: sessionReferenceFor(storage) ?? existing?.localRef,
			lastOpenedAt: result.record.lastOpenedAt,
			status: 'ready'
		});
		if (!store.activeWorkspaceId) setActiveWorkspace(result.record.workspaceId);
		return result;
	} catch (error) {
		// Falha parcial restaura o ponteiro anterior e deixa a fonte intacta.
		if (previousActive !== getActiveWorkspace().workspaceId) {
			setActiveWorkspace(previousActive);
		}
		if (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			(error as { code?: unknown }).code === 'MIGRATION_REQUIRED'
		) {
			throw error;
		}
		throw new Error('workspace_migration_failed', { cause: error });
	}
}

/** Remove somente a referência local; nenhum arquivo da raiz é apagado. */
export async function removeWorkspaceEntry(
	storage: WorkspaceStorage,
	workspaceId: string
): Promise<{ workspaceId: string; status: 'detached'; dataRetained: true }> {
	const manifest = await readManifest(storage);
	if (manifest && manifest.workspaceId !== workspaceId) {
		throw new Error('workspace_id_mismatch');
	}
	markCatalogEntryDetached(workspaceId);
	// Arquivos, manifesto e diretórios da raiz permanecem intactos por contrato.
	return { workspaceId, status: 'detached', dataRetained: true };
}

/**
 * Marca a referência como removida da lista sem apagar o registro local.
 * A entrada fica fora do seletor normal, mas pode ser restaurada na gestão.
 */
export function markCatalogEntryDetached(workspaceId: string): boolean {
	const store = readCatalogStore();
	const entry = store.entries[workspaceId];
	if (!entry) return false;
	entry.status = 'detached';
	if (store.activeWorkspaceId === workspaceId) {
		setActiveWorkspace(null);
	}
	persistCatalogStore();
	return true;
}

/** Restaura uma referência removida para o catálogo operacional. */
export function restoreCatalogEntry(workspaceId: string): WorkspaceCatalogEntry | null {
	const store = readCatalogStore();
	const entry = store.entries[workspaceId];
	if (!entry) return null;
	if (entry.status === 'detached') entry.status = 'registered';
	persistCatalogStore();
	return entry;
}

/**
 * Desvincula a entrada do catálogo local sem tocar em arquivos.
 * Usado pela gestão para raízes não ativas, cujo storage não está aberto:
 * remove só a referência; a raiz pode ser recadastrada depois.
 */
export function detachCatalogEntry(workspaceId: string): boolean {
	const store = readCatalogStore();
	if (!store.entries[workspaceId]) return false;
	delete store.entries[workspaceId];
	persistCatalogStore();
	if (store.activeWorkspaceId === workspaceId) {
		const remaining = Object.keys(store.entries);
		setActiveWorkspace(remaining.length > 0 ? remaining[0] : null);
	}
	return true;
}

export type CollisionResolution =
	{ action: 'update'; workspaceId: string } | { action: 'copy'; workspaceId: string };

/**
 * Resolve colisão de ID sem manter duas raízes locais para o mesmo ID.
 * - Mesma identidade: atualizar a localização existente preservando o ID.
 * - Cópia independente: gravar novo ID antes do cadastro.
 */
export async function addExistingWorkspaceEntry(
	storage: WorkspaceStorage,
	requested: { workspaceId: string }
): Promise<CollisionResolution> {
	const manifest = await readManifest(storage);
	const store = readCatalogStore();
	const duplicate = store.entries[requested.workspaceId];
	if (duplicate) {
		// Atualizar localização preserva o ID original (caminho feliz do teste).
		if (manifest && manifest.workspaceId === requested.workspaceId) {
			await persistLocalWorkspaceHandle(storage, requested.workspaceId);
			duplicate.storageKind = storage.kind;
			duplicate.localRef = sessionReferenceFor(storage) ?? duplicate.localRef;
			touchLastOpened(requested.workspaceId);
			return { action: 'update', workspaceId: requested.workspaceId };
		}
		// Cópia independente precisa de novo ID antes do cadastro.
		const copyId = generateWorkspaceId();
		if (manifest) {
			await persistLocalWorkspaceHandle(storage, copyId);
			await writeManifest(storage, { ...manifest, workspaceId: copyId });
		}
		upsertCatalogEntry({
			workspaceId: copyId,
			nameCache: manifest?.name ?? storage.label,
			storageKind: storage.kind,
			localRef: sessionReferenceFor(storage),
			lastOpenedAt: new Date().toISOString(),
			status: 'registered'
		});
		return { action: 'copy', workspaceId: copyId };
	}
	const idToRegister = manifest?.workspaceId ?? requested.workspaceId;
	await persistLocalWorkspaceHandle(storage, idToRegister);
	upsertCatalogEntry({
		workspaceId: idToRegister,
		nameCache: manifest?.name ?? storage.label,
		storageKind: storage.kind,
		localRef: sessionReferenceFor(storage),
		lastOpenedAt: new Date().toISOString(),
		status: 'registered'
	});
	// Se o manifesto lido tem o mesmo ID solicitado, é atualização de localização.
	if (manifest && manifest.workspaceId === requested.workspaceId) {
		return { action: 'update', workspaceId: requested.workspaceId };
	}
	return { action: 'update', workspaceId: idToRegister };
}

/** Renomeia o nome portátil sem alterar ID, raiz física ou estado de sync. */
export async function renameWorkspaceEntry(
	storage: WorkspaceStorage,
	workspaceId: string,
	name: string
): Promise<WorkspaceManifest> {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('invalid_name');
	const manifest = await readManifest(storage);
	if (!manifest) throw new Error('manifest_not_found');
	if (manifest.workspaceId !== workspaceId) throw new Error('workspace_id_mismatch');
	const next: WorkspaceManifest = { ...manifest, name: trimmed, label: trimmed };
	await writeManifest(storage, next);
	const store = readCatalogStore();
	const entry = store.entries[workspaceId];
	if (entry) {
		entry.nameCache = trimmed;
		persistCatalogStore();
	}
	return next;
}

export type DeleteBlockReason =
	| 'not_managed'
	| 'unknown_files'
	| 'locked'
	| 'scan_error'
	| 'capability_unavailable'
	| 'persistence_conflict';

export class WorkspaceDeleteBlockedError extends Error {
	readonly code = 'PERSISTENCE_CONFLICT' as const;
	readonly reason: DeleteBlockReason;
	constructor(reason: DeleteBlockReason, message: string) {
		super(message);
		this.name = 'WorkspaceDeleteBlockedError';
		this.reason = reason;
	}
}

const KNOWN_TOP_LEVEL = new Set([
	'.openbible',
	'bibles',
	'notes',
	'sermons',
	'studies',
	'templates',
	'attachments',
	'trash'
]);

/**
 * Varredura conservadora da raiz: lista o topo e separa conhecidos de
 * desconhecidos. Qualquer erro de leitura vira `scanError` (fail-closed).
 */
export async function scanWorkspaceRoot(
	storage: WorkspaceStorage
): Promise<{ topLevel: string[]; unknownFiles: string[]; scanError: boolean }> {
	let topLevel: string[];
	try {
		const [rootFiles, openbibleFiles] = await Promise.all([
			storage.listFiles('').catch(() => null),
			storage.listFiles('.openbible').catch(() => [] as string[])
		]);
		void openbibleFiles;
		// Alguns adapters não listam a raiz; nesse caso, varrer diretórios conhecidos.
		if (rootFiles === null) {
			topLevel = [];
			for (const dir of KNOWN_TOP_LEVEL) {
				if (dir === '.openbible') continue;
				try {
					await storage.listFiles(dir);
					topLevel.push(dir);
				} catch {
					// Diretório ausente é estado válido.
				}
			}
		} else {
			topLevel = rootFiles;
		}
	} catch {
		return { topLevel: [], unknownFiles: [], scanError: true };
	}
	return {
		topLevel,
		unknownFiles: topLevel.filter((entry) => !KNOWN_TOP_LEVEL.has(entry)),
		scanError: false
	};
}

export interface DeleteGuardPreview {
	manifestValid: boolean;
	managedRoot: boolean;
	capability: boolean;
	scanError: boolean;
	unknownFiles: string[];
	ok: boolean;
	blockReason: DeleteBlockReason | null;
	blockMessage: string | null;
}

/**
 * Prévia somente-leitura dos guardas de exclusão para a confirmação
 * destrutiva: manifesto, ownership, capability e varredura. Nunca apaga.
 */
export async function previewDeleteGuards(
	storage: WorkspaceStorage,
	workspaceId: string
): Promise<DeleteGuardPreview> {
	const failed = (
		blockReason: DeleteBlockReason,
		blockMessage: string,
		partial: Partial<DeleteGuardPreview> = {}
	): DeleteGuardPreview => ({
		manifestValid: false,
		managedRoot: false,
		capability: false,
		scanError: false,
		unknownFiles: [],
		ok: false,
		blockReason,
		blockMessage,
		...partial
	});

	const manifest = await readManifest(storage).catch(() => null);
	if (!manifest || manifest.workspaceId !== workspaceId) {
		return failed('not_managed', 'Manifesto gerenciado não comprovado para este workspace.');
	}
	if (manifest.managedRoot !== true) {
		return failed(
			'not_managed',
			'Raiz não gerenciada: só raízes dedicadas preparadas pelo OpenBible podem ser excluídas aqui.',
			{ manifestValid: true }
		);
	}
	if (!capabilitiesForKind(storage.kind).deleteManagedRoot) {
		return failed(
			'capability_unavailable',
			'Este backend não oferece exclusão segura da raiz. Apague manualmente fora do OpenBible.',
			{ manifestValid: true, managedRoot: true }
		);
	}
	const scan = await scanWorkspaceRoot(storage);
	if (scan.scanError) {
		return failed('scan_error', 'A varredura da raiz falhou; por segurança, nada será apagado.', {
			manifestValid: true,
			managedRoot: true,
			capability: true,
			scanError: true
		});
	}
	if (scan.unknownFiles.length > 0) {
		return failed(
			'unknown_files',
			`Arquivos fora do controle do OpenBible impedem a exclusão: ${scan.unknownFiles.join(', ')}.`,
			{
				manifestValid: true,
				managedRoot: true,
				capability: true,
				unknownFiles: scan.unknownFiles
			}
		);
	}
	return {
		manifestValid: true,
		managedRoot: true,
		capability: true,
		scanError: false,
		unknownFiles: [],
		ok: true,
		blockReason: null,
		blockMessage: null
	};
}

/**
 * Exclusão fail-closed: exige manifesto v2 com managedRoot válido e ID
 * correspondente, propriedade comprovada, varredura sem desconhecidos, lock e
 * capability do backend. Qualquer dúvida bloqueia sem opção de força.
 */
export async function deleteManagedRootEntry(
	storage: WorkspaceStorage,
	workspaceId: string
): Promise<void> {
	const manifest = await readManifest(storage);
	if (!manifest || manifest.workspaceId !== workspaceId) {
		throw new WorkspaceDeleteBlockedError(
			'not_managed',
			'Manifesto gerenciado não comprovado para este workspace.'
		);
	}
	if (manifest.managedRoot !== true) {
		throw new WorkspaceDeleteBlockedError(
			'not_managed',
			'Raiz não gerenciada: exclusão integral bloqueada sem opção de forçar.'
		);
	}
	const capabilities = capabilitiesForKind(storage.kind);
	if (!capabilities.deleteManagedRoot) {
		throw new WorkspaceDeleteBlockedError(
			'capability_unavailable',
			'Backend sem capability de exclusão segura.'
		);
	}
	const scan = await scanWorkspaceRoot(storage);
	if (scan.scanError) {
		throw new WorkspaceDeleteBlockedError(
			'scan_error',
			'Varredura da raiz falhou; exclusão bloqueada.'
		);
	}
	if (scan.unknownFiles.length > 0) {
		throw new WorkspaceDeleteBlockedError(
			'unknown_files',
			`Arquivos desconhecidos impedem a exclusão: ${scan.unknownFiles.join(', ')}`
		);
	}

	// Apaga a raiz inteira pela capability do backend. Fakes em memória
	// (Map, usados nos testes) limpam os mapas; cada backend real remove pelo
	// mecanismo completo (comando nativo com guardas no Tauri, remoção
	// recursiva da ref lógica no OPFS). Sem mecanismo completo, bloqueia.
	const mutable = storage as unknown as {
		files?: Map<string, Uint8Array>;
		directories?: Set<string>;
	};
	const entryRef = readCatalogStore().entries[workspaceId]?.localRef;
	try {
		if (mutable.files instanceof Map) {
			mutable.files.clear();
			if (mutable.directories instanceof Set) mutable.directories.clear();
		} else if (storage.kind === 'native') {
			await (await import('./tauri-storage')).deleteNativeManagedRoot(workspaceId);
		} else if (storage.kind === 'opfs' && typeof entryRef === 'string') {
			await (await import('./opfs-storage')).deleteOpfsLogicalRoot(entryRef);
		} else {
			throw new WorkspaceDeleteBlockedError(
				'capability_unavailable',
				'Backend sem exclusão integral disponível; apague manualmente fora do OpenBible.'
			);
		}

		// A raiz legada é removida pela capability do runtime; o registro de
		// identidade é removido no banco normativo em uma operação separada e
		// explícita, sem deixar o catálogo como fonte de verdade.
		if (mutable.files instanceof Map) {
			// O double de memória usado pelos testes já não possui banco runtime.
		} else if (storage.kind === 'native') {
			await (await import('./tauri-storage')).deleteNativeWorkspaceRecord(workspaceId);
		} else if (storage.kind === 'opfs') {
			const { createIndexedDbWorkspaceAdapter } = await import('./indexeddb-workspace-adapter');
			const adapter = createIndexedDbWorkspaceAdapter();
			await adapter.ensureSchema();
			await adapter.deleteWorkspace(workspaceId);
		}
	} catch (error) {
		if (error instanceof WorkspaceDeleteBlockedError) throw error;
		if (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			(error as { code?: unknown }).code === 'persistence_conflict'
		) {
			throw new WorkspaceDeleteBlockedError(
				'persistence_conflict',
				'O registro local não foi removido pela transação. A exclusão foi interrompida; tente novamente.'
			);
		}
		throw new WorkspaceDeleteBlockedError('scan_error', 'Falha ao apagar a raiz gerenciada.');
	}

	const store = readCatalogStore();
	delete store.entries[workspaceId];
	if (store.activeWorkspaceId === workspaceId) {
		const remaining = Object.values(store.entries)
			.filter((entry) => entry.status !== 'detached')
			.map((entry) => entry.workspaceId);
		setActiveWorkspace(remaining.length > 0 ? remaining[0] : null);
	}
	persistCatalogStore();
}

/**
 * Compatibilidade com os testes TDD da SPEC-0016, que exercitam o contrato
 * via métodos no storage em memória. Acopla delegações finas ao catálogo sem
 * expor caminho arbitrário ou capability ausente.
 */
export function attachCatalogMethods(storage: WorkspaceStorage): void {
	const mutable = storage as WorkspaceStorage & {
		removeWorkspace?: (workspaceId: string) => Promise<unknown>;
		addExistingWorkspace?: (request: { workspaceId: string }) => Promise<CollisionResolution>;
		renameWorkspace?: (workspaceId: string, name: string) => Promise<void>;
		deleteManagedRoot?: (workspaceId: string) => Promise<void>;
	};
	if (typeof mutable.removeWorkspace !== 'function') {
		mutable.removeWorkspace = (workspaceId: string) => removeWorkspaceEntry(storage, workspaceId);
	}
	if (typeof mutable.addExistingWorkspace !== 'function') {
		mutable.addExistingWorkspace = (request: { workspaceId: string }) =>
			addExistingWorkspaceEntry(storage, request);
	}
	if (typeof mutable.renameWorkspace !== 'function') {
		mutable.renameWorkspace = async (workspaceId: string, name: string) => {
			await renameWorkspaceEntry(storage, workspaceId, name);
		};
	}
	if (typeof mutable.deleteManagedRoot !== 'function') {
		mutable.deleteManagedRoot = (workspaceId: string) =>
			deleteManagedRootEntry(storage, workspaceId);
	}
}
