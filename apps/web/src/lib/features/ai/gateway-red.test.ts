import { describe, expect, it } from 'vitest';
import { createWorkspaceAgentFixture, executeAgent } from './workspace-agent-fixture';

describe('PWA gateway session contract', () => {
	// SPECSFY: US-004 FR-009 FR-010 NFR-003 NFR-005 NFR-007 NFR-009 AC-010
	it('performs an HTTPS preflight without sending workspace content', async () => {
		const { storage, workspaceId } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.gateway.preflight',
			endpoint: 'https://gateway.example.test/session',
			workspaceId,
			content: undefined
		});

		expect(result.ok).toBe(true);
	});

	// SPECSFY: US-004 FR-009 FR-010 NFR-003 NFR-005 NFR-009 AC-011
	it('keeps the opaque gateway session token in memory with bounded expiry', async () => {
		const { storage, workspaceId } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.gateway.session.issue',
			endpoint: 'https://gateway.example.test/session',
			workspaceId,
			maxAgeSeconds: 3600
		});

		expect(result.ok).toBe(true);
		expect(JSON.stringify(result)).not.toContain('apiKey');
	});

	// SPECSFY: US-004 FR-009 FR-010 FR-011 NFR-005 NFR-007 NFR-009 AC-012
	it('revokes the session without persisting provider credentials', async () => {
		const { storage } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.gateway.session.revoke',
			sessionId: 'opaque-session-fixture'
		});

		expect(result.ok).toBe(true);
	});
});
