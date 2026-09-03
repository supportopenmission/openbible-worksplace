<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { APP_VERSION } from '$lib/app-version';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import BibleLibraryManager from '$lib/features/bible/BibleLibraryManager.svelte';
	import InitialScreenPicker from '$lib/features/navigation/InitialScreenPicker.svelte';
	import {
		getReminderConfig,
		requestReminderPermission,
		saveReminderConfig
	} from '$lib/pwa/daily-reminder';
	import WorkspaceStats from '$lib/features/workspace/WorkspaceStats.svelte';
	import WorkspaceSettings from '$lib/features/workspace/WorkspaceSettings.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	const isMobile = new IsMobile();
	let activeTab = $state<'storage' | 'bibles' | 'stats' | 'home' | 'reminder'>('storage');

	let reminderEnabled = $state(false);
	let reminderTime = $state('09:00');
	let reminderPermission = $state<NotificationPermission | 'unsupported'>('default');
	let reminderMessage = $state('');
	let reminderSaving = $state(false);

	onMount(() => {
		const config = getReminderConfig();
		reminderEnabled = config.enabled;
		reminderTime = config.time;
		reminderPermission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
	});

	async function handleReminderToggle(event: Event) {
		const checked = (event.target as HTMLInputElement).checked;
		reminderEnabled = checked;
		if (checked && typeof Notification !== 'undefined' && Notification.permission === 'default') {
			reminderPermission = await requestReminderPermission();
		}
	}

	function handleReminderSave() {
		reminderMessage = '';
		reminderSaving = true;
		try {
			saveReminderConfig({ enabled: reminderEnabled, time: reminderTime });
			if (typeof Notification !== 'undefined') reminderPermission = Notification.permission;
			reminderMessage = reminderEnabled
				? reminderPermission === 'granted'
					? `Lembrete ativo para ${reminderTime}.`
					: `Lembrete salvo para ${reminderTime}. Ative as notificações do navegador para recebê-lo.`
				: 'Lembrete desativado.';
			window.dispatchEvent(new CustomEvent('openbible:reminder-changed'));
		} catch (error) {
			reminderMessage = error instanceof Error ? error.message : 'Não foi possível salvar o lembrete.';
		} finally {
			reminderSaving = false;
		}
	}
</script>

<div class="config-page">
	<h1 class="sr-only">Configurações</h1>
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
			<section class="config-section" aria-labelledby="config-reminder-heading">
				<h2 id="config-reminder-heading" class="section-label">Lembrete diário</h2>
				{@render reminderSettings()}
			</section>
		</div>
	{:else}
		<Tabs.Root bind:value={activeTab} class="config-tabs">
			<Tabs.List variant="line" aria-label="Seções de configuração">
				<Tabs.Trigger value="storage">Armazenamento</Tabs.Trigger>
				<Tabs.Trigger value="bibles">Bíblias</Tabs.Trigger>
				<Tabs.Trigger value="stats">Estatísticas</Tabs.Trigger>
				<Tabs.Trigger value="home">Tela inicial</Tabs.Trigger>
				<Tabs.Trigger value="reminder">Lembrete</Tabs.Trigger>
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
			<Tabs.Content value="reminder" class="config-tab-panel">
				{@render reminderSettings()}
			</Tabs.Content>
		</Tabs.Root>
	{/if}

	<footer class="config-footer">
		<p>OpenBible v{APP_VERSION}</p>
	</footer>
</div>

{#snippet reminderSettings()}
	<div class="reminder-settings">
		<label class="reminder-row">
			<input type="checkbox" checked={reminderEnabled} onchange={handleReminderToggle} />
			<span>Lembrar de estudar a Bíblia todos os dias</span>
		</label>
		<label class="reminder-row">
			<span>Horário</span>
			<input
				type="time"
				value={reminderTime}
				oninput={(event) => (reminderTime = (event.target as HTMLInputElement).value)}
				disabled={!reminderEnabled}
				required
			/>
		</label>
		<Button type="button" size="sm" onclick={handleReminderSave} disabled={reminderSaving}>
			Salvar lembrete
		</Button>
		{#if reminderMessage}
			<p class="reminder-feedback" role="status">{reminderMessage}</p>
		{/if}
		{#if reminderPermission === 'denied'}
			<p class="reminder-hint">
				As notificações estão bloqueadas no navegador. Libere a permissão para receber o
				lembrete.
			</p>
		{:else if reminderPermission === 'unsupported'}
			<p class="reminder-hint">Este navegador não oferece notificações locais.</p>
		{/if}
		<p class="reminder-hint">
			Sem servidor: o aviso aparece neste dispositivo enquanto o app estiver aberto. No iOS,
			o sistema pode não entregar com o app fechado.
		</p>
	</div>
{/snippet}

<style>
	.config-page {
		max-width: 720px;
		width: 100%;
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

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
		white-space: nowrap;
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

	.config-footer {
		margin-top: 32px;
		border-top: 1px solid var(--border);
		padding-top: 16px;
	}

	.config-footer p {
		margin: 0;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	.reminder-settings {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.reminder-row {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.84rem;
	}

	.reminder-row input[type='checkbox'] {
		width: 16px;
		height: 16px;
		accent-color: var(--foreground);
	}

	.reminder-row input[type='time'] {
		border: 1px solid var(--input);
		border-radius: 8px;
		background: var(--background);
		padding: 6px 10px;
		color: var(--foreground);
		font: inherit;
	}

	.reminder-row input:disabled {
		opacity: 0.5;
	}

	.reminder-feedback {
		margin: 0;
		font-size: 0.8rem;
	}

	.reminder-hint {
		max-width: 52ch;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
		line-height: 1.55;
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
