import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ConfigPage from './config/+page.svelte';

describe('/config', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	// SPECSFY: US-003 FR-006 NFR-003 AC-010
	it('no longer offers an initial screen section', async () => {
		await page.viewport(320, 900);
		await render(ConfigPage);

		expect(page.getByRole('button', { name: 'Tela inicial' })).not.toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Estatísticas' })).toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-006 NFR-003 AC-011
	it('ignores a legacy initial screen preference', async () => {
		localStorage.setItem('openbible.initial-route', 'sermons');
		await page.viewport(320, 900);
		await render(ConfigPage);

		expect(page.getByRole('button', { name: 'Tela inicial' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Estatísticas' })).toBeInTheDocument();
	});

	it('shows a section index on mobile with drill-down subpages and back', async () => {
		await page.viewport(320, 900);
		await render(ConfigPage);

		await expect
			.element(page.getByRole('heading', { name: 'Configurações', level: 1 }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: 'Configurações', level: 2 }))
			.toBeInTheDocument();
		const statsRow = page.getByRole('button', { name: 'Estatísticas' });
		await expect.element(statsRow).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Tela inicial' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Sobre' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Aparência' })).toBeInTheDocument();

		await statsRow.click();
		await expect
			.element(page.getByRole('heading', { name: 'Estatísticas', exact: true, level: 2 }))
			.toBeInTheDocument();

		await page.getByRole('button', { name: /voltar para configurações/i }).click();
		await expect.element(page.getByRole('button', { name: 'Estatísticas' })).toBeInTheDocument();
	});

	it('uses vertical section navigation on desktop without an initial screen panel', async () => {
		await page.viewport(1440, 900);
		await render(ConfigPage);

		await expect
			.element(page.getByRole('heading', { name: 'Configurações', level: 1 }))
			.toBeInTheDocument();
		const appearanceTab = page.getByRole('tab', { name: 'Aparência' });
		await expect.element(appearanceTab).toBeInTheDocument();
		await expect
			.element(page.getByRole('tablist', { name: 'Seções de configuração' }))
			.toHaveAttribute('aria-orientation', 'vertical');
		expect(page.getByRole('tab', { name: 'Tela inicial' })).not.toBeInTheDocument();
		await expect.element(appearanceTab).toHaveAttribute('aria-selected', 'true');

		const statsTab = page.getByRole('tab', { name: 'Estatísticas' });
		await statsTab.click();
		await expect.element(statsTab).toHaveAttribute('aria-selected', 'true');
	});

	it('separates stats, workspace management and backup operations', async () => {
		await page.viewport(1440, 900);
		await render(ConfigPage);

		const statsTab = page.getByRole('tab', { name: 'Estatísticas' });
		const workspacesTab = page.getByRole('tab', { name: 'Workspaces' });
		const backupsTab = page.getByRole('tab', { name: 'Backup e restauração' });
		await expect.element(statsTab).toBeInTheDocument();
		await expect.element(workspacesTab).toBeInTheDocument();
		await expect.element(backupsTab).toBeInTheDocument();

		await workspacesTab.click();
		await expect.element(workspacesTab).toHaveAttribute('aria-selected', 'true');

		await backupsTab.click();
		await expect.element(backupsTab).toHaveAttribute('aria-selected', 'true');
	});

	it('exposes bibles and stats sections on desktop and mobile', async () => {
		// SPECSFY: US-001 US-002 US-004 FR-001 FR-002 FR-004 NFR-001 AC-010
		await page.viewport(1440, 900);
		await render(ConfigPage);

		const biblesTab = page.getByRole('tab', { name: 'Bíblias' });
		const statsTab = page.getByRole('tab', { name: 'Estatísticas' });
		await expect.element(biblesTab).toBeInTheDocument();
		await expect.element(statsTab).toBeInTheDocument();

		await biblesTab.click();
		await expect.element(biblesTab).toHaveAttribute('aria-selected', 'true');
		await statsTab.click();
		await expect.element(statsTab).toHaveAttribute('aria-selected', 'true');
	});

	it('shows branded project information in Sobre', async () => {
		await page.viewport(1440, 900);
		await render(ConfigPage);

		await page.getByRole('tab', { name: 'Sobre' }).click();
		await expect
			.element(page.getByRole('heading', { name: 'Informações do projeto', level: 3 }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('img', { name: 'OpenBible' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: /repositório no github/i }))
			.toHaveAttribute('href', 'https://github.com/supportopenmission/openbible-worksplace');
		expect(page.getByText(/v\d/)).toBeInTheDocument();
		expect(page.getByText('OpenBible v0.5.5')).not.toBeInTheDocument();
	});
});
