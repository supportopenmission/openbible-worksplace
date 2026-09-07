import { WORKSPACE_MANIFEST_PATH } from './workspace-catalog';
import type { WorkspaceStorage } from './types';
import { getWorkspaceContentRepository, workspaceContentContext } from './workspace-content-storage';
import { serializePortableNote } from '$lib/features/notes/portable-markdown';
import type { NoteFile, NoteMeta } from '$lib/features/notes/note-types';

export const WORKSPACE_EXPORT_SNAPSHOT_VERSION = 1 as const;

export interface WorkspaceExportSnapshot {
	workspaceId: string;
	version: typeof WORKSPACE_EXPORT_SNAPSHOT_VERSION;
	name: string;
	capturedAt: string;
}

export interface WorkspaceExportSource {
	readonly workspaceId: string;
	readonly snapshotVersion: typeof WORKSPACE_EXPORT_SNAPSHOT_VERSION;
	snapshot(): Promise<WorkspaceExportSnapshot>;
	listNotes(): Promise<string[]>;
	readNote(relativePath: string): Promise<Uint8Array | null>;
}

function decodeJson(bytes: Uint8Array | null): Record<string, unknown> | null {
	if (!bytes) return null;
	try {
		const value = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
		return typeof value === 'object' && value !== null
			? (value as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

function safePath(path: string): boolean {
	return path.startsWith('notes/') && !path.split('/').some((part) => part === '..');
}

export function createWorkspaceExportSource(
	storage: WorkspaceStorage,
	workspaceId: string
): WorkspaceExportSource {
	if (!workspaceId.trim()) throw new Error('workspace_id_required');

	return {
		workspaceId,
		snapshotVersion: WORKSPACE_EXPORT_SNAPSHOT_VERSION,
		async snapshot() {
			const manifest = decodeJson(await storage.readFile(WORKSPACE_MANIFEST_PATH));
			if (!manifest || manifest.workspaceId !== workspaceId) {
				throw new Error('workspace_id_mismatch');
			}
			return {
				workspaceId,
				version: WORKSPACE_EXPORT_SNAPSHOT_VERSION,
				name:
					typeof manifest.name === 'string'
						? manifest.name
						: typeof manifest.label === 'string'
							? manifest.label
							: workspaceId,
				capturedAt: new Date().toISOString()
			};
		},
		async listNotes() {
			const context = workspaceContentContext(storage, { workspaceId });
			const records = await getWorkspaceContentRepository(storage, context).list(context);
			const persisted = records
				.filter((record) => record.kind === 'note')
				.map((record) => `notes/${encodeURIComponent(record.id)}.md`);
			if (persisted.length > 0) return persisted.sort();
			const files = await storage.listFiles('notes');
			return files.filter((file) => file.endsWith('.md')).map((file) => `notes/${file}`);
		},
		async readNote(relativePath) {
			if (!safePath(relativePath)) throw new Error('export_path_outside_notes');
			const match = /^notes\/([^/]+)\.md$/.exec(relativePath);
			if (!match) return null;
			const context = workspaceContentContext(storage, { workspaceId });
			const record = (await getWorkspaceContentRepository(storage, context).list(context)).find(
				(candidate) => candidate.kind === 'note' && candidate.id === decodeURIComponent(match[1])
			);
			if (record && typeof record.payload.body === 'string' && typeof record.payload.meta === 'object') {
				const note: NoteFile = {
					meta: record.payload.meta as NoteMeta,
					body: record.payload.body
				};
				return new TextEncoder().encode(serializePortableNote(note));
			}
			return storage.readFile(relativePath);
		}
	};
}
