import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createWorkspaceAgentFixture, executeAgent, readFixtureText } from './workspace-agent-fixture';

// SPECSFY: US-001 US-002 US-003 US-004 FR-001 FR-002 FR-003 FR-004 FR-005 FR-006 FR-007 FR-008 FR-009 FR-010 FR-011 FR-012 NFR-001 NFR-002 NFR-003 NFR-004 NFR-005 NFR-006 NFR-007 NFR-008 NFR-009 AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007 AC-008 AC-009 AC-010 AC-011 AC-012 AC-013 AC-014 AC-015
describe('AI regression and traceability', () => {
	it('keeps the portable profile redacted and the selected context scoped', async () => {
		const { storage, workspaceId, generation } = await createWorkspaceAgentFixture();
		const profileResult = await executeAgent(storage, {
			name: 'agent.profile.save',
			profile: {
				id: 'profile-study',
				name: 'Estudo',
				instruction: 'Responda com referências.'
			},
			secret: 'sk-test-secret',
			endpoint: 'https://provider.invalid'
		});
		const profile = await readFixtureText(storage, '.openbible/agent-profile.json');
		const contextResult = await executeAgent(storage, {
			name: 'agent.context.prepare',
			workspaceId,
			generation,
			selectedPaths: ['notes/romans-08.md']
		});

		expect(profileResult.ok).toBe(true);
		expect(profile).not.toContain('sk-test-secret');
		expect(profile).not.toContain('endpoint');
		expect(contextResult).toMatchObject({ ok: true });
		expect(JSON.stringify(contextResult)).toContain('notes/romans-08.md');
		expect(JSON.stringify(contextResult)).not.toContain('index.sqlite');
	});

	it('preserves canonical content until a proposal is explicitly confirmed', async () => {
		const { storage, workspaceId, generation } = await createWorkspaceAgentFixture();
		const before = await readFixtureText(storage, 'notes/romans-08.md');
		const proposal = await executeAgent(storage, {
			name: 'agent.proposal.preview',
			workspaceId,
			generation,
			relativePath: 'notes/romans-08.md',
			baseHash: 'sha256:fixture-romans-08',
			proposedText: `${before}Nova linha revisável.\n`
		});

		expect(proposal).toMatchObject({ ok: true, value: { state: 'review' } });
		expect(await readFixtureText(storage, 'notes/romans-08.md')).toBe(before);

		const rejected = await executeAgent(storage, {
			name: 'agent.proposal.reject',
			workspaceId,
			generation,
			relativePath: 'notes/romans-08.md',
			baseHash: 'sha256:fixture-romans-08',
			reason: 'author-declined'
		});
		expect(rejected).toMatchObject({ ok: true, value: { state: 'rejected' } });
		expect(await readFixtureText(storage, 'notes/romans-08.md')).toBe(before);
	});

	it('keeps gateway and service-worker boundaries explicit', async () => {
		const { storage, workspaceId } = await createWorkspaceAgentFixture();
		const preflight = await executeAgent(storage, {
			name: 'agent.gateway.preflight',
			endpoint: 'http://insecure.invalid',
			workspaceId
		});
		const serviceWorker = await executeAgent(storage, {
			name: 'agent.service-worker.capability',
			workspaceId,
			serviceWorker: false
		});

		expect(preflight.ok).toBe(false);
		expect(serviceWorker).toMatchObject({ ok: true, value: { serviceWorker: false } });
	});

	it('keeps source contracts and diagnostic redaction wired to the normative boundary', () => {
		const contextSource = readFileSync(new URL('./agent-context.ts', import.meta.url), 'utf8');
		const proposalSource = readFileSync(new URL('./ai-proposal.ts', import.meta.url), 'utf8');
		const observabilitySource = readFileSync(new URL('./ai-observability.ts', import.meta.url), 'utf8');

		expect(contextSource).toContain('selected-files-only');
		expect(contextSource).toContain('agent_relative_path_required');
		expect(proposalSource).toContain('explicit-user-action');
		expect(proposalSource).toContain('agent_proposal_stale');
		expect(observabilitySource).toContain('MAX_EVENTS = 200');
		expect(observabilitySource).not.toContain('prompt');
		expect(observabilitySource).not.toContain('response');
	});
});
