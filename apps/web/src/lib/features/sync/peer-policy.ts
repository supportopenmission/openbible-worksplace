export type SyncPeerStatus = 'active' | 'revoked';

export interface SyncPeerRecord {
	peerId: string;
	workspaceId: string;
	scope: string[];
	status: SyncPeerStatus;
	createdAt: string;
	revokedAt?: string;
}

export interface SyncCredentialPolicy {
	storage: 'secure-device-only';
	exported: false;
}

function requireWorkspaceId(workspaceId: string): string {
	const normalized = workspaceId.trim();
	if (!normalized) throw new Error('workspace_id_required');
	return normalized;
}

function requirePeerId(peerId: string): string {
	const normalized = peerId.trim();
	if (!normalized) throw new Error('peer_id_required');
	return normalized;
}

function normalizeScope(scope: readonly string[]): string[] {
	const normalized = [...new Set(scope.map((documentId) => documentId.trim()).filter(Boolean))];
	if (!normalized.length) throw new Error('peer_scope_required');
	return normalized;
}

export class SyncPeerPolicy {
	readonly workspaceId: string;
	private readonly peers = new Map<string, SyncPeerRecord>();

	constructor(workspaceId: string) {
		this.workspaceId = requireWorkspaceId(workspaceId);
	}

	pair(peerId: string, scope: readonly string[]): SyncPeerRecord {
		const normalizedPeerId = requirePeerId(peerId);
		const existing = this.peers.get(normalizedPeerId);
		if (existing?.status === 'revoked') throw new Error('peer_revoked');
		const record: SyncPeerRecord = {
			peerId: normalizedPeerId,
			workspaceId: this.workspaceId,
			scope: normalizeScope(scope),
			status: 'active',
			createdAt: existing?.createdAt ?? new Date().toISOString()
		};
		this.peers.set(normalizedPeerId, record);
		return { ...record, scope: [...record.scope] };
	}

	revoke(peerId: string): SyncPeerRecord {
		const normalizedPeerId = requirePeerId(peerId);
		const existing = this.peers.get(normalizedPeerId);
		const record: SyncPeerRecord = {
			peerId: normalizedPeerId,
			workspaceId: this.workspaceId,
			scope: existing?.scope ? [...existing.scope] : [],
			status: 'revoked',
			createdAt: existing?.createdAt ?? new Date().toISOString(),
			revokedAt: new Date().toISOString()
		};
		this.peers.set(normalizedPeerId, record);
		return { ...record, scope: [...record.scope] };
	}

	allows(peerId: string, documentId: string): boolean {
		const peer = this.peers.get(peerId);
		return peer?.status === 'active' && peer.scope.includes(documentId);
	}

	assertWorkspace(documentWorkspaceId: string): void {
		if (documentWorkspaceId !== this.workspaceId) throw new Error('sync_workspace_scope_mismatch');
	}

	credentials(): SyncCredentialPolicy {
		return { storage: 'secure-device-only', exported: false };
	}
}

export function createSyncPeerPolicy(workspaceId: string): SyncPeerPolicy {
	return new SyncPeerPolicy(workspaceId);
}
