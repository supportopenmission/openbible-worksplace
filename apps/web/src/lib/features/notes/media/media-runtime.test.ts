// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { mountMediaRuntime } from './media-runtime';
import type { MediaService } from './media-service';

describe('media runtime', () => {
	it('resolves stable references without changing the note attribute contract', async () => {
		const root = document.createElement('div');
		root.innerHTML = '<img src="media:media-1" alt="Capa" />';
		document.body.append(root);
		const service: { resolve: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> } = {
			resolve: vi.fn(async () => 'blob:resolved-media'),
			dispose: vi.fn()
		};

		const stop = mountMediaRuntime(root, service as unknown as MediaService);
		await new Promise((resolve) => setTimeout(resolve, 0));

		const image = root.querySelector('img');
		expect(service.resolve).toHaveBeenCalledWith('media:media-1');
		expect(image?.getAttribute('src')).toBe('blob:resolved-media');
		expect(image?.getAttribute('data-openbible-media-reference')).toBe('media:media-1');
		stop();
		expect(service.dispose).toHaveBeenCalledOnce();
	});

	it('keeps an accessible placeholder when bytes are missing', async () => {
		const root = document.createElement('div');
		root.innerHTML = '<video src="media:missing-1" />';
		document.body.append(root);
		const service: { resolve: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> } = {
			resolve: vi.fn(async () => {
				throw new Error('missing');
			}),
			dispose: vi.fn()
		};

		const stop = mountMediaRuntime(root, service as unknown as MediaService);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(root.querySelector('[data-openbible-media-placeholder]')?.textContent).toContain(
			'Uso e armazenamento'
		);
		expect(root.querySelector('video')?.getAttribute('data-media-state')).toBe('missing');
		stop();
	});
});
