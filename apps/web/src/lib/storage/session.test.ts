import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapWorkspace } from './session';

const detectStorageKind = vi.fn(() => 'local' as const);
const loadLocalWorkspaceHandle = vi.fn();
const queryLocalHandlePermission = vi.fn();
const requestLocalHandlePermission = vi.fn();
const createLocalStorageFromHandle = vi.fn();
const createOpfsStorage = vi.fn();
const readStoragePreference = vi.fn();
const resolveStorageKind = vi.fn(() => readStoragePreference() ?? detectStorageKind());
const isStoragePersisted = vi.fn(async () => null);
const requestPersistentStorage = vi.fn(async () => false);
const loadWorkspaceConfig = vi.fn();

vi.mock('./environment', () => ({
	detectStorageKind: () => detectStorageKind(),
	readStoragePreference: () => readStoragePreference(),
	resolveStorageKind: () => resolveStorageKind()
}));

vi.mock('./local-storage', () => ({
	loadLocalWorkspaceHandle: () => loadLocalWorkspaceHandle(),
	queryLocalHandlePermission: (handle: FileSystemDirectoryHandle) =>
		queryLocalHandlePermission(handle),
	requestLocalHandlePermission: (handle: FileSystemDirectoryHandle) =>
		requestLocalHandlePermission(handle),
	createLocalStorageFromHandle: (handle: FileSystemDirectoryHandle) =>
		createLocalStorageFromHandle(handle)
}));

vi.mock('./opfs-storage', () => ({
	createOpfsStorage: () => createOpfsStorage()
}));

vi.mock('./workspace', () => ({
	loadWorkspaceConfig: (storage: unknown) => loadWorkspaceConfig(storage)
}));

vi.mock('./persistent-storage', () => ({
	isStoragePersisted: () => isStoragePersisted(),
	requestPersistentStorage: () => requestPersistentStorage()
}));

describe('workspace bootstrap', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		detectStorageKind.mockReturnValue('local');
		isStoragePersisted.mockResolvedValue(null);
		readStoragePreference.mockReturnValue(null);
		loadWorkspaceConfig.mockResolvedValue(null);
	});

	it('stays unconfigured when no local folder handle exists', async () => {
		loadLocalWorkspaceHandle.mockResolvedValue(null);

		const snapshot = await bootstrapWorkspace();

		expect(snapshot.status).toBe('unconfigured');
		expect(snapshot.storage).toBeNull();
	});

	it('asks for folder permission instead of treating the workspace as missing', async () => {
		loadLocalWorkspaceHandle.mockResolvedValue({ name: 'OpenBible' });
		queryLocalHandlePermission.mockResolvedValue('prompt');

		const snapshot = await bootstrapWorkspace();

		expect(snapshot.status).toBe('permission-needed');
		expect(snapshot.permission).toBe('prompt');
		expect(createLocalStorageFromHandle).not.toHaveBeenCalled();
	});

	it('reopens an explicit OPFS fallback when no local handle exists', async () => {
		const storage = {
			kind: 'opfs',
			label: 'Armazenamento do navegador',
			readFile: async () => null,
			fileExists: async () => false,
			listFiles: async () => [],
			ensureDirectory: async () => undefined,
			writeFile: async () => undefined
		};
		loadLocalWorkspaceHandle.mockResolvedValue(null);
		readStoragePreference.mockReturnValue('opfs');
		createOpfsStorage.mockResolvedValue(storage);
		loadWorkspaceConfig.mockResolvedValue({
			version: 1,
			storage: 'opfs',
			configuredAt: '2026-09-04T00:00:00.000Z',
			bibleImportStatus: 'pending'
		});

		const snapshot = await bootstrapWorkspace();

		expect(snapshot.status).toBe('ready');
		expect(snapshot.storage).toBe(storage);
	});
});
