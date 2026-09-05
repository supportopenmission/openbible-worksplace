import { invokeWorkspaceCommand, TauriCommandError } from './tauri-bridge';
import type { FileContent, WorkspaceStorage } from './types';

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

export function createTauriStorage(): WorkspaceStorage {
	return {
		kind: 'native',
		label: 'Pasta do computador',
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
				await invokeWorkspaceCommand({ name: 'workspace.readFile', relativePath: path });
				return true;
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
}

export async function initializeNativeWorkspace(options: { path?: string } = {}) {
	try {
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
