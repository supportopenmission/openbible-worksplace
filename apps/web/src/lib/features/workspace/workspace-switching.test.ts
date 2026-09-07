import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareWorkspace } from '$lib/storage/workspace';
import {
	getActiveWorkspace,
	getCatalogEntry,
	setActiveWorkspace
} from '$lib/storage/workspace-catalog';
import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';
import { WorkspaceState } from './workspace-state.svelte';

const openWorkspaceStorageMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/storage/storage-registry', async () => {
	const actual = await vi.importActual<typeof import('$lib/storage/storage-registry')>(
		'$lib/storage/storage-registry'
	);
	return { ...actual, openWorkspaceStorage: openWorkspaceStorageMock };
});

vi.mock('$lib/theme/theme', () => ({
	applyTheme: vi.fn(),
	readTheme: vi.fn(() => 'light'),
	saveTheme: vi.fn(() => true)
}));

class MemoryStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	readonly directories = new Set<string>();

	constructor(
		readonly kind: StorageKind,
		readonly label: string
	) {}

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
		const prefix = path ? `${path.replace(/\/$/, '')}/` : '';
		return [...this.files.keys()]
			.filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
			.map((file) => file.slice(prefix.length));
	}
}

describe('workspace activation integration', () => {
	beforeEach(() => {
		openWorkspaceStorageMock.mockReset();
		setActiveWorkspace(null);
	});

	it('switches the pointer and publishes the destination storage/configuration', async () => {
		const first = new MemoryStorage('opfs', 'Workspace A');
		const second = new MemoryStorage('opfs', 'Workspace B');
		await prepareWorkspace(first);
		await prepareWorkspace(second);

		const firstId = JSON.parse(new TextDecoder().decode(first.files.get('.openbible/config.json')))
			.workspaceId as string;
		const secondId = JSON.parse(
			new TextDecoder().decode(second.files.get('.openbible/config.json'))
		).workspaceId as string;
		setActiveWorkspace(firstId);
		openWorkspaceStorageMock.mockResolvedValue(second);

		const state = new WorkspaceState();
		await state.activateEntry(getCatalogEntry(secondId)!);

		expect(openWorkspaceStorageMock).toHaveBeenCalledWith(getCatalogEntry(secondId), {
			requestPermission: true
		});
		expect(getActiveWorkspace().workspaceId).toBe(secondId);
		expect(state.workspaceId).toBe(secondId);
		expect(state.storage).toBe(second);
		expect(state.config?.label).toBe('Workspace B');
		expect(state.status).toBe('ready');
	});

	it('does not let an older activation commit after a newer generation', async () => {
		const first = new MemoryStorage('opfs', 'Workspace A');
		const second = new MemoryStorage('opfs', 'Workspace B');
		const third = new MemoryStorage('opfs', 'Workspace C');
		await Promise.all([prepareWorkspace(first), prepareWorkspace(second), prepareWorkspace(third)]);

		const ids = [first, second, third].map(
			(storage) =>
				JSON.parse(new TextDecoder().decode(storage.files.get('.openbible/config.json')))
					.workspaceId as string
		);
		setActiveWorkspace(ids[0]);
		let resolveSecond: ((storage: WorkspaceStorage) => void) | undefined;
		openWorkspaceStorageMock.mockImplementation((entry: { workspaceId: string }) => {
			if (entry.workspaceId === ids[1]) {
				return new Promise<WorkspaceStorage>((resolve) => {
					resolveSecond = resolve;
				});
			}
			return Promise.resolve(third);
		});

		const state = new WorkspaceState();
		const older = state.activateEntry(getCatalogEntry(ids[1])!);
		await state.activateEntry(getCatalogEntry(ids[2])!);
		resolveSecond?.(second);

		await expect(older).rejects.toThrow('stale_generation');
		expect(getActiveWorkspace().workspaceId).toBe(ids[2]);
		expect(state.storage).toBe(third);
	});
});
