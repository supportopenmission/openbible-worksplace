import type {
	WorkspaceMediaCatalogEntry,
	WorkspaceStorage
} from '$lib/storage/types';

export const MEDIA_CATALOG_PATH = 'media/catalog.json';
export const MEDIA_REFERENCE_PREFIX = 'media:';

export type MediaType = 'image' | 'video' | 'audio';
export type MediaState = 'available' | 'missing' | 'corrupt';

export interface MediaReference {
	mediaId: string;
	referenceId?: string;
	noteId?: string;
	blockId?: string;
	createdAt: string;
	lastSeenAt: string;
}

export interface MediaAsset {
	workspaceId: string;
	mediaId: string;
	originalName: string;
	mediaType: MediaType;
	format: string;
	byteSize: number;
	importedAt: string;
	lastUsedAt: string;
	state: MediaState;
	sha256: string;
	storageKey: string;
	references: MediaReference[];
}

export interface MediaInventoryItem extends MediaAsset {
	usageCount: number;
	unused: boolean;
}

export interface MediaUploadResult {
	mediaId: string;
	mediaType: MediaType;
	state: 'available';
	src: string;
}

export class MediaValidationError extends Error {
	readonly code: 'unsupported_format' | 'size_limit' | 'empty_file';

	constructor(code: 'unsupported_format' | 'size_limit' | 'empty_file', message: string) {
		super(message);
		this.name = 'MediaValidationError';
		this.code = code;
	}
}

export class MediaInUseError extends Error {
	readonly asset: MediaAsset;

	constructor(asset: MediaAsset) {
		super('Esta mídia ainda é usada por uma ou mais notas.');
		this.name = 'MediaInUseError';
		this.asset = asset;
	}
}

const LIMITS: Record<MediaType, number> = {
	image: 10 * 1024 * 1024,
	audio: 50 * 1024 * 1024,
	video: 200 * 1024 * 1024
};

const FORMATS: Record<MediaType, Record<string, string>> = {
	image: {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		webp: 'image/webp',
		gif: 'image/gif'
	},
	video: {
		mp4: 'video/mp4',
		webm: 'video/webm'
	},
	audio: {
		mp3: 'audio/mpeg',
		m4a: 'audio/mp4',
		ogg: 'audio/ogg'
	}
};

const EMPTY_CATALOG = (): MediaAsset[] => [];

function mediaTypeFor(file: Pick<File, 'name' | 'type'>): { mediaType: MediaType; format: string } {
	const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
	for (const [mediaType, formats] of Object.entries(FORMATS) as [MediaType, Record<string, string>][]) {
		const mime = formats[extension];
		if (mime && (!file.type || file.type === mime || file.type === 'application/octet-stream')) {
			return { mediaType, format: extension };
		}
	}
	throw new MediaValidationError(
		'unsupported_format',
		'Formato não suportado. Use PNG, JPEG, WebP, GIF, MP4, WebM, MP3, M4A ou OGG.'
	);
}

export function validateMediaFile(file: File): { mediaType: MediaType; format: string } {
	if (!file || file.size === 0) {
		throw new MediaValidationError('empty_file', 'O arquivo de mídia está vazio.');
	}
	const result = mediaTypeFor(file);
	if (file.size > LIMITS[result.mediaType]) {
		const limitMb = LIMITS[result.mediaType] / 1024 / 1024;
		throw new MediaValidationError(
			'size_limit',
			`O arquivo excede o limite de ${limitMb} MB para ${result.mediaType === 'image' ? 'imagens' : result.mediaType === 'audio' ? 'áudios' : 'vídeos'}.`
		);
	}
	return result;
}

function parseCatalog(value: Uint8Array | null): MediaAsset[] {
	if (!value) return EMPTY_CATALOG();
	try {
		const parsed: unknown = JSON.parse(new TextDecoder().decode(value));
		if (!Array.isArray(parsed)) return EMPTY_CATALOG();
		return parsed.filter((asset): asset is MediaAsset => {
			if (!asset || typeof asset !== 'object') return false;
			const item = asset as Partial<MediaAsset>;
			return (
				typeof item.mediaId === 'string' &&
				typeof item.storageKey === 'string' &&
				typeof item.originalName === 'string' &&
				Array.isArray(item.references)
			);
		});
	} catch {
		return EMPTY_CATALOG();
	}
}

function referenceIdFor(reference: MediaReference, index: number): string {
	return (
		reference.referenceId ??
		[reference.noteId ?? '', reference.blockId ?? '', index].join(':')
	);
}

function fromStorageEntry(entry: WorkspaceMediaCatalogEntry): MediaAsset {
	return {
		...entry,
		references: entry.references.map((reference) => ({
			...reference,
			referenceId: reference.referenceId
		}))
	};
}

