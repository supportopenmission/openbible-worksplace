import type { D1Database } from '@cloudflare/workers-types';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDb } from './db';
import * as schema from './db/schema';
import { drizzle } from 'drizzle-orm/d1';

export interface AuthRuntimeEnv {
	BETTER_AUTH_URL?: string;
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_TRUSTED_ORIGINS?: string;
}

const DEFAULT_AUTH_SECRET = 'openbible-sync-secret-default-key-32ch';
const DEFAULT_TRUSTED_ORIGINS = [
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://localhost:4173',
	'http://127.0.0.1:4173',
	'tauri://localhost',
	'http://tauri.localhost'
];

const mockD1 = {
	prepare: () =>
		({
			bind: () => ({
				all: async () => ({ results: [], success: true, meta: {} as any }),
				run: async () => ({ success: true, meta: {} as any, results: [] }),
				first: async () => null,
				raw: async () => []
			}),
			all: async () => ({ results: [], success: true, meta: {} as any }),
			run: async () => ({ success: true, meta: {} as any, results: [] }),
			first: async () => null,
			raw: async () => []
		}) as any,
	batch: async () => [],
	exec: async () => ({ count: 0, duration: 0 }),
	dump: async () => new ArrayBuffer(0)
} as unknown as D1Database;

export function createAuth(d1?: D1Database, options?: Partial<BetterAuthOptions>) {
	const db = d1 ? createDb(d1) : drizzle(mockD1, { schema });
	const processEnv = typeof process === 'undefined' ? undefined : process.env;
	const baseURL =
		options?.baseURL ?? processEnv?.BETTER_AUTH_URL ?? (d1 ? undefined : 'http://localhost:8787');
	const secret =
		options?.secret ?? processEnv?.BETTER_AUTH_SECRET ?? (d1 ? undefined : DEFAULT_AUTH_SECRET);

	if (d1 && !secret) {
		throw new Error('BETTER_AUTH_SECRET precisa ser configurado no ambiente do servidor.');
	}

	const configuredTrustedOrigins = options?.trustedOrigins;
	const trustedOrigins = Array.isArray(configuredTrustedOrigins)
		? [...DEFAULT_TRUSTED_ORIGINS, ...configuredTrustedOrigins]
		: (configuredTrustedOrigins ?? DEFAULT_TRUSTED_ORIGINS);

	return betterAuth({
		...options,
		...(baseURL ? { baseURL } : {}),
		...(secret ? { secret } : {}),
		trustedOrigins,
		plugins: [bearer(), ...(options?.plugins ?? [])],
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification
			}
		}),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false
		}
	});
}

export const auth = createAuth();

export function getAuth(d1?: D1Database, runtime?: AuthRuntimeEnv) {
	if (!d1 && !runtime) {
		return auth;
	}

	const configuredOrigins = runtime?.BETTER_AUTH_TRUSTED_ORIGINS?.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);

	return createAuth(d1, {
		...(runtime?.BETTER_AUTH_URL ? { baseURL: runtime.BETTER_AUTH_URL } : {}),
		...(runtime?.BETTER_AUTH_SECRET ? { secret: runtime.BETTER_AUTH_SECRET } : {}),
		...(configuredOrigins?.length ? { trustedOrigins: configuredOrigins } : {})
	});
}

export type Auth = ReturnType<typeof createAuth>;
