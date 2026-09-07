import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import HighlightsPage from './highlights/+page.svelte';
import type { WorkspaceStorage } from '$lib/storage/types';

let storageSequence = 0;

function createStorage(options: { failListing?: () => boolean; withHighlight?: boolean } = {}) {
	const files = new Map<string, Uint8Array>();
	const workspaceId = `highlights-test-${++storageSequence}`;
	files.set(
		'.openbible/config.json',
		new TextEncoder().encode(
			JSON.stringify({
				workspaceId,
				formatVersion: 2,
				name: 'Highlights test',
				managedRoot: true,
				storage: 'opfs',
				bibleImportStatus: 'pending',
				label: 'Highlights test'
			})
		)
	);
	if (options.withHighlight) {
		files.set(
			'highlights/highlight-1.json',
			new TextEncoder().encode(
				JSON.stringify({
					highlightId: 'highlight-1',
					versionId: 'nvi.sqlite',
					bookId: 43,
					chapter: 3,
					verseStart: 16,
					verseEnd: 16,
					styleId: 'pen-gold',
					schemaVersion: 1
				})
			)
		);
	}

	return {
		kind: 'opfs' as const,
		label: 'Armazenamento de teste',
		async ensureDirectory() {},
		async writeFile(path: string, content: string | Uint8Array) {
			files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
		},
		async readFile(path: string) {
			return files.get(path) ?? null;
		},
		async fileExists(path: string) {
			return files.has(path);
		},
		async listFiles(path: string) {
			if (options.failListing?.()) throw new Error('storage indisponível');
			const prefix = `${path.replace(/\/$/, '')}/`;
			return [...files.keys()]
				.filter((file) => file.startsWith(prefix) && !file.slice(prefix.length).includes('/'))
				.map((file) => file.slice(prefix.length))
				.sort();
		}
	} satisfies WorkspaceStorage;
}

// SPECSFY: US-003 FR-004 NFR-001 NFR-003 AC-009 AC-010 AC-011
describe('/highlights recovery', () => {
	beforeEach(async () => {
		await page.viewport(1440, 900);
	});

	it('exposes empty state and an explicit rebuild action', async () => {
		await render(HighlightsPage, { props: { storageOverride: createStorage() } });

		await expect.element(page.getByRole('heading', { name: 'Destaques' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: 'Reconstruir índice de destaques' }))
			.toBeInTheDocument();
		await page.getByRole('button', { name: 'Reconstruir índice' }).click();
		await expect.element(page.getByText(/0 registro\(s\) disponível/i)).toBeInTheDocument();
		await expect.element(page.getByTestId('highlights-empty')).toBeInTheDocument();
	});

	it('rebuilds from primary records without hiding the highlight projection', async () => {
		await render(HighlightsPage, {
			props: { storageOverride: createStorage({ withHighlight: true }) }
		});

		await expect.element(page.getByTestId('highlights-card-list')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Reconstruir índice' }).click();
		await expect.element(page.getByText(/1 registro\(s\) disponível/i)).toBeInTheDocument();
		await expect.element(page.getByText('nvi.sqlite')).toBeInTheDocument();
	});

	it('offers retry when storage listing fails and recovers', async () => {
		let shouldFail = true;
		await render(HighlightsPage, {
			props: { storageOverride: createStorage({ failListing: () => shouldFail }) }
		});

		await expect.element(page.getByText('storage indisponível')).toBeInTheDocument();
		shouldFail = false;
		await page.getByRole('button', { name: 'Tentar novamente' }).click();
		await expect
			.element(page.getByRole('button', { name: 'Reconstruir índice' }))
			.toBeInTheDocument();
		await expect.element(page.getByTestId('highlights-empty')).toBeInTheDocument();
	});
});