function toStorageEntry(asset: MediaAsset): WorkspaceMediaCatalogEntry {
	return {
		...asset,
		references: asset.references.map((reference, index) => ({
			referenceId: referenceIdFor(reference, index),
			mediaId: asset.mediaId,
			...(reference.noteId ? { noteId: reference.noteId } : {}),
			...(reference.blockId ? { blockId: reference.blockId } : {}),
			createdAt: reference.createdAt,
			lastSeenAt: reference.lastSeenAt
		}))
	};
}

async function digest(bytes: Uint8Array): Promise<string> {
	if (globalThis.crypto?.subtle) {
		const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource);
		return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
	}
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 64);
}

function createId(): string {
	const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	return `media-${uuid}`;
}

function storageKey(mediaId: string, format: string): string {
	return `media/${mediaId}.${format}`;
}

function publishMediaEvent(name: 'media:committed' | 'media:state-changed', mediaId: string): void {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent(`openbible:${name}`, { detail: { mediaId } }));
}

export function isMediaReference(value: string): boolean {
	return value.startsWith(MEDIA_REFERENCE_PREFIX) && value.length > MEDIA_REFERENCE_PREFIX.length;
}

export function mediaIdFromReference(value: string): string | null {
	return isMediaReference(value) ? value.slice(MEDIA_REFERENCE_PREFIX.length) : null;
}

