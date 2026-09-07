import type { WorkspaceStorage } from '$lib/storage/types';
import { issueGatewaySession, preflightGateway, revokeGatewaySession } from './pwa-gateway-session';

export async function executeGatewayCommand(
	_storage: WorkspaceStorage,
	command: Record<string, unknown>
): Promise<Record<string, unknown>> {
	const name = typeof command.name === 'string' ? command.name : '';
	if (name === 'agent.gateway.preflight') {
		return preflightGateway(String(command.endpoint ?? ''), String(command.workspaceId ?? ''));
	}
	if (name === 'agent.gateway.session.issue') return issueGatewaySession(Number(command.maxAgeSeconds ?? 3600));
	if (name === 'agent.gateway.session.revoke') return revokeGatewaySession(String(command.sessionId ?? ''));
	if (name === 'agent.service-worker.capability') {
		if (command.serviceWorker === true) throw new Error('agent_service_worker_forbidden');
		return { capability: 'gateway-session', serviceWorker: false };
	}
	throw new Error('agent_gateway_command_not_allowed');
}
