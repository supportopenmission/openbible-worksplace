export type WorkspaceContentBackend = 'sqlite' | 'indexeddb';
export type WorkspaceContentKind = 'note' | 'highlight';

export interface WorkspaceContentContext {
	workspaceId: string;
	generation: number;
	backend: WorkspaceContentBackend;
}

export interface WorkspaceContentRecord {
	kind: WorkspaceContentKind;
	id: string;
	workspaceId: string;
	schemaVersion: number;
	payload: Record<string, unknown>;
	createdAt?: string;
	updatedAt?: string;
}

export interface WorkspaceContentProjection {
	backend: WorkspaceContentBackend;
	workspaceId: string;
	generation: number;
	projectionVersion: number;
	status: 'ready';
	records: WorkspaceContentRecord[];
}

export interface WorkspaceContentDriver {
	write(record: WorkspaceContentRecord): Promise<void>;
	list(context: WorkspaceContentContext): Promise<WorkspaceContentRecord[]>;
	remove?(context: WorkspaceContentContext, kind: WorkspaceContentKind, id: string): Promise<void>;
}

export type WorkspaceContentRepository = {
	readonly backend: WorkspaceContentBackend;
	write(record: WorkspaceContentRecord): Promise<void>;
	list(context: WorkspaceContentContext): Promise<WorkspaceContentRecord[]>;
	remove(context: WorkspaceContentContext, kind: WorkspaceContentKind, id: string): Promise<void>;
	rebuild(context: WorkspaceContentContext): Promise<WorkspaceContentProjection>;
};

export class WorkspaceContentRepositoryError extends Error {
	constructor(
		readonly code: 'WORKSPACE_ID_REQUIRED' | 'CONTEXT_MISMATCH' | 'INVALID_RECORD',
		message: string,
		cause?: unknown
	) {
		super(message, { cause });
		this.name = 'WorkspaceContentRepositoryError';
	}
}

const memoryRecords: Record<WorkspaceContentBackend, Map<string, WorkspaceContentRecord>> = {
	sqlite: new Map(),
	indexeddb: new Map()
};

function requireWorkspaceId(value: string): string {
	const workspaceId = value.trim();
	if (!workspaceId) {
		throw new WorkspaceContentRepositoryError(
			'WORKSPACE_ID_REQUIRED',
			'workspaceId é obrigatório para persistir conteúdo.'
		);
	}
	return workspaceId;
}

function cloneRecord(record: WorkspaceContentRecord): WorkspaceContentRecord {
	return {
		...record,
		payload: structuredClone(record.payload)
	};
}

function validateRecord(record: WorkspaceContentRecord): void {
	if (
		!record ||
		(record.kind !== 'note' && record.kind !== 'highlight') ||
		!record.id.trim() ||
		!record.workspaceId.trim() ||
		!Number.isInteger(record.schemaVersion) ||
		typeof record.payload !== 'object' ||
		record.payload === null
	) {
		throw new WorkspaceContentRepositoryError('INVALID_RECORD', 'Registro de conteúdo inválido.');
	}
}

function assertContext(context: WorkspaceContentContext): string {
	const workspaceId = requireWorkspaceId(context.workspaceId);
	if (!Number.isInteger(context.generation) || context.generation < 0) {
		throw new WorkspaceContentRepositoryError(
			'CONTEXT_MISMATCH',
			'Geração inválida para o workspace ativo.'
		);
	}
	return workspaceId;
}

function key(record: WorkspaceContentRecord): string {
	return `${record.workspaceId}\u0000${record.kind}\u0000${record.id}`;
}

function createMemoryDriver(backend: WorkspaceContentBackend): WorkspaceContentDriver {
	const records = memoryRecords[backend];
	return {
		async write(record) {
			records.set(key(record), cloneRecord(record));
		},
		async list(context) {
			const workspaceId = assertContext(context);
			return [...records.values()]
				.filter((record) => record.workspaceId === workspaceId)
				.map(cloneRecord);
		},
		async remove(context, kind, id) {
			const workspaceId = assertContext(context);
			records.delete(`${workspaceId}\u0000${kind}\u0000${id}`);
		}
	};
}

export function createWorkspaceContentRepository(
	context: WorkspaceContentContext,
	driver: WorkspaceContentDriver = createMemoryDriver(context.backend)
): WorkspaceContentRepository {
	assertContext(context);
	return {
		backend: context.backend,
		async write(record) {
			validateRecord(record);
			await driver.write(cloneRecord(record));
		},
		async list(activeContext) {
			assertContext(activeContext);
			if (activeContext.backend !== context.backend) {
				throw new WorkspaceContentRepositoryError(
					'CONTEXT_MISMATCH',
					'O backend do contexto não corresponde ao repositório.'
				);
			}
			return driver.list(activeContext);
		},
		async remove(activeContext, kind, id) {
			assertContext(activeContext);
			if (activeContext.backend !== context.backend) {
				throw new WorkspaceContentRepositoryError(
					'CONTEXT_MISMATCH',
					'O backend do contexto não corresponde ao repositório.'
				);
			}
			if (!id.trim()) {
				throw new WorkspaceContentRepositoryError('INVALID_RECORD', 'ID do registro é obrigatório.');
			}
			if (!driver.remove) {
				throw new WorkspaceContentRepositoryError(
					'INVALID_RECORD',
					'O backend não suporta exclusão de conteúdo.'
				);
			}
			await driver.remove(activeContext, kind, id);
		},
		async rebuild(activeContext) {
			const records = await this.list(activeContext);
			return {
				backend: activeContext.backend,
				workspaceId: activeContext.workspaceId,
				generation: activeContext.generation,
				projectionVersion: 1,
				status: 'ready',
				records
			};
		}
	};
}
