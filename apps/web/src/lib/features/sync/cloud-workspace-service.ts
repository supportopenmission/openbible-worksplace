import { getSyncServerBaseUrl, getStoredAuthToken } from '../auth/auth-client';
import {
	getCatalogEntry,
	listCatalog,
	upsertCatalogEntry,
	writeManifest,
	type WorkspaceCatalogEntry
} from '$lib/storage/workspace-catalog';
import { createOpfsLogicalRoot } from '$lib/storage/opfs-storage';
import { prepareWorkspace } from '$lib/storage/workspace';
import {
	getWorkspaceContentRepository,
	workspaceContentContext
} from '$lib/storage/workspace-content-storage';
import { syncWorkspaceWithAccount } from './sync-client';
import type { WorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
import type { WorkspaceStorage } from '$lib/storage/types';

export interface CloudWorkspaceItem {
	workspaceId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

export async function fetchUserCloudWorkspaces(
	fetcher: typeof fetch = fetch
): Promise<CloudWorkspaceItem[]> {
	const baseUrl = getSyncServerBaseUrl();
	const token = getStoredAuthToken();

	const response = await fetcher(`${baseUrl}/v1/workspaces`, {
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {})
		},
		credentials: 'include'
	});

	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('Sessão expirada. Conecte-se novamente para acessar seus workspaces na nuvem.');
		}
		throw new Error(`Falha ao buscar workspaces na nuvem (status ${response.status}).`);
	}

	const data = (await response.json()) as { workspaces?: CloudWorkspaceItem[] };
	return data.workspaces || [];
}

export function isWorkspaceInLocalCatalog(workspaceId: string): boolean {
	try {
		return Boolean(getCatalogEntry(workspaceId));
	} catch {
		return false;
	}
}

export function isCloudWorkspaceActive(workspaceState: WorkspaceState | null, workspaceId: string): boolean {
	return workspaceState?.workspaceId === workspaceId;
}

export async function linkAndDownloadCloudWorkspace(
	workspaceState: WorkspaceState,
	cloudWorkspace: { workspaceId: string; name: string },
	options: {
		importCurrentNotes?: boolean;
		storageKind?: 'opfs' | 'local' | 'native';
		storageOverride?: WorkspaceStorage;
		fetcher?: typeof fetch;
	} = {}
): Promise<{ success: boolean; workspaceId: string }> {
	const targetId = cloudWorkspace.workspaceId;
	const targetName = cloudWorkspace.name || targetId;

	const existingEntry = getCatalogEntry(targetId);

	if (!existingEntry) {
		// Cria a raiz no armazenamento local deste aparelho
		const kind = options.storageKind ?? workspaceState.storage?.kind ?? 'opfs';

		if (kind === 'opfs' && !options.storageOverride) {
			const { storage, ref } = await createOpfsLogicalRoot(targetId);
			await writeManifest(storage, {
				workspaceId: targetId,
				formatVersion: 2,
				name: targetName,
				managedRoot: true,
				version: 1,
				storage: 'opfs',
				configuredAt: new Date().toISOString(),
				bibleImportStatus: 'pending',
				label: targetName
			});
			await prepareWorkspace(storage);

			// Se solicitado importar anotações existentes do workspace atual deste aparelho
			if (options.importCurrentNotes && workspaceState.storage && workspaceState.status === 'ready') {
				try {
					const currentCtx = workspaceContentContext(workspaceState.storage);
					const currentRepo = getWorkspaceContentRepository(workspaceState.storage, currentCtx);
					const records = await currentRepo.list(currentCtx);

					const targetCtx = workspaceContentContext(storage, { workspaceId: targetId });
					const targetRepo = getWorkspaceContentRepository(storage, targetCtx);

					for (const record of records) {
						await targetRepo.write({
							...record,
							workspaceId: targetId
						});
					}
				} catch {
					// Importação de notas é melhor esforço
				}
			}

			upsertCatalogEntry({
				workspaceId: targetId,
				nameCache: targetName,
				storageKind: 'opfs',
				localRef: ref,
				lastOpenedAt: new Date().toISOString(),
				status: 'ready'
			});
		} else if (options.storageOverride) {
			// Usado para testes com storage em memória
			const storage = options.storageOverride;
			await writeManifest(storage, {
				workspaceId: targetId,
				formatVersion: 2,
				name: targetName,
				managedRoot: true,
				version: 1,
				storage: storage.kind,
				configuredAt: new Date().toISOString(),
				bibleImportStatus: 'pending',
				label: targetName
			});

			upsertCatalogEntry({
				workspaceId: targetId,
				nameCache: targetName,
				storageKind: storage.kind,
				lastOpenedAt: new Date().toISOString(),
				status: 'ready'
			});
		}
	}

	// Ativa o workspace vinculado
	const targetEntry = getCatalogEntry(targetId);
	if (targetEntry) {
		await workspaceState.activateEntry(targetEntry, { storage: options.storageOverride });
	} else {
		await workspaceState.flushAndSwitch(targetId);
	}

	// Habilita a sincronização localmente para este workspace
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.setItem(
				`openbible:sync-settings:${targetId}`,
				JSON.stringify({ enabled: true })
			);
		} catch {
			// Ignora falhas de localStorage
		}
	}

	// Executa a primeira sincronização (puxa todos os registros da nuvem)
	if (workspaceState.storage) {
		try {
			await syncWorkspaceWithAccount({
				storage: workspaceState.storage,
				fetcher: options.fetcher
			});
		} catch (err) {
			console.warn('[CloudWorkspace] Initial pull deferred or network unavailable:', err);
		}
	}

	// Emite evento para os componentes atualizarem
	if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent('openbible:workspace-content-changed', {
				detail: { workspaceId: targetId }
			})
		);
	}

	return { success: true, workspaceId: targetId };
}
