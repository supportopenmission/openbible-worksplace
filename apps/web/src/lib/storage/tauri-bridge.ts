import { invoke } from '@tauri-apps/api/core';

export type WorkspaceCommand =
	| { name: 'workspace.initialize'; preferredPath?: string }
	| { name: 'workspace.readFile'; relativePath: string }
	| { name: 'workspace.listFiles'; relativePath: string }
	| { name: 'workspace.deleteFile'; relativePath: string }
	| { name: 'workspace.writeFile'; relativePath: string; bytes: Uint8Array }
	| {
			name: 'index.query';
			operation: 'list_highlights' | 'upsert_highlight' | 'delete_highlight';
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

function payload(command: WorkspaceCommand | UnknownWorkspaceCommand): Record<string, unknown> {
	switch (command.name) {
		case 'workspace.initialize':
			return { preferredPath: command.preferredPath };
		case 'workspace.readFile':
			validatePath(String(command.relativePath));
			return { relativePath: String(command.relativePath) };
		case 'workspace.listFiles':
			validatePath(String(command.relativePath));
			return { relativePath: String(command.relativePath) };
		case 'workspace.deleteFile':
			validatePath(String(command.relativePath));
			return { relativePath: String(command.relativePath) };
		case 'workspace.writeFile':
			validatePath(String(command.relativePath));
			return {
				relativePath: String(command.relativePath),
				bytes: Array.from(command.bytes as ArrayLike<number>)
			};
		case 'index.query':
			if (command.operation !== 'list_highlights') {
				throw new TauriCommandError({ code: 'command_not_allowed', recoverable: false });
			}
			return {
				operation: command.operation,
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
		'workspace.initialize': 'initialize_workspace',
		'workspace.readFile': 'read_workspace_file',
		'workspace.listFiles': 'list_workspace_files',
		'workspace.deleteFile': 'delete_workspace_file',
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
