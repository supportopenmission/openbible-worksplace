import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import RemoteBibleImport from './RemoteBibleImport.svelte';
import type { FileContent, WorkspaceStorage } from '$lib/storage/types';

function createStorage(files = new Map<string, Uint8Array>()): WorkspaceStorage {
	return {
		kind: 'opfs',
		label: 'Armazenamento do navegador',
		async ensureDirectory() {},
		async writeFile(path: string, content: FileContent) {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
		},
		async readFile(path: string) {
			return files.get(path) ?? null;
		},
		async fileExists(path: string) {
			return files.has(path);
		},
		async listFiles(path: string) {
			const prefix = `${path.replace(/\/$/, '')}/`;
			return [...files.keys()]
				.filter((filePath) => filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/'))
				.map((filePath) => filePath.slice(prefix.length))
				.sort();
		}
	};
}

describe('remote bible import', () => {
	it('keeps recoverable list errors near the url field', async () => {
		// SPECSFY: US-001 FR-001 FR-005 NFR-001 NFR-002 AC-003
		const storage = createStorage();
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
		);
		try {
			await render(RemoteBibleImport, { props: { storage, initialUrl: 'https://cdn.exemplo.com/biblias/' } });
			await page.getByRole('button', { name: /^carregar$/i }).click();
			await expect.element(page.getByRole('alert')).toBeInTheDocument();
			expect(page.getByRole('textbox', { name: /url do bucket/i })).toBeInTheDocument();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('reflects installed versions and import status', async () => {
		// SPECSFY: US-001 US-002 FR-002 FR-004 FR-005 NFR-001 AC-008
		const files = new Map<string, Uint8Array>([['bibles/acf.sqlite', new Uint8Array([1])]]);
		const storage = createStorage(files);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				const payload = {
					files: [
						{ name: 'acf.sqlite', url: 'https://cdn.exemplo.com/biblias/acf.sqlite', size: 10 },
						{ name: 'nova.sqlite', url: 'https://cdn.exemplo.com/biblias/nova.sqlite', size: 20 }
					]
				};
				return new Response(JSON.stringify(payload), { status: 200 });
			})
		);
		try {
			await render(RemoteBibleImport, { props: { storage, initialUrl: 'https://cdn.exemplo.com/biblias/' } });
			await page.getByRole('button', { name: /^carregar$/i }).click();
			await expect.element(page.getByText('acf.sqlite')).toBeInTheDocument();
			await expect.element(page.getByText('nova.sqlite')).toBeInTheDocument();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('exposes labeled url, keyboard list and progress semantics', async () => {
		// SPECSFY: US-001 US-002 FR-005 NFR-001 NFR-002 AC-009
		const storage = createStorage();
		await render(RemoteBibleImport, { props: { storage } });
		expect(page.getByRole('textbox', { name: /url do bucket/i })).toBeInTheDocument();
		expect(page.getByRole('button', { name: /^carregar$/i })).toBeDisabled();
		const input = page.getByRole('textbox', { name: /url do bucket/i });
		await input.fill('https://cdn.exemplo.com/biblias/');
		await expect.element(page.getByRole('button', { name: /^carregar$/i })).not.toBeDisabled();
	});
});
