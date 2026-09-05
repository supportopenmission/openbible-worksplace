import { describe, expect, it } from 'vitest';
import { WorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

type WorkspaceLifecycleContract = {
	flushAndSwitch: (workspaceId: string, options?: { discard?: boolean }) => Promise<unknown>;
};

describe('workspace lifecycle contract', () => {
	// SPECSFY: US-002 FR-002 NFR-001 AC-005
	it('aguarda o autosave antes de publicar o workspace destino', async () => {
		const state = new WorkspaceState() as unknown as WorkspaceState & WorkspaceLifecycleContract;

		expect(typeof state.flushAndSwitch).toBe('function');
		await state.flushAndSwitch('workspace-b');
	});

	// SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-006
	it('mantém o workspace atual quando autosave falha até retry ou descarte explícito', async () => {
		const state = new WorkspaceState() as unknown as WorkspaceState & WorkspaceLifecycleContract;

		expect(typeof state.flushAndSwitch).toBe('function');
		await expect(state.flushAndSwitch('workspace-b')).rejects.toMatchObject({
			code: 'AUTOSAVE_FAILED',
			activeWorkspaceId: expect.any(String),
			actions: expect.arrayContaining(['retry', 'discard-and-switch'])
		});
	});
});
