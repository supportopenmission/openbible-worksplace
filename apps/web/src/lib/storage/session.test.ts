import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapWorkspace } from './session';

const detectStorageKind = vi.fn(() => 'local' as const);
const loadLocalWorkspaceHandle = vi.fn();
const queryLocalHandlePermission = vi.fn();
const requestLocalHandlePermission = vi.fn();
const createLocalStorageFromHandle = vi.fn();
const isStoragePersisted = vi.fn(async () => null);
const requestPersistentStorage = vi.fn(async () => false);

vi.mock('./environment', () => ({
	detectStorageKind: () => detectStorageKind()
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

vi.mock('./persistent-storage', () => ({
	isStoragePersisted: () => isStoragePersisted(),
	requestPersistentStorage: () => requestPersistentStorage()
}));

describe('workspace bootstrap', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		detectStorageKind.mockReturnValue('local');
		isStoragePersisted.mockResolvedValue(null);
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
});