export function createMediaService(storage: WorkspaceStorage) {
	const workspaceId = () => storage.workspaceId ?? `local-${storage.kind}`;
	const objectUrls = new Map<string, string>();

	async function readCatalog(): Promise<MediaAsset[]> {
		if (storage.mediaCatalog) {
			return (await storage.mediaCatalog.list()).map(fromStorageEntry);
		}
		return parseCatalog(await storage.readFile(MEDIA_CATALOG_PATH));
	}

	async function writeCatalog(catalog: MediaAsset[]): Promise<void> {
		if (storage.mediaCatalog) {
			await storage.mediaCatalog.replace(catalog.map(toStorageEntry));
			return;
		}
		await storage.ensureDirectory('media');
		await storage.writeFile(MEDIA_CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
	}

	async function upload(file: File, noteId?: string, blockId?: string): Promise<MediaUploadResult> {
		const { mediaType, format } = validateMediaFile(file);
		const mediaId = createId();
		const key = storageKey(mediaId, format);
		const now = new Date().toISOString();
		const bytes = new Uint8Array(await file.arrayBuffer());
		const sha256 = await digest(bytes);
		const catalog = await readCatalog();
		const reference: MediaReference = {
			mediaId,
			noteId,
			blockId: blockId ?? mediaId,
			createdAt: now,
			lastSeenAt: now
		};
		const asset: MediaAsset = {
			workspaceId: workspaceId(),
			mediaId,
			originalName: file.name,
			mediaType,
			format,
			byteSize: bytes.byteLength,
			importedAt: now,
			lastUsedAt: now,
			state: 'available',
			sha256,
			storageKey: key,
			references: [reference]
		};
		if (!noteId) asset.references = [];

		await storage.ensureDirectory('media');
		try {
			await storage.writeFile(key, bytes);
			await writeCatalog([...catalog, asset]);
		} catch (error) {
			try {
				await storage.deleteFile?.(key);
			} catch {
				// A limpeza é best effort; o catálogo não expõe o asset parcial.
			}
			throw error;
		}
		publishMediaEvent('media:committed', mediaId);
		return { mediaId, mediaType, state: 'available', src: `${MEDIA_REFERENCE_PREFIX}${mediaId}` };
	}

	async function resolve(reference: string): Promise<string> {
		const mediaId = mediaIdFromReference(reference);
		if (!mediaId) return reference;
		const cached = objectUrls.get(mediaId);
		if (cached) return cached;
		const catalog = await readCatalog();
		const asset = catalog.find((entry) => entry.mediaId === mediaId);
		if (!asset) throw new Error('Mídia não encontrada no catálogo.');
		const bytes = await storage.readFile(asset.storageKey);
		if (!bytes) {
			asset.state = 'missing';
			await writeCatalog(catalog);
			publishMediaEvent('media:state-changed', mediaId);
			throw new Error('Arquivo de mídia ausente no workspace.');
		}
		const actualHash = await digest(bytes);
		if (asset.sha256 && actualHash !== asset.sha256) {
			asset.state = 'corrupt';
			await writeCatalog(catalog);
			publishMediaEvent('media:state-changed', mediaId);
			throw new Error('Arquivo de mídia corrompido.');
		}
		const url = URL.createObjectURL(
			new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: mimeFor(asset) })
		);
		objectUrls.set(mediaId, url);
		asset.lastUsedAt = new Date().toISOString();
		await writeCatalog(catalog);
		publishMediaEvent('media:state-changed', mediaId);
		return url;
	}

	async function list(filter?: { mediaType?: MediaType; state?: MediaState; unused?: boolean }): Promise<MediaInventoryItem[]> {
		const catalog = await readCatalog();
		return catalog
			.map((asset) => ({ ...asset, usageCount: asset.references.length, unused: asset.references.length === 0 }))
			.filter((asset) => !filter?.mediaType || asset.mediaType === filter.mediaType)
			.filter((asset) => !filter?.state || asset.state === filter.state)
			.filter((asset) => filter?.unused === undefined || asset.unused === filter.unused)
			.sort((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt));
	}

	async function deleteUnused(mediaId: string): Promise<void> {
		const catalog = await readCatalog();
		const asset = catalog.find((entry) => entry.mediaId === mediaId);
		if (!asset) return;
		if (asset.references.length > 0) throw new MediaInUseError(asset);
		if (!storage.deleteFile) throw new Error('Este armazenamento não permite remover arquivos de mídia.');
		await storage.deleteFile(asset.storageKey);
		await writeCatalog(catalog.filter((entry) => entry.mediaId !== mediaId));
		const url = objectUrls.get(mediaId);
		if (url) URL.revokeObjectURL(url);
		objectUrls.delete(mediaId);
	}

	async function reimport(mediaId: string, file: File): Promise<MediaUploadResult> {
		const { mediaType, format } = validateMediaFile(file);
		const catalog = await readCatalog();
		const asset = catalog.find((entry) => entry.mediaId === mediaId);
		if (!asset) throw new Error('Mídia não encontrada para reimportação.');
		const previousKey = asset.storageKey;
		const bytes = new Uint8Array(await file.arrayBuffer());
		const nextKey = storageKey(mediaId, format);
		await storage.writeFile(nextKey, bytes);
		asset.originalName = file.name;
		asset.mediaType = mediaType;
		asset.format = format;
		asset.byteSize = bytes.byteLength;
		asset.sha256 = await digest(bytes);
		asset.storageKey = nextKey;
		asset.state = 'available';
		asset.lastUsedAt = new Date().toISOString();
		await writeCatalog(catalog);
		const cached = objectUrls.get(mediaId);
		if (cached) URL.revokeObjectURL(cached);
		objectUrls.delete(mediaId);
		if (previousKey !== nextKey) {
			try {
				await storage.deleteFile?.(previousKey);
			} catch {
				// A troca já está disponível; o arquivo antigo pode ser limpo no próximo inventário.
			}
		}
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('openbible:media-updated', { detail: { mediaId } }));
		}
		return { mediaId, mediaType, state: 'available', src: `${MEDIA_REFERENCE_PREFIX}${mediaId}` };
	}

	async function syncNoteReferences(noteId: string, content: string): Promise<void> {
		if (!noteId) return;
		const referencedIds = new Set(
			[...content.matchAll(/media:([A-Za-z0-9-]+)/g)].map((match) => match[1])
		);
		const catalog = await readCatalog();
		let changed = false;
		for (const asset of catalog) {
			const existing = asset.references.filter((reference) => reference.noteId !== noteId);
			if (referencedIds.has(asset.mediaId)) {
				existing.push({
					mediaId: asset.mediaId,
					noteId,
					createdAt: new Date().toISOString(),
					lastSeenAt: new Date().toISOString()
				});
			}
			if (existing.length !== asset.references.length || existing.some((entry, index) => entry.noteId !== asset.references[index]?.noteId)) {
				asset.references = existing;
				changed = true;
			}
		}
		if (changed) await writeCatalog(catalog);
	}

	async function detachNoteReferences(noteId: string): Promise<void> {
		if (!noteId) return;
		const catalog = await readCatalog();
		let changed = false;
		for (const asset of catalog) {
			const next = asset.references.filter((reference) => reference.noteId !== noteId);
			if (next.length !== asset.references.length) {
				asset.references = next;
				changed = true;
			}
		}
		if (changed) await writeCatalog(catalog);
	}

	function dispose() {
		for (const url of objectUrls.values()) URL.revokeObjectURL(url);
		objectUrls.clear();
	}

	return {
		upload,
		resolve,
		list,
		deleteUnused,
		reimport,
		syncNoteReferences,
		detachNoteReferences,
		readCatalog,
		dispose
	};
}

function mimeFor(asset: MediaAsset): string {
	return FORMATS[asset.mediaType][asset.format] ?? 'application/octet-stream';
}

export type MediaService = ReturnType<typeof createMediaService>;
