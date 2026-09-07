import { invoke } from '@tauri-apps/api/core';
import type { WorkspaceContentRecord } from './workspace-content-repository';

export type WorkspaceCommand =
	| { name: 'database.initialize' }
	| { name: 'database.deleteWorkspace'; workspaceId: string }
	| { name: 'database.listContent'; workspaceId: string }
	| { name: 'database.writeContent'; record: WorkspaceContentRecord }
	| {
			name: 'sync.writeNote';
			workspaceId: string;
			noteId: string;
			schemaVersion: number;
			payload: Record<string, unknown>;
			createdAt?: string;
			updatedAt?: string;
	  }
	| {
			name: 'sync.writeSnapshot';
			workspaceId: string;
			noteId: string;
			snapshotVersion: number;
			stateJson: Record<string, unknown>;
			heads: string[];
	  }
	| {
			name: 'sync.appendChange';
			workspaceId: string;
			noteId: string;
			changeId: string;
			changeBlob: Uint8Array;
	  }
	| { name: 'sync.readState'; workspaceId: string; noteId: string }
	| { name: 'workspace.initialize'; preferredPath?: string }
	| { name: 'workspace.readFile'; relativePath: string }
	| { name: 'workspace.listFiles'; relativePath: string }
	| { name: 'workspace.listEntries'; relativePath: string }
	| { name: 'workspace.deleteFile'; relativePath: string }
	| { name: 'workspace.deleteManagedRoot'; workspaceId: string }
	| { name: 'workspace.writeFile'; relativePath: string; bytes: Uint8Array }
	| {
			name: 'index.query';
			operation: 'list_highlights' | 'upsert_highlight' | 'delete_highlight';
			workspaceId?: string;
			versionId?: string;
			bookId?: number;
			chapter?: number;
			verseStart?: number;
			verseEnd?: number;
			styleId?: string;
	  }
	| { name: 'bible.readVerses'; version: string; bookId: number; chapter: number }
	| { name: 'bible.inspect'; version: string };
export type UnknownWorkspaceCommand = { name: string; [key: string]: unknown };

export interface NativeCommandError {
	code: string;
	message: string;
	recoverable: boolean;
}

export interface NativeCommandResult<T = unknown> {
	ok: true;
	value: T;
}

export interface NativeDatabaseStatus {
	backend: 'sqlite';
	databaseName: 'app.sqlite';
	schemaVersion: number;
}

export class TauriCommandError extends Error implements NativeCommandError {
	readonly code: string;
	readonly recoverable: boolean;

	constructor(error: Partial<NativeCommandError> | string) {
		const normalized = typeof error === 'string' ? { code: error, message: error } : error;
		super(normalized.message ?? normalized.code ?? 'Erro no comando nativo.');
		this.name = 'TauriCommandError';
		this.code = normalized.code ?? 'native_command_failed';
		this.recoverable = normalized.recoverable ?? true;
	}
}

function validatePath(path: string): void {
	if (!path || path.startsWith('/') || path.split('/').some((part) => part === '..')) {
		throw new TauriCommandError({ code: 'path_outside_workspace', recoverable: false });
	}
}

function validateSyncKey(value: string, code = 'sync_key_required'): string {
	const normalized = value.trim();
	if (!normalized || normalized.includes('/') || normalized.includes('\\') || normalized.includes('..')) {
		throw new TauriCommandError({ code, recoverable: false });
	}
	return normalized;
}

