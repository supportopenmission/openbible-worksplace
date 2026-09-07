export const INDEXEDDB_WORKSPACE_DATABASE = 'openbible-workspace';
export const INDEXEDDB_WORKSPACE_SCHEMA_VERSION = 2;

export const INDEXEDDB_WORKSPACE_STORES = {
	workspaces: 'workspaces',
	activePointer: 'active_workspace_pointer',
	legacyMigrations: 'legacy_workspace_migrations',
	blobs: 'workspace_blobs',
	notes: 'workspace_notes',
	highlights: 'workspace_highlights',
	indexState: 'workspace_index_state',
	noteVerseRefs: 'note_verse_ref',
	readerHighlights: 'reader_highlight'
} as const;

export type IndexedDbWorkspaceStore =
	(typeof INDEXEDDB_WORKSPACE_STORES)[keyof typeof INDEXEDDB_WORKSPACE_STORES];
export type WorkspaceRecordStatus =
	| 'registered'
	| 'opening'
	| 'ready'
	| 'unavailable'
	| 'migrating'
	| 'invalid'
	| 'detached'
	| 'deleted';

export interface IndexedDbWorkspaceRecord {
	workspaceId: string;
	name: string;
	status: WorkspaceRecordStatus;
	schemaVersion: number;
	createdAt: string;
	updatedAt: string;
	lastOpenedAt: string | null;
	metadataJson: string;
}

export interface IndexedDbActiveWorkspacePointer {
	pointerId: 1;
	workspaceId: string | null;
	generation: number;
	updatedAt: string;
}

export interface IndexedDbLegacyMigration {
	migrationKey: string;
	sourceType: string;
	sourceRef: string | null;
	workspaceId: string | null;
	state: 'not_started' | 'running' | 'completed' | 'error';
	cursor: string | null;
	errorCode: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface IndexedDbWorkspaceBlob {
	workspaceId: string;
	blobKey: string;
	data: Blob;
}

export interface IndexedDbSchemaStatus {
	backend: 'indexeddb';
	schemaVersion: number;
}

export type IndexedDbPersistenceErrorCode =
	'INDEXEDDB_UNAVAILABLE' | 'SCHEMA_UNAVAILABLE' | 'TRANSACTION_FAILED';

export class IndexedDbPersistenceError extends Error {
	readonly code: IndexedDbPersistenceErrorCode;

