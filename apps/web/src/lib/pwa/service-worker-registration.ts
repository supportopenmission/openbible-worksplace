const OPENBIBLE_CACHE_PREFIX = 'openbible-';
const SERVICE_WORKER_PATH = '/service-worker.js';

interface WorkerLike {
	scriptURL: string;
}

interface ServiceWorkerRegistrationLike {
	active?: WorkerLike | null;
	waiting?: WorkerLike | null;
	installing?: WorkerLike | null;
	unregister(): Promise<boolean>;
}

interface ServiceWorkerContainerLike {
	getRegistrations(): Promise<readonly ServiceWorkerRegistrationLike[]>;
	register(scriptURL: string): Promise<unknown>;
}

interface CacheStorageLike {
	keys(): Promise<string[]>;
	delete(cacheName: string): Promise<boolean>;
}

interface ConfigureServiceWorkerOptions {
	development: boolean;
	serviceWorker: ServiceWorkerContainerLike;
	cacheStorage?: CacheStorageLike;
}

function isOpenBibleWorker(registration: ServiceWorkerRegistrationLike): boolean {
	return [registration.active, registration.waiting, registration.installing].some((worker) => {
		if (!worker) return false;
		try {
			return new URL(worker.scriptURL).pathname === SERVICE_WORKER_PATH;
		} catch {
			return worker.scriptURL.endsWith(SERVICE_WORKER_PATH);
		}
	});
}

export async function configureOpenBibleServiceWorker({
	development,
	serviceWorker,
	cacheStorage
}: ConfigureServiceWorkerOptions): Promise<void> {
	if (!development) {
		await serviceWorker.register(SERVICE_WORKER_PATH);
		return;
	}

	const registrations = await serviceWorker.getRegistrations();
	await Promise.all(
		registrations.filter(isOpenBibleWorker).map((registration) => registration.unregister())
	);

	if (!cacheStorage) return;
	const cacheNames = await cacheStorage.keys();
	await Promise.all(
		cacheNames
			.filter((cacheName) => cacheName.startsWith(OPENBIBLE_CACHE_PREFIX))
			.map((cacheName) => cacheStorage.delete(cacheName))
	);
}
