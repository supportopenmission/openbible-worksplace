import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AppSidebarTestHost from '$lib/features/navigation/AppSidebar.test-host.svelte';

describe('AppSidebar', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	// SPECSFY: US-003 FR-005 FR-006 NFR-001 AC-003
	it('shows product links with Início first and identifies the active route', async () => {
		await render(AppSidebarTestHost, { props: { currentPath: '/bible' } });

		const primaryNavigation = page.getByRole('navigation', { name: /navegação mobile/i });
		const homeLink = primaryNavigation.getByRole('link', { name: 'Início' });
		const bibleLink = primaryNavigation.getByRole('link', { name: 'Bíblia' });
		await expect.element(primaryNavigation).toBeInTheDocument();
		await expect.element(homeLink).toBeInTheDocument();
		await expect.element(bibleLink).toHaveAttribute('aria-current', 'page');
		await expect
			.element(primaryNavigation.getByRole('link', { name: 'Notas' }))
			.toBeInTheDocument();
		await expect.element(primaryNavigation.getByText('Sermões')).toBeInTheDocument();
		await expect
			.element(primaryNavigation.getByRole('link', { name: 'Configurações' }))
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
	it('publishes a mobile navigation bar with Início and four destinations', async () => {
		await render(AppSidebarTestHost, { props: { currentPath: '/bible' } });

		const mobileNavigation = page.getByRole('navigation', { name: /navegação mobile/i });
		await expect.element(mobileNavigation).toBeInTheDocument();
		await expect
			.element(mobileNavigation.getByRole('link', { name: 'Início' }))
			.toBeInTheDocument();
		await expect
			.element(mobileNavigation.getByRole('link', { name: 'Bíblia' }))
			.toBeInTheDocument();
		await expect
			.element(mobileNavigation.getByRole('link', { name: 'Configurações' }))
			.toBeInTheDocument();
		await expect.element(mobileNavigation).toHaveAttribute('data-safe-area', 'bottom');
	});

	it('keeps Destaques in the desktop sidebar outside the mobile bar', async () => {
		// SPECSFY: US-002 FR-002 NFR-001 AC-016
		await page.viewport(1440, 900);
		await render(AppSidebarTestHost, { props: { currentPath: '/highlights' } });

		const highlightsLink = page.getByRole('link', { name: 'Destaques' });
		await expect.element(highlightsLink).toBeInTheDocument();
		await expect.element(highlightsLink).toHaveAttribute('href', expect.stringContaining('/highlights'));
		await expect.element(highlightsLink).toHaveAttribute('aria-current', 'page');

		const mobileNavigation = page.getByRole('navigation', { name: /navegação mobile/i });
		expect(mobileNavigation.getByRole('link', { name: 'Destaques' })).not.toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-006 FR-007 NFR-002 AC-011 AC-012
	it('marks the current destination in both navigation modes', async () => {
		await page.viewport(425, 812);
		await render(AppSidebarTestHost, { props: { currentPath: '/notes' } });

		const mobileNavigation = page.getByRole('navigation', { name: /navegação mobile/i });
		await expect
			.element(mobileNavigation.getByRole('link', { name: 'Notas' }))
			.toHaveAttribute('aria-current', 'page');
	});
});
