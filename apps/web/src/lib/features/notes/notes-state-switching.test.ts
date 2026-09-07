import { afterEach, describe, expect, it } from 'vitest';
import { notesState } from './notes-state.svelte';
import type { WorkspaceStorage } from '$lib/storage/types';

function noteFile(id: string): Uint8Array {
	return new TextEncoder().encode(
		`---\ntitle: "${id}"\ncreatedAt: "2026-09-05T00:00:00.000Z"\nupdatedAt: "2026-09-05T00:00:00.000Z"\ntype: "note"\n---\n\n# ${id}\n`
	);
}

function storageWithNotes(
	names: string[],
	listFilesImpl?: () => Promise<string[]>
): WorkspaceStorage {
	const files = new Map(names.map((name) => [`notes/${name}`, noteFile(name.replace('.md', ''))]));
	return {
		kind: 'opfs',
		label: 'Notas',
		ensureDirectory: async () => undefined,
		writeFile: async (path, content) => {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
		},
		readFile: async (path) => files.get(path) ?? null,
		fileExists: async (path) => files.has(path),
		listFiles: listFilesImpl ?? (async () => names)
	};
}

afterEach(() => {
	notesState.resetForWorkspace();
});

describe('notes projection across workspace switches', () => {
	it('keeps a slower read from the previous workspace out of the active list', async () => {
		let releaseFirst: (() => void) | undefined;
		const firstList = new Promise<string[]>((resolve) => {
			releaseFirst = () => resolve(['nota-a.md']);
		});
		const first = storageWithNotes([], () => firstList);
		const second = storageWithNotes(['nota-b.md']);

		notesState.resetForWorkspace();
		const older = notesState.loadNotes(first, true);
		await notesState.loadNotes(second, true);
		releaseFirst?.();
		await older;

		expect(notesState.notes.map((note) => note.id)).toEqual(['nota-b']);
	});
});
