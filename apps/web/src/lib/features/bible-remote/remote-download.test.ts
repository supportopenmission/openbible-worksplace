import { describe, expect, it, vi } from 'vitest';
import { downloadWithProgress, RemoteDownloadError } from './remote-download';

function streamResponse(chunks: Uint8Array[], total?: number) {
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			for (const chunk of chunks) controller.enqueue(chunk);
			controller.close();
		}
	});
	return new Response(stream, {
		status: 200,
		headers: total !== undefined ? { 'Content-Length': String(total) } : {}
	});
}

describe('remote download', () => {
	it('diagnoses network and cors failures distinctly', async () => {
		// SPECSFY: US-001 FR-001 FR-003 FR-005 NFR-002 AC-004
		const corsFailure = vi.fn(async () => {
			throw new TypeError('Failed to fetch');
		});
		await expect(
			downloadWithProgress('https://cdn.exemplo.com/biblias/a.sqlite', () => undefined, {
				fetchImpl: corsFailure as typeof fetch
			})
		).rejects.toMatchObject({ kind: 'cors-blocked' });

		const httpFailure = vi.fn(async () => new Response('missing', { status: 404 }));
		await expect(
			downloadWithProgress('https://cdn.exemplo.com/biblias/a.sqlite', () => undefined, {
				fetchImpl: httpFailure as typeof fetch
			})
		).rejects.toBeInstanceOf(RemoteDownloadError);
	});

	it('reports per-file progress while streaming', async () => {
		// SPECSFY: US-002 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-005
		const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])];
		const fetchMock = vi.fn(async () => streamResponse(chunks, 5));
		const seen: number[] = [];
		const bytes = await downloadWithProgress('https://cdn.exemplo.com/biblias/a.sqlite', (progress) => {
			seen.push(progress.loaded);
		}, { fetchImpl: fetchMock as typeof fetch });
		expect(bytes).toHaveLength(5);
		expect(seen.at(-1)).toBe(5);
		expect(seen.length).toBeGreaterThan(1);
	});

	it('supports downloads without content-length', async () => {
		// SPECSFY: US-002 FR-002 FR-003 FR-005 NFR-001 NFR-002 AC-005
		const fetchMock = vi.fn(async () => streamResponse([new Uint8Array([9, 9, 9])]));
		const bytes = await downloadWithProgress('https://cdn.exemplo.com/biblias/b.sqlite', () => undefined, {
			fetchImpl: fetchMock as typeof fetch
		});
		expect(bytes).toHaveLength(3);
	});
});
