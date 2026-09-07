export type NativeWorkspaceReason =
	| 'lock'
	| 'permission'
	| 'unavailable'
	| 'invalid'
	| 'schema'
	| 'migration';

export function nativeWorkspaceStates(options: { reducedMotion?: boolean } = {}) {
	const animation = options.reducedMotion ? 'none' : 'fade';
	return {
		lockConflict: { ariaLive: 'assertive', focusTarget: 'retry', animation },
		permissionDenied: { ariaLive: 'assertive', focusTarget: 'choose-folder', animation },
		unavailable: {
			ariaLive: 'assertive',
			focusTarget: 'retry',
			actions: ['retry', 'choose-other'],
			animation
		},
		invalid: {
			ariaLive: 'assertive',
			focusTarget: 'reconnect',
			actions: ['reconnect', 'choose-other'],
			animation
		},
		schema: {
			ariaLive: 'assertive',
			focusTarget: 'retry',
			actions: ['retry', 'choose-other'],
			animation
		},
		migration: {
			ariaLive: 'assertive',
			focusTarget: 'retry',
			actions: ['retry', 'resume-migration', 'restore-legacy', 'choose-other'],
			animation
		}
	} as const;
}
