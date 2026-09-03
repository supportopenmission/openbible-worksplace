import type { WorkspaceStorage } from '$lib/storage/types';

export interface WorkspaceStats {
	bibles: { count: number; bytes: number };
	notes: { active: number; trash: number };
	sermons: { count: number };
	bytesTotal: number;
}

const SERMON_DIRECTORIES = ['sermons/drafts', 'sermons/preached', 'sermons/series'] as const;

async function safeListFiles(storage: WorkspaceStorage, path: string): Promise<string[]> {
	try {
		return await storage.listFiles(path);
	} catch {
		return [];
	}
}

export async function collectWorkspaceStats(storage: WorkspaceStorage): Promise<WorkspaceStats> {
	const bibleFiles = (await safeListFiles(storage, 'bibles')).filter((fileName) =>
		fileName.toLowerCase().endsWith('.sqlite')
	);
	let bibleBytes = 0;
	for (const fileName of bibleFiles) {
		const bytes = await storage.readFile(`bibles/${fileName}`);
		if (bytes) bibleBytes += bytes.length;
	}

	const noteFiles = (await safeListFiles(storage, 'notes')).filter((fileName) =>
		fileName.endsWith('.md')
	);
	let noteBytes = 0;
	for (const fileName of noteFiles) {
		const bytes = await storage.readFile(`notes/${fileName}`);
		if (bytes) noteBytes += bytes.length;
	}

	const trashFiles = (await safeListFiles(storage, 'trash')).filter((fileName) =>
		fileName.endsWith('.md')
	);

	let sermons = 0;
	for (const directory of SERMON_DIRECTORIES) {
		const files = await safeListFiles(storage, directory);
		sermons += files.filter((fileName) => fileName.endsWith('.md')).length;
	}

	return {
		bibles: { count: bibleFiles.length, bytes: bibleBytes },
		notes: { active: noteFiles.length, trash: trashFiles.length },
		sermons: { count: sermons },
		bytesTotal: bibleBytes + noteBytes
	};
}
