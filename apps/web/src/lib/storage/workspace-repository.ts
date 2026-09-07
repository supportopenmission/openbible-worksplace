import {
	generateWorkspaceId,
	type WorkspaceCatalogEntry
} from './workspace-catalog';
import type {
	IndexedDbActiveWorkspacePointer,
	IndexedDbWorkspaceAdapter,
	IndexedDbWorkspaceRecord,
	IndexedDbWorkspaceStore
} from './indexeddb-workspace-adapter';

export type WorkspaceRecord = IndexedDbWorkspaceRecord;

export type WorkspaceRepositoryErrorCode =
	| 'DUPLICATE_ID'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'PERSISTENCE_UNAVAILABLE'
	| 'WORKSPACE_ID_REQUIRED';

export class WorkspaceRepositoryError extends Error {
	constructor(
		readonly code: WorkspaceRepositoryErrorCode,
		message: string,
		readonly workspaceId?: string,
		cause?: unknown
	) {
		super(message, { cause });
		this.name = 'WorkspaceRepositoryError';
	}
}

export type WorkspacePersistenceAdapter = Pick<
	IndexedDbWorkspaceAdapter,
	| 'backend'
	| 'readWorkspace'
	| 'writeWorkspace'
	| 'queryWorkspaces'
	| 'readActivePointer'
	| 'writeActivePointer'
	| 'transaction'
> & {
	deleteWorkspace?: (workspaceId: string) => Promise<void>;
};

export interface WorkspaceContext {
	readonly workspaceId: string;
	readonly backend: 'sqlite' | 'indexeddb';
	get(): Promise<WorkspaceRecord>;
	rename(name: string): Promise<WorkspaceRecord>;
	remove(): Promise<WorkspaceRecord>;
	restore(): Promise<WorkspaceRecord>;
	setActive(): Promise<WorkspaceActiveResult>;
}

export interface WorkspaceActiveResult {
	workspaceId: string;
	generation: number;
	backend: 'sqlite' | 'indexeddb';
}

export interface CreateWorkspaceInput {
	workspaceId?: string;
	name: string;
	metadataJson?: string;
}

function requireWorkspaceId(workspaceId: string): string {
	const normalized = workspaceId.trim();
	if (!normalized) {
		throw new WorkspaceRepositoryError(
			'WORKSPACE_ID_REQUIRED',
			'workspaceId é obrigatório para acessar dados de domínio.'
		);
	}
	return normalized;
}

function now(): string {
	return new Date().toISOString();
}

function assertName(name: string): string {
	const normalized = name.trim();
	if (!normalized) throw new WorkspaceRepositoryError('CONFLICT', 'O nome do workspace não pode ser vazio.');
	return normalized;
}

function activePointer(
	workspaceId: string,
	current: IndexedDbActiveWorkspacePointer | null,
	backend: 'sqlite' | 'indexeddb'
): WorkspaceActiveResult {
	return {
		workspaceId,
		generation: (current?.generation ?? 0) + 1,
		backend
	};
}

export class WorkspaceRepository {
	readonly backend: 'sqlite' | 'indexeddb';

	constructor(private readonly adapter: WorkspacePersistenceAdapter) {
		this.backend = adapter.backend;
	}

	/** Registry global permitido: retorna apenas metadados de workspaces. */
	list(): Promise<WorkspaceRecord[]> {
		return this.adapter.queryWorkspaces();
	}

	async getById(workspaceId: string): Promise<WorkspaceRecord> {
		const id = requireWorkspaceId(workspaceId);
		const record = await this.adapter.readWorkspace(id);
		if (!record) throw new WorkspaceRepositoryError('NOT_FOUND', 'Workspace não encontrado.', id);
		return record;
	}

	async create(input: CreateWorkspaceInput): Promise<WorkspaceRecord> {
		const workspaceId = requireWorkspaceId(input.workspaceId ?? generateWorkspaceId());
		const name = assertName(input.name);
		const existing = await this.adapter.readWorkspace(workspaceId);
		if (existing) {
			throw new WorkspaceRepositoryError('DUPLICATE_ID', 'workspaceId já está cadastrado.', workspaceId);
		}
		const timestamp = now();
		const record: WorkspaceRecord = {
			workspaceId,
			name,
			status: 'registered',
			schemaVersion: 1,
			createdAt: timestamp,
			updatedAt: timestamp,
			lastOpenedAt: null,
			metadataJson: input.metadataJson ?? '{}'
		};
		await this.adapter.writeWorkspace(record);
		return record;
	}

