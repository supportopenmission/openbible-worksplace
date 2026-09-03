import { getSql } from '$lib/features/bible/bible-reader';
import type { WorkspaceStorage } from '$lib/storage/types';

export interface LibraryEntry {
	fileName: string;
	name: string;
	books: number;
	size: number;
	status: 'installed' | 'invalid';
	diagnostic?: string;
}

export interface DeleteBibleResult {
	name: string;
	status: 'deleted';
	remaining: number;
}

export type LibraryErrorCode = 'delete-unsupported' | 'not-found' | 'delete-failed';

export class LibraryError extends Error {
	code: LibraryErrorCode;
	constructor(code: LibraryErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

async function describeFile(fileName: string, bytes: Uint8Array): Promise<LibraryEntry> {
	const fallback: LibraryEntry = {
		fileName,
		name: fileName,
		books: 0,
		size: bytes.length,
		status: 'invalid',
		diagnostic: 'Arquivo SQLite incompatível'
	};
	const sql = await getSql();
	let database = null as Awaited<ReturnType<typeof getSql>>['Database'] | null;
	try {
		database = new sql.Database(bytes);
		const tables = new Set(
			(database.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('book', 'verse')")[0]?.values ?? []).map(
				(row) => String(row[0]).toLowerCase()
			)
		);
		if (!tables.has('book') || !tables.has('verse')) {
			return { ...fallback, diagnostic: 'Schema OpenLP inválido: tabelas book e verse são obrigatórias' };
		}
		const bookCount = Number(database.exec('SELECT COUNT(*) FROM book')[0]?.values[0]?.[0] ?? 0);
		let name = fileName;
		try {
			const value = database.exec('SELECT value FROM metadata WHERE key = ? LIMIT 1', ['name'])[0]?.values[0]?.[0];
			if (typeof value === 'string' && value.trim()) name = value.trim();
		} catch {
			// metadata é opcional; mantém o nome do arquivo.
		}
		return { fileName, name, books: bookCount, size: bytes.length, status: 'installed' };
	} catch {
		return fallback;
	} finally {
		database?.close();
	}
}

export async function listLibraryEntries(storage: WorkspaceStorage): Promise<LibraryEntry[]> {
	const files = (await storage.listFiles('bibles'))
		.filter((fileName) => fileName.toLowerCase().endsWith('.sqlite'))
		.sort();
	const entries: LibraryEntry[] = [];
	for (const fileName of files) {
		const bytes = await storage.readFile(`bibles/${fileName}`);
		if (!bytes) {
			entries.push({
				fileName,
				name: fileName,
				books: 0,
				size: 0,
				status: 'invalid',
				diagnostic: 'Arquivo da Bíblia não pôde ser lido'
			});
			continue;
		}
		entries.push(await describeFile(fileName, bytes));
	}
	return entries;
}

function decodeConfig(bytes: Uint8Array | null): (Record<string, unknown> & { bibleImportStatus?: string }) | null {
	if (!bytes) return null;
	try {
		return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
	} catch {
		return null;
	}
}

export async function deleteBibleVersion(
	storage: WorkspaceStorage,
	fileName: string
): Promise<DeleteBibleResult> {
	const destination = `bibles/${fileName}`;
	if (!(await storage.fileExists(destination))) {
		throw new LibraryError('not-found', `Versão ${fileName} não encontrada.`);
	}
	if (typeof storage.deleteFile !== 'function') {
		throw new LibraryError('delete-unsupported', 'Este armazenamento não permite excluir arquivos.');
	}
	try {
		await storage.deleteFile(destination);
	} catch (error) {
		throw new LibraryError(
			'delete-failed',
			error instanceof Error ? error.message : `Não foi possível excluir ${fileName}.`
		);
	}
	const remaining = (await storage.listFiles('bibles')).filter((name) =>
		name.toLowerCase().endsWith('.sqlite')
	);
	const config = decodeConfig(await storage.readFile('.openbible/config.json'));
	if (config && remaining.length === 0) {
		await storage.writeFile(
			'.openbible/config.json',
			`${JSON.stringify({ ...config, bibleImportStatus: 'pending' }, null, 2)}\n`
		);
	}
	return { name: fileName, status: 'deleted', remaining: remaining.length };
}
