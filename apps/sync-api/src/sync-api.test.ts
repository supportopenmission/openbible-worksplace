import { describe, expect, it } from 'vitest';
import { createSyncApi } from './index';
import { createMemorySyncStore } from './sync-core';

const workspaceId = 'workspace-demo';

function operation(overrides: Record<string, unknown> = {}) {
	return {
		deviceId: 'desktop-a',
		operationId: 'operation-1',
		documentId: 'note-1',
		kind: 'note',
		baseRevision: 0,
		payload: { title: 'Estudo', body: 'No princípio' },
		...overrides
	};
}

async function push(
	api: ReturnType<typeof createSyncApi>,
	payload: Record<string, unknown>,
	token = 'test-token'
) {
	return api.fetch(
		new Request(`https://sync.example/v1/workspaces/${workspaceId}/sync/push`, {
			method: 'POST',
			headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		})
	);
}

describe('sync API HTTP contract', () => {
	// SPECSFY: US-002 FR-007 NFR-005 AC-031
	it('faz push, pull incremental, tombstone e trata retry como idempotente', async () => {
		const api = createSyncApi({ store: createMemorySyncStore(), token: 'test-token' });

		const first = await push(api, { operations: [operation()] });
		expect(first.status).toBe(200);
		expect(await first.json()).toMatchObject({
			accepted: [{ operationId: 'operation-1', documentId: 'note-1', revision: 1 }],
			conflicts: []
		});

		const retry = await push(api, { operations: [operation()] });
		expect(retry.status).toBe(200);
		expect(await retry.json()).toMatchObject({
			accepted: [{ operationId: 'operation-1', documentId: 'note-1', revision: 1 }],
			conflicts: []
		});

		const tombstone = await push(api, {
			operations: [
				operation({
					operationId: 'operation-2',
					baseRevision: 1,
					payload: null,
					deletedAt: '2026-09-07T12:00:00.000Z'
				})
			]
		});
		expect(tombstone.status).toBe(200);

		const pull = await api.fetch(
			new Request(`https://sync.example/v1/workspaces/${workspaceId}/sync/pull?after=0&limit=10`, {
				headers: { authorization: 'Bearer test-token' }
			})
		);
		expect(pull.status).toBe(200);
		expect(await pull.json()).toMatchObject({
			changes: [
				{ operationId: 'operation-1', revision: 1, payload: { title: 'Estudo' } },
				{
					operationId: 'operation-2',
					revision: 2,
					payload: null,
					deletedAt: '2026-09-07T12:00:00.000Z'
				}
			],
			nextCursor: 2,
			hasMore: false
		});
	});

	// SPECSFY: US-003 FR-007 NFR-002 NFR-005 AC-032
	it('preserva conflito de revisão sem sobrescrever a alteração aceita', async () => {
		const api = createSyncApi({ store: createMemorySyncStore(), token: 'test-token' });
		await push(api, { operations: [operation()] });

		const conflict = await push(api, {
			operations: [
				operation({
					deviceId: 'mobile-b',
					operationId: 'operation-mobile-1',
					payload: { title: 'Outra edição', body: 'Conteúdo concorrente' }
				})
			]
		});
		expect(conflict.status).toBe(200);
		expect(await conflict.json()).toMatchObject({
			accepted: [],
			conflicts: [
				{
					operationId: 'operation-mobile-1',
					documentId: 'note-1',
					baseRevision: 0,
					currentRevision: 1
				}
			]
		});

		const pull = await api.fetch(
			new Request(`https://sync.example/v1/workspaces/${workspaceId}/sync/pull?after=0`, {
				headers: { authorization: 'Bearer test-token' }
			})
		);
		expect(((await pull.json()) as { changes: unknown[] }).changes).toHaveLength(1);
	});

	// SPECSFY: US-002 FR-007 NFR-005 AC-033
	it('expõe health, exige token e rejeita lote acima do limite', async () => {
		const api = createSyncApi({
			store: createMemorySyncStore(),
			token: 'test-token',
			maxBatchSize: 1
		});

		const health = await api.fetch(new Request('https://sync.example/health'));
		expect(health.status).toBe(200);
		expect(await health.json()).toMatchObject({ ok: true, service: 'openbible-sync-api' });

		const unauthorized = await push(api, { operations: [operation()] }, 'wrong-token');
		expect(unauthorized.status).toBe(401);

		const tooLarge = await push(api, {
			operations: [operation(), operation({ operationId: 'operation-2', documentId: 'note-2' })]
		});
		expect(tooLarge.status).toBe(413);
	});
});
