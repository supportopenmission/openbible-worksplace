import { describe, expect, it } from 'vitest';
import type { FileContent, WorkspaceStorage } from '$lib/storage/types';
import { createMediaService, MediaInUseError } from '$lib/features/notes/media/media-service';

function storage(): WorkspaceStorage {
	const files = new Map<string, Uint8Array>();
	return {
		kind: 'opfs',
		label: 'Inventário de teste',
		workspaceId: 'workspace-test',
		ensureDirectory: async () => undefined,
		writeFile: async (path: string, content: FileContent) => {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : new Uint8Array(content));
		},
		deleteFile: async (path: string) => {
			files.delete(path);
		},
		readFile: async (path: string) => files.get(path) ?? null,
		fileExists: async (path: string) => files.has(path),
		listFiles: async () => []
	};
}

describe('media inventory', () => {
	// SPECSFY: US-002 FR-003 AC-005 AC-006 AC-007 AC-008
	it('filters metadata, identifies unused media and protects referenced files', async () => {
		const service = createMediaService(storage());
		const image = await service.upload(
			new File([new Uint8Array([1])], 'cover.png', { type: 'image/png' }),
			'note-1'
		);
		const audio = await service.upload(
			new File([new Uint8Array([2])], 'voice.mp3', { type: 'audio/mpeg' })
		);

		expect(await service.list({ mediaType: 'image' })).toHaveLength(1);
		expect((await service.list({ mediaType: 'image' }))[0].usageCount).toBe(1);
		expect((await service.list({ unused: true })).map((item) => item.mediaId)).toEqual([audio.mediaId]);
		await expect(service.deleteUnused(image.mediaId)).rejects.toBeInstanceOf(MediaInUseError);
		await service.deleteUnused(audio.mediaId);
		expect(await service.list()).toHaveLength(1);
		service.dispose();
	});
});
