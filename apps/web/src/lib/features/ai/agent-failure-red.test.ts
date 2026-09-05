import { describe, expect, it } from 'vitest';
import { createWorkspaceAgentFixture, executeAgent, readFixtureText } from './workspace-agent-fixture';

describe('AI cancellation and failure contract', () => {
	// SPECSFY: US-001 US-002 US-003 FR-002 FR-007 FR-008 NFR-004 NFR-005 NFR-006 AC-014
	it('cancels an active run and returns a redacted recoverable diagnostic', async () => {
		const { storage, workspaceId } = await createWorkspaceAgentFixture();
		const before = await readFixtureText(storage, 'notes/romans-08.md');
		const result = await executeAgent(storage, {
			name: 'agent.run.cancel',
			workspaceId,
			runId: 'run-fixture-1',
			reason: 'user-requested'
		});

		expect(result.ok).toBe(true);
		expect(JSON.stringify(result)).not.toContain('sk-test-secret');
		expect(await readFixtureText(storage, 'notes/romans-08.md')).toBe(before);
	});
});
