import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapWorkspace } from './session';

const detectStorageKind = vi.fn(() => 'local' as 'local' | 'opfs' | 'native');
const loadLocalWorkspaceHandle = vi.fn();
const queryLocalHandlePermission = vi.fn();
const requestLocalHandlePermission = vi.fn();
const createLocalStorageFromHandle = vi.fn();
const createOpfsStorage = vi.fn();
const createTauriStorage = vi.fn();
const ensureNativeWorkspace = vi.fn();
const initializeNativeWorkspace = vi.fn();
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

vi.mock('./tauri-storage', () => ({
	createTauriStorage: () => createTauriStorage(),
	ensureNativeWorkspace: (options: unknown) => ensureNativeWorkspace(options),
	initializeNativeWorkspace: (options: unknown) => initializeNativeWorkspace(options)
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
		createTauriStorage.mockReturnValue({
			kind: 'native',
			label: 'Meu workspace',
			workspaceId: 'native-1',
			ensureDirectory: async () => undefined,
			writeFile: async () => undefined,
			readFile: async () => null,
			fileExists: async () => false,
			listFiles: async () => []
		});
		ensureNativeWorkspace.mockResolvedValue({
			workspaceId: 'native-1',
			name: 'Meu workspace',
			status: 'registered',
			schemaVersion: 3,
			createdAt: '2026-09-07T00:00:00.000Z',
			updatedAt: '2026-09-07T00:00:00.000Z',
			lastOpenedAt: null,
			metadataJson: '{}'
		});
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

	it('bootstraps Tauri from app.sqlite without requiring a native folder', async () => {
		detectStorageKind.mockReturnValue('native');

		const snapshot = await bootstrapWorkspace();

		expect(snapshot.status).toBe('unconfigured');
		expect(snapshot.storage).toMatchObject({ kind: 'native', workspaceId: 'native-1' });
		expect(ensureNativeWorkspace).toHaveBeenCalledWith({ status: 'registered' });
		expect(initializeNativeWorkspace).toHaveBeenCalledOnce();
	});
});
