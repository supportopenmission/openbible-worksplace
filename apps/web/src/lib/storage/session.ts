import { readStoragePreference, resolveStorageKind } from './environment';
import {
	createLocalStorageFromHandle,
	loadLocalWorkspaceHandle,
	queryLocalHandlePermission,
	requestLocalHandlePermission
} from './local-storage';
import { createOpfsStorage } from './opfs-storage';
import { createTauriStorage } from './tauri-storage';
import { initializeNativeWorkspace } from './tauri-storage';
import { isStoragePersisted, requestPersistentStorage } from './persistent-storage';
import { DEFAULT_PREFERENCES, loadWorkspacePreferences } from './preferences';
import type { WorkspaceSnapshot, WorkspaceStorage } from './types';
import { loadWorkspaceConfig } from './workspace';

const emptySnapshot = (
	partial: Partial<WorkspaceSnapshot> & Pick<WorkspaceSnapshot, 'status'>
): WorkspaceSnapshot => ({
	storage: null,
	config: null,
	preferences: DEFAULT_PREFERENCES,
	persisted: null,
	permission: null,
	error: '',
	...partial
});

async function snapshotFromStorage(
	storage: WorkspaceStorage,
	persisted: boolean | null,
	permission: WorkspaceSnapshot['permission']
): Promise<WorkspaceSnapshot> {
	const config = await loadWorkspaceConfig(storage);
	if (!config) {
		return emptySnapshot({
			status: 'unconfigured',
			storage,
			persisted,
			permission
		});
	}

	return {
		status: 'ready',
		storage,
		config,
		preferences: await loadWorkspacePreferences(storage),
		persisted,
		permission,
		error: ''
	};
}

export async function bootstrapWorkspace(
	options: { requestPermission?: boolean; requestPersist?: boolean } = {}
): Promise<WorkspaceSnapshot> {
	const persisted = options.requestPersist
		? await requestPersistentStorage()
		: await isStoragePersisted();

	try {
		if (resolveStorageKind() === 'native') {
			await initializeNativeWorkspace();
			return await snapshotFromStorage(createTauriStorage(), persisted, null);
		}
		if (resolveStorageKind() === 'opfs') {
			return await snapshotFromStorage(await createOpfsStorage(), persisted, null);
		}

		const handle = await loadLocalWorkspaceHandle();
		if (!handle) {
			if (readStoragePreference() !== 'opfs') {
				return emptySnapshot({ status: 'unconfigured', persisted });
			}
			return await snapshotFromStorage(await createOpfsStorage(), persisted, null);
		}

		const permission = options.requestPermission
			? await requestLocalHandlePermission(handle)
			: await queryLocalHandlePermission(handle);

		if (permission === 'denied' || permission === 'prompt') {
			return emptySnapshot({
				status: 'permission-needed',
				persisted,
				permission
			});
		}

		return await snapshotFromStorage(createLocalStorageFromHandle(handle), persisted, permission);
	} catch (error) {
		return emptySnapshot({
			status: 'error',
			persisted,
			error: error instanceof Error ? error.message : 'Não foi possível acessar o workspace.'
		});
	}
}
