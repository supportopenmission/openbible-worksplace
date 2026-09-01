/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const CACHE_NAME = `openbible-${version}`;
const APP_ROUTES = ['/', '/bible', '/sermons', '/study', '/config'];
const PRECACHE_ASSETS = [...build, ...files, ...prerendered];
const worker = self as unknown as ServiceWorkerGlobalScope;

worker.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			await cache.addAll(PRECACHE_ASSETS);
			await Promise.all(
				APP_ROUTES.map(async (route) => {
					try {
						await cache.add(route);
					} catch {
						// A route can be unavailable during a partial deployment; navigation still caches it later.
					}
				})
			);
			await worker.skipWaiting();
		})()
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(
				keys
					.filter((key) => key.startsWith('openbible-') && key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			);
			await worker.clients.claim();
		})()
	);
});

worker.addEventListener('fetch', (event) => {
	if (
		event.request.method !== 'GET' ||
		new URL(event.request.url).origin !== worker.location.origin
	) {
		return;
	}

	if (event.request.mode === 'navigate') {
		event.respondWith(networkFirstNavigation(event.request));
		return;
	}

	event.respondWith(cacheFirstAsset(event.request));
});

async function networkFirstNavigation(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE_NAME);
	try {
		const response = await fetch(request);
		if (response.ok) await cache.put(request, response.clone());
		return response;
	} catch {
		return (
			(await cache.match(request)) ??
			(await cache.match(new URL(request.url).pathname)) ??
			(await cache.match('/')) ??
			new Response('OpenBible indisponível sem conexão.', {
				status: 503,
				headers: { 'Content-Type': 'text/plain; charset=utf-8' }
			})
		);
	}
}

async function cacheFirstAsset(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);
	if (cached) return cached;

	try {
		const response = await fetch(request);
		if (response.ok) await cache.put(request, response.clone());
		return response;
	} catch {
		return Response.error();
	}
}
