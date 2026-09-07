import type { WorkspaceStorage } from '../types';
import { readBackupExclusions } from './backup-enumerator';

export type BackupOperationPhase =
	| 'idle'
	| 'flushing'
	| 'enumerating'
	| 'writing'
	| 'validating'
	| 'staging'
	| 'committing'
	| 'rebuilding'
	| 'succeeded'
	| 'cancelled'
	| 'failed'
	| 'recoverable';

export type BackupRecoveryAction =
	| 'none'
	| 'retry'
	| 'discard_staging'
	| 'open_workspace'
	| 'choose_destination'
	| 'close_report';

export type BackupErrorCode =
	| 'backup_hash_unavailable'
	| 'backup_entry_limit_exceeded'
	| 'backup_entries_limit_exceeded'
	| 'backup_total_size_limit_exceeded'
	| 'backup_logical_path_invalid'
	| 'backup_permission_denied'
	| 'backup_quota_exceeded'
	| 'backup_checksum_mismatch'
	| 'backup_archive_invalid'
	| 'backup_cancelled'
	| 'index_rebuild_failed'
	| 'index_rebuild_cancelled'
	| 'restore_staging_recoverable'
	| 'restore_conflict'
	| 'unknown';

export type BackupStagingStatus = 'none' | 'prepared' | 'committed' | 'rolled_back' | 'recoverable';

export interface BackupReportExclusion {
	category: string;
	count: number;
}

export interface BackupOperationReport {
	phase: BackupOperationPhase | string;
	status: 'success' | 'failed' | 'cancelled' | 'recoverable' | 'pending';
	backend: 'indexeddb' | 'sqlite';
	entries: number;
	bytes: number;
	archiveBytes: number;
	bibles: {
		included: number;
		omitted: number;
	};
	omitted: string[];
	exclusions: BackupReportExclusion[];
	conflicts: number;
	checksums: number;
	code?: BackupErrorCode;
	recoverable: boolean;
	stagingStatus: BackupStagingStatus;
	nextAction: string;
	action: BackupRecoveryAction;
}

export interface BackupOperationReportOptions {
	phase?: BackupOperationPhase;
	status?: BackupOperationReport['status'];
	backend?: BackupOperationReport['backend'];
	entries?: number;
	bytes?: number;
	archiveBytes?: number;
	biblesIncluded?: number;
	biblesOmitted?: number;
	omitted?: string[];
	exclusions?: BackupReportExclusion[];
	conflicts?: number;
	checksums?: number;
	code?: BackupErrorCode;
	recoverable?: boolean;
	stagingStatus?: BackupStagingStatus;
	nextAction?: string;
	action?: BackupRecoveryAction;
}

export interface BackupIndexRecovery {
	available: true;
	nextAction: string;
	code: 'index_rebuild_failed';
	recoverable: true;
}

export interface BackupIndexRebuildResult {
	status: 'rebuilt' | 'deferred';
	nextAction: string;
	code?: 'index_rebuild_failed';
	recoverable: boolean;
}

const ERROR_CODES = new Set<BackupErrorCode>([
	'backup_hash_unavailable',
	'backup_entry_limit_exceeded',
	'backup_entries_limit_exceeded',
	'backup_total_size_limit_exceeded',
	'backup_logical_path_invalid',
	'backup_permission_denied',
	'backup_quota_exceeded',
	'backup_checksum_mismatch',
	'backup_archive_invalid',
	'backup_cancelled',
	'index_rebuild_failed',
	'index_rebuild_cancelled',
	'restore_staging_recoverable',
	'restore_conflict',
	'unknown'
]);

const DEFAULT_OMISSIONS = ['index', 'deviceState', 'bibles'];
const DEFAULT_NEXT_ACTION = 'Fechar relatório';
const RETRY_NEXT_ACTION = 'Tentar novamente';
const REBUILD_NEXT_ACTION = 'Tentar reconstruir o índice';

function backendFor(storage: WorkspaceStorage): 'indexeddb' | 'sqlite' {
	return storage.kind === 'native' ? 'sqlite' : 'indexeddb';
}

function clampCount(value: number | undefined): number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function statusFor(
	phase: BackupOperationPhase,
	status: BackupOperationReport['status'] | undefined,
	recoverable: boolean
): BackupOperationReport['status'] {
	if (status) return status;
	if (phase === 'succeeded') return 'success';
	if (phase === 'cancelled') return 'cancelled';
	if (recoverable || phase === 'recoverable') return 'recoverable';
	if (phase === 'failed') return 'failed';
	return 'pending';
}

