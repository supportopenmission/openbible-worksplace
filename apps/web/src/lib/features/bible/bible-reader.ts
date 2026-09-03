import initSqlJs from 'sql.js';
import type { WorkspaceStorage } from '$lib/storage/types';

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;
type SqlDatabase = InstanceType<SqlJs['Database']>;

export interface BibleVerse {
	number: number;
	text: string;
}

export interface BibleBook {
	id: number;
	name: string;
	abbreviation: string;
	testamentId?: number;
	chapters: number[];
}

export interface BibleVersion {
	id: string;
	fileName: string;
	name: string;
	books: BibleBook[];
	bytes: Uint8Array;
}

export interface BibleCatalogDiagnostic {
	fileName: string;
	message: string;
}

export interface BibleCatalog {
	versions: BibleVersion[];
	diagnostics: BibleCatalogDiagnostic[];
}

export interface BibleChapterSelection {
	bookId: number;
	chapter: number;
}

export interface BibleSearchResult {
	bookId: number;
	bookName: string;
	chapter: number;
	verse: number;
	text: string;
}

type ChapterDirection = 'previous' | 'next';

let sqlPromise: Promise<SqlJs> | null = null;

function locateWasm(file: string): string {
	if (typeof window !== 'undefined') return '/sql-wasm.wasm';
	return new URL(`../../../../../../node_modules/sql.js/dist/${file}`, import.meta.url).pathname;
}

export async function getSql(): Promise<SqlJs> {
	sqlPromise ??= initSqlJs({ locateFile: locateWasm });
	return sqlPromise;
}

function resultRows(database: SqlDatabase, query: string, params: (number | string)[] = []) {
	return database.exec(query, params)[0]?.values ?? [];
}

function tableColumns(database: SqlDatabase, table: string): Set<string> {
	return new Set(
		resultRows(database, `PRAGMA table_info(${table})`).map((row) => String(row[1]).toLowerCase())
	);
}

function validateOpenLpSchema(database: SqlDatabase): { bookColumns: Set<string> } {
	const tables = new Set(
		resultRows(
			database,
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('book', 'verse')"
		).map((row) => String(row[0]).toLowerCase())
	);
	if (!tables.has('book')) throw new Error('Schema OpenLP inválido: tabela book ausente');
	if (!tables.has('verse')) throw new Error('Schema OpenLP inválido: tabela verse ausente');

	const bookColumns = tableColumns(database, 'book');
	const verseColumns = tableColumns(database, 'verse');
	for (const column of ['id', 'name']) {
		if (!bookColumns.has(column)) {
			throw new Error(`Schema OpenLP inválido: coluna book.${column} ausente`);
		}
	}
	for (const column of ['book_id', 'chapter', 'verse', 'text']) {
		if (!verseColumns.has(column)) {
			throw new Error(`Schema OpenLP inválido: coluna verse.${column} ausente`);
		}
	}
	return { bookColumns };
}

function readBooks(database: SqlDatabase, bookColumns: Set<string>): BibleBook[] {
	const abbreviationColumn = bookColumns.has('abbreviation') ? ', abbreviation' : '';
	const testamentColumn = bookColumns.has('testament_id') ? ', testament_id' : '';
	return resultRows(
		database,
		`SELECT id, name${abbreviationColumn}${testamentColumn} FROM book ORDER BY id`
	).map((row) => ({
		id: Number(row[0]),
		name: String(row[1]),
		abbreviation: abbreviationColumn ? String(row[2] ?? '') : '',
		...(testamentColumn ? { testamentId: Number(row[2 + (abbreviationColumn ? 1 : 0)]) } : {}),
		chapters: resultRows(
			database,
			'SELECT DISTINCT chapter FROM verse WHERE book_id = ? ORDER BY chapter',
			[Number(row[0])]
		).map((chapter) => Number(chapter[0]))
	}));
}

function readVersionName(database: SqlDatabase, fallback: string): string {
	const metadataColumns = tableColumns(database, 'metadata');
	if (!metadataColumns.has('key') || !metadataColumns.has('value')) return fallback;
	const value = resultRows(database, 'SELECT value FROM metadata WHERE key = ? LIMIT 1', [
		'name'
	])[0]?.[0];
	return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function databaseFor(version: BibleVersion, sql: SqlJs): SqlDatabase {
	return new sql.Database(version.bytes);
}

export async function loadBibleCatalog(storage: WorkspaceStorage): Promise<BibleCatalog> {
	const sql = await getSql();
	const versions: BibleVersion[] = [];
	const diagnostics: BibleCatalogDiagnostic[] = [];
	const files = (await storage.listFiles('bibles'))
		.filter((fileName) => fileName.toLowerCase().endsWith('.sqlite'))
		.sort();

	for (const fileName of files) {
		const bytes = await storage.readFile(`bibles/${fileName}`);
		if (!bytes) {
			diagnostics.push({ fileName, message: 'Arquivo da Bíblia não pôde ser lido' });
			continue;
		}

		let database: SqlDatabase | null = null;
		try {
			database = new sql.Database(bytes);
			const { bookColumns } = validateOpenLpSchema(database);
			versions.push({
				id: fileName,
				fileName,
				name: readVersionName(database, fileName),
				books: readBooks(database, bookColumns),
				bytes: new Uint8Array(bytes)
			});
		} catch (error) {
			diagnostics.push({
				fileName,
				message: error instanceof Error ? error.message : 'Arquivo SQLite incompatível'
			});
		} finally {
			database?.close();
		}
	}

	return { versions, diagnostics };
}

export async function readBibleChapter(
	version: BibleVersion,
	bookId: number,
	chapter: number
): Promise<BibleVerse[]> {
	const sql = await getSql();
	const database = databaseFor(version, sql);
	try {
		return resultRows(
			database,
			'SELECT verse, text FROM verse WHERE book_id = ? AND chapter = ? ORDER BY verse',
			[bookId, chapter]
		).map((row) => ({ number: Number(row[0]), text: String(row[1]) }));
	} finally {
		database.close();
	}
}

export async function searchBible(
	version: BibleVersion,
	term: string
): Promise<BibleSearchResult[]> {
	const sql = await getSql();
	const database = databaseFor(version, sql);
	try {
		return resultRows(
			database,
			`SELECT verse.book_id, book.name, verse.chapter, verse.verse, verse.text
			 FROM verse JOIN book ON book.id = verse.book_id
			 WHERE verse.text LIKE ?
			 ORDER BY verse.book_id, verse.chapter, verse.verse
			 LIMIT 50`,
			[`%${term}%`]
		).map((row) => ({
			bookId: Number(row[0]),
			bookName: String(row[1]),
			chapter: Number(row[2]),
			verse: Number(row[3]),
			text: String(row[4])
		}));
	} finally {
		database.close();
	}
}

export function getAdjacentChapter(
	version: BibleVersion,
	selection: BibleChapterSelection,
	direction: ChapterDirection
): BibleChapterSelection | null {
	const chapters = version.books.flatMap((book) =>
		book.chapters.map((chapter) => ({ bookId: book.id, chapter }))
	);
	const currentIndex = chapters.findIndex(
		(item) => item.bookId === selection.bookId && item.chapter === selection.chapter
	);
	if (currentIndex < 0) return null;
	return chapters[currentIndex + (direction === 'next' ? 1 : -1)] ?? null;
}
