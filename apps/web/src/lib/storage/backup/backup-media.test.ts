import { describe, expect, it } from 'vitest';
import type {
	FileContent,
	WorkspaceMediaCatalogEntry,
	WorkspaceStorage,
	WorkspaceStorageEntry
} from '../types';
import { readBackupManifest, writeBackupArchive } from './backup-archive';

function mediaStorage(options: { native?: boolean } = {}): WorkspaceStorage {
	const files = new Map<string, Uint8Array>([
		...(options.native ? [] : [['media/catalog.json', new TextEncoder().encode('[]\n')] as const]),
		['media/media-1.png', new Uint8Array([137, 80, 78, 71])],
		['notes/note-1.md', new TextEncoder().encode('# Nota\n')]
	]);
	const nativeCatalog: WorkspaceMediaCatalogEntry[] = [];
	const entriesAt = (path: string): WorkspaceStorageEntry[] => {
		const prefix = path ? `${path}/` : '';
		const entries = new Map<string, WorkspaceStorageEntry>();
		for (const file of files.keys()) {
			if (!file.startsWith(prefix)) continue;
			const rest = file.slice(prefix.length);
			const [name, ...nested] = rest.split('/');
			entries.set(name, { name, kind: nested.length > 0 ? 'directory' : 'file' });
		}
		return [...entries.values()];
	};
	return {
		kind: options.native ? 'native' : 'opfs',
		label: 'Backup de teste',
		workspaceId: 'workspace-test',
		ensureDirectory: async () => undefined,
		writeFile: async (path: string, content: FileContent) => {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : new Uint8Array(content));
		},
		readFile: async (path: string) => files.get(path) ?? null,
		fileExists: async (path: string) => files.has(path),
		listFiles: async (path: string) => entriesAt(path).filter((entry) => entry.kind === 'file').map((entry) => entry.name),
		listEntries: async (path: string) => entriesAt(path),
		...(options.native
			? {
				mediaCatalog: {
					list: async () => nativeCatalog,
					replace: async (entries: WorkspaceMediaCatalogEntry[]) => {
						nativeCatalog.splice(0, nativeCatalog.length, ...entries);
					}
				}
			}
			: {})
	};
}

describe('media backup', () => {
	// SPECSFY: US-003 FR-005 FR-006 AC-011 AC-012
	it('includes the media catalog and bytes with media roles and MIME types', async () => {
		const archive = await writeBackupArchive(mediaStorage());
		const { manifest } = readBackupManifest(archive);
		const catalog = manifest.files.find((file) => file.path === 'media/catalog.json');
		const image = manifest.files.find((file) => file.path === 'media/media-1.png');

		expect(catalog).toMatchObject({ role: 'media', mediaType: 'application/json' });
		expect(image).toMatchObject({ role: 'media', mediaType: 'image/png', size: 4 });
	});

	// SPECSFY: US-003 FR-005 FR-006 AC-011 AC-012
	it('serializes the native SQLite catalog into the backup without a physical JSON file', async () => {
		const archive = await writeBackupArchive(mediaStorage({ native: true }));
		const parsed = readBackupManifest(archive);
		const catalog = parsed.entries.find((entry) => entry.path === 'media/catalog.json');

		expect(catalog).toMatchObject({ role: 'media', mediaType: 'application/json' });
		expect(new TextDecoder().decode(catalog?.bytes)).toBe('[]\n');
	});
});
