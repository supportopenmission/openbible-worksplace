import {
	invokeWorkspaceCommand,
	TauriCommandError,
	type NativeDatabaseStatus,
	type NativeWorkspaceRecord
} from './tauri-bridge';
import type {
	FileContent,
	WorkspaceMediaCatalogEntry,
	WorkspaceStorage,
	WorkspaceStorageEntry
} from './types';
import {
	capabilitiesForKind,
	generateWorkspaceId,
	type StorageCapabilities
} from './workspace-catalog';

export const tauriCapabilities: StorageCapabilities = capabilitiesForKind('native');

/**
 * Exclusão integral da raiz dedicada via comando nativo com guardas
 * fail-closed no backend (lock da sessão, manifesto v2, managedRoot,
 * varredura). Erros de guarda não são recuperáveis: sem forçar.
 */
export async function deleteNativeManagedRoot(workspaceId: string): Promise<void> {
	await invokeWorkspaceCommand({ name: 'workspace.deleteManagedRoot', workspaceId });
}

export async function deleteNativeWorkspaceRecord(workspaceId: string): Promise<void> {
	await invokeWorkspaceCommand({ name: 'database.deleteWorkspace', workspaceId });
}

const NATIVE_WORKSPACE_PATH_KEY = 'openbible:native-workspace-path';

function bytes(content: FileContent): Uint8Array {
	return typeof content === 'string' ? new TextEncoder().encode(content) : content;
}

function toBytes(value: unknown): Uint8Array | null {
	if (value == null) return null;
	if (value instanceof Uint8Array) return value;
	if (Array.isArray(value)) return new Uint8Array(value);
	return null;
}

export function createTauriStorage(
	options: { workspaceId?: string; label?: string } = {}
): WorkspaceStorage {
	const storage: WorkspaceStorage = {
		kind: 'native',
		label: options.label ?? 'Meu workspace',
		workspaceId: options.workspaceId,
		mediaCatalog: {
			list: async (): Promise<WorkspaceMediaCatalogEntry[]> => {
				const result = await invokeWorkspaceCommand<WorkspaceMediaCatalogEntry[]>({
					name: 'media.listCatalog',
					workspaceId: storage.workspaceId ?? ''
				});
				return Array.isArray(result.value) ? result.value : [];
			},
			replace: async (entries) => {
				await invokeWorkspaceCommand({
					name: 'media.replaceCatalog',
					workspaceId: storage.workspaceId ?? '',
					entries
				});
			}
		},
		ensureDirectory: async () => undefined,
		writeFile: async (path, content) => {
			await invokeWorkspaceCommand({
				name: 'workspace.writeFile',
				relativePath: path,
				bytes: bytes(content)
			});
		},
		readFile: async (path) => {
			const result = await invokeWorkspaceCommand<unknown>({
				name: 'workspace.readFile',
				relativePath: path
			});
			return toBytes(result.value);
		},
		fileExists: async (path) => {
			try {
				const result = await invokeWorkspaceCommand<unknown>({
					name: 'workspace.readFile',
					relativePath: path
				});
				return toBytes(result.value) !== null;
			} catch (error) {
				if (error instanceof TauriCommandError && error.code === 'io_error') return false;
				throw error;
			}
		},
		listFiles: async (path) => {
			const result = await invokeWorkspaceCommand<unknown>({
				name: 'workspace.listFiles',
				relativePath: path
			});
			return Array.isArray(result.value) ? result.value.map(String) : [];
		},
		listEntries: async (path): Promise<WorkspaceStorageEntry[]> => {
			const result = await invokeWorkspaceCommand<unknown>({
				name: 'workspace.listEntries',
				relativePath: path
			});
			if (!Array.isArray(result.value)) return [];
			return result.value.flatMap((entry) => {
				if (typeof entry !== 'object' || entry === null) return [];
				const record = entry as { name?: unknown; kind?: unknown };
				return typeof record.name === 'string' &&
					(record.kind === 'file' || record.kind === 'directory')
					? [{ name: record.name, kind: record.kind }]
					: [];
			});
		},
		deleteFile: async (path) => {
			await invokeWorkspaceCommand({ name: 'workspace.deleteFile', relativePath: path });
		},
		readBibleChapter: async (version, bookId, chapter) => {
			const result = await invokeWorkspaceCommand<{ verse: number; text: string }[]>({
				name: 'bible.readVerses',
				version,
				bookId,
				chapter
			});
			return result.value ?? [];
		},
		inspectBible: async (version) => {
			const result = await invokeWorkspaceCommand<{
				name: string;
				books: { id: number; name: string; abbreviation: string; chapters: number[] }[];
			}>({ name: 'bible.inspect', version });
			return result.value ?? { name: version, books: [] };
		},
		queryIndex: async (operation, record) => {
			const result = await invokeWorkspaceCommand({
				name: 'index.query',
				operation,
				workspaceId: record.workspaceId,
				versionId: record.versionId,
				bookId: record.bookId,
				chapter: record.chapter,
				verseStart: record.verseStart,
				verseEnd: record.verseEnd,
				styleId: record.styleId
			});
			return result.value;
		}
	};
	return storage;
}

