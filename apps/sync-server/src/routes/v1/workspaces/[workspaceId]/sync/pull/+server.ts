import { json, type RequestHandler } from '@sveltejs/kit';
import { getAuth } from '$lib/server/auth';
import { pullChanges, SyncAuthError, SyncCoreError } from '$lib/server/sync/sync-service';

export const GET: RequestHandler = async (event) => {
	const d1 = event.platform?.env?.openbible_sync;
	const auth = getAuth(d1);
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (!session?.user) {
		return json({ error: 'unauthorized', message: 'Autenticação necessária.' }, { status: 401 });
	}

	const workspaceId = event.params.workspaceId;
	if (!workspaceId) {
		return json({ error: 'invalid_id', message: 'workspaceId é obrigatório.' }, { status: 400 });
	}

	const url = new URL(event.request.url);
	const afterParam = url.searchParams.get('after') ?? url.searchParams.get('afterCursor');
	const limitParam = url.searchParams.get('limit');

	const afterCursor = afterParam !== null && afterParam !== '' ? Number(afterParam) : 0;
	const limit = limitParam !== null && limitParam !== '' ? Number(limitParam) : 50;

	if (!Number.isInteger(afterCursor) || afterCursor < 0) {
		return json({ error: 'invalid_revision', message: 'Cursor inválido.' }, { status: 400 });
	}
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
		return json({ error: 'batch_limit_exceeded', message: 'limit deve estar entre 1 e 100.' }, { status: 400 });
	}

	try {
		const result = await pullChanges(d1, workspaceId, session.user.id, afterCursor, limit);
		return json(result, { status: 200 });
	} catch (error) {
		if (error instanceof SyncAuthError) {
			return json({ error: 'forbidden', message: error.message }, { status: error.status });
		}
		if (error instanceof SyncCoreError) {
			const status =
				error.code === 'batch_limit_exceeded' || error.code === 'payload_limit_exceeded' ? 413 : 400;
			return json({ error: error.code, message: error.message }, { status });
		}
		return json({ error: 'internal_error', message: 'Erro ao buscar alterações.' }, { status: 500 });
	}
};
