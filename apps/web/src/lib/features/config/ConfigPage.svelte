<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import BibleLibraryManager from '$lib/features/bible/BibleLibraryManager.svelte';
	import InitialScreenPicker from '$lib/features/navigation/InitialScreenPicker.svelte';
	import WorkspaceStats from '$lib/features/workspace/WorkspaceStats.svelte';
	import WorkspaceSettings from '$lib/features/workspace/WorkspaceSettings.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	const isMobile = new IsMobile();
	let activeTab = $state<'storage' | 'bibles' | 'stats' | 'home'>('storage');
</script>

<div class="config-page">
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href={resolve('/')}>OpenBible</a>
		<span aria-hidden="true">/</span>
		<span aria-current="page">Configuração</span>
	</nav>

	{#if isMobile.current}
		<div class="config-sections">
			<section class="config-section" aria-labelledby="config-storage-heading">
				<h2 id="config-storage-heading" class="section-label">Armazenamento</h2>
				<WorkspaceSettings embedded />
			</section>
			<section class="config-section" aria-labelledby="config-bibles-heading">
				<h2 id="config-bibles-heading" class="section-label">Bíblias</h2>
				<BibleLibraryManager />
			</section>
			<section class="config-section" aria-labelledby="config-stats-heading">
				<h2 id="config-stats-heading" class="section-label">Estatísticas</h2>
				<WorkspaceStats />
			</section>
			<section class="config-section" aria-labelledby="config-home-heading">
				<h2 id="config-home-heading" class="section-label">Tela inicial</h2>
				<InitialScreenPicker mode="config" embedded />
			</section>
		</div>
	{:else}
		<Tabs.Root bind:value={activeTab} class="config-tabs">
			<Tabs.List variant="line" aria-label="Seções de configuração">
				<Tabs.Trigger value="storage">Armazenamento</Tabs.Trigger>
				<Tabs.Trigger value="bibles">Bíblias</Tabs.Trigger>
				<Tabs.Trigger value="stats">Estatísticas</Tabs.Trigger>
				<Tabs.Trigger value="home">Tela inicial</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="storage" class="config-tab-panel">
				<WorkspaceSettings embedded />
			</Tabs.Content>
			<Tabs.Content value="bibles" class="config-tab-panel">
				<BibleLibraryManager />
			</Tabs.Content>
			<Tabs.Content value="stats" class="config-tab-panel">
				<WorkspaceStats />
			</Tabs.Content>
			<Tabs.Content value="home" class="config-tab-panel">
				<InitialScreenPicker mode="config" embedded />
			</Tabs.Content>
		</Tabs.Root>
	{/if}
</div>

<style>
	.config-page {
		max-width: 720px;
		margin: 0 auto;
		padding: 8px clamp(20px, 5vw, 64px) 80px;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-bottom: 24px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
	}

	.breadcrumb a {
		color: var(--foreground);
		font-weight: 500;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.config-tabs) {
		display: flex;
		flex-direction: column;
		gap: 0;
		width: 100%;
	}

	:global(.config-tabs [data-slot='tabs-list']) {
		width: 100%;
		justify-content: flex-start;
		gap: 0;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		background: transparent;
		padding: 0;
	}

	:global(.config-tabs [data-slot='tabs-trigger']) {
		position: relative;
		flex: 0 0 auto;
		min-height: 38px;
		padding-inline: 2px;
		margin-right: 24px;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		font-weight: 500;
	}

	:global(.config-tabs [data-slot='tabs-trigger']:hover) {
		color: var(--foreground);
	}

	:global(.config-tabs [data-slot='tabs-trigger'][data-state='active']) {
		color: var(--foreground);
		font-weight: 550;
	}

	:global(.config-tabs [data-slot='tabs-trigger'][data-state='active']::after) {
		opacity: 1;
		bottom: -1px;
		height: 2px;
		background: var(--foreground);
	}

	:global(.config-tab-panel) {
		margin-top: 28px;
		outline: none;
	}

	.config-sections {
		display: grid;
		gap: 0;
	}

	.config-section {
		padding: 28px 0;
		border-top: 1px solid var(--border);
	}

	.config-section:first-child {
		padding-top: 4px;
		border-top: 0;
	}

	.section-label {
		margin: 0 0 18px;
		color: var(--muted-foreground);
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	@media (max-width: 480px) {
		.config-page {
			padding-inline: 16px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.config-tabs [data-slot='tabs-trigger']) {
			transition: none;
		}
	}
</style>
