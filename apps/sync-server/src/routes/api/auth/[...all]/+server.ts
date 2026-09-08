import { getAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const auth = getAuth(event.platform?.env?.openbible_sync);
	return auth.handler(event.request);
};

export const POST: RequestHandler = async (event) => {
	const auth = getAuth(event.platform?.env?.openbible_sync);
	return auth.handler(event.request);
};

export const fallback: RequestHandler = async (event) => {
	const auth = getAuth(event.platform?.env?.openbible_sync);
	return auth.handler(event.request);
};
