import { detectStorageKind } from './environment';
import {
	chooseLocalWorkspaceStorage,
	createLocalStorageFromHandle,
	loadLocalWorkspaceHandle
} from './local-storage';
import { createOpfsStorage } from './opfs-storage';
import type { WorkspaceStorage } from './types';

export async function createConfiguredStorage(): Promise<WorkspaceStorage | null> {
	if (detectStorageKind() === 'opfs') return createOpfsStorage();

	const handle = await loadLocalWorkspaceHandle();
	return handle ? createLocalStorageFromHandle(handle) : null;
}

export async function chooseWorkspaceStorage(): Promise<WorkspaceStorage> {
	if (detectStorageKind() === 'opfs') return createOpfsStorage();
	return chooseLocalWorkspaceStorage();
}
