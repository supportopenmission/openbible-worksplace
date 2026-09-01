import type { BibleBook } from './bible-reader';

export const READER_SELECTION_STORAGE_KEY = 'openbible.reader-selection';

export interface ReaderSelection {
	versionId: string;
	bookId: number;
	chapter: number;
}

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type SelectionCatalog = {
	versions: Array<{ id: string; books: Array<Pick<BibleBook, 'id' | 'chapters'>> }>;
};

function browserStorage(): PreferenceStorage | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function isSelectionShape(value: unknown): value is ReaderSelection {
	if (!value || typeof value !== 'object') return false;
	const selection = value as Partial<ReaderSelection>;
	return (
		typeof selection.versionId === 'string' &&
		selection.versionId.length > 0 &&
		typeof selection.bookId === 'number' &&
		Number.isInteger(selection.bookId) &&
		selection.bookId > 0 &&
		typeof selection.chapter === 'number' &&
		Number.isInteger(selection.chapter) &&
		selection.chapter > 0
	);
}

export function readReaderPreference(
	storage: PreferenceStorage | null = browserStorage()
): ReaderSelection | null {
	if (!storage) return null;
	try {
		const raw = storage.getItem(READER_SELECTION_STORAGE_KEY);
		if (!raw) return null;
		const selection: unknown = JSON.parse(raw);
		if (isSelectionShape(selection)) return selection;
		storage.removeItem(READER_SELECTION_STORAGE_KEY);
	} catch {
		return null;
	}
	return null;
}

export function saveReaderPreference(
	selection: ReaderSelection,
	storage: PreferenceStorage | null = browserStorage()
): boolean {
	if (!storage || !isSelectionShape(selection)) return false;
	try {
		storage.setItem(READER_SELECTION_STORAGE_KEY, JSON.stringify(selection));
		return true;
	} catch {
		return false;
	}
}

export function isReaderSelectionValid(
	selection: unknown,
	catalog: SelectionCatalog
): selection is ReaderSelection {
	if (!isSelectionShape(selection)) return false;
	const version = catalog.versions.find((item) => item.id === selection.versionId);
	const book = version?.books.find((item) => item.id === selection.bookId);
	return Boolean(book?.chapters.includes(selection.chapter));
}
