import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { resolve } from 'node:path';
import {
	deleteHighlightByRange,
	listChapterHighlights,
	readChapterHighlights,
	readerHighlightSchema,
	upsertHighlight
} from './reader-highlights-repository';
import * as highlightRepo from './reader-highlights-repository';
import type { WorkspaceStorage } from '$lib/storage/types';

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;

let SQL: SqlJs;

beforeAll(async () => {
	SQL = await initSqlJs({
		locateFile: (file) => resolve(process.cwd(), '../../node_modules/sql.js/dist', file)
	});
});

function openIndex() {
	const database = new SQL.Database();
	database.run(readerHighlightSchema() || 'SELECT 1');
	return database;
}

const record = {
	versionId: 'ara.sqlite',
	bookId: 1,
	chapter: 1,
	verseStart: 2,
	verseEnd: 5,
	styleId: 'pen-gold'
};

describe('reader-highlights-repository', () => {
	it('sends a deterministic legacy workspace scope to the native SQLite driver', async () => {
		const calls: unknown[] = [];
		const storage: WorkspaceStorage = {
			kind: 'native',
			label: 'Workspace nativo legado',
			async ensureDirectory() {},
			async writeFile() {},
			async readFile(path) {
				if (path === '.openbible/config.json') {
					return new TextEncoder().encode(
						JSON.stringify({
							path: '/tmp/openbible-legacy',
							storageKind: 'native',
							formatVersion: 1,
							migrationState: 'not_started'
						})
					);
				}
				return null;
			},
			async fileExists() {
				return false;
			},
			async listFiles() {
				return [];
			},
			async queryIndex(_operation, record) {
				calls.push(record);
				return [];
			}
		};

		await expect(
			readChapterHighlights(storage, { versionId: 'nvi.sqlite', bookId: 43, chapter: 3 })
		).resolves.toEqual([]);
		expect(calls[0]).toMatchObject({
			versionId: 'nvi.sqlite',
			workspaceId: expect.stringMatching(/^legacy-native-[0-9a-f]{8}$/)
		});
	});

	it('treats a missing highlights directory as an empty chapter on first load', async () => {
		// SPECSFY: US-003 FR-004 NFR-001 AC-009 AC-010
		const storage: WorkspaceStorage = {
			kind: 'opfs',
			label: 'Workspace sem destaques',
			async ensureDirectory() {},
			async writeFile() {},
			async readFile(path) {
				if (path === '.openbible/config.json') {
					return new TextEncoder().encode(
						JSON.stringify({
							workspaceId: 'workspace-empty-highlights',
							formatVersion: 2,
							name: 'Workspace sem destaques',
							managedRoot: true,
							storage: 'opfs',
							configuredAt: '2026-09-06T00:00:00.000Z',
							bibleImportStatus: 'complete',
							label: 'Workspace sem destaques',
							version: 1
						})
					);
				}
				return null;
			},
			async fileExists() {
				return false;
			},
			async listFiles(path) {
				if (path === 'highlights') {
					const error = new Error('directory does not exist');
					error.name = 'NotFoundError';
					throw error;
				}
				return [];
			}
		};

		await expect(
			readChapterHighlights(storage, {
				versionId: 'nvi.sqlite',
				bookId: 43,
				chapter: 3
			})
		).resolves.toEqual([]);
	});

	it('restores saved ranges after a new connection to the auxiliary index', async () => {
		// SPECSFY: US-002 FR-008 NFR-002 AC-012
		expect(readerHighlightSchema()).toMatch(/CREATE TABLE IF NOT EXISTS\s+reader_highlight/i);
		const first = openIndex();
		await upsertHighlight(first, record);
		const exported = first.export();
		first.close();
		const reopened = new SQL.Database(exported);
		const restored = await listChapterHighlights(reopened, {
			versionId: 'ara.sqlite',
			bookId: 1,
			chapter: 1
		});
		expect(restored).toEqual([record]);
		reopened.close();
	});

	it('writes only the auxiliary index and never a biblical sqlite', async () => {
		// SPECSFY: FR-008 NFR-002 AC-017
		const bible = new SQL.Database();
		bible.run(
			'CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO book (id, name) VALUES (1, \'Gênesis\');'
		);
		const index = openIndex();
		await upsertHighlight(index, record);
		const listed = await listChapterHighlights(index, {
			versionId: 'ara.sqlite',
			bookId: 1,
			chapter: 1
		});
		expect(listed).toHaveLength(1);
		const bibleTables = bible.exec(
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'reader_highlight'"
		);
		expect(bibleTables[0]?.values ?? []).toEqual([]);
		expect(bible.exec('SELECT name FROM book')[0].values).toEqual([['Gênesis']]);
		await deleteHighlightByRange(index, {
			versionId: record.versionId,
			bookId: record.bookId,
			chapter: record.chapter,
			verseStart: record.verseStart,
			verseEnd: record.verseEnd
		});
		expect(
			await listChapterHighlights(index, { versionId: 'ara.sqlite', bookId: 1, chapter: 1 })
		).toEqual([]);
		bible.close();
		index.close();
	});
});

