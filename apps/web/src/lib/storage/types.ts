import type { Theme } from '$lib/theme/theme';

export type StorageKind = 'local' | 'opfs' | 'native';
export type FileContent = string | Uint8Array;
export type BibleImportStatus = 'pending' | 'complete' | 'partial';
export type ImportResultStatus = 'imported' | 'rejected';
export type ImportRejectionReason = 'invalid-sqlite' | 'duplicate' | 'copy-failed';
export type WorkspacePermission = PermissionState | 'unsupported';
export type WorkspaceStatus = 'unconfigured' | 'permission-needed' | 'ready' | 'error';
export type HomeRoutePreference = 'bible' | 'sermons';
export type NoteEditorEngine = 'milkdown' | 'edra';

export interface WorkspaceStorageEntry {
	name: string;
	kind: 'file' | 'directory';
}

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
	/** Motor do editor de notas. `milkdown` é o padrão estável; `edra` é o novo motor em migração gradativa. */
	editorEngine: NoteEditorEngine;
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
	/** Identidade do workspace para conteúdo autoral no backend operacional. */
	workspaceId?: string;
	/** Handle da pasta local; a referência fica no IndexedDB local e nunca no catálogo/sync. */
	localHandle?: FileSystemDirectoryHandle;
	ensureDirectory(path: string): Promise<void>;
	writeFile(path: string, content: FileContent): Promise<void>;
	deleteFile?(path: string): Promise<void>;
	readFile(path: string): Promise<Uint8Array | null>;
	fileExists(path: string): Promise<boolean>;
	listFiles(path: string): Promise<string[]>;
	listEntries?(path: string): Promise<WorkspaceStorageEntry[]>;
	readBibleChapter?(
		version: string,
		bookId: number,
		chapter: number
	): Promise<{ verse: number; text: string }[]>;
	inspectBible?(
		version: string
	): Promise<{
		name: string;
		books: { id: number; name: string; abbreviation: string; chapters: number[] }[];
	}>;
	queryIndex?(
		operation: 'list_highlights' | 'upsert_highlight' | 'delete_highlight',
		record: {
			workspaceId?: string;
			versionId: string;
			bookId: number;
			chapter: number;
			verseStart?: number;
			verseEnd?: number;
			styleId?: string;
		}
	): Promise<unknown>;
}

/**
 * Limite explícito para operações de conteúdo pertencentes a um workspace.
 * O storage resolve os arquivos; o ID impede que um consumidor perca a
 * identidade do workspace ao atravessar a fronteira de domínio.
 */
export interface WorkspaceStorageScope {
	workspaceId: string;
	storage: WorkspaceStorage;
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
