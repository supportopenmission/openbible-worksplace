import {
	readStoragePreference,
	rememberStoragePreference,
	resolveStorageKind
} from './environment';
import { open } from '@tauri-apps/plugin-dialog';
import {
	chooseLocalWorkspaceStorage,
	createLocalStorageFromHandle,
	loadLocalWorkspaceHandle
} from './local-storage';
import { createOpfsStorage } from './opfs-storage';
import {
	createTauriStorage,
	getNativeWorkspacePath,
	initializeNativeWorkspace
} from './tauri-storage';
import { loadWorkspaceConfig } from './workspace';
import { chooseNativeWorkspace } from './workspace-choice';
import type { WorkspaceStorage } from './types';

export async function createConfiguredStorage(): Promise<WorkspaceStorage | null> {
	if (resolveStorageKind() === 'native') {
		const path = await getNativeWorkspacePath();
		if (!path) return null;
		await initializeNativeWorkspace({ path });
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
		const path = await open({ directory: true, multiple: false });
		if (typeof path !== 'string') {
			throw new DOMException('A seleção da pasta foi cancelada.', 'AbortError');
		}
		const choice = chooseNativeWorkspace(path);
		await initializeNativeWorkspace({ path: choice.path });
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
