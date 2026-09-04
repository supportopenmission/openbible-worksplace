import { readStoragePreference, rememberStoragePreference, resolveStorageKind } from './environment';
import {
	chooseLocalWorkspaceStorage,
	createLocalStorageFromHandle,
	loadLocalWorkspaceHandle
} from './local-storage';
import { createOpfsStorage } from './opfs-storage';
import { createTauriStorage, initializeNativeWorkspace } from './tauri-storage';
import { loadWorkspaceConfig } from './workspace';
import type { WorkspaceStorage } from './types';

export async function createConfiguredStorage(): Promise<WorkspaceStorage | null> {
	if (resolveStorageKind() === 'native') {
		await initializeNativeWorkspace();
		return createTauriStorage();
	}
	if (resolveStorageKind() === 'opfs') return createOpfsStorage();

	const handle = await loadLocalWorkspaceHandle();
	if (handle) return createLocalStorageFromHandle(handle);
	if (readStoragePreference() !== 'opfs') return null;

	const storage = await createOpfsStorage();
	return (await loadWorkspaceConfig(storage)) ? storage : null;
}

export async function chooseWorkspaceStorage(): Promise<WorkspaceStorage> {
	if (resolveStorageKind() === 'native') {
		await initializeNativeWorkspace();
		return createTauriStorage();
	}
	if (resolveStorageKind() === 'opfs') return createOpfsStorage();
	const storage = await chooseLocalWorkspaceStorage();
	rememberStoragePreference('local');
	return storage;
}

export async function chooseBrowserWorkspaceStorage(): Promise<WorkspaceStorage> {
	const storage = await createOpfsStorage();
	rememberStoragePreference('opfs');
	return storage;
}
