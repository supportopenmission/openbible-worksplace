import type { WorkspaceStorage } from '$lib/storage/types';
import { prepareAgentContext } from './agent-context';

export interface AgentRunResult {
	runId: string;
	state: 'succeeded' | 'cancelled' | 'failed';
	workspaceId: string;
	generation?: number;
	error?: { code: string; recoverable: true };
}

function text(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

export async function startAgentRun(
	storage: WorkspaceStorage,
	command: Record<string, unknown>
): Promise<AgentRunResult> {
	const workspaceId = text(command.workspaceId).trim();
	const generation = Number(command.generation);
	if (!workspaceId || !Number.isInteger(generation)) throw new Error('agent_run_scope_required');
	if (Array.isArray(command.tools) && command.tools.length > 0) throw new Error('agent_tools_not_allowed');
	if (typeof command.request !== 'string' || !command.request.trim()) throw new Error('agent_request_required');
	await prepareAgentContext(storage, {
		workspaceId,
		generation,
		selectedPaths: [],
		contentPolicy: 'selected-files-only'
	}).catch((error: unknown) => {
		if (error instanceof Error && error.message === 'agent_stale_generation') throw error;
	});
	return { runId: text(command.runId) || 'run-local', state: 'succeeded', workspaceId, generation };
}

export function cancelAgentRun(command: Record<string, unknown>): AgentRunResult {
	return {
		runId: text(command.runId) || 'run-local',
		state: 'cancelled',
		workspaceId: text(command.workspaceId) || 'workspace-unknown',
		error: { code: 'agent_cancelled', recoverable: true }
	};
}
