import { clearHomeRoute, readHomeRoute } from '$lib/navigation/home-preference';
import {
	readReaderPreference,
	READER_SELECTION_STORAGE_KEY,
	saveReaderPreference
} from '$lib/features/bible/reader-preference';
import { readTheme, saveTheme } from '$lib/theme/theme';
import type { NoteEditorEngine, WorkspacePreferences, WorkspaceStorage } from './types';

export const PREFERENCES_PATH = '.openbible/preferences.json';
export const DEFAULT_BIBLE_VERSION_STORAGE_KEY = 'openbible.default-bible-version';
export const EDITOR_ENGINE_STORAGE_KEY = 'openbible.editor-engine';

export const DEFAULT_PREFERENCES: WorkspacePreferences = {
	version: 1,
	theme: 'light',
	initialRoute: null,
	readerSelection: null,
	defaultBibleVersionId: null,
	editorEngine: 'edra'
};

/** Resolve o motor do editor; o Edra é o padrão, o Milkdown é opt-in legado. */
export function resolveEditorEngine(
	preferences: { editorEngine?: unknown } | null | undefined
): NoteEditorEngine {
	return preferences?.editorEngine === 'milkdown' ? 'milkdown' : 'edra';
}

export function readEditorEngine(): NoteEditorEngine {
	if (typeof window === 'undefined') return 'edra';
	try {
		return window.localStorage.getItem(EDITOR_ENGINE_STORAGE_KEY) === 'milkdown'
			? 'milkdown'
			: 'edra';
	} catch {
		return 'edra';
	}
}

export function saveEditorEngine(engine: NoteEditorEngine): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(EDITOR_ENGINE_STORAGE_KEY, engine);
	} catch {
		// Private browsing may deny localStorage.
	}
}

export function readDefaultBibleVersion(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage.getItem(DEFAULT_BIBLE_VERSION_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function saveDefaultBibleVersion(versionId: string | null): void {
	if (typeof window === 'undefined') return;
	try {
		if (versionId) {
			window.localStorage.setItem(DEFAULT_BIBLE_VERSION_STORAGE_KEY, versionId);
		} else {
			window.localStorage.removeItem(DEFAULT_BIBLE_VERSION_STORAGE_KEY);
		}
	} catch {
		// Private browsing may deny localStorage.
	}
}

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
	const defaultVersionValid =
		preferences.defaultBibleVersionId === undefined ||
		preferences.defaultBibleVersionId === null ||
		typeof preferences.defaultBibleVersionId === 'string';
	const editorEngineValid =
		preferences.editorEngine === undefined ||
		preferences.editorEngine === 'milkdown' ||
		preferences.editorEngine === 'edra';
	return (
		preferences.version === 1 &&
		themeValid &&
		routeValid &&
		selectionValid &&
		defaultVersionValid &&
		editorEngineValid
	);
}

export function readCachedPreferences(): WorkspacePreferences {
	return {
		version: 1,
		theme: readTheme(),
		initialRoute: readHomeRoute(),
		readerSelection: readReaderPreference(),
		defaultBibleVersionId: readDefaultBibleVersion(),
		editorEngine: readEditorEngine()
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
	saveDefaultBibleVersion(preferences.defaultBibleVersionId ?? null);
	saveEditorEngine(resolveEditorEngine(preferences));
}

export async function loadWorkspacePreferences(
	storage: WorkspaceStorage
): Promise<WorkspacePreferences> {
	const stored = decodeJson<unknown>(await storage.readFile(PREFERENCES_PATH));
	if (isPreferences(stored)) {
		// Arquivos legados podem não ter o campo; normaliza para o motor padrão.
		const normalized: WorkspacePreferences = {
			version: 1,
			theme: stored.theme,
			initialRoute: stored.initialRoute,
			readerSelection: stored.readerSelection,
			defaultBibleVersionId: stored.defaultBibleVersionId ?? null,
			editorEngine: resolveEditorEngine(stored)
		};
		writeCachedPreferences(normalized);
		return normalized;
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
		readerSelection: preferences.readerSelection,
		defaultBibleVersionId: preferences.defaultBibleVersionId ?? null,
		editorEngine: resolveEditorEngine(preferences)
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
