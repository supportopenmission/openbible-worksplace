import { describe, expect, it, vi } from 'vitest';
import {
	configureOpenBibleServiceWorker,
	SERVICE_WORKER_UPDATE_EVENT
} from './service-worker-registration';

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

	it('notifies a controlled page when a new worker finishes installing', async () => {
		const updateFoundListeners: Array<() => void> = [];
		const stateChangeListeners: Array<() => void> = [];
		const installing = {
			scriptURL: 'http://localhost:5173/service-worker.js',
			state: 'installing',
			addEventListener: vi.fn((_type: string, listener: () => void) => {
				stateChangeListeners.push(listener);
			})
		};
		const registration = {
			active: { scriptURL: 'http://localhost:5173/service-worker.js' },
			waiting: null,
			installing,
			unregister: vi.fn().mockResolvedValue(false),
			addEventListener: vi.fn((_type: string, listener: () => void) => {
				updateFoundListeners.push(listener);
			})
		};
		const dispatchEvent = vi.fn();
		vi.stubGlobal('window', { dispatchEvent });

		try {
			await configureOpenBibleServiceWorker({
				development: false,
				serviceWorker: {
					controller: { scriptURL: 'http://localhost:5173/service-worker.js' },
					getRegistrations: vi.fn(),
					register: vi.fn().mockResolvedValue(registration)
				}
			});

			expect(updateFoundListeners).toHaveLength(1);
			updateFoundListeners[0]();
			expect(stateChangeListeners).toHaveLength(1);

			installing.state = 'installed';
			stateChangeListeners[0]();

			expect(dispatchEvent).toHaveBeenCalledOnce();
			expect(dispatchEvent.mock.calls[0][0].type).toBe(SERVICE_WORKER_UPDATE_EVENT);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
