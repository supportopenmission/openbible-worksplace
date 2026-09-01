import type { StorageKind } from './types';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isLocalhost(hostname: string): boolean {
	return LOCAL_HOSTS.has(hostname);
}

export function detectStorageKind(
	location: Pick<Location, 'hostname'> | undefined = typeof window === 'undefined'
		? undefined
		: window.location
): StorageKind {
	if (!location) return 'opfs';
	return isLocalhost(location.hostname) ? 'local' : 'opfs';
}
