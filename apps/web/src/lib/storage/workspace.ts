import { emptyIndexSqlite, isSQLite } from './empty-sqlite';
import { loadWorkspacePreferences, PREFERENCES_PATH } from './preferences';
import type { ImportResult, ProgressCallback, WorkspaceConfig, WorkspaceStorage } from './types';

export const WORKSPACE_DIRECTORIES = [
	'.openbible',
	'bibles',
	'notes/theology',
	'notes/studies',
	'sermons/drafts',
	'sermons/preached',
	'sermons/series',
	'studies/characters',
	'studies/themes',
	'studies/books',
	'templates',
	'attachments/images',
	'attachments/audio',
	'attachments/pdf',
	'attachments/files',
	'trash'
] as const;

const template = (type: string, heading: string) =>
	`---\ntitle: ""\ncreatedAt: ""\nupdatedAt: ""\ntype: "${type}"\n---\n\n# ${heading}\n`;

export const WORKSPACE_FILES = [
	{
		path: '.openbible/sync.json',
		content: '{\n  "version": 1,\n  "enabled": false,\n  "lastSyncAt": null\n}\n'
	},
	{ path: 'templates/sermon.md', content: template('sermon', 'Novo sermão') },
	{ path: 'templates/study.md', content: template('study', 'Novo estudo') },
	{ path: 'templates/note.md', content: template('note', 'Nova nota') }
] as const;

function workspaceConfig(storage: WorkspaceStorage): WorkspaceConfig {
	return {
		version: 1,
		storage: storage.kind,
		configuredAt: new Date().toISOString(),
		bibleImportStatus: 'pending',
		label: storage.label
	};
}

function decodeJson<T>(bytes: Uint8Array | null): T | null {
	if (!bytes) return null;
	try {
		return JSON.parse(new TextDecoder().decode(bytes)) as T;
	} catch {
		return null;
	}
}

export async function prepareWorkspace(
	storage: WorkspaceStorage,
	onProgress: ProgressCallback = () => undefined
): Promise<void> {
	const steps = WORKSPACE_DIRECTORIES.length + WORKSPACE_FILES.length + 3;
	let completed = 0;
	const advance = () => {
		completed += 1;
		onProgress(completed / steps);
	};

	for (const directory of WORKSPACE_DIRECTORIES) {
		await storage.ensureDirectory(directory);
		advance();
	}

	const configPath = '.openbible/config.json';
	if (!(await storage.fileExists(configPath))) {
		await storage.writeFile(configPath, `${JSON.stringify(workspaceConfig(storage), null, 2)}\n`);
	}
	advance();

	const indexPath = '.openbible/index.sqlite';
	const indexBytes = await storage.readFile(indexPath);
	if (!indexBytes || !isSQLite(indexBytes)) {
		await storage.writeFile(indexPath, emptyIndexSqlite());
	}
	advance();

	if (!(await storage.fileExists(PREFERENCES_PATH))) {
		await loadWorkspacePreferences(storage);
	}
	advance();

	for (const file of WORKSPACE_FILES) {
		if (!(await storage.fileExists(file.path))) await storage.writeFile(file.path, file.content);
		advance();
	}
}

export async function loadWorkspaceConfig(
	storage: WorkspaceStorage
): Promise<WorkspaceConfig | null> {
	const config = decodeJson<WorkspaceConfig>(await storage.readFile('.openbible/config.json'));
	if (!config || config.version !== 1 || config.storage !== storage.kind) return null;
	if (!['pending', 'complete', 'partial'].includes(config.bibleImportStatus)) return null;
	return config;
}

export async function importBibleFiles(
	storage: WorkspaceStorage,
	files: File[],
	onProgress: ProgressCallback = () => undefined
): Promise<ImportResult[]> {
	const results: ImportResult[] = [];
	if (files.length === 0) return results;

	for (const [index, file] of files.entries()) {
		const name = file.name;
		const destination = `bibles/${name}`;
		let result: ImportResult;

		if (!name.toLowerCase().endsWith('.sqlite')) {
			result = { name, status: 'rejected', reason: 'invalid-sqlite' };
		} else if (await storage.fileExists(destination)) {
			result = { name, status: 'rejected', reason: 'duplicate' };
		} else {
			const bytes = new Uint8Array(await file.arrayBuffer());
			if (!isSQLite(bytes)) {
				result = { name, status: 'rejected', reason: 'invalid-sqlite' };
			} else {
				try {
					await storage.writeFile(destination, bytes);
					result = { name, status: 'imported' };
				} catch {
					result = { name, status: 'rejected', reason: 'copy-failed' };
				}
			}
		}

		results.push(result);
		onProgress((index + 1) / files.length);
	}

	const config = decodeJson<WorkspaceConfig>(await storage.readFile('.openbible/config.json'));
	if (config) {
		const imported = results.some((result) => result.status === 'imported');
		const status = imported
			? results.every((result) => result.status === 'imported')
				? 'complete'
				: 'partial'
			: config.bibleImportStatus;
		await storage.writeFile(
			'.openbible/config.json',
			`${JSON.stringify({ ...config, bibleImportStatus: status }, null, 2)}\n`
		);
	}

	if (results.some((result) => result.status === 'imported')) {
		try {
			const { populateTranslationsFromStorage } = await import('$lib/bible/parser/translations');
			await populateTranslationsFromStorage(storage);
		} catch {
			// Não bloqueia o resultado da importação se a leitura do catálogo falhar
		}
	}

	return results;
}