export async function initializeNativeWorkspace(options: { path?: string } = {}) {
	try {
		await initializeNativeDatabase();
		const result = await invokeWorkspaceCommand({
			name: 'workspace.initialize',
			preferredPath: options.path
		});
		return result.value;
	} catch (error) {
		if (
			error instanceof TauriCommandError &&
			(error.code === 'io_error' || error.code === 'permission_denied')
		) {
			throw new TauriCommandError({
				code: 'permission_denied',
				message: 'Não foi possível acessar a pasta do workspace.',
				recoverable: true
			});
		}
		throw error;
	}
}

export async function initializeNativeDatabase(): Promise<NativeDatabaseStatus | undefined> {
	const result = await invokeWorkspaceCommand<NativeDatabaseStatus>({
		name: 'database.initialize'
	});
	return result.value;
}

/**
 * Abre o workspace operacional do Tauri sem consultar filesystem, manifesto
 * ou caminho local. O registro e o ponteiro ativo vivem exclusivamente em
 * app.sqlite; o catálogo do navegador é apenas uma projeção para a UI.
 */
export async function ensureNativeWorkspace(
	options: {
		workspaceId?: string;
		name?: string;
		status?: 'registered' | 'ready';
		createIfMissing?: boolean;
	} = {}
): Promise<NativeWorkspaceRecord> {
	await initializeNativeDatabase();
	const active = await invokeWorkspaceCommand<NativeWorkspaceRecord | null>({
		name: 'database.activeWorkspace'
	});
	if (active.value && (!options.workspaceId || active.value.workspaceId === options.workspaceId)) {
		if (options.status !== 'ready' || active.value.status === 'ready') return active.value;
	}
	if (options.createIfMissing === false) {
		throw new TauriCommandError({
			code: 'workspace_record_missing',
			message: 'O workspace nativo não foi encontrado no app.sqlite.',
			recoverable: true
		});
	}

	const result = await invokeWorkspaceCommand<NativeWorkspaceRecord>({
		name: 'database.ensureWorkspace',
		workspaceId: options.workspaceId ?? generateWorkspaceId(),
		workspaceName: options.name?.trim() || 'Meu workspace',
		status: options.status ?? 'registered'
	});
	if (!result.value) throw new TauriCommandError('database_unavailable');
	return result.value;
}

export function readNativeWorkspacePath(): string | null {
	const storage = nativeWorkspaceStorage();
	if (!storage) return null;
	try {
		const value = storage.getItem(NATIVE_WORKSPACE_PATH_KEY);
		return value && isAbsoluteNativePath(value) ? value : null;
	} catch {
		return null;
	}
}

export function rememberNativeWorkspacePath(path: string): void {
	const storage = nativeWorkspaceStorage();
	if (!storage || !isAbsoluteNativePath(path)) return;
	try {
		storage.setItem(NATIVE_WORKSPACE_PATH_KEY, path);
	} catch {
		// A indisponibilidade do cache do webview não impede o workspace atual.
	}
}

export function clearNativeWorkspacePath(): void {
	const storage = nativeWorkspaceStorage();
	if (!storage) return;
	try {
		storage.removeItem(NATIVE_WORKSPACE_PATH_KEY);
	} catch {
		// A indisponibilidade do cache do webview não impede o workspace atual.
	}
}

function nativeWorkspaceStorage(): Storage | null {
	try {
		return typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
	} catch {
		return null;
	}
}

function isAbsoluteNativePath(path: string): boolean {
	return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path);
}
