import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AgentCapabilityPanel from './AgentCapabilityPanel.svelte';
import AgentContextPicker from './AgentContextPicker.svelte';
import AgentProposalReview from './AgentProposalReview.svelte';

const files = [
	{ path: 'notes/studies/hope.md', title: 'Esperança', bytes: 1_200 },
	{ path: 'notes/studies/prayer.md', title: 'Oração', bytes: 800 }
];

const proposal = {
	proposalId: 'proposal-interface-001',
	workspaceId: 'workspace-study',
	generation: 4,
	relativePath: 'notes/studies/hope.md',
	baseHash: 'sha256:fixture',
	originalText: 'A esperança permanece.\n',
	proposedText: 'A esperança permanece em Cristo.\n'
};

// SPECSFY: US-001 US-002 US-003 US-004 FR-001 FR-002 FR-004 FR-007 FR-009 FR-010 NFR-008 AC-007 AC-008 AC-010 AC-012
describe('AI interface contract', () => {
	it('informa a fronteira PWA sem solicitar ou persistir API key', async () => {
		await page.viewport(320, 900);
		await render(AgentCapabilityPanel, { props: { capability: 'pwa' } });

		await expect.element(page.getByRole('status')).toHaveTextContent('Conexão segura necessária');
		expect(page.getByRole('textbox', { name: /credencial/i })).not.toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Salvar perfil' })).not.toBeInTheDocument();
	});

	it('permite selecionar contexto com teclado sem sair do workspace ativo', async () => {
		await page.viewport(1440, 900);
		const onSelectionChange = vi.fn();
		await render(AgentContextPicker, {
			props: {
				workspaceId: 'workspace-study',
				generation: 4,
				files,
				onSelectionChange
			}
		});

		const checkbox = page.getByRole('checkbox', { name: 'Selecionar Esperança' });
		await checkbox.click();
		await userEvent.keyboard('{Space}');
		await expect.element(page.getByRole('status')).toHaveTextContent('0 arquivos selecionados');
		await checkbox.click();
		await expect.element(page.getByRole('status')).toHaveTextContent('1 arquivo selecionado');
		expect(onSelectionChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ workspaceId: 'workspace-study', generation: 4 })
		);
	});

	it('aplica somente após ação explícita e nunca altera a fonte no painel', async () => {
		await page.viewport(1440, 900);
		const onApply = vi.fn();
		await render(AgentProposalReview, {
			props: { proposal, currentWorkspaceId: 'workspace-study', currentGeneration: 4, onApply }
		});

		await expect.element(page.getByText('A esperança permanece em Cristo.')).toBeInTheDocument();
		expect(onApply).not.toHaveBeenCalled();
		await page.getByRole('button', { name: 'Aplicar proposta' }).click();
		expect(onApply).toHaveBeenCalledWith(
			expect.objectContaining({ confirmation: 'explicit-user-action', proposedText: proposal.proposedText })
		);
	});

	it('bloqueia proposta stale e oferece recuperação para erro externo', async () => {
		await page.viewport(320, 900);
		const onApply = vi.fn();
		const onReject = vi.fn();
		await render(AgentProposalReview, {
			props: {
				proposal: { ...proposal, state: 'stale' },
				currentWorkspaceId: 'workspace-other',
				currentGeneration: 5,
				onApply,
				onReject
			}
		});

		await expect.element(page.getByRole('alert')).toHaveTextContent('não corresponde mais à fonte');
		expect(page.getByRole('button', { name: 'Aplicar proposta' })).not.toBeInTheDocument();
		await page.getByRole('button', { name: 'Descartar proposta antiga' }).click();
		expect(onApply).not.toHaveBeenCalled();
		expect(onReject).toHaveBeenCalledWith({ proposalId: proposal.proposalId, reason: 'stale' });

		const onRetry = vi.fn();
		await render(AgentProposalReview, {
			props: {
				proposal: { ...proposal, state: 'error', errorMessage: 'Sessão expirada.' },
				onRetry
			}
		});
		await expect.element(page.getByText('Sessão expirada.')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Tentar novamente' }).first().click();
		expect(onRetry).toHaveBeenCalledOnce();
	});
});
