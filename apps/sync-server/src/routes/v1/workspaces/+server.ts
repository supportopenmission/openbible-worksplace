import { json, type RequestHandler } from '@sveltejs/kit';
import { getAuth } from '$lib/server/auth';
import {
	listUserWorkspaces,
	bindWorkspace,
	SyncAuthError,
	SyncCoreError
} from '$lib/server/sync/sync-service';

export const GET: RequestHandler = async (event) => {
	const env = event.platform?.env;
	const d1 = env?.openbible_sync;
	const auth = getAuth(d1, env);
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (!session?.user) {
		return json({ error: 'unauthorized', message: 'Autenticação necessária.' }, { status: 401 });
	}

	try {
		const result = await listUserWorkspaces(d1, session.user.id);
		return json(result, { status: 200 });
	} catch (error) {
		if (error instanceof SyncAuthError) {
			return json({ error: 'unauthorized', message: error.message }, { status: error.status });
		}
		return json(
			{ error: 'internal_error', message: 'Erro ao listar workspaces.' },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async (event) => {
	const env = event.platform?.env;
	const d1 = env?.openbible_sync;
	const auth = getAuth(d1, env);
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (!session?.user) {
		return json({ error: 'unauthorized', message: 'Autenticação necessária.' }, { status: 401 });
	}

	try {
		const body = (await event.request.json()) as { workspaceId?: string; name?: string };
		if (!body.workspaceId) {
			return json({ error: 'invalid_id', message: 'workspaceId é obrigatório.' }, { status: 400 });
		}

		const result = await bindWorkspace(d1, body.workspaceId, session.user.id, body.name);
		return json(result, { status: 200 });
	} catch (error) {
		if (error instanceof SyncAuthError) {
			return json({ error: 'forbidden', message: error.message }, { status: error.status });
		}
		if (error instanceof SyncCoreError) {
			return json({ error: error.code, message: error.message }, { status: 400 });
		}
		return json(
			{ error: 'internal_error', message: 'Erro ao vincular workspace.' },
			{ status: 500 }
		);
	}
};
