import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AgentContextPicker from './AgentContextPicker.svelte';

const files = [
	{ path: 'notes/studies/hope.md', title: 'Esperança', bytes: 1_200 },
	{ path: 'sermons/drafts/message.md', title: 'Mensagem', bytes: 2_400 },
	{ path: '/Users/private/secret.md', title: 'Não deve aparecer', bytes: 100 },
	{ path: 'index.sqlite', title: 'Índice', bytes: 100 },
	{ path: 'notes/../private.md', title: 'Fora do escopo', bytes: 100 }
];

// SPECSFY: US-002 FR-004 FR-005 FR-006 NFR-002 NFR-003 NFR-006 NFR-008 AC-004 AC-005 AC-006
describe('AgentContextPicker', () => {
	it('mantém a seleção no workspace ativo e só exibe paths autorais relativos', async () => {
		await page.viewport(1440, 900);
		const onSelectionChange = vi.fn();
		const onPrepare = vi.fn();

		await render(AgentContextPicker, {
			props: {
				workspaceId: 'workspace-study',
				generation: 4,
				files,
				onSelectionChange,
				onPrepare
			}
		});

		await expect.element(page.getByRole('heading', { name: 'Escolha o contexto' })).toBeInTheDocument();
		await expect.element(page.getByText('Esperança')).toBeInTheDocument();
		await expect.element(page.getByText('Mensagem')).toBeInTheDocument();
		expect(page.getByText('Não deve aparecer')).not.toBeInTheDocument();
		expect(page.getByText('Índice')).not.toBeInTheDocument();
		expect(page.getByText('Fora do escopo')).not.toBeInTheDocument();

		await page.getByRole('checkbox', { name: 'Selecionar Esperança' }).click();
		await expect.element(page.getByRole('status')).toHaveTextContent('1 arquivo selecionado');
		expect(onSelectionChange).toHaveBeenCalledWith(
			expect.objectContaining({
				workspaceId: 'workspace-study',
				generation: 4,
				selectedPaths: ['notes/studies/hope.md'],
				contentPolicy: 'selected-files-only'
			})
		);

		await page.getByRole('button', { name: 'Preparar contexto' }).click();
		expect(onPrepare).toHaveBeenCalledOnce();
	});

	it('mostra estado vazio e não permite preparar sem seleção', async () => {
		await page.viewport(320, 900);
		await render(AgentContextPicker, {
			props: { workspaceId: 'workspace-empty', generation: 4, files: [] }
		});

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent('Nenhum arquivo autoral elegível foi encontrado');
		expect(page.getByRole('button', { name: 'Preparar contexto' })).not.toBeInTheDocument();
	});

	it('falha fechada quando a geração não corresponde ao contrato ativo', async () => {
		await page.viewport(1440, 900);
		await render(AgentContextPicker, {
			props: { workspaceId: 'workspace-stale', generation: 3, files }
		});

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Workspace ativo indisponível');
		expect(page.getByText('notes/studies/hope.md')).not.toBeInTheDocument();
	});
});
