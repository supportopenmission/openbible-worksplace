import { getAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const env = event.platform?.env;
	const auth = getAuth(env?.openbible_sync, env);
	return auth.handler(event.request);
};

export const POST: RequestHandler = async (event) => {
	const env = event.platform?.env;
	const auth = getAuth(env?.openbible_sync, env);
	return auth.handler(event.request);
};

export const fallback: RequestHandler = async (event) => {
	const env = event.platform?.env;
	const auth = getAuth(env?.openbible_sync, env);
	return auth.handler(event.request);
};
