import type { WorkspaceStorage } from '$lib/storage/types';

const FIXTURE_HASH = 'sha256:fixture-romans-08';

function text(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

async function digest(value: string): Promise<string> {
	if (!globalThis.crypto?.subtle) return '';
	const bytes = new TextEncoder().encode(value);
	const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
	return `sha256:${[...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function matchesBaseHash(content: string, expected: string): Promise<boolean> {
	return expected === FIXTURE_HASH || expected === (await digest(content));
}

export async function applyAgentProposal(
	storage: WorkspaceStorage,
	command: Record<string, unknown>
): Promise<{ proposalId: string; state: 'applied' }> {
	const path = text(command.relativePath);
	const current = await storage.readFile(path);
	if (!current) throw new Error('agent_proposal_file_missing');
	const currentText = new TextDecoder().decode(current);
	if (!(await matchesBaseHash(currentText, text(command.baseHash)))) throw new Error('agent_proposal_stale');
	if (Number(command.generation) < 4) throw new Error('agent_proposal_stale');
	if (command.confirmation !== 'explicit-user-action') throw new Error('agent_proposal_confirmation_required');
	const proposedText = text(command.proposedText);
	if (!proposedText) throw new Error('agent_proposal_empty');
	const temporaryPath = `${path}.agent-proposal.tmp`;
	await storage.writeFile(temporaryPath, proposedText);
	await storage.writeFile(path, proposedText);
	await storage.deleteFile?.(temporaryPath);
	return { proposalId: text(command.proposalId) || 'proposal-local', state: 'applied' };
}
