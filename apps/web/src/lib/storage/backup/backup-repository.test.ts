import { describe, expect, it } from 'vitest';
import * as workspaceApi from '../workspace';
import {
	createWorkspaceContentRepository,
	type WorkspaceContentBackend,
	type WorkspaceContentRepository
} from '../workspace-content-repository';

type LogicalBackupSource = {
	repository: WorkspaceContentRepository;
	context: {
		workspaceId: string;
		generation: number;
		backend: WorkspaceContentBackend;
	};
};

function createSource(backend: WorkspaceContentBackend, workspaceId: string): LogicalBackupSource {
	return {
		repository: createWorkspaceContentRepository({ workspaceId, generation: 1, backend }),
		context: { workspaceId, generation: 1, backend }
	};
}

async function seedSource(source: LogicalBackupSource): Promise<void> {
	await source.repository.write({
		kind: 'note',
		id: 'note-1',
		workspaceId: source.context.workspaceId,
		schemaVersion: 1,
		payload: {
			meta: {
				id: 'note-1',
				title: 'Estudo',
				type: 'note',
				schemaVersion: 1,
				createdAt: '2026-09-06T00:00:00.000Z',
				updatedAt: '2026-09-06T00:00:00.000Z',
				path: 'notes/note-1.md',
				unknownFields: {}
			},
			body: '# Estudo\n\nConteúdo'
		}
	});
	await source.repository.write({
		kind: 'highlight',
		id: 'highlight-1',
		workspaceId: source.context.workspaceId,
		schemaVersion: 1,
		payload: { versionId: 'nvi.sqlite', bookId: 43, chapter: 3, verseStart: 16, verseEnd: 16 }
	});
}

async function enumerate(source: LogicalBackupSource): Promise<unknown> {
	const api = workspaceApi as unknown as {
		enumerateWorkspaceContent?: (input: LogicalBackupSource) => Promise<unknown>;
	};
	return api.enumerateWorkspaceContent?.(source);
}

// SPECSFY: US-001 US-003 FR-001 FR-002 FR-004 NFR-002 NFR-003 AC-002 AC-004 AC-005
describe('enumeração lógica do conteúdo do workspace', () => {
	it('expõe notas e destaques do backend IndexedDB como conteúdo portátil', async () => {
		const source = createSource('indexeddb', 'workspace-pwa-backup');
		await seedSource(source);

		const entries = await enumerate(source);

		expect(entries, 'RED: a enumeração lógica ainda não foi exposta').toBeDefined();
		expect(entries).toEqual(expect.arrayContaining([
			expect.objectContaining({ path: 'notes/note-1.md', mediaType: expect.stringContaining('text/markdown') }),
			expect.objectContaining({ path: 'highlights/highlight-1.json', mediaType: 'application/json' })
		]));
	});

	it('mantém o mesmo contrato para o backend SQLite nativo', async () => {
		const source = createSource('sqlite', 'workspace-tauri-backup');
		await seedSource(source);

		const entries = await enumerate(source);

		expect(entries, 'RED: o contrato não é compartilhado com SQLite').toBeDefined();
		expect(entries).toEqual(expect.arrayContaining([
			expect.objectContaining({ path: 'notes/note-1.md' }),
			expect.objectContaining({ path: 'highlights/highlight-1.json' })
		]));
	});

	it('não mistura registros de outro workspace nem projeções operacionais', async () => {
		const source = createSource('indexeddb', 'workspace-scope-backup');
		const other = createSource('indexeddb', 'workspace-other-backup');
		await seedSource(source);
		await seedSource(other);

		const entries = await enumerate(source);

		expect(entries, 'RED: o escopo lógico ainda não foi aplicado').toBeDefined();
		expect(entries).not.toEqual(expect.arrayContaining([
			expect.objectContaining({ path: expect.stringContaining('workspace-other-backup') }),
			expect.objectContaining({ path: expect.stringContaining('index.sqlite') })
		]));
	});
});
