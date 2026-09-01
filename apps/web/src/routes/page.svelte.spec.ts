import { beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

describe('+page.svelte', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it('renders the page title', async () => {
		await render(Page, { props: { initialWorkspaceConfigured: true } });

		await expect.element(page.getByRole('heading', { name: 'OpenBible' })).toBeInTheDocument();
	});

	it('renders the Bible status in the project surface', async () => {
		await render(Page, { props: { initialWorkspaceConfigured: true } });

		await expect.element(page.getByText(/bíblias pendentes/i)).toBeInTheDocument();
	});

	// SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 AC-001
	it('shows the three starting items and only enables implemented destinations', async () => {
		await render(Page, { props: { initialWorkspaceConfigured: true } });

		await expect.element(page.getByRole('link', { name: /ler a bíblia/i })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /montar um sermão/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /montar um estudo/i })).toBeDisabled();
	});

	// SPECSFY: US-001 FR-002 FR-003 NFR-001 AC-002
	it('redirects to the saved home route when opening the root', async () => {
		localStorage.setItem('openbible.initial-route', 'bible');
		await render(Page, { props: { initialWorkspaceConfigured: true } });

		await expect.element(page.getByText(/abrindo sua tela inicial/i)).toBeInTheDocument();
		expect(goto).toHaveBeenCalledWith('/bible');
	});
});
