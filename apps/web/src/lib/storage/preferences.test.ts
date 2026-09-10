import { describe, expect, it } from 'vitest';
import {
	loadWorkspacePreferences,
	patchWorkspacePreferences,
	resolveEditorEngine
} from './preferences';
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
			readerSelection: null,
			defaultBibleVersionId: null,
			editorEngine: 'edra'
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

	it('defaults the note editor engine to edra', async () => {
		const storage = new MemoryStorage();

		const preferences = await loadWorkspacePreferences(storage);

		expect(preferences.editorEngine).toBe('edra');
		expect(
			JSON.parse(new TextDecoder().decode(storage.files.get('.openbible/preferences.json')))
		).toMatchObject({ editorEngine: 'edra' });
	});

	it('patches the note editor engine in the workspace file', async () => {
		const storage = new MemoryStorage();

		const preferences = await patchWorkspacePreferences(storage, { editorEngine: 'milkdown' });

		expect(preferences.editorEngine).toBe('milkdown');
		expect(
			JSON.parse(new TextDecoder().decode(storage.files.get('.openbible/preferences.json')))
		).toMatchObject({ editorEngine: 'milkdown' });
	});

	it('normalizes legacy preferences files without the engine field', async () => {
		const storage = new MemoryStorage();
		await storage.writeFile(
			'.openbible/preferences.json',
			JSON.stringify({
				version: 1,
				theme: 'dark',
				initialRoute: null,
				readerSelection: null,
				defaultBibleVersionId: null
			})
		);

		const preferences = await loadWorkspacePreferences(storage);

		expect(preferences.editorEngine).toBe('edra');
		expect(preferences.theme).toBe('dark');
	});

	it('resolves unknown engine values to the default engine', () => {
		expect(resolveEditorEngine(null)).toBe('edra');
		expect(resolveEditorEngine(undefined)).toBe('edra');
		expect(resolveEditorEngine({})).toBe('edra');
		expect(resolveEditorEngine({ editorEngine: 'edra' })).toBe('edra');
		expect(resolveEditorEngine({ editorEngine: 'milkdown' })).toBe('milkdown');
		expect(resolveEditorEngine({ editorEngine: 'tipex' })).toBe('edra');
	});
});
