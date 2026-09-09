import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNote } from '$lib/features/notes/notes-repository';
import type { WorkspaceStorage } from '$lib/storage/types';
import { syncWorkspaceHttp } from './sync-http-client';

function createStorage(workspaceId: string): WorkspaceStorage {
	return {
		kind: 'opfs',
		label: 'Teste HTTP',
		workspaceId,
		ensureDirectory: async () => undefined,
		writeFile: async () => undefined,
		readFile: async () => null,
		fileExists: async () => false,
		listFiles: async () => []
	};
}

describe('HTTP sync integration', () => {
	afterEach(() => vi.unstubAllGlobals());

	// SPECSFY: US-001 US-002 FR-007 NFR-001 NFR-004 AC-031
	it('envia uma réplica local e retoma o pull pelo cursor persistido', async () => {
		const workspaceId = `workspace-http-${Date.now()}`;
		const storage = createStorage(workspaceId);
		const note = await createNote(storage);
		const localStorageValues = new Map<string, string>();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => localStorageValues.get(key) ?? null,
			setItem: (key: string, value: string) => localStorageValues.set(key, value),
			removeItem: (key: string) => localStorageValues.delete(key)
		});

		const requests: Array<{ url: string; method: string; body?: string }> = [];
		const fetcher: typeof fetch = async (input, init) => {
			const url = String(input);
			requests.push({ url, method: init?.method ?? 'GET', body: init?.body?.toString() });
			if (url.endsWith('/sync/push')) {
				const body = JSON.parse(init?.body?.toString() ?? '{}') as {
					operations: Array<{ operationId: string; documentId: string }>;
				};
				return new Response(
					JSON.stringify({
						accepted: [
							{
								operationId: body.operations[0].operationId,
								documentId: body.operations[0].documentId,
								revision: 1
							}
						],
						conflicts: []
					}),
					{ status: 200, headers: { 'content-type': 'application/json' } }
				);
			}
			return new Response(JSON.stringify({ changes: [], nextCursor: 7, hasMore: false }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		};
		const settings = {
			endpoint: 'https://sync.example.test',
			token: 'session-token',
			deviceId: 'device-test',
			fetcher
		};

		const first = await syncWorkspaceHttp(storage, settings);
		expect(first).toMatchObject({ accepted: 1, conflicts: 0, cursor: 7 });
		expect(requests[0].url).toContain('/sync/push');
		expect(JSON.parse(requests[0].body ?? '{}').operations[0].payload.meta.path).toBeUndefined();

		requests.length = 0;
		const second = await syncWorkspaceHttp(storage, settings);
		expect(second).toMatchObject({ accepted: 0, conflicts: 0, cursor: 7 });
		expect(requests).toHaveLength(1);
		expect(requests[0].url).toContain('/sync/pull?after=7');
		expect(note.id).toBeTruthy();
	});

	it('puxa alterações remotas com metadados parciais e disponibiliza nas notas', async () => {
		const workspaceId = `workspace-pull-${Date.now()}`;
		const storage = createStorage(workspaceId);
		const localStorageValues = new Map<string, string>();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => localStorageValues.get(key) ?? null,
			setItem: (key: string, value: string) => localStorageValues.set(key, value),
			removeItem: (key: string) => localStorageValues.delete(key)
		});

		const fetcher: typeof fetch = async () => {
			return new Response(
				JSON.stringify({
					changes: [
						{
							workspaceId,
							documentId: 'remote-note-abc',
							kind: 'note',
							revision: 2,
							payload: {
								body: '# Nota Remota da Nuvem\n\nConteúdo sincronizado com sucesso.',
								meta: {
									createdAt: '2026-09-08T03:05:13.402Z'
								}
							},
							deletedAt: null,
							updatedAt: '2026-09-08T21:53:06.738Z',
							cursor: 2
						}
					],
					nextCursor: 2,
					hasMore: false
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			);
		};

		const settings = {
			endpoint: 'https://sync.example.test',
			token: 'session-token',
			deviceId: 'device-test',
			fetcher
		};

		let eventFired = false;
		const target = new EventTarget();
		vi.stubGlobal('window', target);
		target.addEventListener('openbible:workspace-content-changed', () => {
			eventFired = true;
		});

		const result = await syncWorkspaceHttp(storage, settings);
		expect(result.pulled).toBe(1);
		expect(eventFired).toBe(true);

		const { listNotes } = await import('$lib/features/notes/notes-repository');
		const notes = await listNotes(storage);
		expect(notes.map((n) => n.id)).toContain('remote-note-abc');
		const remoteNote = notes.find((n) => n.id === 'remote-note-abc');
		expect(remoteNote?.title).toBe('Nota Remota da Nuvem');
		expect(remoteNote?.body).toContain('Conteúdo sincronizado');
	});
});
