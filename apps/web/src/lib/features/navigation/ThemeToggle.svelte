<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { applyTheme, readTheme, resolveTheme, saveTheme, type Theme } from '$lib/theme/theme';

	let theme = $state<Theme>('light');
	const workspace = getWorkspaceState();
	const effectiveTheme = $derived(resolveTheme(theme));

	onMount(() => {
		const syncTheme = () => {
			theme = workspace?.preferences.theme ?? readTheme();
			applyTheme(theme);
		};
		const handleThemeChanged = () => syncTheme();

		syncTheme();
		window.addEventListener('openbible:theme-changed', handleThemeChanged);
		return () => window.removeEventListener('openbible:theme-changed', handleThemeChanged);
	});

	async function toggleTheme() {
		const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
		if (workspace) {
			await workspace.updatePreferences({ theme: nextTheme });
			theme = nextTheme;
			return;
		}
		if (!saveTheme(nextTheme)) return;
		theme = nextTheme;
		applyTheme(theme);
		window.dispatchEvent(new CustomEvent('openbible:theme-changed', { detail: theme }));
	}
</script>

<button
	class="theme-toggle"
	type="button"
	aria-label={effectiveTheme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
	title={effectiveTheme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
	onclick={toggleTheme}
>
	{#if effectiveTheme === 'light'}
		<Moon size={16} strokeWidth={1.8} />
	{:else}
		<Sun size={16} strokeWidth={1.8} />
	{/if}
	<span>{effectiveTheme === 'light' ? 'Tema escuro' : 'Tema claro'}</span>
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 34px;
		border: 1px solid var(--sidebar-border);
		border-radius: 9px;
		background: transparent;
		padding: 7px 9px;
		color: var(--sidebar-foreground);
		font-family: var(--font-sans);
		font-size: 0.72rem;
		font-weight: 650;
		cursor: pointer;
	}

	.theme-toggle:hover {
		background: var(--sidebar-accent);
	}

	.theme-toggle:focus-visible {
		outline: 3px solid color-mix(in oklch, var(--ring) 45%, transparent);
		outline-offset: 2px;
	}

	@media (max-width: 767px) {
		.theme-toggle {
			border-color: var(--border);
			color: var(--foreground);
		}
	}
</style>
