import { describe, expect, it } from 'vitest';
import {
	createWorkspaceContentRepository,
	type WorkspaceContentRepository,
	type WorkspaceContentRecord
} from './workspace-content-repository';

type Backend = 'sqlite' | 'indexeddb';

const contexts = [
	{ workspaceId: 'workspace-sqlite', generation: 1, backend: 'sqlite' as const },
	{ workspaceId: 'workspace-indexeddb', generation: 1, backend: 'indexeddb' as const }
];

function note(id: string, workspaceId: string): WorkspaceContentRecord {
	return {
		kind: 'note',
		id,
		workspaceId,
		schemaVersion: 1,
		payload: { title: `${workspaceId} note`, blocks: [] }
	};
}

function highlight(id: string, workspaceId: string): WorkspaceContentRecord {
	return {
		kind: 'highlight',
		id,
		workspaceId,
		schemaVersion: 1,
		payload: {
			versionId: 'nvi.sqlite',
			bookId: 43,
			chapter: 3,
			verseStart: 16,
			verseEnd: 16,
			styleId: 'yellow'
		}
	};
}

async function assertWorkspaceIsolation(
	backend: Backend,
	context: (typeof contexts)[number]
): Promise<void> {
	const repository: WorkspaceContentRepository = createWorkspaceContentRepository({
		...context,
		backend
	});
	const otherContext = {
		...context,
		workspaceId: `${context.workspaceId}-other`,
		generation: context.generation + 1
	};

	await repository.write(note('note-a', context.workspaceId));
	await repository.write(highlight('highlight-a', context.workspaceId));
	await repository.write(note('note-b', otherContext.workspaceId));

	expect(await repository.list(context)).toEqual([
		note('note-a', context.workspaceId),
		highlight('highlight-a', context.workspaceId)
	]);
	expect(await repository.list(otherContext)).toEqual([note('note-b', otherContext.workspaceId)]);

	const projection = await repository.rebuild(otherContext);
	expect(projection.workspaceId).toBe(otherContext.workspaceId);
	expect(projection.records).toEqual([note('note-b', otherContext.workspaceId)]);
}

// SPECSFY: US-003 FR-004 FR-005 NFR-001 NFR-003 AC-009 AC-010 AC-011 AC-014
describe('workspace content repository contract', () => {
	it('keeps native SQLite content isolated by workspaceId', async () => {
		await assertWorkspaceIsolation('sqlite', contexts[0]);
	});

	it('keeps PWA IndexedDB content isolated by workspaceId', async () => {
		await assertWorkspaceIsolation('indexeddb', contexts[1]);
	});
});
