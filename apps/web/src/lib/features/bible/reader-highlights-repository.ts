import { isSQLite } from '$lib/storage/empty-sqlite';
import type { WorkspaceStorage } from '$lib/storage/types';
import { getSql } from './bible-reader';

export type ReaderHighlightRecord = {
	versionId: string;
	bookId: number;
	chapter: number;
	verseStart: number;
	verseEnd: number;
	styleId: string;
};

type SqlBindValue = string | number | Uint8Array | null;

interface SqlDatabase {
	run(sql: string, params?: SqlBindValue[]): void;
	exec(sql: string, params?: SqlBindValue[]): { values: unknown[][] }[];
}

/**
 * Tabela auxiliar do workspace (`.openbible/index.sqlite`). A identidade natural
 * é o intervalo exato numa versão, por isso o índice único cobre os cinco campos
 * de referência. Nenhum SQLite de `bibles/` recebe escrita.
 */
export function readerHighlightSchema(): string {
	return `CREATE TABLE IF NOT EXISTS reader_highlight (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_id TEXT NOT NULL,
  book_id INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER NOT NULL,
  style_id TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reader_highlight_range
  ON reader_highlight(version_id, book_id, chapter, verse_start, verse_end);
CREATE INDEX IF NOT EXISTS idx_reader_highlight_chapter
  ON reader_highlight(version_id, book_id, chapter);`;
}

function ensureSchema(database: SqlDatabase): void {
	database.run(readerHighlightSchema());
}

export async function listAllReaderHighlights(database: SqlDatabase): Promise<ReaderHighlightRecord[]> {
	ensureSchema(database);
	const rows =
		database.exec(
			`SELECT version_id, book_id, chapter, verse_start, verse_end, style_id
			 FROM reader_highlight
			 ORDER BY version_id, book_id, chapter, verse_start, verse_end`,
			[]
		)[0]?.values ?? [];
	return rows.map((row) => ({
		versionId: String(row[0]),
		bookId: Number(row[1]),
		chapter: Number(row[2]),
		verseStart: Number(row[3]),
		verseEnd: Number(row[4]),
		styleId: String(row[5])
	}));
}

export async function listChapterHighlights(
	database: SqlDatabase,
	query: { versionId: string; bookId: number; chapter: number }
): Promise<ReaderHighlightRecord[]> {
	ensureSchema(database);
	const rows =
		database.exec(
			`SELECT version_id, book_id, chapter, verse_start, verse_end, style_id
			 FROM reader_highlight
			 WHERE version_id = ? AND book_id = ? AND chapter = ?
			 ORDER BY verse_start, verse_end`,
			[query.versionId, query.bookId, query.chapter]
		)[0]?.values ?? [];
	return rows.map((row) => ({
		versionId: String(row[0]),
		bookId: Number(row[1]),
		chapter: Number(row[2]),
		verseStart: Number(row[3]),
		verseEnd: Number(row[4]),
		styleId: String(row[5])
	}));
}

export async function upsertHighlight(
	database: SqlDatabase,
	record: ReaderHighlightRecord
): Promise<void> {
	ensureSchema(database);
	database.run(
		`INSERT INTO reader_highlight
		   (version_id, book_id, chapter, verse_start, verse_end, style_id)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(version_id, book_id, chapter, verse_start, verse_end)
		 DO UPDATE SET style_id = excluded.style_id`,
		[
			record.versionId,
			record.bookId,
			record.chapter,
			record.verseStart,
			record.verseEnd,
			record.styleId
		]
	);
}

export async function deleteHighlightByRange(
	database: SqlDatabase,
	record: Omit<ReaderHighlightRecord, 'styleId'>
): Promise<void> {
	ensureSchema(database);
	database.run(
		`DELETE FROM reader_highlight
		 WHERE version_id = ? AND book_id = ? AND chapter = ?
		   AND verse_start = ? AND verse_end = ?`,
		[record.versionId, record.bookId, record.chapter, record.verseStart, record.verseEnd]
	);
}

export const READER_HIGHLIGHT_INDEX_PATH = '.openbible/index.sqlite';

type OpenIndex = { database: SqlDatabase; export(): Uint8Array; close(): void };

async function openWorkspaceIndex(storage: WorkspaceStorage): Promise<OpenIndex> {
	const sql = await getSql();
	const bytes = await storage.readFile(READER_HIGHLIGHT_INDEX_PATH);
	const database = bytes && isSQLite(bytes) ? new sql.Database(bytes) : new sql.Database();
	return {
		database,
		export: () => database.export(),
		close: () => database.close()
	};
}

async function withWorkspaceIndex<T>(
	storage: WorkspaceStorage,
	run: (database: SqlDatabase) => Promise<T>,
	persist: boolean
): Promise<T> {
	const index = await openWorkspaceIndex(storage);
	try {
		const result = await run(index.database);
		if (persist) {
			await storage.ensureDirectory('.openbible');
			await storage.writeFile(READER_HIGHLIGHT_INDEX_PATH, index.export());
		}
		return result;
	} finally {
		index.close();
	}
}

export async function readChapterHighlights(
	storage: WorkspaceStorage,
	query: { versionId: string; bookId: number; chapter: number }
): Promise<ReaderHighlightRecord[]> {
	if (storage.kind === 'native' && storage.queryIndex) {
		const value = await storage.queryIndex('list_highlights', query);
		return Array.isArray(value) ? (value as ReaderHighlightRecord[]) : [];
	}
	return withWorkspaceIndex(storage, (database) => listChapterHighlights(database, query), false);
}

export async function readAllReaderHighlights(storage: WorkspaceStorage): Promise<ReaderHighlightRecord[]> {
	if (storage.kind === 'native' && storage.queryIndex) {
		const value = await storage.queryIndex('list_highlights', { versionId: '', bookId: 0, chapter: 0 });
		return Array.isArray(value) ? (value as ReaderHighlightRecord[]) : [];
	}
	return withWorkspaceIndex(storage, (database) => listAllReaderHighlights(database), false);
}

export async function persistHighlight(
	storage: WorkspaceStorage,
	record: ReaderHighlightRecord
): Promise<void> {
	if (storage.kind === 'native' && storage.queryIndex) {
		await storage.queryIndex('upsert_highlight', record);
		return;
	}
	await withWorkspaceIndex(storage, (database) => upsertHighlight(database, record), true);
}

export async function removeHighlight(
	storage: WorkspaceStorage,
	record: Omit<ReaderHighlightRecord, 'styleId'>
): Promise<void> {
	if (storage.kind === 'native' && storage.queryIndex) {
		await storage.queryIndex('delete_highlight', record);
		return;
	}
	await withWorkspaceIndex(storage, (database) => deleteHighlightByRange(database, record), true);
}
