import type { Handle } from '@sveltejs/kit';

const ALLOWED_ORIGINS = new Set([
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://localhost:4173',
	'http://127.0.0.1:4173',
	'tauri://localhost',
	'http://tauri.localhost'
]);

export const handle: Handle = async ({ event, resolve }) => {
	const origin = event.request.headers.get('origin');
	const isAllowed =
		origin &&
		(ALLOWED_ORIGINS.has(origin) || origin.endsWith('.workers.dev') || origin.endsWith('.pages.dev'));

	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': isAllowed ? origin : origin || '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Max-Age': '86400'
			}
		});
	}

	const response = await resolve(event);

	if (isAllowed && origin) {
		response.headers.set('Access-Control-Allow-Origin', origin);
		response.headers.set('Access-Control-Allow-Credentials', 'true');
	}

	return response;
};
