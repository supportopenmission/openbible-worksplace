import { describe, expect, it } from 'vitest';
import { createWorkspaceAgentFixture, executeAgent, readFixtureText } from './workspace-agent-fixture';

describe('AI portable profile and local binding contract', () => {
	// SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 AC-001
	it('stores a portable profile through the native boundary without returning a secret', async () => {
		const { storage } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.profile.save',
			profile: {
				id: 'profile-study',
				name: 'Estudo bíblico',
				instruction: 'Responda com contexto e referências.'
			},
			binding: { provider: 'openai', model: 'gpt-5', secretRef: 'os:openai:study' }
		});

		expect(result.ok).toBe(true);
		expect(JSON.stringify(result)).not.toContain('sk-test-secret');
		expect(await readFixtureText(storage, '.openbible/agent-profile.json')).not.toContain('secretRef');
	});

	// SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 NFR-007 AC-003
	it('revokes a local binding without placing credentials in workspace data', async () => {
		const { storage } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.profile.revoke',
			profileId: 'profile-study',
			secretRef: 'os:openai:study'
		});

		expect(result.ok).toBe(true);
		expect(JSON.stringify(result)).not.toContain('secretRef');
	});
});
