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
		expect(page.getByRole('button', { name: 'Armazenamento' })).toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-006 NFR-003 AC-011
	it('ignores a legacy initial screen preference', async () => {
		localStorage.setItem('openbible.initial-route', 'sermons');
		await page.viewport(320, 900);
		await render(ConfigPage);

		expect(page.getByRole('button', { name: 'Tela inicial' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Armazenamento' })).toBeInTheDocument();
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
		const storageRow = page.getByRole('button', { name: 'Armazenamento' });
		await expect.element(storageRow).toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Tela inicial' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Sobre' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Aparência' })).toBeInTheDocument();

		await storageRow.click();
		await expect
			.element(page.getByRole('heading', { name: 'Armazenamento', level: 2 }))
			.toBeInTheDocument();

		await page.getByRole('button', { name: /voltar para configurações/i }).click();
		await expect.element(page.getByRole('button', { name: 'Armazenamento' })).toBeInTheDocument();
	});

	it('uses vertical section navigation on desktop without an initial screen panel', async () => {
		await page.viewport(1440, 900);
		await render(ConfigPage);

		await expect
			.element(page.getByRole('heading', { name: 'Configurações', level: 1 }))
			.toBeInTheDocument();
		const storageTab = page.getByRole('tab', { name: 'Armazenamento' });
		await expect.element(storageTab).toBeInTheDocument();
		await expect
			.element(page.getByRole('tablist', { name: 'Seções de configuração' }))
			.toHaveAttribute('aria-orientation', 'vertical');
		expect(page.getByRole('tab', { name: 'Tela inicial' })).not.toBeInTheDocument();
		await expect.element(storageTab).toHaveAttribute('aria-selected', 'true');

		await storageTab.click();
		await expect.element(storageTab).toHaveAttribute('aria-selected', 'true');
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
