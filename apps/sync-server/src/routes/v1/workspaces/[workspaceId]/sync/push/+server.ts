import { json, type RequestHandler } from '@sveltejs/kit';
import { getAuth } from '$lib/server/auth';
import { pushChanges, SyncAuthError, SyncCoreError } from '$lib/server/sync/sync-service';

export const POST: RequestHandler = async (event) => {
	const env = event.platform?.env;
	const d1 = env?.openbible_sync;
	const auth = getAuth(d1, env);
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (!session?.user) {
		return json({ error: 'unauthorized', message: 'Autenticação necessária.' }, { status: 401 });
	}

	const workspaceId = event.params.workspaceId;
	if (!workspaceId) {
		return json({ error: 'invalid_id', message: 'workspaceId é obrigatório.' }, { status: 400 });
	}

	try {
		const body = await event.request.json();
		const result = await pushChanges(d1, workspaceId, session.user.id, body);
		return json(result, { status: 200 });
	} catch (error) {
		if (error instanceof SyncAuthError) {
			return json({ error: 'forbidden', message: error.message }, { status: error.status });
		}
		if (error instanceof SyncCoreError) {
			const status =
				error.code === 'batch_limit_exceeded' || error.code === 'payload_limit_exceeded'
					? 413
					: 400;
			return json({ error: error.code, message: error.message }, { status });
		}
		return json(
			{ error: 'internal_error', message: 'Erro ao processar sincronização.' },
			{ status: 500 }
		);
	}
};
