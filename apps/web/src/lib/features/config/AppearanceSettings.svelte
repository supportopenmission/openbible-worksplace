<script lang="ts">
	import type { Component } from 'svelte';
	import { onMount } from 'svelte';
	import { MonitorSmartphone, Moon, Sun } from '@lucide/svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { applyTheme, readTheme, saveTheme, type Theme } from '$lib/theme/theme';

	const workspace = getWorkspaceState();

	const options: Array<{ value: Theme; label: string; hint: string; icon: Component }> = [
		{ value: 'light', label: 'Claro', hint: 'Sempre claro', icon: Sun },
		{ value: 'dark', label: 'Escuro', hint: 'Sempre escuro', icon: Moon },
		{ value: 'system', label: 'Sistema', hint: 'Acompanha o dispositivo', icon: MonitorSmartphone }
	];

	let theme = $state<Theme>('light');

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

	async function selectTheme(value: Theme) {
		if (value === theme) return;
		if (workspace) {
			await workspace.updatePreferences({ theme: value });
			theme = value;
			return;
		}
		if (!saveTheme(value)) return;
		theme = value;
		applyTheme(value);
		window.dispatchEvent(new CustomEvent('openbible:theme-changed', { detail: value }));
	}
</script>

<div class="appearance-settings" role="radiogroup" aria-label="Aparência">
	{#each options as option (option.value)}
		{@const Icon = option.icon}
		<label class="appearance-row" class:selected={theme === option.value}>
			<span class="appearance-icon" aria-hidden="true">
				<Icon size={15} strokeWidth={1.8} />
			</span>
			<span class="appearance-text">
				<span class="appearance-label">{option.label}</span>
				<span class="appearance-hint">{option.hint}</span>
			</span>
			<input
				type="radio"
				name="openbible-appearance"
				value={option.value}
				checked={theme === option.value}
				onchange={() => void selectTheme(option.value)}
				aria-label={option.label}
			/>
		</label>
	{/each}
</div>

<style>
	.appearance-settings {
		display: grid;
		border-top: 1px solid var(--border);
	}

	.appearance-row {
		display: flex;
		min-height: 56px;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding: 10px 4px;
		cursor: pointer;
	}

	.appearance-icon {
		display: flex;
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
	}

	.appearance-text {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 2px;
	}

	.appearance-label {
		font-size: 0.9rem;
		font-weight: 550;
	}

	.appearance-row.selected .appearance-label {
		font-weight: 650;
	}

	.appearance-hint {
		color: var(--muted-foreground);
		font-size: 0.76rem;
	}

	.appearance-row input[type='radio'] {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		margin: 0;
		accent-color: var(--foreground);
		cursor: pointer;
	}
</style>
