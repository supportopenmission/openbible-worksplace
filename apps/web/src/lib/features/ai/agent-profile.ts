export interface PortableAgentProfile {
	id: string;
	name: string;
	instruction: string;
	capability: 'textual';
}

export interface DeviceAgentBinding {
	profileId: string;
	provider: string;
	model: string;
	endpoint?: string;
	state: 'ready' | 'revoked';
	secretRef?: string;
}

export function portableProfileFromInput(input: Record<string, unknown>): PortableAgentProfile {
	return {
		id: typeof input.id === 'string' ? input.id : 'profile-default',
		name: typeof input.name === 'string' ? input.name : 'Assistência local',
		instruction: typeof input.instruction === 'string' ? input.instruction : '',
		capability: 'textual'
	};
}

export function serializePortableProfile(profile: PortableAgentProfile): string {
	return `${JSON.stringify(profile, null, 2)}\n`;
}

export function serializeRevokedProfile(profileId: string): string {
	return `${JSON.stringify({ profileId, state: 'revoked' })}\n`;
}
