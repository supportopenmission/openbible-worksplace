import { readStoragePreference, resolveStorageKind } from './environment';
import {
	createLocalStorageFromHandle,
	loadLocalWorkspaceHandle,
	queryLocalHandlePermission,
	requestLocalHandlePermission
} from './local-storage';
import { createOpfsStorage } from './opfs-storage';
import {
	createTauriStorage,
	ensureNativeWorkspace,
	initializeNativeWorkspace
} from './tauri-storage';
import { isStoragePersisted, requestPersistentStorage } from './persistent-storage';
import { DEFAULT_PREFERENCES, loadWorkspacePreferences } from './preferences';
import type { WorkspaceSnapshot, WorkspaceStorage } from './types';
import { loadWorkspaceConfig } from './workspace';
import { setActiveWorkspace, upsertCatalogEntry } from './workspace-catalog';

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

function nativeWorkspaceConfig(record: Awaited<ReturnType<typeof ensureNativeWorkspace>>) {
	return {
		version: 1 as const,
		storage: 'native' as const,
		configuredAt: record.createdAt,
		bibleImportStatus: 'pending' as const,
		label: record.name
	};
}

function projectNativeWorkspace(record: Awaited<ReturnType<typeof ensureNativeWorkspace>>): void {
	upsertCatalogEntry({
		workspaceId: record.workspaceId,
		nameCache: record.name,
		storageKind: 'native',
		lastOpenedAt: record.lastOpenedAt,
		status: record.status === 'ready' ? 'ready' : 'registered'
	});
	setActiveWorkspace(record.workspaceId);
}

export async function bootstrapWorkspace(
	options: { requestPermission?: boolean; requestPersist?: boolean } = {}
): Promise<WorkspaceSnapshot> {
	const persisted = options.requestPersist
		? await requestPersistentStorage()
		: await isStoragePersisted();

	try {
		if (resolveStorageKind() === 'native') {
			const record = await ensureNativeWorkspace({ status: 'registered' });
			projectNativeWorkspace(record);
			const storage = createTauriStorage({
				workspaceId: record.workspaceId,
				label: record.name
			});
			// A área interna serve somente para recursos legados/arquivos SQLite de
			// Bíblia. Ela nunca é escolhida pela pessoa nem identifica o workspace.
			await initializeNativeWorkspace();
			return {
				status: record.status === 'ready' ? 'ready' : 'unconfigured',
				storage,
				config: record.status === 'ready' ? nativeWorkspaceConfig(record) : null,
				preferences: DEFAULT_PREFERENCES,
				persisted,
				permission: 'granted',
				error: ''
			};
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
