import type { FileContent, WorkspaceStorage, WorkspaceStorageEntry } from './types';
import { capabilitiesForKind, type StorageCapabilities } from './workspace-catalog';

export const opfsCapabilities: StorageCapabilities = capabilitiesForKind('opfs');

type OpfsStorageManager = StorageManager & {
	getDirectory(): Promise<FileSystemDirectoryHandle>;
};

function pathParts(path: string): string[] {
	const parts = path.split('/').filter(Boolean);
	if (parts.some((part) => part === '.' || part === '..')) {
		throw new Error(`Invalid workspace path: ${path}`);
	}
	return parts;
}

function directoryStorage(kind: 'opfs', root: FileSystemDirectoryHandle): WorkspaceStorage {
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
		kind,
		label: root.name || 'Armazenamento do navegador',
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
		},
		listEntries: async (path): Promise<WorkspaceStorageEntry[]> => {
			const directory = await getDirectory(path);
			const entries: WorkspaceStorageEntry[] = [];
			for await (const [name, handle] of directory.entries()) {
				entries.push({ name, kind: handle.kind });
			}
			return entries.sort((left, right) => left.name.localeCompare(right.name));
		}
	};
}

export async function createOpfsStorage(): Promise<WorkspaceStorage> {
	if (
		!('storage' in navigator) ||
		typeof (navigator.storage as OpfsStorageManager).getDirectory !== 'function'
	) {
		throw new Error('OPFS is not available in this browser');
	}

	const root = await (navigator.storage as OpfsStorageManager).getDirectory();
	return directoryStorage('opfs', root);
}

export function createOpfsStorageFromRoot(root: FileSystemDirectoryHandle): WorkspaceStorage {
	return directoryStorage('opfs', root);
}

const LOGICAL_VAULTS_DIR = 'vaults';

/**
 * Cria uma raiz lógica isolada (`vaults/<workspaceId>`) no OPFS para um novo
 * workspace. Raízes lógicas nunca são apresentadas como pasta do sistema.
 */
export async function createOpfsLogicalRoot(
	workspaceId: string
): Promise<{ storage: WorkspaceStorage; ref: string }> {
	if (
		!('storage' in navigator) ||
		typeof (navigator.storage as OpfsStorageManager).getDirectory !== 'function'
	) {
		throw new Error('OPFS is not available in this browser');
	}

	const origin = await (navigator.storage as OpfsStorageManager).getDirectory();
	const vaults = await origin.getDirectoryHandle(LOGICAL_VAULTS_DIR, { create: true });
	const root = await vaults.getDirectoryHandle(workspaceId, { create: true });
	return { storage: directoryStorage('opfs', root), ref: `${LOGICAL_VAULTS_DIR}/${workspaceId}` };
}

/** Reabre uma raiz lógica existente sem criá-la. Falha se ela não existir. */
export async function openOpfsLogicalRoot(ref: string): Promise<WorkspaceStorage> {
	if (
		!('storage' in navigator) ||
		typeof (navigator.storage as OpfsStorageManager).getDirectory !== 'function'
	) {
		throw new Error('OPFS is not available in this browser');
	}

	const parts = ref.split('/').filter(Boolean);
	const origin = await (navigator.storage as OpfsStorageManager).getDirectory();
	let directory = origin;
	for (const part of parts) {
		directory = await directory.getDirectoryHandle(part, { create: false });
	}
	return directoryStorage('opfs', directory);
}

/**
 * Apaga uma raiz lógica inteira (`vaults/<id>`) de forma recursiva pelo
 * diretório pai. Usado só após todos os guardas fail-closed da exclusão.
 */
export async function deleteOpfsLogicalRoot(ref: string): Promise<void> {
	const parts = ref.split('/').filter(Boolean);
	const leaf = parts.pop();
	if (!leaf || parts.some((part) => part === '.' || part === '..')) {
		throw new Error(`Invalid workspace ref: ${ref}`);
	}
	if (
		!('storage' in navigator) ||
		typeof (navigator.storage as OpfsStorageManager).getDirectory !== 'function'
	) {
		throw new Error('OPFS is not available in this browser');
	}

	const origin = await (navigator.storage as OpfsStorageManager).getDirectory();
	let directory = origin;
	for (const part of parts) {
		directory = await directory.getDirectoryHandle(part, { create: false });
	}
	await directory.removeEntry(leaf, { recursive: true });
}