describe('listAllReaderHighlights', () => {
	it('lists every persisted highlight in the workspace', async () => {
		// SPECSFY: US-001 FR-001 FR-006 NFR-001 AC-001
		expect(highlightRepo.listAllReaderHighlights).toEqual(expect.any(Function));
		const database = openIndex();
		await upsertHighlight(database, record);
		await upsertHighlight(database, {
			versionId: 'nvi.sqlite',
			bookId: 43,
			chapter: 3,
			verseStart: 16,
			verseEnd: 16,
			styleId: 'pen-mint'
		});
		expect(await highlightRepo.listAllReaderHighlights(database)).toEqual([
			record,
			{
				versionId: 'nvi.sqlite',
				bookId: 43,
				chapter: 3,
				verseStart: 16,
				verseEnd: 16,
				styleId: 'pen-mint'
			}
		]);
		database.close();
	});

	it('does not clip the list to the open chapter or version', async () => {
		// SPECSFY: US-001 FR-001 FR-006 AC-002
		expect(highlightRepo.listAllReaderHighlights).toEqual(expect.any(Function));
		const database = openIndex();
		await upsertHighlight(database, record);
		await upsertHighlight(database, {
			versionId: 'ara.sqlite',
			bookId: 1,
			chapter: 2,
			verseStart: 1,
			verseEnd: 1,
			styleId: 'underline'
		});
		const rows = await highlightRepo.listAllReaderHighlights(database);
		expect(rows).toHaveLength(2);
		expect(rows).toEqual(
			expect.arrayContaining([
				record,
				expect.objectContaining({ chapter: 2, verseStart: 1, verseEnd: 1 })
			])
		);
		database.close();
	});

	it('returns an empty list when the workspace has no reader highlights', async () => {
		// SPECSFY: US-001 FR-001 NFR-002 AC-003
		expect(highlightRepo.listAllReaderHighlights).toEqual(expect.any(Function));
		const database = openIndex();
		expect(await highlightRepo.listAllReaderHighlights(database)).toEqual([]);
		database.close();
	});

	it('exposes the same membership for sheet and page consumers', async () => {
		// SPECSFY: US-002 FR-006 AC-005
		expect(highlightRepo.listAllReaderHighlights).toEqual(expect.any(Function));
		const database = openIndex();
		await upsertHighlight(database, record);
		const forSheet = await highlightRepo.listAllReaderHighlights(database);
		const forPage = await highlightRepo.listAllReaderHighlights(database);
		expect(forPage).toEqual(forSheet);
		database.close();
	});

	it('does not create a new table or write biblical sqlite files', async () => {
		// SPECSFY: NFR-002 AC-015
		expect(highlightRepo.listAllReaderHighlights).toEqual(expect.any(Function));
		const bible = new SQL.Database();
		bible.run(
			"CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO book (id, name) VALUES (1, 'Gênesis');"
		);
		const index = openIndex();
		await upsertHighlight(index, record);
		await highlightRepo.listAllReaderHighlights(index);
		expect(
			bible.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'reader_highlight'")
		).toEqual([]);
		expect(bible.exec('SELECT name FROM book')[0].values).toEqual([['Gênesis']]);
		bible.close();
		index.close();
	});
});
