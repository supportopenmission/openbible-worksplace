export const NATIVE_ROUTES = [
	'/',
	'/bible',
	'/notes',
	'/highlights',
	'/sermons',
	'/study',
	'/config'
] as const;

export function isTauriRuntime(): boolean {
	return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function nativeRouteRegistry(): readonly string[] {
	return [...NATIVE_ROUTES];
}