	async rename(workspaceId: string, name: string): Promise<WorkspaceRecord> {
		const record = await this.getById(workspaceId);
		const next = { ...record, name: assertName(name), updatedAt: now() };
		await this.adapter.writeWorkspace(next);
		return next;
	}

	async remove(workspaceId: string): Promise<WorkspaceRecord> {
		const record = await this.getById(workspaceId);
		if (record.status === 'deleted') {
			throw new WorkspaceRepositoryError('CONFLICT', 'Workspace já foi excluído.', record.workspaceId);
		}
		const next = { ...record, status: 'detached' as const, updatedAt: now() };
		await this.adapter.writeWorkspace(next);
		return next;
	}

	async restore(workspaceId: string): Promise<WorkspaceRecord> {
		const record = await this.getById(workspaceId);
		if (record.status !== 'detached') return record;
		const next = { ...record, status: 'ready' as const, updatedAt: now() };
		await this.adapter.writeWorkspace(next);
		return next;
	}

	async setActive(workspaceId: string): Promise<WorkspaceActiveResult> {
		const record = await this.getById(workspaceId);
		if (record.status === 'deleted') {
			throw new WorkspaceRepositoryError('CONFLICT', 'Workspace excluído não pode ser ativado.', record.workspaceId);
		}
		const current = await this.adapter.readActivePointer();
		const result = activePointer(record.workspaceId, current, this.backend);
		const pointer: IndexedDbActiveWorkspacePointer = {
			pointerId: 1,
			workspaceId: result.workspaceId,
			generation: result.generation,
			updatedAt: now()
		};
		await this.adapter.writeActivePointer(pointer);
		await this.adapter.writeWorkspace({ ...record, lastOpenedAt: pointer.updatedAt, updatedAt: pointer.updatedAt });
		return result;
	}

	async touchLastOpened(workspaceId: string): Promise<WorkspaceRecord> {
		const record = await this.getById(workspaceId);
		const timestamp = now();
		const next = { ...record, lastOpenedAt: timestamp, updatedAt: timestamp };
		await this.adapter.writeWorkspace(next);
		return next;
	}

	async delete(workspaceId: string): Promise<void> {
		const id = requireWorkspaceId(workspaceId);
		await this.getById(id);
		if (!this.adapter.deleteWorkspace) {
			throw new WorkspaceRepositoryError(
				'PERSISTENCE_UNAVAILABLE',
				'O adapter não expõe exclusão transacional para este runtime.',
				id
			);
		}
		await this.adapter.deleteWorkspace(id);
	}

	context(workspaceId: string): WorkspaceContext {
		const id = requireWorkspaceId(workspaceId);
		return {
			workspaceId: id,
			backend: this.backend,
			get: () => this.getById(id),
			rename: (name) => this.rename(id, name),
			remove: () => this.remove(id),
			restore: () => this.restore(id),
			setActive: () => this.setActive(id)
		};
	}

	async activeContext(): Promise<WorkspaceContext> {
		const pointer = await this.adapter.readActivePointer();
		if (!pointer?.workspaceId) {
			throw new WorkspaceRepositoryError(
				'WORKSPACE_ID_REQUIRED',
				'Nenhum workspace ativo foi definido para esta operação.'
			);
		}
		return this.context(pointer.workspaceId);
	}

	transaction<T>(
		stores: readonly IndexedDbWorkspaceStore[],
		mode: IDBTransactionMode,
		requestFactory: Parameters<IndexedDbWorkspaceAdapter['transaction']>[2]
	): ReturnType<IndexedDbWorkspaceAdapter['transaction']> {
		return this.adapter.transaction(stores, mode, requestFactory);
	}
}

export function catalogBackend(entry: WorkspaceCatalogEntry): 'sqlite' | 'indexeddb' {
	return entry.backend;
}
