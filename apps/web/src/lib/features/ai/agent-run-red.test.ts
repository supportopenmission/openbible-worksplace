import { describe, expect, it } from 'vitest';
import { createWorkspaceAgentFixture, executeAgent } from './workspace-agent-fixture';

describe('AI textual run contract', () => {
	// SPECSFY: US-001 US-002 FR-002 FR-004 FR-006 NFR-001 NFR-005 AC-002
	it('starts a bounded textual run for one workspace generation', async () => {
		const { storage, workspaceId, generation } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.run.start',
			workspaceId,
			generation,
			profileId: 'profile-study',
			request: 'Resuma a ideia central do documento selecionado.',
			budget: { maxTokens: 800, timeoutMs: 30_000 },
			tools: []
		});

		expect(result.ok).toBe(true);
	});
});
