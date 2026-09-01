import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ConfigPage from './config/+page.svelte';

describe('/config', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	// SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 AC-002
	it('saves Bible as the initial screen', async () => {
		await page.viewport(320, 900);
		await render(ConfigPage);

		await page.getByRole('radio', { name: /ler a bíblia/i }).click();
		await page.getByRole('button', { name: /salvar tela inicial/i }).click();

		await expect.element(page.getByText(/tela inicial salva/i)).toBeInTheDocument();
	});

	// SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 AC-003
	it('removes an existing initial screen preference', async () => {
		localStorage.setItem('openbible.initial-route', 'sermons');
		await page.viewport(320, 900);
		await render(ConfigPage);

		await page.getByRole('button', { name: /remover preferência/i }).click();

		await expect.element(page.getByText(/preferência removida/i)).toBeInTheDocument();
	});

	it('shows stacked sections on mobile without a page hero', async () => {
		await page.viewport(320, 900);
		await render(ConfigPage);

		expect(page.getByRole('heading', { level: 1 })).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: 'Armazenamento', level: 2 }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: 'Tela inicial', level: 2 }))
			.toBeInTheDocument();
	});

	it('uses tabs on desktop and reveals the home panel on selection', async () => {
		await page.viewport(1440, 900);
		await render(ConfigPage);

		expect(page.getByRole('heading', { level: 1 })).not.toBeInTheDocument();
		const storageTab = page.getByRole('tab', { name: 'Armazenamento' });
		const homeTab = page.getByRole('tab', { name: 'Tela inicial' });
		await expect.element(storageTab).toBeInTheDocument();
		await expect.element(homeTab).toBeInTheDocument();
		await expect.element(storageTab).toHaveAttribute('data-state', 'active');
		await expect.element(homeTab).toHaveAttribute('data-state', 'inactive');

		await homeTab.click();
		await expect.element(homeTab).toHaveAttribute('data-state', 'active');
		await expect.element(storageTab).toHaveAttribute('data-state', 'inactive');
		await expect
			.element(page.getByRole('radio', { name: /ler a bíblia/i }))
			.toBeInTheDocument();
	});
});
