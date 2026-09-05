import { describe, expect, it } from 'vitest';
import { authorialText, createWorkspaceAgentFixture, executeAgent, readFixtureText } from './workspace-agent-fixture';

describe('AI proposal contract', () => {
	// SPECSFY: US-003 FR-007 FR-012 NFR-004 NFR-008 AC-007
	it('returns one reviewable proposal without mutating the authorial file', async () => {
		const { storage, workspaceId, generation } = await createWorkspaceAgentFixture();
		const before = await readFixtureText(storage, 'notes/romans-08.md');
		const result = await executeAgent(storage, {
			name: 'agent.proposal.preview',
			workspaceId,
			generation,
			relativePath: 'notes/romans-08.md',
			baseHash: 'sha256:fixture-romans-08',
			proposedText: authorialText.replace('permanece', 'permanece em Cristo')
		});

		expect(result.ok).toBe(true);
		expect(await readFixtureText(storage, 'notes/romans-08.md')).toBe(before);
	});

	// SPECSFY: US-003 FR-007 FR-008 FR-012 NFR-002 NFR-004 NFR-008 AC-008
	it('applies a proposal only after explicit hash and generation validation', async () => {
		const { storage, workspaceId, generation } = await createWorkspaceAgentFixture();
		const result = await executeAgent(storage, {
			name: 'agent.proposal.apply',
			workspaceId,
			generation,
			relativePath: 'notes/romans-08.md',
			baseHash: 'sha256:fixture-romans-08',
			proposedText: authorialText.replace('permanece', 'permanece em Cristo'),
			confirmation: 'explicit-user-action'
		});

		expect(result.ok).toBe(true);
		expect(await readFixtureText(storage, 'notes/romans-08.md')).toContain('em Cristo');
	});

	// SPECSFY: US-003 FR-007 FR-008 FR-011 NFR-002 NFR-004 NFR-008 AC-009
	it('rejects a proposal without changing canonical content when the author declines', async () => {
		const { storage, workspaceId, generation } = await createWorkspaceAgentFixture();
		const before = await readFixtureText(storage, 'notes/romans-08.md');
		const result = await executeAgent(storage, {
			name: 'agent.proposal.reject',
			workspaceId,
			generation,
			relativePath: 'notes/romans-08.md',
			baseHash: 'sha256:fixture-romans-08',
			reason: 'author-declined'
		});

		expect(result.ok).toBe(true);
		expect(await readFixtureText(storage, 'notes/romans-08.md')).toBe(before);
	});
});
