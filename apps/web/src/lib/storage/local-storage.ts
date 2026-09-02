import type { FileContent, WorkspaceStorage } from './types';

const DATABASE_NAME = 'openbible-workspace';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'default';

function pathParts(path: string): string[] {
	const parts = path.split('/').filter(Boolean);
	if (parts.some((part) => part === '.' || part === '..')) {
		throw new Error(`Invalid workspace path: ${path}`);
	}
	return parts;
}

function directoryStorage(root: FileSystemDirectoryHandle): WorkspaceStorage {
	const getDirectory = async (path: string, create = false) => {
		let directory = root;
		for (const part of pathParts(path)) {
			directory = await directory.getDirectoryHandle(part, { create });
		}
		return directory;
	};

	const getFile = async (path: string, create = false) => {
		const parts = pathParts(path);
		const fileName = parts.pop();
		if (!fileName) throw new Error(`Invalid workspace file path: ${path}`);
		const directory = await getDirectory(parts.join('/'), create);
		return directory.getFileHandle(fileName, { create });
	};

	return {
		kind: 'local',
		label: root.name || 'Pasta local',
		ensureDirectory: async (path) => {
			await getDirectory(path, true);
		},
		writeFile: async (path, content: FileContent) => {
			const handle = await getFile(path, true);
			const writable = await handle.createWritable();
			await writable.write(content as unknown as FileSystemWriteChunkType);
			await writable.close();
		},
		deleteFile: async (path) => {
			const parts = pathParts(path);
			const fileName = parts.pop();
			if (!fileName) throw new Error(`Invalid workspace file path: ${path}`);
			const directory = await getDirectory(parts.join('/'));
			await directory.removeEntry(fileName);
		},
		readFile: async (path) => {
			try {
				const handle = await getFile(path);
				const file = await handle.getFile();
				return new Uint8Array(await file.arrayBuffer());
			} catch (error) {
				if (error instanceof DOMException && error.name === 'NotFoundError') return null;
				throw error;
			}
		},
		fileExists: async (path) => {
			try {
				await getFile(path);
				return true;
			} catch (error) {
				if (error instanceof DOMException && error.name === 'NotFoundError') return false;
				throw error;
			}
		},
		listFiles: async (path) => {
			const directory = await getDirectory(path);
			const files: string[] = [];
			for await (const [name, handle] of directory.entries()) {
				if (handle.kind === 'file') files.push(name);
			}
			return files.sort();
		}
	};
}

function openHandleDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(request.error ?? new Error('Unable to open local workspace registry'));
	});
}

export async function saveLocalWorkspaceHandle(handle: FileSystemDirectoryHandle): Promise<void> {
	const database = await openHandleDatabase();
	await new Promise<void>((resolve, reject) => {
		const transaction = database.transaction(STORE_NAME, 'readwrite');
		transaction.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
		transaction.oncomplete = () => resolve();
		transaction.onerror = () =>
			reject(transaction.error ?? new Error('Unable to save workspace handle'));
	});
	database.close();
}

export async function loadLocalWorkspaceHandle(): Promise<FileSystemDirectoryHandle | null> {
	const database = await openHandleDatabase();
	const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
		const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(HANDLE_KEY);
		request.onsuccess = () =>
			resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
		request.onerror = () => reject(request.error ?? new Error('Unable to load workspace handle'));
	});
	database.close();
	return handle;
}

export async function chooseLocalWorkspaceStorage(): Promise<WorkspaceStorage> {
	if (typeof window.showDirectoryPicker !== 'function') {
		throw new Error('Directory selection is not available in this browser');
	}

	const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
	await saveLocalWorkspaceHandle(handle);
	return directoryStorage(handle);
}

export type DirectoryPermissionHandle = {
	queryPermission?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
	requestPermission?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
};

export async function queryLocalHandlePermission(
	handle: DirectoryPermissionHandle
): Promise<PermissionState | 'unsupported'> {
	if (typeof handle.queryPermission !== 'function') return 'unsupported';
	try {
		return await handle.queryPermission({ mode: 'readwrite' });
	} catch {
		return 'prompt';
	}
}

export async function requestLocalHandlePermission(
	handle: DirectoryPermissionHandle
): Promise<PermissionState | 'unsupported'> {
	if (typeof handle.requestPermission !== 'function') return 'unsupported';
	try {
		return await handle.requestPermission({ mode: 'readwrite' });
	} catch {
		return 'denied';
	}
}

export function createLocalStorageFromHandle(handle: FileSystemDirectoryHandle): WorkspaceStorage {
	return directoryStorage(handle);
}
