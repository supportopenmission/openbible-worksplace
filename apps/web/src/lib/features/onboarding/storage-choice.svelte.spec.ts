import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import OnboardingModal from '$lib/features/onboarding/OnboardingModal.svelte';
import type { FileContent, WorkspaceStorage } from '$lib/storage/types';

function createStorage(): WorkspaceStorage {
	const files = new Map<string, Uint8Array>();
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
				.filter(
					(filePath) => filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/')
				)
				.map((filePath) => filePath.slice(prefix.length))
				.sort();
		}
	};
}

describe('armazenamento automático no onboarding', () => {
	// SPECSFY: STORAGE-002
	it('prepara o workspace diretamente no armazenamento local configurado', async () => {
		await render(OnboardingModal, {
			props: { storageMode: 'opfs', storage: createStorage() }
		});

		await page.getByRole('button', { name: /começar/i }).click();

		await expect
			.element(page.getByRole('heading', { name: /você já tem bíblias sqlite/i }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /escolher pasta/i }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /usar armazenamento do navegador/i }))
			.not.toBeInTheDocument();
	});
});
