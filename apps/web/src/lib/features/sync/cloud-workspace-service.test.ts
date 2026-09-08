import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	fetchUserCloudWorkspaces,
	isWorkspaceInLocalCatalog,
	linkAndDownloadCloudWorkspace,
	renameCloudWorkspace,
	deleteCloudWorkspace
} from './cloud-workspace-service';
import { setStoredAuthToken } from '../auth/auth-client';
import { upsertCatalogEntry, getCatalogEntry } from '$lib/storage/workspace-catalog';
import { WorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
import type { WorkspaceStorage } from '$lib/storage/types';

function createMockStorage(workspaceId: string): WorkspaceStorage {
	const files = new Map<string, Uint8Array>();
	return {
		kind: 'opfs' as const,
		label: 'Test Storage',
		workspaceId,
		async ensureDirectory() {},
		async writeFile(path: string, content: string | Uint8Array) {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
		},
		async readFile(path: string) {
			return files.get(path) ?? null;
		},
		async fileExists(path: string) {
			return files.has(path);
		},
		async listFiles() {
			return Array.from(files.keys());
		}
	} satisfies WorkspaceStorage;
}

describe('cloud-workspace-service', () => {
	const localStorageMap = new Map<string, string>();

	beforeEach(() => {
		localStorageMap.clear();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => localStorageMap.get(key) ?? null,
			setItem: (key: string, val: string) => localStorageMap.set(key, val),
			removeItem: (key: string) => localStorageMap.delete(key),
			clear: () => localStorageMap.clear()
		});
		vi.stubGlobal('document', {
			documentElement: {
				classList: {
					add: vi.fn(),
					remove: vi.fn(),
					contains: vi.fn(),
					toggle: vi.fn()
				},
				style: {
					setProperty: vi.fn(),
					removeProperty: vi.fn()
				}
			},
			querySelector: vi.fn(() => null)
		});
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (key: string) => localStorageMap.get(key) ?? null,
				setItem: (key: string, val: string) => localStorageMap.set(key, val),
				removeItem: (key: string) => localStorageMap.delete(key),
				clear: () => localStorageMap.clear()
			},
			dispatchEvent: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('busca a lista de workspaces remotos do usuário com token de autenticação', async () => {
		setStoredAuthToken('mock-user-token');

		const mockWorkspaces = [
			{
				workspaceId: 'ws-pc-1',
				name: 'Workspace do Computador',
				createdAt: '2026-09-08T18:00:00.000Z',
				updatedAt: '2026-09-08T18:30:00.000Z'
			}
		];

		const mockFetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
			expect(init?.headers).toMatchObject({
				authorization: 'Bearer mock-user-token'
			});
			return new Response(JSON.stringify({ workspaces: mockWorkspaces }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;

		const list = await fetchUserCloudWorkspaces(mockFetcher);
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe('Workspace do Computador');
		expect(list[0].workspaceId).toBe('ws-pc-1');
	});

	it('identifica se um workspaceId já existe no catálogo local do aparelho', () => {
		expect(isWorkspaceInLocalCatalog('ws-unknown')).toBe(false);

		upsertCatalogEntry({
			workspaceId: 'ws-local-1',
			nameCache: 'Local 1',
			storageKind: 'opfs',
			lastOpenedAt: new Date().toISOString(),
			status: 'ready'
		});

		expect(isWorkspaceInLocalCatalog('ws-local-1')).toBe(true);
	});

	it('vincula um workspace da nuvem criando a entrada local no aparelho', async () => {
		const targetId = 'ws-cloud-sync-target';
		const targetName = 'Estudos Bíblicos Remotos';

		const workspaceState = new WorkspaceState();
		const mockStorage = createMockStorage(targetId);

		const result = await linkAndDownloadCloudWorkspace(
			workspaceState,
			{ workspaceId: targetId, name: targetName },
			{ storageOverride: mockStorage }
		);

		expect(result.success).toBe(true);
		expect(result.workspaceId).toBe(targetId);

		// O workspace deve constar no catálogo local
		const entry = getCatalogEntry(targetId);
		expect(entry).not.toBeNull();
		expect(entry?.nameCache).toBe(targetName);

		// O workspace deve ter sido ativado
		expect(workspaceState.workspaceId).toBe(targetId);
	});

	it('permite renomear um workspace na nuvem atualizando o catalog local', async () => {
		setStoredAuthToken('mock-user-token');
		upsertCatalogEntry({
			workspaceId: 'ws-rename-test',
			nameCache: 'Nome Original',
			storageKind: 'opfs',
			lastOpenedAt: new Date().toISOString(),
			status: 'ready'
		});

		const mockFetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
			expect(init?.method).toBe('PATCH');
			expect(JSON.parse(String(init?.body))).toEqual({ name: 'Nome Atualizado' });
			return new Response(JSON.stringify({ workspaceId: 'ws-rename-test', name: 'Nome Atualizado' }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;

		const res = await renameCloudWorkspace('ws-rename-test', 'Nome Atualizado', mockFetcher);
		expect(res.success).toBe(true);
		expect(res.name).toBe('Nome Atualizado');

		const entry = getCatalogEntry('ws-rename-test');
		expect(entry?.nameCache).toBe('Nome Atualizado');
	});

	it('permite excluir um workspace da nuvem', async () => {
		setStoredAuthToken('mock-user-token');

		const mockFetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
			expect(init?.method).toBe('DELETE');
			return new Response(JSON.stringify({ deleted: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}) as typeof fetch;

		const res = await deleteCloudWorkspace('ws-delete-test', mockFetcher);
		expect(res.success).toBe(true);
	});
});
