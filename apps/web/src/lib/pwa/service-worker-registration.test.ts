import { describe, expect, it, vi } from 'vitest';
import { configureOpenBibleServiceWorker } from './service-worker-registration';

describe('OpenBible service worker registration', () => {
	it('removes the OpenBible worker and caches while Vite is running in development', async () => {
		const unregister = vi.fn().mockResolvedValue(true);
		const serviceWorker = {
			getRegistrations: vi.fn().mockResolvedValue([
				{
					active: { scriptURL: 'http://localhost:5173/service-worker.js' },
					waiting: null,
					installing: null,
					unregister
				}
			]),
			register: vi.fn()
		};
		const cacheStorage = {
			keys: vi.fn().mockResolvedValue(['openbible-stale', 'another-app']),
			delete: vi.fn().mockResolvedValue(true)
		};

		await configureOpenBibleServiceWorker({
			development: true,
			serviceWorker,
			cacheStorage
		});

		expect(unregister).toHaveBeenCalledOnce();
		expect(cacheStorage.delete).toHaveBeenCalledExactlyOnceWith('openbible-stale');
		expect(serviceWorker.register).not.toHaveBeenCalled();
	});

	it('registers the worker only in production', async () => {
		const serviceWorker = {
			getRegistrations: vi.fn(),
			register: vi.fn().mockResolvedValue(undefined)
		};
		const cacheStorage = {
			keys: vi.fn(),
			delete: vi.fn()
		};

		await configureOpenBibleServiceWorker({
			development: false,
			serviceWorker,
			cacheStorage
		});

		expect(serviceWorker.register).toHaveBeenCalledExactlyOnceWith('/service-worker.js');
		expect(serviceWorker.getRegistrations).not.toHaveBeenCalled();
		expect(cacheStorage.keys).not.toHaveBeenCalled();
	});
});