	constructor(code: IndexedDbPersistenceErrorCode, message: string, cause?: unknown) {
		super(message, { cause });
		this.name = 'IndexedDbPersistenceError';
		this.code = code;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isWorkspaceStatus(value: unknown): value is WorkspaceRecordStatus {
	return (
		value === 'registered' ||
		value === 'opening' ||
		value === 'ready' ||
		value === 'unavailable' ||
		value === 'migrating' ||
		value === 'invalid' ||
		value === 'detached' ||
		value === 'deleted'
	);
}

function isWorkspaceRecord(value: unknown): value is IndexedDbWorkspaceRecord {
	return (
		isRecord(value) &&
		typeof value.workspaceId === 'string' &&
		typeof value.name === 'string' &&
		isWorkspaceStatus(value.status) &&
		typeof value.schemaVersion === 'number' &&
		typeof value.createdAt === 'string' &&
		typeof value.updatedAt === 'string' &&
		(value.lastOpenedAt === null || typeof value.lastOpenedAt === 'string') &&
		typeof value.metadataJson === 'string'
	);
}

function isActiveWorkspacePointer(value: unknown): value is IndexedDbActiveWorkspacePointer {
	return (
		isRecord(value) &&
		value.pointerId === 1 &&
		(value.workspaceId === null || typeof value.workspaceId === 'string') &&
		typeof value.generation === 'number' &&
		typeof value.updatedAt === 'string'
	);
}

function isLegacyMigration(value: unknown): value is IndexedDbLegacyMigration {
	return (
		isRecord(value) &&
		typeof value.migrationKey === 'string' &&
		typeof value.sourceType === 'string' &&
		(value.sourceRef === null || typeof value.sourceRef === 'string') &&
		(value.workspaceId === null || typeof value.workspaceId === 'string') &&
		(value.state === 'not_started' ||
			value.state === 'running' ||
			value.state === 'completed' ||
			value.state === 'error') &&
		(value.cursor === null || typeof value.cursor === 'string') &&
		(value.errorCode === null || typeof value.errorCode === 'string') &&
		typeof value.createdAt === 'string' &&
		typeof value.updatedAt === 'string'
	);
}

function isWorkspaceBlob(value: unknown): value is IndexedDbWorkspaceBlob {
	return (
		isRecord(value) &&
		typeof value.workspaceId === 'string' &&
		typeof value.blobKey === 'string' &&
		value.data instanceof Blob
	);
}

function requestError(request: IDBRequest<unknown>, fallback: string): Error {
	return request.error ?? new Error(fallback);
}

export class IndexedDbWorkspaceAdapter {
	readonly backend = 'indexeddb' as const;
	readonly capabilities = {
		backend: 'indexeddb' as const,
		transactions: true,
		blobs: true
	};

	private database: IDBDatabase | null = null;

	constructor(private readonly databaseName = INDEXEDDB_WORKSPACE_DATABASE) {}

	async open(): Promise<IndexedDbSchemaStatus> {
		if (this.database) return this.schemaStatus();
		if (typeof globalThis.indexedDB === 'undefined') {
			throw new IndexedDbPersistenceError(
				'INDEXEDDB_UNAVAILABLE',
				'IndexedDB não está disponível nesta origem.'
			);
		}

		this.database = await new Promise<IDBDatabase>((resolve, reject) => {
			const request = globalThis.indexedDB.open(
				this.databaseName,
				INDEXEDDB_WORKSPACE_SCHEMA_VERSION
			);
			request.onupgradeneeded = () => this.createSchema(request.result);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () =>
				reject(
					new IndexedDbPersistenceError(
						'SCHEMA_UNAVAILABLE',
						'Não foi possível abrir o banco IndexedDB.',
						request.error
					)
				);
			request.onblocked = () =>
				reject(
					new IndexedDbPersistenceError(
						'SCHEMA_UNAVAILABLE',
						'O banco IndexedDB está bloqueado por outra sessão.'
					)
				);
		});
		this.database.onversionchange = () => this.close();
		return this.schemaStatus();
	}

	async ensureSchema(): Promise<IndexedDbSchemaStatus> {
		return this.open();
	}

	async migrate(): Promise<IndexedDbSchemaStatus> {
		return this.ensureSchema();
	}

	async readWorkspace(workspaceId: string): Promise<IndexedDbWorkspaceRecord | null> {
		const value = await this.transaction(
			[INDEXEDDB_WORKSPACE_STORES.workspaces],
			'readonly',
			(transaction) =>
				transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.workspaces).get(workspaceId)
		);
		if (value === undefined) return null;
		if (!isWorkspaceRecord(value)) throw this.invalidRecord('workspace');
		return value;
	}

	async writeWorkspace(record: IndexedDbWorkspaceRecord): Promise<void> {
		if (!isWorkspaceRecord(record)) throw this.invalidRecord('workspace');
		await this.transaction([INDEXEDDB_WORKSPACE_STORES.workspaces], 'readwrite', (transaction) =>
			transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.workspaces).put(record)
		);
	}

