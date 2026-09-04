import type { Theme } from '$lib/theme/theme';

export type StorageKind = 'local' | 'opfs' | 'native';
export type FileContent = string | Uint8Array;
export type BibleImportStatus = 'pending' | 'complete' | 'partial';
export type ImportResultStatus = 'imported' | 'rejected';
export type ImportRejectionReason = 'invalid-sqlite' | 'duplicate' | 'copy-failed';
export type WorkspacePermission = PermissionState | 'unsupported';
export type WorkspaceStatus = 'unconfigured' | 'permission-needed' | 'ready' | 'error';
export type HomeRoutePreference = 'bible' | 'sermons';

export interface ReaderSelectionPreference {
	versionId: string;
	bookId: number;
	chapter: number;
}

export interface WorkspaceConfig {
	version: 1;
	storage: StorageKind;
	configuredAt: string;
	bibleImportStatus: BibleImportStatus;
	label?: string;
	migrationState?: 'not_started' | 'completed' | 'error';
}

export interface WorkspacePreferences {
	version: 1;
	theme: Theme;
	initialRoute: HomeRoutePreference | null;
	readerSelection: ReaderSelectionPreference | null;
	defaultBibleVersionId?: string | null;
}

export interface ImportResult {
	name: string;
	status: ImportResultStatus;
	reason?: ImportRejectionReason;
}

export type ProgressCallback = (value: number) => void;

export interface WorkspaceStorage {
	kind: StorageKind;
	label: string;
	ensureDirectory(path: string): Promise<void>;
	writeFile(path: string, content: FileContent): Promise<void>;
	deleteFile?(path: string): Promise<void>;
	readFile(path: string): Promise<Uint8Array | null>;
	fileExists(path: string): Promise<boolean>;
	listFiles(path: string): Promise<string[]>;
	readBibleChapter?(version: string, bookId: number, chapter: number): Promise<{ verse: number; text: string }[]>;
	inspectBible?(version: string): Promise<{ name: string; books: { id: number; name: string; abbreviation: string; chapters: number[] }[] }>;
	queryIndex?(operation: 'list_highlights' | 'upsert_highlight' | 'delete_highlight', record: { versionId: string; bookId: number; chapter: number; verseStart?: number; verseEnd?: number; styleId?: string }): Promise<unknown>;
}

export interface WorkspaceSnapshot {
	status: WorkspaceStatus;
	storage: WorkspaceStorage | null;
	config: WorkspaceConfig | null;
	preferences: WorkspacePreferences;
	persisted: boolean | null;
	permission: WorkspacePermission | null;
	error: string;
}
