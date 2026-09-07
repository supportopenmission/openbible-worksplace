import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PeerConflictPanel from './PeerConflictPanel.svelte';

const conflict = {
	documentId: 'note-offline-001',
	workspaceId: 'workspace-browser-001',
	backend: 'indexeddb' as const,
	localPath: 'notes/studies/offline.md',
	externalPath: 'conflicts/note-offline-001.external.md',
	status: 'needs-review' as const,
	localVersionRecoverable: true as const,
	externalVersionRecoverable: true as const,
	overwrite: false as const
};

// SPECSFY: US-003 FR-005 NFR-002 NFR-004 AC-011 AC-012 AC-013
describe('PeerConflictPanel', () => {
	it('mostra as duas versões e encaminha ações explícitas em mobile', async () => {
		await page.viewport(320, 900);
		const keepLocal = vi.fn();
		const reviewExternal = vi.fn();

		await render(PeerConflictPanel, {
			props: { conflict, onKeepLocal: keepLocal, onReviewExternal: reviewExternal }
		});

		await expect.element(page.getByRole('heading', { name: 'Conflito precisa de uma decisão' })).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Versão local' })).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Edição externa' })).toBeInTheDocument();
		await expect.element(page.getByRole('alert')).toHaveTextContent('IndexedDB · openbible-workspace');

		await page.getByRole('button', { name: 'Manter versão local' }).click();
		await page.getByRole('button', { name: 'Revisar versão externa' }).click();
		expect(keepLocal).toHaveBeenCalledOnce();
		expect(reviewExternal).toHaveBeenCalledOnce();
	});

	it('informa quando não há conflito pendente', async () => {
		await page.viewport(1440, 900);
		await render(PeerConflictPanel, { props: { conflict: null } });

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent('Nenhum conflito pendente neste workspace.');
	});
});
