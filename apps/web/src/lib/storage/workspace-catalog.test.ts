import { describe, expect, it } from 'vitest';
import { loadWorkspaceConfig, prepareWorkspace } from './workspace';
import {
	listCatalog,
	markCatalogEntryDetached,
	restoreCatalogEntry,
	upsertCatalogEntry
} from './workspace-catalog';
import type { StorageKind, WorkspaceStorage } from './types';

class CatalogMemoryStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	readonly directories = new Set<string>();

	constructor(readonly kind: StorageKind, readonly label = 'Workspace de teste') {}

	async ensureDirectory(path: string) {
		this.directories.add(path);
	}

	async writeFile(path: string, content: string | Uint8Array) {
		this.files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
	}

	async readFile(path: string) {
		return this.files.get(path) ?? null;
	}

	async fileExists(path: string) {
		return this.files.has(path);
	}

	async listFiles(path: string) {
		const prefix = `${path.replace(/\/$/, '')}/`;
		return [...this.files.keys()]
			.filter((filePath) => filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/'))
			.map((filePath) => filePath.slice(prefix.length));
	}
}

const readConfig = (storage: CatalogMemoryStorage) =>
	JSON.parse(new TextDecoder().decode(storage.files.get('.openbible/config.json')));

describe('workspace catalog contract', () => {
	// SPECSFY: US-001 FR-001 NFR-001 AC-001
	it('migra o workspace legado para uma identidade estável e um manifesto v2', async () => {
		const storage = new CatalogMemoryStorage('local', 'Workspace legado');
		await prepareWorkspace(storage);

		const config = await loadWorkspaceConfig(storage);
		const manifest = readConfig(storage);

		expect(config).not.toBeNull();
		expect(manifest).toMatchObject({
		workspaceId: expect.any(String),
		formatVersion: 2,
		name: 'Workspace legado'
		});
	});

	// SPECSFY: US-003 FR-003 FR-004 NFR-002 NFR-003 AC-008
	it('remove a referência local sem apagar a raiz e permite recadastrá-la', async () => {
		const storage = new CatalogMemoryStorage('local');
		await prepareWorkspace(storage);
		await storage.writeFile('notes/theology/keep.md', '# conteúdo autoral');

		const catalog = storage as CatalogMemoryStorage & {
			removeWorkspace?: (workspaceId: string) => Promise<void>;
		};
		expect(typeof catalog.removeWorkspace).toBe('function');
		await catalog.removeWorkspace?.(readConfig(storage).workspaceId);

		expect(await storage.fileExists('notes/theology/keep.md')).toBe(true);
		expect(await storage.fileExists('.openbible/config.json')).toBe(true);
	});

	// SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-011
	it('resolve colisão de ID sem manter duas raízes locais para a mesma identidade', async () => {
		const storage = new CatalogMemoryStorage('local');
		await prepareWorkspace(storage);
		const manifest = readConfig(storage);

		const catalog = storage as CatalogMemoryStorage & {
			addExistingWorkspace?: (workspace: { workspaceId: string }) => Promise<unknown>;
		};
		expect(typeof catalog.addExistingWorkspace).toBe('function');
		const result = await catalog.addExistingWorkspace?.({ workspaceId: manifest.workspaceId });

		expect(result).toMatchObject({ action: expect.stringMatching(/update|copy/) });
	});

	// SPECSFY: US-003 FR-003 NFR-001 NFR-002 AC-012
	it('renomeia o nome portátil sem alterar ID nem referência física', async () => {
		const storage = new CatalogMemoryStorage('local');
		await prepareWorkspace(storage);
		const before = readConfig(storage);

		const catalog = storage as CatalogMemoryStorage & {
			renameWorkspace?: (workspaceId: string, name: string) => Promise<void>;
		};
		expect(typeof catalog.renameWorkspace).toBe('function');
		await catalog.renameWorkspace?.(before.workspaceId, 'Novo nome');
		const after = readConfig(storage);

		expect(after.name).toBe('Novo nome');
		expect(after.workspaceId).toBe(before.workspaceId);
		expect(after.root).toBe(before.root);
	});

	// SPECSFY: US-003 FR-003 FR-004 NFR-003 AC-018
	it('mantém a referência fora da lista ativa e permite restaurá-la', () => {
		const workspaceId = 'workspace-detached-and-restored';
		upsertCatalogEntry({
			workspaceId,
			nameCache: 'Workspace recuperável',
			storageKind: 'opfs',
			lastOpenedAt: null,
			status: 'ready'
		});

		expect(listCatalog().some((entry) => entry.workspaceId === workspaceId)).toBe(true);
		expect(markCatalogEntryDetached(workspaceId)).toBe(true);
		expect(listCatalog().some((entry) => entry.workspaceId === workspaceId)).toBe(false);
		expect(
			listCatalog({ includeDetached: true }).find((entry) => entry.workspaceId === workspaceId)
		).toMatchObject({ status: 'detached' });

		expect(restoreCatalogEntry(workspaceId)).toMatchObject({ status: 'registered' });
		expect(listCatalog().some((entry) => entry.workspaceId === workspaceId)).toBe(true);
	});
});
