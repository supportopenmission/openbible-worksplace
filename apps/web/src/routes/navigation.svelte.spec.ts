import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AppSidebarTestHost from '$lib/features/navigation/AppSidebar.test-host.svelte';

describe('AppSidebar', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	// SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 AC-003
	it('shows product links and identifies the active route', async () => {
		localStorage.setItem('openbible.initial-route', 'bible');
		await render(AppSidebarTestHost, { props: { currentPath: '/bible' } });

		const primaryNavigation = page.getByRole('navigation', { name: /navegação mobile/i });
		const bibleLink = primaryNavigation.getByRole('link', { name: 'Bíblia' });
		await expect.element(primaryNavigation).toBeInTheDocument();
		await expect.element(bibleLink).toHaveAttribute('aria-current', 'page');
		await expect
			.element(primaryNavigation.getByRole('link', { name: 'Sermões' }))
			.toBeInTheDocument();
		await expect
			.element(primaryNavigation.getByRole('link', { name: 'Estudos' }))
			.toBeInTheDocument();
		await expect
			.element(primaryNavigation.getByRole('link', { name: 'Configuração' }))
			.toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-006 FR-007 NFR-002 AC-006 AC-012
	it('keeps the navigation shell available across viewport modes', async () => {
		await render(AppSidebarTestHost, { props: { currentPath: '/sermons' } });

		await expect
			.element(page.getByRole('navigation', { name: /navegação mobile/i }))
			.toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-006 FR-007 NFR-002 AC-006 AC-011
	it('publishes a mobile navigation bar with the four destinations', async () => {
		await render(AppSidebarTestHost, { props: { currentPath: '/bible' } });

		const mobileNavigation = page.getByRole('navigation', { name: /navegação mobile/i });
		await expect.element(mobileNavigation).toBeInTheDocument();
		await expect
			.element(mobileNavigation.getByRole('link', { name: 'Bíblia' }))
			.toBeInTheDocument();
		await expect
			.element(mobileNavigation.getByRole('link', { name: 'Configuração' }))
			.toBeInTheDocument();
		await expect.element(mobileNavigation).toHaveAttribute('data-safe-area', 'bottom');
	});

	// SPECSFY: US-003 FR-006 FR-007 NFR-002 AC-011 AC-012
	it('marks the current destination in both navigation modes', async () => {
		await render(AppSidebarTestHost, { props: { currentPath: '/study' } });

		const mobileNavigation = page.getByRole('navigation', { name: /navegação mobile/i });
		await expect
			.element(mobileNavigation.getByRole('link', { name: 'Estudos' }))
			.toHaveAttribute('aria-current', 'page');
	});
});
