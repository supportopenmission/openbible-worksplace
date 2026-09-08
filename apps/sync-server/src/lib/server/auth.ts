import type { D1Database } from '@cloudflare/workers-types';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDb } from './db';
import * as schema from './db/schema';
import { drizzle } from 'drizzle-orm/d1';

const mockD1 = {
	prepare: () => ({
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
	} as any),
	batch: async () => [],
	exec: async () => ({ count: 0, duration: 0 }),
	dump: async () => new ArrayBuffer(0)
} as unknown as D1Database;

export function createAuth(d1?: D1Database, options?: Partial<BetterAuthOptions>) {
	const db = d1 ? createDb(d1) : drizzle(mockD1, { schema });

	return betterAuth({
		baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8787',
		secret: process.env.BETTER_AUTH_SECRET || 'openbible-sync-secret-default-key-32ch',
		trustedOrigins: [
			'http://localhost:5173',
			'http://127.0.0.1:5173',
			'http://localhost:4173',
			'tauri://localhost',
			'http://tauri.localhost'
		],
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
		},
		...options
	});
}

export const auth = createAuth();

export function getAuth(d1?: D1Database) {
	if (!d1) {
		return auth;
	}
	return createAuth(d1);
}

export type Auth = ReturnType<typeof createAuth>;
