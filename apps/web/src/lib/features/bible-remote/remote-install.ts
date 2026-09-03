import { isSQLite } from '$lib/storage/empty-sqlite';
import type { ImportResult, WorkspaceStorage } from '$lib/storage/types';
import { getSql } from '$lib/features/bible/bible-reader';
import { downloadWithProgress, RemoteDownloadError } from './remote-download';
import type { RemoteBibleFile } from './remote-manifest';

export type RemoteInstallReason =
	| 'invalid-sqlite'
	| 'duplicate'
	| 'copy-failed'
	| 'network-failed'
	| 'http-error'
	| 'cors-blocked'
	| 'invalid-schema';

export interface RemoteInstallResult extends Omit<ImportResult, 'reason'> {
	reason?: RemoteInstallResult['status'] extends never ? never : RemoteInstallReason;
	status: 'imported' | 'rejected';
}

export interface RemoteBatchProgress {
	completedFiles: number;
	totalFiles: number;
}

async function assertOpenLpSchema(bytes: Uint8Array): Promise<void> {
	const sql = await getSql();
	const database = new sql.Database(bytes);
	try {
		const tables = new Set(
			(database.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('book', 'verse')")[0]?.values ?? []).map(
				(row) => String(row[0]).toLowerCase()
			)
		);
		if (!tables.has('book') || !tables.has('verse')) throw new Error('invalid-schema');
		const bookInfo = database.exec('PRAGMA table_info(book)')[0]?.values ?? [];
		const verseInfo = database.exec('PRAGMA table_info(verse)')[0]?.values ?? [];
		const bookCols = new Set(bookInfo.map((row) => String(row[1]).toLowerCase()));
		const verseCols = new Set(verseInfo.map((row) => String(row[1]).toLowerCase()));
		for (const column of ['id', 'name']) if (!bookCols.has(column)) throw new Error('invalid-schema');
		for (const column of ['book_id', 'chapter', 'verse', 'text'])
			if (!verseCols.has(column)) throw new Error('invalid-schema');
	} finally {
		database.close();
	}
}

function decodeConfig(bytes: Uint8Array | null): { bibleImportStatus: string } & Record<string, unknown> | null {
	if (!bytes) return null;
	try {
		return JSON.parse(new TextDecoder().decode(bytes)) as { bibleImportStatus: string } & Record<string, unknown>;
	} catch {
		return null;
	}
}

export async function installRemoteBibles(
	storage: WorkspaceStorage,
	files: RemoteBibleFile[],
	options: {
		fetchImpl?: typeof fetch;
		onFileProgress?: (name: string, loaded: number, total?: number) => void;
		onBatchProgress?: (progress: RemoteBatchProgress) => void;
		signal?: AbortSignal;
		concurrency?: number;
	} = {}
): Promise<ImportResult[]> {
	const results: (ImportResult | null)[] = files.map(() => null);
	const limit = Math.max(1, Math.min(options.concurrency ?? 2, 2));
	let next = 0;
	let completed = 0;

	async function worker() {
		while (next < files.length) {
			if (options.signal?.aborted) break;
			const index = next;
			next += 1;
			const entry = files[index];
			const destination = `bibles/${entry.name}`;
			let result: ImportResult;
			if (await storage.fileExists(destination)) {
				result = { name: entry.name, status: 'rejected', reason: 'duplicate' };
			} else {
				try {
					const bytes = await downloadWithProgress(entry.url, (progress) => {
						options.onFileProgress?.(entry.name, progress.loaded, progress.total ?? entry.size);
					}, { fetchImpl: options.fetchImpl, signal: options.signal });
					if (!isSQLite(bytes)) {
						result = { name: entry.name, status: 'rejected', reason: 'invalid-sqlite' };
					} else {
						try {
							await assertOpenLpSchema(bytes);
						} catch {
							result = { name: entry.name, status: 'rejected', reason: 'invalid-sqlite' };
							results[index] = result;
							completed += 1;
							options.onBatchProgress?.({ completedFiles: completed, totalFiles: files.length });
							continue;
						}
						try {
							await storage.writeFile(destination, bytes);
							result = { name: entry.name, status: 'imported' };
						} catch {
							result = { name: entry.name, status: 'rejected', reason: 'copy-failed' };
						}
					}
				} catch (error) {
					if (error instanceof RemoteDownloadError) {
						const reason =
							error.kind === 'cors-blocked'
								? 'copy-failed'
								: error.kind === 'http-error'
									? 'copy-failed'
									: 'copy-failed';
						result = { name: entry.name, status: 'rejected', reason };
						// Preserva mensagem específica viaDiagnostics? Mantém motivo genérico compatível com ImportResult.
						void reason;
					} else {
						result = { name: entry.name, status: 'rejected', reason: 'copy-failed' };
					}
				}
			}
			results[index] = result;
			completed += 1;
			options.onBatchProgress?.({ completedFiles: completed, totalFiles: files.length });
		}
	}

	await Promise.all(Array.from({ length: Math.min(limit, files.length) }, () => worker()));

	const finalResults = results.map((result, index) => result ?? { name: files[index].name, status: 'rejected' as const, reason: 'copy-failed' as const });

	const config = decodeConfig(await storage.readFile('.openbible/config.json'));
	if (config) {
		const imported = finalResults.some((result) => result.status === 'imported');
		if (imported) {
			const status = finalResults.every((result) => result.status === 'imported') ? 'complete' : 'partial';
			await storage.writeFile(
				'.openbible/config.json',
				`${JSON.stringify({ ...config, bibleImportStatus: status }, null, 2)}\n`
			);
		}
	}

	return finalResults;
}
