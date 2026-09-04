import type { StorageKind } from './types';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const STORAGE_PREFERENCE_KEY = 'openbible:storage-kind';

export function isLocalhost(hostname: string): boolean {
	return LOCAL_HOSTS.has(hostname);
}

export function readStoragePreference(): StorageKind | null {
	try {
		const value = localStorage.getItem(STORAGE_PREFERENCE_KEY);
		return value === 'local' || value === 'opfs' ? value : null;
	} catch {
		return null;
	}
}

export function rememberStoragePreference(kind: StorageKind): void {
	try {
		localStorage.setItem(STORAGE_PREFERENCE_KEY, kind);
	} catch {
		// A private browsing context may deny localStorage; OPFS remains usable for this session.
	}
}

export function clearStoragePreference(): void {
	try {
		localStorage.removeItem(STORAGE_PREFERENCE_KEY);
	} catch {
		// Ignore unavailable localStorage; the active storage still works for this session.
	}
}

export function detectStorageKind(
	location: Pick<Location, 'hostname'> | undefined = typeof window === 'undefined'
		? undefined
		: window.location
): StorageKind {
	if (!location) return 'opfs';
	return isLocalhost(location.hostname) ? 'local' : 'opfs';
}

export function supportsFileSystemAccess(): boolean {
	return (
		typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
	);
}

export function isStandaloneDisplay(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	try {
		if (window.matchMedia('(display-mode: standalone)').matches) return true;
		const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
		return navigatorWithStandalone.standalone === true;
	} catch {
		return false;
	}
}

/**
 * Tipo efetivo: preferência salva vence o padrão por hostname. É o que
 * permite ao PWA no desktop usar pasta do computador após escolha explícita.
 */
export function resolveStorageKind(
	location?: Pick<Location, 'hostname'>
): StorageKind {
	return readStoragePreference() ?? detectStorageKind(location);
}

/**
 * O PWA instalado no desktop oferece escolha explícita entre pasta e OPFS
 * quando o navegador suporta File System Access e nada foi escolhido ainda.
 */
export function shouldOfferStorageChoice(): boolean {
	return (
		isStandaloneDisplay() && supportsFileSystemAccess() && readStoragePreference() === null
	);
}
