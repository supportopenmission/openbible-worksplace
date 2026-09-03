import { isSQLite } from '$lib/storage/empty-sqlite';
import type { WorkspaceStorage } from '$lib/storage/types';
import { getSql } from '$lib/features/bible/bible-reader';

export interface NoteVerseRef {
	id?: number;
	notePath: string;
	blockIndex: number;
	versionId: string;
	bookId: number;
	bookName: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
}

export interface VerseReferenceInput {
	blockIndex: number;
	versionId: string;
	bookId: number;
	book?: string;
	bookName?: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
}

interface SqlDatabase {
	run(sql: string, params?: unknown[]): void;
	exec(sql: string, params?: unknown[]): { values: unknown[][] }[];
}

const memoryIndex = new Map<string, NoteVerseRef[]>();

export function noteVerseIndexSchema(): string {
	return `CREATE TABLE IF NOT EXISTS note_verse_ref (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_path TEXT NOT NULL,
  block_index INTEGER NOT NULL,
  version_id TEXT NOT NULL,
  book_id INTEGER NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_note_verse_ref_note_path ON note_verse_ref(note_path);
CREATE INDEX IF NOT EXISTS idx_note_verse_ref_reference ON note_verse_ref(version_id, book_id, chapter);`;
}

function normalizedRef(notePath: string, input: VerseReferenceInput): NoteVerseRef {
	return {
		notePath,
		blockIndex: input.blockIndex,
		versionId: input.versionId,
		bookId: input.bookId,
		bookName: input.bookName ?? input.book ?? '',
		chapter: input.chapter,
		verseStart: input.verseStart,
		verseEnd: input.verseEnd
	};
}

export async function reindexNoteVerses(
	notePath: string,
	refs: VerseReferenceInput[],
	database?: SqlDatabase
): Promise<NoteVerseRef[]> {
	const normalized = refs.map((ref) => normalizedRef(notePath, ref));
	if (!database) {
		memoryIndex.set(notePath, normalized);
		return normalized;
	}
	database.run(noteVerseIndexSchema());
	database.run('DELETE FROM note_verse_ref WHERE note_path = ?', [notePath]);
	for (const ref of normalized) {
		database.run(
			`INSERT INTO note_verse_ref
			 (note_path, block_index, version_id, book_id, book_name, chapter, verse_start, verse_end)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				ref.notePath,
				ref.blockIndex,
				ref.versionId,
				ref.bookId,
				ref.bookName,
				ref.chapter,
				ref.verseStart,
				ref.verseEnd
			]
		);
	}
	return normalized;
}

export async function deleteNoteVerseRefs(notePath: string, database?: SqlDatabase): Promise<void> {
	if (database) {
		database.run(noteVerseIndexSchema());
		database.run('DELETE FROM note_verse_ref WHERE note_path = ?', [notePath]);
	} else {
		memoryIndex.delete(notePath);
	}
}

export function getMemoryNoteVerseRefs(notePath: string): NoteVerseRef[] {
	return memoryIndex.get(notePath) ?? [];
}

export function resetMemoryNoteVerseIndex(): void {
	memoryIndex.clear();
}

export function listMemoryNoteVerseRefsForChapter(query: {
	versionId: string;
	bookId: number;
	chapter: number;
}): NoteVerseRef[] {
	const refs: NoteVerseRef[] = [];
	for (const noteRefs of memoryIndex.values()) {
		for (const ref of noteRefs) {
			if (
				ref.versionId === query.versionId &&
				ref.bookId === query.bookId &&
				ref.chapter === query.chapter
			) {
				refs.push(ref);
			}
		}
	}
	return refs;
}

function mapNoteVerseRow(row: unknown[]): NoteVerseRef {
	return {
		notePath: String(row[0]),
		blockIndex: Number(row[1]),
		versionId: String(row[2]),
		bookId: Number(row[3]),
		bookName: String(row[4]),
		chapter: Number(row[5]),
		verseStart: Number(row[6]),
		verseEnd: Number(row[7])
	};
}

export function listChapterNoteVerseRefs(
	database: SqlDatabase,
	query: { versionId: string; bookId: number; chapter: number }
): NoteVerseRef[] {
	database.run(noteVerseIndexSchema());
	const rows =
		database.exec(
			`SELECT note_path, block_index, version_id, book_id, book_name, chapter, verse_start, verse_end
			 FROM note_verse_ref
			 WHERE version_id = ? AND book_id = ? AND chapter = ?
			 ORDER BY verse_start, verse_end`,
			[query.versionId, query.bookId, query.chapter]
		)[0]?.values ?? [];
	return rows.map((row) => mapNoteVerseRow(row));
}

const NOTE_INDEX_PATH = '.openbible/index.sqlite';

export async function readChapterNoteVerseRefs(
	storage: WorkspaceStorage,
	query: { versionId: string; bookId: number; chapter: number }
): Promise<NoteVerseRef[]> {
	const sql = await getSql();
	const bytes = await storage.readFile(NOTE_INDEX_PATH);
	const database =
		bytes && isSQLite(bytes) ? new sql.Database(bytes) : new sql.Database();
	try {
		const persisted = listChapterNoteVerseRefs(database, query);
		const memory = listMemoryNoteVerseRefsForChapter(query);
		if (memory.length === 0) return persisted;
		const seen = new Set(persisted.map((ref) => `${ref.notePath}:${ref.blockIndex}`));
		const merged = [...persisted];
		for (const ref of memory) {
			const key = `${ref.notePath}:${ref.blockIndex}`;
			if (!seen.has(key)) merged.push(ref);
		}
		return merged;
	} finally {
		database.close();
	}
}

export async function persistNoteVerseRefsToWorkspace(
	storage: WorkspaceStorage,
	notePath: string,
	refs: VerseReferenceInput[]
): Promise<NoteVerseRef[]> {
	const sql = await getSql();
	const bytes = await storage.readFile(NOTE_INDEX_PATH);
	const database =
		bytes && isSQLite(bytes) ? new sql.Database(bytes) : new sql.Database();
	try {
		const normalized = await reindexNoteVerses(notePath, refs, database);
		await storage.ensureDirectory('.openbible');
		await storage.writeFile(NOTE_INDEX_PATH, database.export());
		memoryIndex.set(notePath, normalized);
		return normalized;
	} finally {
		database.close();
	}
}
