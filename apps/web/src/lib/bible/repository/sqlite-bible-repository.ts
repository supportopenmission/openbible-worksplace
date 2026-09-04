import type { WorkspaceStorage } from '$lib/storage/types';
import type { BiblePassage, BibleRepository, GetPassageInput } from './types';
import { loadBibleCatalog, readBibleChapter, type BibleVersion } from '$lib/features/bible/bible-reader';
import { getBookName } from '../parser/books';
import { MockBibleRepository } from './mock-bible-repository';
import { readDefaultBibleVersion } from '$lib/storage/preferences';

export class SQLiteBibleRepository implements BibleRepository {
	private storage: WorkspaceStorage;
	private fallback: MockBibleRepository;

	constructor(storage: WorkspaceStorage) {
		this.storage = storage;
		this.fallback = new MockBibleRepository();
	}

	async getPassage(input: GetPassageInput): Promise<BiblePassage> {
		try {
			const catalog = await loadBibleCatalog(this.storage);
			if (catalog.versions.length === 0) {
				return this.fallback.getPassage(input);
			}

			// Match version by translation abbreviation or filename
			let version: BibleVersion | undefined;
			let versionMismatch = false;
			if (input.translation) {
				const trClean = input.translation.toLowerCase();
				version = catalog.versions.find(
					(v) =>
						v.name.toLowerCase().includes(trClean) ||
						v.fileName.toLowerCase().includes(trClean) ||
						v.id.toLowerCase().includes(trClean)
				);
				if (!version) {
					versionMismatch = true;
				}
			}
			if (!version) {
				const defaultVersionId = readDefaultBibleVersion();
				if (defaultVersionId) {
					version = catalog.versions.find(
						(v) => v.id === defaultVersionId || v.fileName === defaultVersionId
					);
				}
			}
			version ??= catalog.versions[0];

			if (!version) {
				return this.fallback.getPassage(input);
			}

			// Parse OSIS
			const firstSegment = input.osis.split(',')[0] ?? input.osis;
			const isRange = firstSegment.includes('-');
			const [startPart, endPart] = isRange ? firstSegment.split('-') : [firstSegment, firstSegment];

			const startTokens = startPart.split('.');
			const endTokens = endPart?.split('.') ?? startTokens;

			const bookOsis = startTokens[0] ?? 'Gen';
			const bookNamePt = getBookName(bookOsis);
			const chapter = parseInt(startTokens[1] ?? '1', 10) || 1;

			const startVerse = startTokens[2] ? parseInt(startTokens[2], 10) : 1;
			const endVerse = endTokens[2] ? parseInt(endTokens[2], 10) : startTokens[2] ? startVerse : 999;

			// Find matching book in version
			const book = version.books.find(
				(b) =>
					b.name.toLowerCase() === bookNamePt.toLowerCase() ||
					b.abbreviation.toLowerCase() === bookOsis.toLowerCase() ||
					bookNamePt.toLowerCase().includes(b.name.toLowerCase()) ||
					b.name.toLowerCase().includes(bookNamePt.toLowerCase())
			);

			if (!book) {
				return this.fallback.getPassage(input);
			}

			const allChapterVerses = await readBibleChapter(version, book.id, chapter);
			const filtered = allChapterVerses.filter(
				(v) => v.number >= startVerse && v.number <= endVerse
			);

			if (filtered.length === 0) {
				return this.fallback.getPassage(input);
			}

			return {
				osis: input.osis,
				translation: version.name || 'Bíblia',
				requestedTranslation: input.translation,
				versionMismatch,
				bookName: book.name,
				chapter,
				verses: filtered
			};
		} catch {
			return this.fallback.getPassage(input);
		}
	}
}
