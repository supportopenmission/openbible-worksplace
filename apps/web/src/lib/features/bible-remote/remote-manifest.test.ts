import { describe, expect, it, vi } from 'vitest';
import { isDirectSqliteUrl, loadRemoteCatalog, normalizeBaseUrl } from './remote-manifest';

const manifestPayload = {
	files: [
		{ name: 'almeida.sqlite', url: 'https://cdn.exemplo.com/biblias/almeida.sqlite', size: 1024 },
		{ name: 'acf.sqlite', url: '/biblias/acf.sqlite', size: 2048 },
		{ name: 'leia-me.txt', url: 'https://cdn.exemplo.com/biblias/leia-me.txt' }
	]
};

function jsonResponse(payload: unknown, status = 200) {
	return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('remote manifest', () => {
	it('lists available sqlite files from the bucket base url', async () => {
		// SPECSFY: US-001 FR-001 FR-002 FR-005 NFR-001 NFR-002 AC-001
		const fetchMock = vi.fn(async (url: string) => {
			expect(url).toBe('https://cdn.exemplo.com/biblias/manifest.json');
			return jsonResponse(manifestPayload);
		});
		const { catalog } = await loadRemoteCatalog('https://cdn.exemplo.com/biblias', fetchMock as typeof fetch, [
			'acf.sqlite'
		]);
		expect(catalog.baseUrl).toBe('https://cdn.exemplo.com/biblias/');
		expect(catalog.entries.map((entry) => entry.name).sort()).toEqual(['acf.sqlite', 'almeida.sqlite']);
		expect(catalog.entries.find((entry) => entry.name === 'acf.sqlite')?.url).toBe(
			'https://cdn.exemplo.com/biblias/acf.sqlite'
		);
		expect(normalizeBaseUrl('https://cdn.exemplo.com/biblias')).toBe('https://cdn.exemplo.com/biblias/');
	});

	it('treats a direct sqlite url as a single item without manifest', async () => {
		// SPECSFY: US-001 FR-001 FR-002 FR-005 NFR-002 AC-002
		const fetchMock = vi.fn(async () => {
			throw new Error('manifest should not be fetched');
		});
		expect(isDirectSqliteUrl('https://cdn.exemplo.com/biblias/ara.sqlite')).toBe(true);
		const { catalog } = await loadRemoteCatalog(
			'https://cdn.exemplo.com/biblias/ara.sqlite',
			fetchMock as typeof fetch
		);
		expect(catalog.entries).toHaveLength(1);
		expect(catalog.entries[0]).toMatchObject({ name: 'ara.sqlite' });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('falls back to index.json when manifest.json is missing', async () => {
		// SPECSFY: US-001 FR-001 FR-002 FR-005 NFR-002 AC-001
		const fetchMock = vi.fn(async (url: string) => {
			if (url.endsWith('manifest.json')) return new Response('nope', { status: 404 });
			return jsonResponse(manifestPayload);
		});
		const { catalog } = await loadRemoteCatalog(
			'https://cdn.exemplo.com/biblias/',
			fetchMock as typeof fetch
		);
		expect(catalog.entries).toHaveLength(2);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
