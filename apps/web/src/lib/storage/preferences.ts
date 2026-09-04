import { clearHomeRoute, readHomeRoute } from '$lib/navigation/home-preference';
import {
	readReaderPreference,
	READER_SELECTION_STORAGE_KEY,
	saveReaderPreference
} from '$lib/features/bible/reader-preference';
import { readTheme, saveTheme } from '$lib/theme/theme';
import type { WorkspacePreferences, WorkspaceStorage } from './types';

export const PREFERENCES_PATH = '.openbible/preferences.json';

export const DEFAULT_PREFERENCES: WorkspacePreferences = {
	version: 1,
	theme: 'light',
	initialRoute: null,
	readerSelection: null
};

function decodeJson<T>(bytes: Uint8Array | null): T | null {
	if (!bytes) return null;
	try {
		return JSON.parse(new TextDecoder().decode(bytes)) as T;
	} catch {
		return null;
	}
}

function isPreferences(value: unknown): value is WorkspacePreferences {
	if (!value || typeof value !== 'object') return false;
	const preferences = value as Partial<WorkspacePreferences>;
	const themeValid =
		preferences.theme === 'light' || preferences.theme === 'dark' || preferences.theme === 'system';
	const routeValid =
		preferences.initialRoute === null ||
		preferences.initialRoute === 'bible' ||
		preferences.initialRoute === 'sermons';
	const selection = preferences.readerSelection;
	const selectionValid =
		selection === null ||
		(typeof selection === 'object' &&
			typeof selection.versionId === 'string' &&
			selection.versionId.length > 0 &&
			Number.isInteger(selection.bookId) &&
			selection.bookId > 0 &&
			Number.isInteger(selection.chapter) &&
			selection.chapter > 0);
	return preferences.version === 1 && themeValid && routeValid && selectionValid;
}

export function readCachedPreferences(): WorkspacePreferences {
	return {
		version: 1,
		theme: readTheme(),
		initialRoute: readHomeRoute(),
		readerSelection: readReaderPreference()
	};
}

export function writeCachedPreferences(preferences: WorkspacePreferences): void {
	saveTheme(preferences.theme);
	clearHomeRoute();
	if (preferences.readerSelection) saveReaderPreference(preferences.readerSelection);
	else if (typeof window !== 'undefined') {
		try {
			window.localStorage.removeItem(READER_SELECTION_STORAGE_KEY);
		} catch {
			// Private browsing may deny localStorage.
		}
	}
}

export async function loadWorkspacePreferences(
	storage: WorkspaceStorage
): Promise<WorkspacePreferences> {
	const stored = decodeJson<unknown>(await storage.readFile(PREFERENCES_PATH));
	if (isPreferences(stored)) {
		writeCachedPreferences(stored);
		return stored;
	}

	const cached = readCachedPreferences();
	await saveWorkspacePreferences(storage, cached);
	return cached;
}

export async function saveWorkspacePreferences(
	storage: WorkspaceStorage,
	preferences: WorkspacePreferences
): Promise<void> {
	const next: WorkspacePreferences = {
		version: 1,
		theme: preferences.theme,
		initialRoute: preferences.initialRoute,
		readerSelection: preferences.readerSelection
	};
	await storage.writeFile(PREFERENCES_PATH, `${JSON.stringify(next, null, 2)}\n`);
	writeCachedPreferences(next);
}

export async function patchWorkspacePreferences(
	storage: WorkspaceStorage,
	patch: Partial<Omit<WorkspacePreferences, 'version'>>
): Promise<WorkspacePreferences> {
	const current = await loadWorkspacePreferences(storage);
	const next: WorkspacePreferences = { ...current, ...patch, version: 1 };
	await saveWorkspacePreferences(storage, next);
	return next;
}
