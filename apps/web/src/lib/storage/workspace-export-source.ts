import { WORKSPACE_MANIFEST_PATH } from './workspace-catalog';
import type { WorkspaceStorage } from './types';

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
			const files = await storage.listFiles('notes');
			return files
				.filter((file) => file.endsWith('.md'))
				.map((file) => `notes/${file}`);
		},
		async readNote(relativePath) {
			if (!safePath(relativePath)) throw new Error('export_path_outside_notes');
			return storage.readFile(relativePath);
		}
	};
}
