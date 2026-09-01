import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ThemeToggle from '$lib/features/navigation/ThemeToggle.svelte';

describe('ThemeToggle', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove('dark');
	});

	// SPECSFY: US-003 FR-005 NFR-002 AC-005
	it('switches between light and dark labels', async () => {
		await render(ThemeToggle);

		await expect
			.element(page.getByRole('button', { name: /ativar tema escuro/i }))
			.toBeInTheDocument();
		await page.getByRole('button', { name: /ativar tema escuro/i }).click();
		await expect
			.element(page.getByRole('button', { name: /ativar tema claro/i }))
			.toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-005 NFR-002 AC-009
	it('recovers the saved dark theme', async () => {
		localStorage.setItem('openbible.theme', 'dark');
		await render(ThemeToggle);

		await expect
			.element(page.getByRole('button', { name: /ativar tema claro/i }))
			.toBeInTheDocument();
	});

	// SPECSFY: US-003 FR-005 NFR-002 AC-010
	it('keeps an invalid theme value usable', async () => {
		localStorage.setItem('openbible.theme', 'sepia');
		await render(ThemeToggle);

		await expect
			.element(page.getByRole('button', { name: /ativar tema escuro/i }))
			.toBeInTheDocument();
	});
});