	async deleteWorkspace(workspaceId: string): Promise<void> {
		if (!workspaceId.trim()) throw this.invalidRecord('workspace');
		await this.transaction(
			[
				INDEXEDDB_WORKSPACE_STORES.workspaces,
				INDEXEDDB_WORKSPACE_STORES.activePointer,
				INDEXEDDB_WORKSPACE_STORES.legacyMigrations
			],
			'readwrite',
			(transaction) => {
				const pointerStore = transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.activePointer);
				const pointerRequest = pointerStore.get(1);
				pointerRequest.onsuccess = () => {
					const pointer = pointerRequest.result;
					if (isActiveWorkspacePointer(pointer) && pointer.workspaceId === workspaceId) {
						pointerStore.put({
							...pointer,
							workspaceId: null,
							generation: pointer.generation + 1,
							updatedAt: new Date().toISOString()
						});
					}
				};

				const migrationStore = transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.legacyMigrations);
				const migrationCursor = migrationStore.index('workspaceId').openCursor(workspaceId);
				migrationCursor.onsuccess = () => {
					const cursor = migrationCursor.result;
					if (!cursor) return;
					cursor.delete();
					cursor.continue();
				};
				return transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.workspaces).delete(workspaceId);
			}
		);
	}

	async queryWorkspaces(): Promise<IndexedDbWorkspaceRecord[]> {
		const values = await this.transaction(
			[INDEXEDDB_WORKSPACE_STORES.workspaces],
			'readonly',
			(transaction) => transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.workspaces).getAll()
		);
		if (!Array.isArray(values) || !values.every(isWorkspaceRecord)) {
			throw this.invalidRecord('workspace');
		}
		return values;
	}

	async readActivePointer(): Promise<IndexedDbActiveWorkspacePointer | null> {
		const value = await this.transaction(
			[INDEXEDDB_WORKSPACE_STORES.activePointer],
			'readonly',
			(transaction) => transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.activePointer).get(1)
		);
		if (value === undefined) return null;
		if (!isActiveWorkspacePointer(value)) throw this.invalidRecord('active pointer');
		return value;
	}

	async writeActivePointer(pointer: IndexedDbActiveWorkspacePointer): Promise<void> {
		if (!isActiveWorkspacePointer(pointer)) throw this.invalidRecord('active pointer');
		await this.transaction([INDEXEDDB_WORKSPACE_STORES.activePointer], 'readwrite', (transaction) =>
			transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.activePointer).put(pointer)
		);
	}

	async readMigration(migrationKey: string): Promise<IndexedDbLegacyMigration | null> {
		const value = await this.transaction(
			[INDEXEDDB_WORKSPACE_STORES.legacyMigrations],
			'readonly',
			(transaction) =>
				transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.legacyMigrations).get(migrationKey)
		);
		if (value === undefined) return null;
		if (!isLegacyMigration(value)) throw this.invalidRecord('legacy migration');
		return value;
	}

	async writeMigration(migration: IndexedDbLegacyMigration): Promise<void> {
		if (!isLegacyMigration(migration)) throw this.invalidRecord('legacy migration');
		await this.transaction(
			[INDEXEDDB_WORKSPACE_STORES.legacyMigrations],
			'readwrite',
			(transaction) =>
				transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.legacyMigrations).put(migration)
		);
	}

	async readBlob(workspaceId: string, blobKey: string): Promise<Blob | null> {
		const value = await this.transaction(
			[INDEXEDDB_WORKSPACE_STORES.blobs],
			'readonly',
			(transaction) =>
				transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.blobs).get([workspaceId, blobKey])
		);
		if (value === undefined) return null;
		if (!isWorkspaceBlob(value)) throw this.invalidRecord('workspace blob');
		return value.data;
	}

	async writeBlob(workspaceId: string, blobKey: string, data: Blob): Promise<void> {
		const record: IndexedDbWorkspaceBlob = { workspaceId, blobKey, data };
		await this.transaction([INDEXEDDB_WORKSPACE_STORES.blobs], 'readwrite', (transaction) =>
			transaction.objectStore(INDEXEDDB_WORKSPACE_STORES.blobs).put(record)
		);
	}

	async transaction<T>(
		stores: readonly IndexedDbWorkspaceStore[],
		mode: IDBTransactionMode,
		requestFactory: (transaction: IDBTransaction) => IDBRequest<T>
	): Promise<T> {
		await this.open();
		const database = this.database;
		if (!database) throw this.invalidRecord('database');

		return new Promise<T>((resolve, reject) => {
			let result: T;
			let request: IDBRequest<T>;
			let transaction: IDBTransaction;
			try {
				transaction = database.transaction([...stores], mode);
				request = requestFactory(transaction);
			} catch (error) {
				reject(
					new IndexedDbPersistenceError(
						'TRANSACTION_FAILED',
						'Não foi possível iniciar a transação IndexedDB.',
						error
					)
				);
				return;
			}

			request.onsuccess = () => {
				result = request.result;
			};
			request.onerror = () =>
				reject(
					new IndexedDbPersistenceError(
						'TRANSACTION_FAILED',
						'Uma operação IndexedDB falhou.',
						requestError(request as IDBRequest<unknown>, 'IndexedDB request failed')
					)
				);
			transaction.oncomplete = () => resolve(result);
			transaction.onerror = () =>
				reject(
					new IndexedDbPersistenceError(
						'TRANSACTION_FAILED',
						'Uma transação IndexedDB falhou.',
						transaction.error
					)
				);
			transaction.onabort = () =>
				reject(
					new IndexedDbPersistenceError(
						'TRANSACTION_FAILED',
						'Uma transação IndexedDB foi abortada.',
						transaction.error
					)
				);
		});
	}

	close(): void {
		this.database?.close();
		this.database = null;
	}

	private schemaStatus(): IndexedDbSchemaStatus {
		if (!this.database) throw this.invalidRecord('database');
		return { backend: 'indexeddb', schemaVersion: this.database.version };
	}

	private invalidRecord(kind: string): IndexedDbPersistenceError {
		return new IndexedDbPersistenceError(
			'SCHEMA_UNAVAILABLE',
			`Registro IndexedDB inválido: ${kind}.`
		);
	}

	private createSchema(database: IDBDatabase): void {
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.workspaces)) {
			const store = database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.workspaces, {
				keyPath: 'workspaceId'
			});
			store.createIndex('status', 'status', { unique: false });
			store.createIndex('updatedAt', 'updatedAt', { unique: false });
		}
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.activePointer)) {
			database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.activePointer, {
				keyPath: 'pointerId'
			});
		}
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.legacyMigrations)) {
			const store = database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.legacyMigrations, {
				keyPath: 'migrationKey'
			});
			store.createIndex('workspaceId', 'workspaceId', { unique: false });
			store.createIndex('state', 'state', { unique: false });
		}
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.blobs)) {
			const store = database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.blobs, {
				keyPath: ['workspaceId', 'blobKey']
			});
			store.createIndex('workspaceId', 'workspaceId', { unique: false });
		}
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.notes)) {
			const store = database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.notes, {
				keyPath: ['workspaceId', 'noteId']
			});
			store.createIndex('workspaceId', 'workspaceId', { unique: false });
			store.createIndex('updatedAt', ['workspaceId', 'updatedAt'], { unique: false });
		}
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.highlights)) {
			const store = database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.highlights, {
				keyPath: ['workspaceId', 'highlightId']
			});
			store.createIndex('workspaceId', 'workspaceId', { unique: false });
			store.createIndex(
				'reference',
				['workspaceId', 'versionId', 'bookId', 'chapter', 'verseStart', 'verseEnd'],
				{ unique: false }
			);
		}
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.indexState)) {
			const store = database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.indexState, {
				keyPath: 'workspaceId'
			});
			store.createIndex('status', 'status', { unique: false });
			store.createIndex('updatedAt', 'updatedAt', { unique: false });
		}
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.noteVerseRefs)) {
			const store = database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.noteVerseRefs, {
				keyPath: ['workspaceId', 'noteId', 'blockId']
			});
			store.createIndex('workspaceId', 'workspaceId', { unique: false });
			store.createIndex('noteId', ['workspaceId', 'noteId'], { unique: false });
		}
		if (!database.objectStoreNames.contains(INDEXEDDB_WORKSPACE_STORES.readerHighlights)) {
			const store = database.createObjectStore(INDEXEDDB_WORKSPACE_STORES.readerHighlights, {
				keyPath: ['workspaceId', 'highlightId']
			});
			store.createIndex('workspaceId', 'workspaceId', { unique: false });
			store.createIndex(
				'reference',
				['workspaceId', 'versionId', 'bookId', 'chapter', 'verseStart', 'verseEnd'],
				{ unique: false }
			);
		}
	}
}

export function createIndexedDbWorkspaceAdapter(
	databaseName = INDEXEDDB_WORKSPACE_DATABASE
): IndexedDbWorkspaceAdapter {
	return new IndexedDbWorkspaceAdapter(databaseName);
}