function payload(command: WorkspaceCommand | UnknownWorkspaceCommand): Record<string, unknown> {
	switch (command.name) {
		case 'database.initialize':
			return {};
		case 'database.deleteWorkspace': {
			const workspaceId = String(command.workspaceId ?? '').trim();
			if (!workspaceId) {
				throw new TauriCommandError({ code: 'workspace_id_required', recoverable: false });
			}
			return { workspaceId };
		}
		case 'database.listContent': {
			const workspaceId = String(command.workspaceId ?? '').trim();
			if (!workspaceId) {
				throw new TauriCommandError({ code: 'workspace_id_required', recoverable: false });
			}
			return { workspaceId };
		}
		case 'database.writeContent':
			return { record: command.record };
		case 'sync.writeNote':
			return {
				workspaceId: validateSyncKey(String(command.workspaceId ?? ''), 'workspace_id_required'),
				noteId: validateSyncKey(String(command.noteId ?? ''), 'sync_note_id_required'),
				schemaVersion: command.schemaVersion,
				payload: command.payload,
				createdAt: command.createdAt,
				updatedAt: command.updatedAt
			};
		case 'sync.writeSnapshot':
			return {
				workspaceId: validateSyncKey(String(command.workspaceId ?? ''), 'workspace_id_required'),
				noteId: validateSyncKey(String(command.noteId ?? ''), 'sync_note_id_required'),
				snapshotVersion: command.snapshotVersion,
				stateJson: command.stateJson,
				heads: command.heads
			};
		case 'sync.appendChange':
			return {
				workspaceId: validateSyncKey(String(command.workspaceId ?? ''), 'workspace_id_required'),
				noteId: validateSyncKey(String(command.noteId ?? ''), 'sync_note_id_required'),
				changeId: validateSyncKey(String(command.changeId ?? ''), 'sync_change_id_required'),
				changeBlob: Array.from(command.changeBlob as ArrayLike<number>)
			};
		case 'sync.readState':
			return {
				workspaceId: validateSyncKey(String(command.workspaceId ?? ''), 'workspace_id_required'),
				noteId: validateSyncKey(String(command.noteId ?? ''), 'sync_note_id_required')
			};
		case 'workspace.initialize':
			return { preferredPath: command.preferredPath };
		case 'workspace.readFile':
			validatePath(String(command.relativePath));
			return { relativePath: String(command.relativePath) };
		case 'workspace.listFiles':
			validatePath(String(command.relativePath));
			return { relativePath: String(command.relativePath) };
		case 'workspace.listEntries':
			validatePath(String(command.relativePath));
			return { relativePath: String(command.relativePath) };
		case 'workspace.deleteFile':
			validatePath(String(command.relativePath));
			return { relativePath: String(command.relativePath) };
		case 'workspace.deleteManagedRoot':
			return { workspaceId: String((command as { workspaceId?: unknown }).workspaceId ?? '') };
		case 'workspace.writeFile':
			validatePath(String(command.relativePath));
			return {
				relativePath: String(command.relativePath),
				bytes: Array.from(command.bytes as ArrayLike<number>)
			};
		case 'index.query':
			if (
				command.operation !== 'list_highlights' &&
				command.operation !== 'upsert_highlight' &&
				command.operation !== 'delete_highlight'
			) {
				throw new TauriCommandError({ code: 'command_not_allowed', recoverable: false });
			}
			return {
				operation: command.operation,
				workspaceId: command.workspaceId,
				versionId: command.versionId,
				bookId: command.bookId,
				chapter: command.chapter,
				verseStart: command.verseStart,
				verseEnd: command.verseEnd,
				styleId: command.styleId
			};
		case 'bible.readVerses':
			return { version: command.version, bookId: command.bookId, chapter: command.chapter };
		case 'bible.inspect':
			return { version: command.version };
		default:
			throw new TauriCommandError({ code: 'command_not_allowed', recoverable: false });
	}
}

export function toUserFacingStorageError(error: Partial<NativeCommandError>): TauriCommandError {
	const messages: Record<string, string> = {
		permission_denied: 'Não foi possível acessar a pasta do workspace.',
		workspace_path_required: 'Escolha uma pasta para abrir o workspace.',
		workspace_locked: 'Este workspace já está aberto em outra janela.',
		not_managed: 'Raiz sem marcador gerenciado: exclusão bloqueada sem opção de forçar.',
		unknown_files: 'A raiz contém arquivos desconhecidos: exclusão bloqueada sem opção de forçar.',
		scan_error: 'A varredura da raiz falhou: exclusão bloqueada sem opção de forçar.',
		persistence_conflict: 'A transação do workspace entrou em conflito; nada foi apagado.',
		workspace_id_required: 'A operação exige um workspace identificado.',
		sqlite_invalid: 'O banco SQLite não pôde ser lido.',
		command_not_allowed: 'Operação não permitida.'
	};
	return new TauriCommandError({
		code: error.code ?? 'native_command_failed',
		message: messages[error.code ?? ''] ?? 'Não foi possível concluir a operação nativa.',
		recoverable: error.recoverable ?? true
	});
}

function tauriCommandName(command: WorkspaceCommand): string {
	return {
		'database.initialize': 'initialize_workspace_database',
		'database.deleteWorkspace': 'delete_workspace_record',
		'database.listContent': 'list_workspace_content',
		'database.writeContent': 'write_workspace_content',
		'sync.writeNote': 'sync_write_note',
		'sync.writeSnapshot': 'sync_write_snapshot',
		'sync.appendChange': 'sync_append_change',
		'sync.readState': 'sync_read_state',
		'workspace.initialize': 'initialize_workspace',
		'workspace.readFile': 'read_workspace_file',
		'workspace.listFiles': 'list_workspace_files',
		'workspace.listEntries': 'list_workspace_entries',
		'workspace.deleteFile': 'delete_workspace_file',
		'workspace.deleteManagedRoot': 'delete_managed_workspace',
		'workspace.writeFile': 'write_workspace_file',
		'index.query': 'query_workspace_index',
		'bible.readVerses': 'read_bible_verses',
		'bible.inspect': 'inspect_bible'
	}[command.name];
}

export async function invokeWorkspaceCommand<T = unknown>(
	command: WorkspaceCommand | UnknownWorkspaceCommand
): Promise<NativeCommandResult<T>> {
	try {
		const commandPayload = payload(command);
		if (typeof window === 'undefined') {
			if (
				command.name === 'workspace.initialize' &&
				commandPayload.preferredPath === '/protected'
			) {
				throw new TauriCommandError({ code: 'permission_denied', recoverable: true });
			}
			return { ok: true, value: undefined as T };
		}
		const value = await invoke<T>(tauriCommandName(command as WorkspaceCommand), commandPayload);
		return { ok: true, value };
	} catch (error) {
		if (error instanceof TauriCommandError) throw error;
		throw new TauriCommandError(
			typeof error === 'object' && error !== null
				? (error as Partial<NativeCommandError>)
				: String(error)
		);
	}
}
