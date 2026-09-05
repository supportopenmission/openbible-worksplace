const OPENBIBLE_CACHE_PREFIX = 'openbible-';
const SERVICE_WORKER_PATH = '/service-worker.js';
export const SERVICE_WORKER_UPDATE_EVENT = 'openbible:service-worker-update-available';

interface WorkerLike {
	scriptURL: string;
	state?: string;
	addEventListener?: (type: 'statechange', listener: () => void) => void;
}

interface ServiceWorkerRegistrationLike {
	active?: WorkerLike | null;
	waiting?: WorkerLike | null;
	installing?: WorkerLike | null;
	addEventListener?: (type: 'updatefound', listener: () => void) => void;
	unregister(): Promise<boolean>;
}

interface ServiceWorkerContainerLike {
	controller?: WorkerLike | null;
	getRegistrations(): Promise<readonly ServiceWorkerRegistrationLike[]>;
	register(scriptURL: string): Promise<ServiceWorkerRegistrationLike | undefined>;
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

function announceUpdateAvailable(): void {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent(SERVICE_WORKER_UPDATE_EVENT));
	}
}

function watchServiceWorkerUpdates(
	registration: ServiceWorkerRegistrationLike,
	serviceWorker: ServiceWorkerContainerLike
): void {
	let announced = false;
	const announceIfControlled = () => {
		if (announced || !serviceWorker.controller) return;
		announced = true;
		announceUpdateAvailable();
	};

	if (registration.waiting) announceIfControlled();
	registration.addEventListener?.('updatefound', () => {
		const installing = registration.installing;
		if (!installing) return;

		const handleStateChange = () => {
			if (installing.state === 'installed') announceIfControlled();
		};
		installing.addEventListener?.('statechange', handleStateChange);
		handleStateChange();
	});
}

export async function configureOpenBibleServiceWorker({
	development,
	serviceWorker,
	cacheStorage
}: ConfigureServiceWorkerOptions): Promise<void> {
	if (!development) {
		const registration = await serviceWorker.register(SERVICE_WORKER_PATH);
		if (registration) watchServiceWorkerUpdates(registration, serviceWorker);
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
