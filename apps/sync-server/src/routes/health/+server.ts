import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	const d1 = platform?.env?.openbible_sync;

	if (!d1) {
		return json({ status: 'ok', service: 'sync-server', database: 'unconfigured' });
	}

	try {
		await d1.prepare('SELECT 1').first();
		return json({ status: 'ok', service: 'sync-server', database: 'ok' });
	} catch {
		return json(
			{ status: 'degraded', service: 'sync-server', database: 'unavailable' },
			{ status: 503 }
		);
	}
};
