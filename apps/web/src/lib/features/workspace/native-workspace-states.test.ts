import { describe, expect, it } from 'vitest';
import { nativeWorkspaceStates } from './native-workspace-states';

describe('native workspace interaction states', () => {
	// SPECSFY: US-001 US-003 FR-004 FR-005 NFR-001 NFR-002 AC-012
	it('announces lock and permission states without mandatory motion', () => {
		const states = nativeWorkspaceStates({ reducedMotion: true });

		expect(states.lockConflict).toMatchObject({ ariaLive: 'assertive', focusTarget: 'retry' });
		expect(states.permissionDenied.animation).toBe('none');
	});
});
