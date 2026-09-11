import { describe, expect, it } from 'vitest';
import type {
	FileContent,
	WorkspaceMediaCatalogEntry,
	WorkspaceStorage
} from '$lib/storage/types';
import {
	createMediaService,
	MediaInUseError,
	MediaValidationError,
	MEDIA_CATALOG_PATH
} from './media-service';

function memoryStorage(): WorkspaceStorage & { files: Map<string, Uint8Array> } {
	const files = new Map<string, Uint8Array>();
	return {
		kind: 'opfs',
		label: 'Teste',
		workspaceId: 'workspace-test',
		files,
		ensureDirectory: async () => undefined,
		writeFile: async (path: string, content: FileContent) => {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : new Uint8Array(content));
		},
		deleteFile: async (path: string) => {
			files.delete(path);
		},
		readFile: async (path: string) => files.get(path) ?? null,
		fileExists: async (path: string) => files.has(path),
		listFiles: async (path: string) =>
			[...files.keys()]
				.filter((key) => key.startsWith(`${path}/`))
				.map((key) => key.slice(path.length + 1))
	};
}

describe('media service', () => {
	// SPECSFY: US-001 FR-001 FR-002 NFR-001 AC-001
	it('copies a valid image before returning a stable Edra media reference', async () => {
		const storage = memoryStorage();
		const service = createMediaService(storage);
		const file = new File([new Uint8Array([137, 80, 78, 71])], 'cover.png', {
			type: 'image/png'
		});

		const result = await service.upload(file, 'note-1');
		const [asset] = await service.list();

		expect(result.src).toMatch(/^media:[^/]+$/);
		expect(storage.files.has(asset.storageKey)).toBe(true);
		expect(storage.files.has(MEDIA_CATALOG_PATH)).toBe(true);
		expect(asset.references).toEqual([
			expect.objectContaining({ noteId: 'note-1', mediaId: result.mediaId })
		]);
		service.dispose();
	});

	// SPECSFY: US-001 FR-001 FR-002 FR-004 AC-003 AC-004
	it('rejects unsupported files and blocks deletion while a note uses the media', async () => {
		const storage = memoryStorage();
		const service = createMediaService(storage);

		await expect(
			service.upload(new File(['no'], 'script.exe', { type: 'application/octet-stream' }))
		).rejects.toBeInstanceOf(MediaValidationError);

		const result = await service.upload(
			new File([new Uint8Array([1, 2, 3])], 'voice.mp3', { type: 'audio/mpeg' }),
			'note-1'
		);
		await expect(service.deleteUnused(result.mediaId)).rejects.toBeInstanceOf(MediaInUseError);

		await service.detachNoteReferences('note-1');
		await service.deleteUnused(result.mediaId);
		expect(await service.list()).toHaveLength(0);
		service.dispose();
	});

	// SPECSFY: US-003 FR-004 AC-010 AC-018
	it('reimports the same media id after a missing or corrupt byte', async () => {
		const storage = memoryStorage();
		const service = createMediaService(storage);
		const result = await service.upload(
			new File([new Uint8Array([1, 2, 3])], 'voice.mp3', { type: 'audio/mpeg' }),
			'note-1'
		);
		const firstAsset = (await service.list())[0];
		storage.files.delete(firstAsset.storageKey);
		await expect(service.resolve(result.src)).rejects.toThrow('ausente');
		expect((await service.list())[0].state).toBe('missing');

		await service.reimport(
			result.mediaId,
			new File([new Uint8Array([4, 5, 6])], 'voice.mp3', { type: 'audio/mpeg' })
		);
		expect((await service.list())[0]).toMatchObject({ mediaId: result.mediaId, state: 'available' });
		service.dispose();
	});

	// SPECSFY: US-001 FR-002 FR-006 NFR-001 AC-014
	it('uses the native catalog port without creating a JSON catalog file', async () => {
		const storage = memoryStorage();
		const nativeCatalog: WorkspaceMediaCatalogEntry[] = [];
		storage.mediaCatalog = {
			list: async () => nativeCatalog.map((entry) => structuredClone(entry)),
			replace: async (entries) => {
				nativeCatalog.splice(0, nativeCatalog.length, ...structuredClone(entries));
			}
		};
		const service = createMediaService(storage);
		const result = await service.upload(
			new File([new Uint8Array([1, 2, 3])], 'voice.mp3', { type: 'audio/mpeg' }),
			'note-native'
		);

		expect(result.src).toBe(`media:${result.mediaId}`);
		expect(storage.files.has(MEDIA_CATALOG_PATH)).toBe(false);
		expect(nativeCatalog[0]).toMatchObject({
			workspaceId: 'workspace-test',
			mediaId: result.mediaId,
			mediaType: 'audio',
			references: [expect.objectContaining({ noteId: 'note-native' })]
		});
		await service.detachNoteReferences('note-native');
		expect((await service.list())[0].unused).toBe(true);
		service.dispose();
	});
});
