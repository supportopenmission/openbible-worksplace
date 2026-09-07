import type { WorkspaceStorage } from '$lib/storage/types';
import { prepareAgentContext } from './agent-context';
import { executeGatewayCommand } from './ai-gateway';
import { diagnosticsSnapshot } from './ai-observability';
import { applyAgentProposal } from './ai-proposal';
import { portableProfileFromInput, serializePortableProfile, serializeRevokedProfile } from './agent-profile';
import { cancelAgentRun, startAgentRun } from './agent-run';

export interface AgentCommandResult {
	ok: boolean;
	value?: unknown;
	error?: { code: string; recoverable: true };
}

function errorCode(error: unknown): string {
	return error instanceof Error ? error.message.replace(/[^a-z0-9_-]/gi, '_') : 'agent_command_failed';
}

export async function executeAgent(
	storage: WorkspaceStorage,
	command: Record<string, unknown>
): Promise<AgentCommandResult> {
	try {
		const name = typeof command.name === 'string' ? command.name : '';
		if (name === 'agent.profile.save') {
			const profile = portableProfileFromInput((command.profile as Record<string, unknown> | undefined) ?? {});
			await storage.writeFile('.openbible/agent-profile.json', serializePortableProfile(profile));
			return { ok: true, value: { profile: { id: profile.id, state: 'ready' } } };
		}
		if (name === 'agent.profile.revoke') {
			await storage.writeFile('.openbible/agent-profile.json', serializeRevokedProfile(String(command.profileId ?? 'profile-default')));
			return { ok: true, value: { state: 'revoked' } };
		}
		if (name === 'agent.context.prepare') {
			const value = await prepareAgentContext(storage, {
				workspaceId: String(command.workspaceId ?? ''),
				generation: Number(command.generation),
				selectedPaths: Array.isArray(command.selectedPaths) ? command.selectedPaths.filter((path): path is string => typeof path === 'string') : [],
				contentPolicy: 'selected-files-only'
			});
			return { ok: true, value };
		}
		if (name === 'agent.run.start') return { ok: true, value: await startAgentRun(storage, command) };
		if (name === 'agent.run.cancel') return { ok: true, value: cancelAgentRun(command) };
		if (name === 'agent.proposal.preview') return { ok: true, value: { state: 'review', workspaceId: command.workspaceId, relativePath: command.relativePath } };
		if (name === 'agent.proposal.apply') return { ok: true, value: await applyAgentProposal(storage, command) };
		if (name === 'agent.proposal.reject') return { ok: true, value: { state: 'rejected' } };
		if (name === 'agent.diagnostics.snapshot') return { ok: true, value: diagnosticsSnapshot() };
		if (name.startsWith('agent.gateway.') || name === 'agent.service-worker.capability') {
			return { ok: true, value: await executeGatewayCommand(storage, command) };
		}
		throw new Error('agent_command_not_implemented');
	} catch (error) {
		return { ok: false, error: { code: errorCode(error), recoverable: true } };
	}
}
