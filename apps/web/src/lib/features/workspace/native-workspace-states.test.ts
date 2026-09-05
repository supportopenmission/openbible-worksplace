import { describe, expect, it } from 'vitest';
import { nativeWorkspaceStates } from './native-workspace-states';

describe('native workspace interaction states', () => {
	// SPECSFY: US-001 US-003 FR-004 FR-005 NFR-001 NFR-002 AC-012
	it('announces lock and permission states without mandatory motion', () => {
		const states = nativeWorkspaceStates({ reducedMotion: true });

		expect(states.lockConflict).toMatchObject({ ariaLive: 'assertive', focusTarget: 'retry' });
		expect(states.permissionDenied.animation).toBe('none');
	});

	// SPECSFY: US-002 FR-002 FR-004 NFR-001 NFR-003 AC-007
	it('preserva o registro e oferece recuperação para ausência e manifesto inválido', () => {
		const states = nativeWorkspaceStates({ reducedMotion: true }) as ReturnType<typeof nativeWorkspaceStates> & {
			unavailable?: { ariaLive: string; actions: string[] };
			invalid?: { ariaLive: string; actions: string[] };
		};

		expect(states.unavailable).toMatchObject({
			ariaLive: 'assertive',
			actions: expect.arrayContaining(['retry', 'choose-other'])
		});
		expect(states.invalid).toMatchObject({
			ariaLive: 'assertive',
			actions: expect.arrayContaining(['reconnect', 'choose-other'])
		});
	});
});
