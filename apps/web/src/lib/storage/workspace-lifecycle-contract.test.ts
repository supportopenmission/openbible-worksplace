import { describe, expect, it } from 'vitest';
import { WorkspaceLifecycle } from './workspace-lifecycle';

// SPECSFY: US-002 FR-002 NFR-001 AC-016
describe('workspace lifecycle contract', () => {
	it('reports a committed transaction after the flush barrier', async () => {
		const lifecycle = new WorkspaceLifecycle();
		const result = await lifecycle.flushAndSwitch('workspace-b');

		expect(result).toMatchObject({ workspaceId: 'workspace-b', committed: true });
	});
});
