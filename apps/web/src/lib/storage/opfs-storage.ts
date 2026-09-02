import type { FileContent, WorkspaceStorage } from './types';

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
