import type { D1Database } from '@cloudflare/workers-types';

declare global {
	namespace App {
		interface Platform {
			env: {
				openbible_sync: D1Database;
				BETTER_AUTH_URL?: string;
				BETTER_AUTH_SECRET?: string;
				BETTER_AUTH_TRUSTED_ORIGINS?: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
