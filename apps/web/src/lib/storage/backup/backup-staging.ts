import { readBackupArchive } from './backup-archive';
import {
	createRestoredWorkspace,
	validateRestoreArchive,
	type RestoreSource
} from './backup-restore';

export type RestoreStagingState = 'prepared' | 'committed' | 'rolled_back';

export interface RestoreStagingSession {
	restoreId: string;
	workspaceId: string;
	state: RestoreStagingState;
	commitMarker: 'prepared' | 'committed' | 'rolled_back';
	entryCount: number;
	createdAt: string;
}

export interface RestoreStagingResult {
	status: 'staged' | 'recoverable';
	restoreId?: string;
	workspaceId?: string;
	error?: string;
}

const sessions = new Map<string, RestoreStagingSession>();
let sequence = 0;

function newRestoreId(): string {
	sequence += 1;
	return `restore-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

function getSession(restoreId: string): RestoreStagingSession {
	const session = sessions.get(restoreId);
	if (!session) throw new Error('restore_staging_not_found');
	return session;
}

export async function restoreIntoStaging(
	source: RestoreSource,
	archive: Uint8Array
): Promise<RestoreStagingResult> {
	const validation = validateRestoreArchive(archive);
	if (!validation.valid || !validation.manifest) {
		return {
			status: 'recoverable',
			error: validation.errors[0] ?? 'backup_archive_invalid'
		};
	}

	const { workspaceId } = await createRestoredWorkspace(source, archive);
	const restoreId = newRestoreId();
	sessions.set(restoreId, {
		restoreId,
		workspaceId,
		state: 'prepared',
		commitMarker: 'prepared',
		entryCount: readBackupArchive(archive).length - 1,
		createdAt: new Date().toISOString()
	});
	return { status: 'staged', restoreId, workspaceId };
}

export function getRestoreStaging(restoreId: string): RestoreStagingSession {
	return { ...getSession(restoreId) };
}

export function recoverStaging(): RestoreStagingSession[] {
	return [...sessions.values()]
		.filter((session) => session.state === 'prepared')
		.map((session) => ({ ...session }));
}

export function commitRestoreStaging(restoreId: string): RestoreStagingSession {
	const session = getSession(restoreId);
	if (session.state !== 'prepared' || session.commitMarker !== 'prepared') {
		throw new Error('restore_staging_not_committable');
	}
	const committed = {
		...session,
		state: 'committed' as const,
		commitMarker: 'committed' as const
	};
	sessions.set(restoreId, committed);
	return { ...committed };
}

export function rollbackRestoreStaging(restoreId: string): RestoreStagingSession {
	const session = getSession(restoreId);
	if (session.state === 'committed') throw new Error('restore_staging_already_committed');
	const rolledBack = {
		...session,
		state: 'rolled_back' as const,
		commitMarker: 'rolled_back' as const
	};
	sessions.set(restoreId, rolledBack);
	return { ...rolledBack };
}

export const discardStaging = rollbackRestoreStaging;
