export function nativeWorkspaceStates(options: { reducedMotion?: boolean } = {}) {
	const animation = options.reducedMotion ? 'none' : 'fade';
	return {
		lockConflict: { ariaLive: 'assertive', focusTarget: 'retry', animation },
		permissionDenied: { ariaLive: 'assertive', focusTarget: 'choose-folder', animation }
	} as const;
}