function actionFor(
	phase: BackupOperationPhase,
	code: BackupErrorCode | undefined,
	recoverable: boolean
): { action: BackupRecoveryAction; nextAction: string } {
	if (code === 'index_rebuild_failed') {
		return { action: 'retry', nextAction: REBUILD_NEXT_ACTION };
	}
	if (code === 'restore_staging_recoverable') {
		return { action: 'discard_staging', nextAction: 'Descartar staging ou tentar novamente' };
	}
	if (code || recoverable || phase === 'failed' || phase === 'recoverable') {
		return { action: 'retry', nextAction: RETRY_NEXT_ACTION };
	}
	if (phase === 'succeeded') return { action: 'close_report', nextAction: DEFAULT_NEXT_ACTION };
	return { action: 'none', nextAction: 'A operação continua' };
}

function normalizeCode(code: string | undefined): BackupErrorCode | undefined {
	if (!code) return undefined;
	return ERROR_CODES.has(code as BackupErrorCode) ? (code as BackupErrorCode) : 'unknown';
}

/**
 * Cria o resumo privado consumido pela interface. O relatório aceita somente
 * contagens e categorias; não carrega conteúdo autoral, segredo ou caminho
 * absoluto para a UI.
 */
export function buildOperationReport(
	storage: WorkspaceStorage,
	options: BackupOperationReportOptions = {}
): BackupOperationReport {
	const phase = options.phase ?? 'succeeded';
	const code = normalizeCode(options.code);
	const recoverable = options.recoverable ?? Boolean(code);
	const status = statusFor(phase, options.status, recoverable);
	const defaultAction = actionFor(phase, code, recoverable);
	const exclusions = (options.exclusions ?? []).map((item) => ({
		category: item.category,
		count: clampCount(item.count)
	}));
	const omitted = [...new Set(options.omitted ?? (exclusions.length > 0 ? exclusions.map((item) => item.category) : DEFAULT_OMISSIONS))];

	return {
		phase,
		status,
		backend: options.backend ?? backendFor(storage),
		entries: clampCount(options.entries),
		bytes: clampCount(options.bytes),
		archiveBytes: clampCount(options.archiveBytes),
		bibles: {
			included: clampCount(options.biblesIncluded),
			omitted: clampCount(options.biblesOmitted ?? (omitted.includes('bibles') ? 1 : 0))
		},
		omitted,
		exclusions,
		conflicts: clampCount(options.conflicts),
		checksums: clampCount(options.checksums ?? options.entries),
		...(code ? { code } : {}),
		recoverable,
		stagingStatus: options.stagingStatus ?? 'none',
		nextAction: options.nextAction ?? defaultAction.nextAction,
		action: options.action ?? defaultAction.action
	};
}

/**
 * Versão assíncrona usada quando a tela precisa dos contadores reais de
 * exclusão. A função síncrona acima continua disponível para estados imediatos
 * durante o job e para compatibilidade com consumidores existentes.
 */
export async function buildOperationReportAsync(
	storage: WorkspaceStorage,
	options: BackupOperationReportOptions = {}
): Promise<BackupOperationReport> {
	const exclusions = options.exclusions ?? (await readBackupExclusions(storage));
	return buildOperationReport(storage, { ...options, exclusions });
}

export async function rebuildDerivedIndex(storage: WorkspaceStorage): Promise<BackupIndexRebuildResult> {
	try {
		const { rebuildWorkspaceIndex } = await import('$lib/features/notes/index-rebuilder');
		await rebuildWorkspaceIndex(storage);
		return {
			status: 'rebuilt',
			nextAction: 'Abrir workspace',
			recoverable: false
		};
	} catch {
		// A projeção é derivada. Nenhum registro autoral é removido ou alterado
		// quando o rebuild falha; a próxima tentativa pode ser feita pela UI.
		return {
			status: 'deferred',
			nextAction: REBUILD_NEXT_ACTION,
			code: 'index_rebuild_failed',
			recoverable: true
		};
	}
}

export async function openAfterIndexFailure(storage: WorkspaceStorage): Promise<BackupIndexRecovery> {
	void storage;
	return {
		available: true,
		nextAction: REBUILD_NEXT_ACTION,
		code: 'index_rebuild_failed',
		recoverable: true
	};
}
