import { describe, expect, it } from 'vitest';
import { createWorkspaceAgentFixture, executeAgent, readFixtureText } from './workspace-agent-fixture';

describe('AI workspace context contract', () => {
	// SPECSFY: US-002 FR-004 FR-005 FR-006 FR-012 NFR-002 NFR-003 NFR-006 AC-004
	it('prepares context only from the active workspace generation', async () => {
		const { storage, workspaceId, generation } = await createWorkspaceAgentFixture();
		const before = await readFixtureText(storage, 'notes/romans-08.md');
		const result = await executeAgent(storage, {
			name: 'agent.context.prepare',
			workspaceId,
			generation,
			selectedPaths: ['notes/romans-08.md']
		});

		expect(result.ok).toBe(true);
		expect(await readFixtureText(storage, 'notes/romans-08.md')).toBe(before);
	});

	// SPECSFY: US-002 FR-004 FR-005 FR-006 FR-011 NFR-002 NFR-003 AC-005
	it('keeps selected context workspace-relative and excludes handles', async () => {
		const { storage, workspaceId, generation } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.context.prepare',
			workspaceId,
			generation,
			selectedPaths: ['notes/romans-08.md'],
			contentPolicy: 'selected-files-only',
			absolutePath: '/home/claudio/private.md'
		});

		expect(result.ok).toBe(true);
		expect(JSON.stringify(result)).not.toContain('/home/');
	});

	// SPECSFY: US-002 FR-004 FR-005 FR-006 FR-012 NFR-001 NFR-002 NFR-006 AC-006
	it('rejects stale generation before context leaves the workspace boundary', async () => {
		const { storage, workspaceId } = await createWorkspaceAgentFixture();
		const before = await readFixtureText(storage, 'notes/romans-08.md');
		const result = await executeAgent(storage, {
			name: 'agent.context.prepare',
			workspaceId,
			generation: 3,
			selectedPaths: ['notes/romans-08.md']
		});

		expect(result.ok).toBe(false);
		expect(await readFixtureText(storage, 'notes/romans-08.md')).toBe(before);
	});
});
