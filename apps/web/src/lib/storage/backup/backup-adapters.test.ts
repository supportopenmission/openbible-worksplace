import { describe, expect, it } from 'vitest';
import { BackupMemoryStorage } from './backup-test-fixture';
import {
	createIndexedDbContentRepository,
	createNativeSqliteContentRepository,
	createWorkspaceStorageBackupSink,
	type NativeWorkspaceContentPort
} from './backup-adapters';
import type { IndexedDbWorkspaceAdapter } from '../indexeddb-workspace-adapter';
import type { WorkspaceContentRecord } from '../workspace-content-repository';

const context = { workspaceId: 'workspace-adapters', generation: 1, backend: 'indexeddb' as const };

function note(backend: 'indexeddb' | 'sqlite'): WorkspaceContentRecord {
	return {
		kind: 'note',
		id: `${backend}-note`,
		workspaceId: context.workspaceId,
		schemaVersion: 1,
		payload: { title: 'Adapter', body: '# Adapter' }
	};
}

function fakeIndexedDbAdapter(): IndexedDbWorkspaceAdapter {
	const rows = new Map<string, Record<string, unknown>[]>();
	return {
		transaction: async (
			stores: readonly string[],
			_mode: IDBTransactionMode,
			requestFactory: (transaction: IDBTransaction) => IDBRequest<unknown>
		) => {
			const store = stores[0];
			const values = rows.get(store) ?? [];
			rows.set(store, values);
			const transaction = {
				objectStore: () => ({
					getAll: () => ({ result: [...values] }),
					put: (value: Record<string, unknown>) => {
						values.push(value);
						return { result: value };
					}
				})
			};
			return requestFactory(transaction as unknown as IDBTransaction).result;
		}
	} as unknown as IndexedDbWorkspaceAdapter;
}

// SPECSFY: US-002 US-003 US-004 FR-003 FR-005 FR-007 FR-008 NFR-003 NFR-004 AC-003 AC-007 AC-009 AC-012
describe('adapters de backend e sinks do backup', () => {
	it('persiste e relê conteúdo pelo adapter IndexedDB escopado', async () => {
		const repository = createIndexedDbContentRepository(fakeIndexedDbAdapter(), context);
		await repository.write(note('indexeddb'));

		expect(await repository.list(context)).toEqual([expect.objectContaining(note('indexeddb'))]);
	});

	it('mantém o adapter SQLite nativo atrás de uma porta explícita', async () => {
		const values: WorkspaceContentRecord[] = [];
		const port: NativeWorkspaceContentPort = {
			async listContent() {
				return values.map((record) => structuredClone(record));
			},
			async writeContent(record) {
				values.push(structuredClone(record));
			}
		};
		const sqliteContext = { ...context, backend: 'sqlite' as const };
		const repository = createNativeSqliteContentRepository(sqliteContext, port);
		await repository.write(note('sqlite'));

		expect(await repository.list(sqliteContext)).toEqual([note('sqlite')]);
	});

	it('trata WorkspaceStorage somente como sink físico do pacote', async () => {
		const storage = new BackupMemoryStorage();
		const sink = createWorkspaceStorageBackupSink(storage);
		await sink.write('files/notes/export.md', new TextEncoder().encode('# Export'));

		expect(await storage.readFile('files/notes/export.md')).toEqual(new TextEncoder().encode('# Export'));
	});
});
