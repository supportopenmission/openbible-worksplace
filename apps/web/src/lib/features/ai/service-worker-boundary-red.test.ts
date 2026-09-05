import { describe, expect, it } from 'vitest';
import { createWorkspaceAgentFixture, executeAgent } from './workspace-agent-fixture';

describe('service worker AI boundary contract', () => {
	// SPECSFY: US-004 FR-010 FR-011 NFR-001 NFR-005 NFR-007 NFR-009 AC-013
	it('keeps gateway execution outside the cache/navigation service worker', async () => {
		const { storage, workspaceId } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.service-worker.capability',
			workspaceId,
			capability: 'gateway-session',
			serviceWorker: false
		});

		expect(result.ok).toBe(true);
	});
});
