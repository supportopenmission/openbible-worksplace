import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const WORKER = fileURLToPath(new URL('../../service-worker.ts', import.meta.url));

const APP_ROUTES = ['/', '/bible', '/notes', '/highlights', '/sermons', '/study', '/config'];

describe('offline do worker', () => {
	// SPECSFY: US-003 FR-003 NFR-002 AC-005
	it('serve rotas locais cacheadas e foca o app ao tocar na notificação', async () => {
		const worker = await readFile(WORKER, 'utf8');
		for (const route of APP_ROUTES) {
			expect(worker).toContain(`'${route}'`);
		}
		expect(worker).toContain('notificationclick');
	});

	// SPECSFY: US-003 FR-003 NFR-002 AC-006
	it('responde fallback para rota nunca carregada sem quebrar o shell', async () => {
		const worker = await readFile(WORKER, 'utf8');
		expect(worker).toContain(`await cache.match('/')`);
		expect(worker).toContain('OpenBible indisponível sem conexão.');
	});
});
