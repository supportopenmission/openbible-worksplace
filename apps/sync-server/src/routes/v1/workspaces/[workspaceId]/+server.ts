import { json, type RequestHandler } from '@sveltejs/kit';
import { getAuth } from '$lib/server/auth';
import {
	renameWorkspace,
	deleteWorkspace,
	SyncAuthError,
	SyncCoreError
} from '$lib/server/sync/sync-service';

export const PATCH: RequestHandler = async (event) => {
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
		const body = (await event.request.json()) as { name?: string };
		if (!body.name) {
			return json({ error: 'invalid_name', message: 'name é obrigatório.' }, { status: 400 });
		}

		const result = await renameWorkspace(d1, workspaceId, session.user.id, body.name);
		return json(result, { status: 200 });
	} catch (error) {
		if (error instanceof SyncAuthError) {
			return json({ error: 'forbidden', message: error.message }, { status: error.status });
		}
		if (error instanceof SyncCoreError) {
			return json({ error: error.code, message: error.message }, { status: 400 });
		}
		return json(
			{ error: 'internal_error', message: 'Erro ao atualizar workspace.' },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async (event) => {
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
		const result = await deleteWorkspace(d1, workspaceId, session.user.id);
		return json(result, { status: 200 });
	} catch (error) {
		if (error instanceof SyncAuthError) {
			return json({ error: 'forbidden', message: error.message }, { status: error.status });
		}
		if (error instanceof SyncCoreError) {
			return json({ error: error.code, message: error.message }, { status: 400 });
		}
		return json(
			{ error: 'internal_error', message: 'Erro ao remover workspace.' },
			{ status: 500 }
		);
	}
};
