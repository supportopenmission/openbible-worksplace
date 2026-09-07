import type { WorkspaceStorage } from './types';
import {
	createIndexedDbContentRepository,
	createNativeSqliteContentRepository
} from './backup/backup-adapters';
import { createIndexedDbWorkspaceAdapter } from './indexeddb-workspace-adapter';
import {
	createWorkspaceContentRepository,
	type WorkspaceContentContext,
	type WorkspaceContentRepository
} from './workspace-content-repository';
import { isTauriRuntime } from './tauri-runtime';

const repositories = new WeakMap<WorkspaceStorage, WorkspaceContentRepository>();

function backendFor(storage: WorkspaceStorage): WorkspaceContentContext['backend'] {
	return storage.kind === 'native' ? 'sqlite' : 'indexeddb';
}

export function workspaceContentContext(
	storage: WorkspaceStorage,
	context?: Partial<WorkspaceContentContext>
): WorkspaceContentContext {
	return {
		workspaceId: context?.workspaceId ?? storage.workspaceId ?? `local-${storage.kind}`,
		generation: context?.generation ?? 0,
		backend: context?.backend ?? backendFor(storage)
	};
}

/**
 * Retorna a porta de conteúdo autoral do backend ativo.
 * A ausência de runtime persistente só é usada em testes sem navegador/Tauri;
 * nunca é um fallback em uma sessão real.
 */
export function getWorkspaceContentRepository(
	storage: WorkspaceStorage,
	context?: Partial<WorkspaceContentContext>
): WorkspaceContentRepository {
	const existing = repositories.get(storage);
	if (existing) return existing;

	const resolvedContext = workspaceContentContext(storage, context);
	let repository: WorkspaceContentRepository;
	if (storage.kind === 'native' && isTauriRuntime()) {
		repository = createNativeSqliteContentRepository(resolvedContext);
	} else if (storage.kind !== 'native' && typeof globalThis.indexedDB !== 'undefined') {
		const adapter = createIndexedDbWorkspaceAdapter();
		repository = createIndexedDbContentRepository(adapter, resolvedContext);
	} else {
		repository = createWorkspaceContentRepository(resolvedContext);
	}

	repositories.set(storage, repository);
	return repository;
}

export function bindWorkspaceStorage(storage: WorkspaceStorage, workspaceId: string): void {
	storage.workspaceId = workspaceId;
	repositories.delete(storage);
}
