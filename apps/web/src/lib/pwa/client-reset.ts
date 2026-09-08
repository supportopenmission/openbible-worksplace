import { isTauriRuntime } from '$lib/storage/tauri-runtime';

/**
 * Migração pontual para os dispositivos usados durante a troca do modelo de
 * armazenamento. O token não deve ser reutilizado em outra limpeza: depois de
 * aplicada, a instalação segue normalmente sem apagar novos dados.
 */
export const CLIENT_RESET_TOKEN = '0.8.1-storage-reset';
export const CLIENT_RESET_STORAGE_KEY = `openbible:client-reset:${CLIENT_RESET_TOKEN}`;
export const CLIENT_RESET_PENDING_KEY = `${CLIENT_RESET_STORAGE_KEY}:pending`;

const INDEXED_DB_NAME = 'openbible-workspace';
const SERVICE_WORKER_PATH = '/service-worker.js';
const CACHE_PREFIX = 'openbible-';

let resetFlight: Promise<boolean> | null = null;
let reloadRequested = false;

function browserStorage(): Storage | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function hasCompletedReset(): boolean {
	return browserStorage()?.getItem(CLIENT_RESET_STORAGE_KEY) === 'done';
}

function markPending(storage: Storage): void {
	try {
		storage.setItem(CLIENT_RESET_PENDING_KEY, '1');
	} catch {
		// Sem marcador, as demais operações continuam em modo best effort.
	}
}

function clearApplicationLocalStorage(storage: Storage): void {
	const keysToRemove: string[] = [];
	for (let index = 0; index < storage.length; index += 1) {
		const key = storage.key(index);
		if (key?.startsWith('openbible:') || key === 'openbible.theme') {
			keysToRemove.push(key);
		}
	}
	for (const key of keysToRemove) storage.removeItem(key);
	storage.setItem(CLIENT_RESET_STORAGE_KEY, 'done');
}

async function clearServiceWorkers(): Promise<void> {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
	try {
		const registrations = await navigator.serviceWorker.getRegistrations();
		await Promise.all(
			registrations
				.filter((registration) => {
					const workers = [registration.active, registration.waiting, registration.installing];
					return workers.some((worker) => worker?.scriptURL.endsWith(SERVICE_WORKER_PATH));
				})
				.map((registration) => registration.unregister())
		);
	} catch {
		// Safari pode negar a operação durante a troca do worker; o reload ainda é seguro.
	}
}

async function clearCaches(): Promise<void> {
	if (!('caches' in globalThis)) return;
	try {
		const cacheStorage = globalThis.caches;
		const keys = await cacheStorage.keys();
		await Promise.all(
			keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => cacheStorage.delete(key))
		);
	} catch {
		// Cache Storage é opcional e pode estar indisponível no modo privado.
	}
}

async function deleteIndexedDb(): Promise<void> {
	if (typeof indexedDB === 'undefined') return;
	await new Promise<void>((resolve) => {
		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			resolve();
		};
		try {
			const request = indexedDB.deleteDatabase(INDEXED_DB_NAME);
			request.onsuccess = finish;
			request.onerror = finish;
			request.onblocked = finish;
			setTimeout(finish, 3000);
		} catch {
			finish();
		}
	});
}

async function clearOpfs(): Promise<void> {
	if (typeof navigator === 'undefined' || !navigator.storage) return;
	const storage = navigator.storage as StorageManager & {
		getDirectory?: () => Promise<FileSystemDirectoryHandle>;
	};
	if (typeof storage.getDirectory !== 'function') return;

	try {
		const root = await storage.getDirectory();
		if (typeof root.entries === 'function') {
			for await (const [name, handle] of root.entries()) {
				await root.removeEntry(name, { recursive: handle.kind === 'directory' });
			}
			return;
		}
		// Fallback para implementações que expõem getDirectory sem entries().
		for (const name of ['vaults', '.openbible', 'bibles', 'notes', 'highlights']) {
			try {
				await root.removeEntry(name, { recursive: true });
			} catch {
				// Entrada ausente ou OPFS parcialmente implementado.
			}
		}
	} catch {
		// OPFS não suportado/indisponível não bloqueia o primeiro boot limpo.
	}
}

async function clearNativeDatabase(): Promise<void> {
	if (!isTauriRuntime()) return;
	try {
		const { invokeWorkspaceCommand } = await import('$lib/storage/tauri-bridge');
		await invokeWorkspaceCommand({ name: 'database.resetLocalData' });
	} catch (error) {
		console.warn('Não foi possível limpar o app.sqlite durante a migração local.', error);
	}
}

async function performReset(storage: Storage | null): Promise<boolean> {
	if (!storage || hasCompletedReset()) return false;

	markPending(storage);
	await Promise.all([clearServiceWorkers(), clearCaches(), deleteIndexedDb(), clearOpfs(), clearNativeDatabase()]);

	try {
		clearApplicationLocalStorage(storage);
	} catch {
		// Não impede a sessão: os storages principais já foram invalidados.
	}
	return true;
}

/** Executa a limpeza no máximo uma vez por origem/instalação. */
export function ensureClientDataReset(): Promise<boolean> {
	if (resetFlight) return resetFlight;
	resetFlight = performReset(browserStorage()).finally(() => {
		resetFlight = null;
	});
	return resetFlight;
}

/** Recarrega apenas uma vez depois de invalidar o shell antigo. */
export function reloadAfterClientReset(): void {
	if (reloadRequested || typeof window === 'undefined') return;
	reloadRequested = true;
	window.location.reload();
}
