type GatewaySession = { sessionId: string; expiresAt: number };

const sessions = new Map<string, GatewaySession>();

function requireHttps(endpoint: string): void {
	if (!endpoint.startsWith('https://')) throw new Error('ai_gateway_https_required');
}

export function preflightGateway(endpoint: string, workspaceId: string): { ok: true; endpoint: string; workspaceId: string } {
	requireHttps(endpoint);
	if (!workspaceId.trim()) throw new Error('agent_workspace_required');
	return { ok: true, endpoint, workspaceId };
}

export function issueGatewaySession(maxAgeSeconds = 3600): { sessionId: string; expiresAt: number } {
	const boundedAge = Math.min(Math.max(Math.floor(maxAgeSeconds), 1), 3600);
	const sessionId = `session-${crypto.randomUUID()}`;
	const expiresAt = Date.now() + boundedAge * 1000;
	sessions.set(sessionId, { sessionId, expiresAt });
	return { sessionId, expiresAt };
}

export function revokeGatewaySession(sessionId: string): { revoked: true } {
	sessions.delete(sessionId);
	return { revoked: true };
}

export function hasValidGatewaySession(sessionId: string): boolean {
	const session = sessions.get(sessionId);
	if (!session || session.expiresAt <= Date.now()) {
		sessions.delete(sessionId);
		return false;
	}
	return true;
}
