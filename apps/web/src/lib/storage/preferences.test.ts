import { describe, expect, it } from 'vitest';
import { loadWorkspacePreferences, patchWorkspacePreferences } from './preferences';
import type { StorageKind, WorkspaceStorage } from './types';

class MemoryStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	readonly label = 'Pasta local';

	constructor(readonly kind: StorageKind = 'local') {}

	async ensureDirectory() {}
	async writeFile(path: string, content: string | Uint8Array) {
		this.files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
	}
	async readFile(path: string) {
		return this.files.get(path) ?? null;
	}
	async fileExists(path: string) {
		return this.files.has(path);
	}
	async listFiles() {
		return [];
	}
}

describe('workspace preferences', () => {
	it('creates preferences.json from defaults when the file is missing', async () => {
		const storage = new MemoryStorage();

		const preferences = await loadWorkspacePreferences(storage);

		expect(preferences).toEqual({
			version: 1,
			theme: 'light',
			initialRoute: null,
			readerSelection: null
		});
		expect(storage.files.has('.openbible/preferences.json')).toBe(true);
	});

	it('patches theme and reader selection in the workspace file', async () => {
		const storage = new MemoryStorage();

		const preferences = await patchWorkspacePreferences(storage, {
			theme: 'dark',
			readerSelection: { versionId: 'ara.sqlite', bookId: 1, chapter: 2 }
		});

		expect(preferences.theme).toBe('dark');
		expect(preferences.readerSelection).toEqual({
			versionId: 'ara.sqlite',
			bookId: 1,
			chapter: 2
		});
		expect(
			JSON.parse(new TextDecoder().decode(storage.files.get('.openbible/preferences.json')))
		).toMatchObject({
			theme: 'dark',
			readerSelection: { versionId: 'ara.sqlite', bookId: 1, chapter: 2 }
		});
	});

	it('accepts the system theme in the workspace file', async () => {
		const storage = new MemoryStorage();

		const preferences = await patchWorkspacePreferences(storage, { theme: 'system' });

		expect(preferences.theme).toBe('system');
		expect(
			JSON.parse(new TextDecoder().decode(storage.files.get('.openbible/preferences.json')))
		).toMatchObject({ theme: 'system' });
	});
});
