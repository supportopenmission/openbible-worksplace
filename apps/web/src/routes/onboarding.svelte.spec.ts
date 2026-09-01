import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import OnboardingModal from '$lib/features/onboarding/OnboardingModal.svelte';
import type { FileContent, WorkspaceStorage } from '$lib/storage/types';
import Page from './+page.svelte';

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

describe('OpenBible onboarding', () => {
	it('keeps the dialog available when local folder access fails', async () => {
		// SPECSFY: US-001 FR-001 FR-005 NFR-001 NFR-002 AC-003
		await render(OnboardingModal, {
			props: { storageMode: 'local', initialError: 'Não foi possível acessar a pasta.' }
		});

		expect(page.getByRole('dialog')).toBeInTheDocument();
		expect(page.getByText(/não foi possível/i)).toBeInTheDocument();
	});

	it('allows postponing Bible import and opens the project', async () => {
		// SPECSFY: US-002 FR-003 FR-004 FR-005 NFR-001 NFR-002 AC-004
		const deferred = vi.fn();
		await render(OnboardingModal, {
			props: { storageMode: 'opfs', storage: createStorage(), onDeferred: deferred }
		});

		await page.getByRole('button', { name: /começar/i }).click();
		await page.getByRole('button', { name: /fazer depois/i }).click();

		expect(deferred).toHaveBeenCalledOnce();
	});

	it('does not show onboarding when a workspace is already configured', async () => {
		// SPECSFY: US-001 US-002 FR-003 FR-005 NFR-001 NFR-002 AC-007
		await render(Page, { props: { initialWorkspaceConfigured: true } });

		expect(page.getByRole('dialog')).not.toBeInTheDocument();
		expect(page.getByRole('heading', { name: /openbible/i })).toBeInTheDocument();
	});

	it('opens directly at the import step when requested', async () => {
		await render(OnboardingModal, {
			props: { storageMode: 'opfs', storage: createStorage(), initialStep: 'import' }
		});

		await expect
			.element(page.getByRole('heading', { name: /você já tem bíblias sqlite/i }))
			.toBeInTheDocument();
	});

	it('exposes progress and accessible operation state', async () => {
		// SPECSFY: US-001 US-002 FR-005 NFR-001 NFR-002 AC-009
		await render(OnboardingModal, {
			props: { storageMode: 'opfs', storage: createStorage(), initialStep: 'import' }
		});

		expect(page.getByRole('dialog')).toHaveAccessibleName(/bíblias sqlite/i);
		await page.getByRole('button', { name: /importar agora/i }).click();
		expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
	});
});
