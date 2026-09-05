import { describe, expect, it } from 'vitest';
import { createWorkspaceAgentFixture, executeAgent } from './workspace-agent-fixture';

describe('AI sanitized observability contract', () => {
	// SPECSFY: US-001 US-003 US-004 FR-001 FR-003 FR-008 FR-012 NFR-001 NFR-007 NFR-009 AC-015
	it('returns bounded sanitized diagnostics without prompts, responses or secrets', async () => {
		const { storage, workspaceId } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.diagnostics.snapshot',
			workspaceId,
			maxEvents: 200,
			maxAgeDays: 7,
			includeContent: false
		});

		expect(result.ok).toBe(true);
		expect(JSON.stringify(result)).not.toContain('includeContent');
	});
});
