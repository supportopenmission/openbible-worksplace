import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AgentProposalReview from './AgentProposalReview.svelte';

const proposal = {
	proposalId: 'proposal-001',
	workspaceId: 'workspace-study',
	generation: 4,
	relativePath: 'notes/studies/hope.md',
	baseHash: 'sha256:fixture',
	originalText: '# Esperança\n\nA esperança permanece.\n',
	proposedText: '# Esperança\n\nA esperança permanece em Cristo.\n',
	origin: 'Consulta textual'
};

// SPECSFY: US-003 FR-007 FR-008 NFR-008 AC-007 AC-008 AC-009
describe('AgentProposalReview', () => {
	it('mantém a fonte intacta até a aplicação explícita e envia confirmação', async () => {
		await page.viewport(1440, 900);
		const onApply = vi.fn();
		const onReject = vi.fn();

		await render(AgentProposalReview, {
			props: {
				proposal,
				currentWorkspaceId: 'workspace-study',
				currentGeneration: 4,
				onApply,
				onReject
			}
		});

		await expect.element(page.getByRole('heading', { name: 'Revise antes de aplicar' })).toBeInTheDocument();
		await expect.element(page.getByText('A esperança permanece em Cristo.')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Aplicar proposta' }).click();

		expect(onApply).toHaveBeenCalledWith(
			expect.objectContaining({
				proposalId: 'proposal-001',
				relativePath: 'notes/studies/hope.md',
				confirmation: 'explicit-user-action'
			})
		);
		expect(onReject).not.toHaveBeenCalled();
	});

	it('bloqueia aplicação quando workspace ou geração ficaram stale', async () => {
		await page.viewport(320, 900);
		const onApply = vi.fn();
		const onReject = vi.fn();

		await render(AgentProposalReview, {
			props: {
				proposal,
				currentWorkspaceId: 'workspace-other',
				currentGeneration: 5,
				onApply,
				onReject
			}
		});

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Esta proposta não corresponde mais à fonte');
		expect(page.getByRole('button', { name: 'Aplicar proposta' })).not.toBeInTheDocument();
		await page.getByRole('button', { name: 'Descartar proposta antiga' }).click();
		expect(onApply).not.toHaveBeenCalled();
		expect(onReject).toHaveBeenCalledWith({ proposalId: 'proposal-001', reason: 'stale' });
	});

	it('mantém diff longo contido e expõe estado vazio sem proposta', async () => {
		await page.viewport(320, 900);
		await render(AgentProposalReview, {
			props: {
				proposal: {
					...proposal,
					originalText: 'a'.repeat(240),
					proposedText: 'b'.repeat(240)
				}
			}
		});

		const root = (await page.getByTestId('agent-proposal-review').element()) as unknown as HTMLElement;
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth + 1);
		await render(AgentProposalReview, { props: { proposal: null } });
		await expect.element(page.getByRole('status')).toHaveTextContent('Nenhuma proposta pendente');
	});
});
