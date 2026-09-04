import { beforeEach, describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';

describe('+page.svelte', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	// SPECSFY: US-003 FR-005 FR-003 NFR-002 AC-001
	it('renders the operational home without redirecting', async () => {
		localStorage.setItem('openbible.initial-route', 'bible');
		await render(Page, { props: { initialWorkspaceConfigured: true } });

		await expect
			.element(page.getByRole('heading', { name: 'Início', level: 1 }))
			.toBeInTheDocument();
	});

	// SPECSFY: US-001 FR-002 NFR-001 AC-006
	it('shows an empty continuation with a call to open the Bible', async () => {
		await render(Page, { props: { initialWorkspaceConfigured: true } });

		await expect
			.element(page.getByRole('link', { name: /abrir a bíblia/i }))
			.toBeInTheDocument();
	});

	// SPECSFY: US-002 FR-003 NFR-001 AC-007
	it('shows quick actions for reading, notes and sermons', async () => {
		await render(Page, { props: { initialWorkspaceConfigured: true } });

		const actions = page.getByRole('region', { name: 'Ações rápidas' });
		await expect
			.element(actions.getByRole('link', { name: /ler a bíblia/i }))
			.toBeInTheDocument();
		await expect
			.element(actions.getByRole('button', { name: /nova nota/i }))
			.toBeInTheDocument();
		await expect
			.element(actions.getByRole('link', { name: /novo sermão/i }))
			.toBeInTheDocument();
	});
});
