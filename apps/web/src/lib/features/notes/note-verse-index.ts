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
