<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { Component } from 'svelte';
	import { APP_VERSION } from '$lib/app-version';
	import {
		Bell,
		BookOpen,
		ChartColumn,
		ChevronLeft,
		ChevronRight,
		Database,
		Download,
		Info,
		SunMoon
	} from '@lucide/svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import AppearanceSettings from './AppearanceSettings.svelte';
	import UpdateSettings from './UpdateSettings.svelte';
	import BibleLibraryManager from '$lib/features/bible/BibleLibraryManager.svelte';
	import {
		getReminderConfig,
		requestReminderPermission,
		saveReminderConfig
	} from '$lib/pwa/daily-reminder';
	import WorkspaceStats from '$lib/features/workspace/WorkspaceStats.svelte';
	import WorkspaceSettings from '$lib/features/workspace/WorkspaceSettings.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	const isMobile = new IsMobile();
	let activeTab = $state<'storage' | 'bibles' | 'stats' | 'reminder' | 'appearance' | 'updates'>(
		'storage'
	);

	type MobileSectionId =
		'storage' | 'bibles' | 'stats' | 'reminder' | 'about' | 'appearance' | 'updates';

	const mobileSections: Array<{ id: MobileSectionId; label: string; icon: Component }> = [
		{ id: 'storage', label: 'Armazenamento', icon: Database },
		{ id: 'bibles', label: 'Bíblias', icon: BookOpen },
		{ id: 'stats', label: 'Estatísticas', icon: ChartColumn },
		{ id: 'reminder', label: 'Lembrete diário', icon: Bell },
		{ id: 'appearance', label: 'Aparência', icon: SunMoon },
		{ id: 'updates', label: 'Atualizações', icon: Download },
		{ id: 'about', label: 'Sobre', icon: Info }
	];

	let mobileSection = $state<MobileSectionId | null>(null);
	let mobileSubheading = $state<HTMLElement | null>(null);
	const mobileSectionLabel = $derived(
		mobileSections.find((section) => section.id === mobileSection)?.label ?? ''
	);

	function openMobileSection(id: MobileSectionId) {
		mobileSection = id;
		document.querySelector('.shell-main')?.scrollTo({ top: 0 });
	}

	function closeMobileSection() {
		mobileSection = null;
		document.querySelector('.shell-main')?.scrollTo({ top: 0 });
	}

	$effect(() => {
		if (mobileSection) {
			void tick().then(() => mobileSubheading?.focus({ preventScroll: true }));
		}
	});

	let reminderEnabled = $state(false);
	let reminderTime = $state('09:00');
	let reminderPermission = $state<NotificationPermission | 'unsupported'>('default');
	let reminderMessage = $state('');
	let reminderSaving = $state(false);

	onMount(() => {
		const config = getReminderConfig();
		reminderEnabled = config.enabled;
		reminderTime = config.time;
		reminderPermission =
			typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
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
			reminderMessage =
				error instanceof Error ? error.message : 'Não foi possível salvar o lembrete.';
		} finally {
			reminderSaving = false;
		}
	}
</script>

<div class="config-page">
	<h1 class="sr-only">Configurações</h1>

	{#if isMobile.current}
		{#if mobileSection === null}
			<div class="config-index">
				<h2 class="config-index-title">Configurações</h2>
				<nav class="config-index-list" aria-label="Seções de configuração">
					{#each mobileSections as section (section.id)}
						{@const Icon = section.icon}
						<button
							type="button"
							class="config-index-row"
							onclick={() => openMobileSection(section.id)}
						>
							<span class="config-index-icon" aria-hidden="true">
								<Icon size={15} strokeWidth={1.8} />
							</span>
							<span class="config-index-label">{section.label}</span>
							<ChevronRight
								size={16}
								strokeWidth={1.8}
								aria-hidden="true"
								class="config-index-chevron"
							/>
						</button>
					{/each}
				</nav>
			</div>
		{:else}
			{#key mobileSection}
				<div class="config-subpage">
					<button
						type="button"
						class="config-back"
						onclick={closeMobileSection}
						aria-label="Voltar para Configurações"
					>
						<ChevronLeft size={18} strokeWidth={2} aria-hidden="true" class="config-back-chevron" />
						<span>Configurações</span>
					</button>
					<h2 class="config-subpage-title" bind:this={mobileSubheading} tabindex={-1}>
						{mobileSectionLabel}
					</h2>
					<div class="config-subpage-body">
						{#if mobileSection === 'storage'}
							<WorkspaceSettings embedded />
						{:else if mobileSection === 'bibles'}
							<BibleLibraryManager />
						{:else if mobileSection === 'stats'}
							<WorkspaceStats />
						{:else if mobileSection === 'reminder'}
							{@render reminderSettings()}
						{:else if mobileSection === 'appearance'}
							<AppearanceSettings />
						{:else if mobileSection === 'updates'}
							<UpdateSettings />
						{:else if mobileSection === 'about'}
							<div class="about-settings">
								<p class="about-version">OpenBible v{APP_VERSION}</p>
								<p class="about-description">
									Seu espaço local para ler a Bíblia, estudar e preparar o que você vai
									compartilhar.
								</p>
								<p class="about-hint">
									Seus dados ficam guardados neste dispositivo, no workspace que você configurou.
									Sem conta e sem servidor.
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/key}
		{/if}
	{:else}
		<Tabs.Root bind:value={activeTab} class="config-tabs">
			<Tabs.List variant="line" aria-label="Seções de configuração">
				<Tabs.Trigger value="storage">Armazenamento</Tabs.Trigger>
				<Tabs.Trigger value="bibles">Bíblias</Tabs.Trigger>
				<Tabs.Trigger value="stats">Estatísticas</Tabs.Trigger>
				<Tabs.Trigger value="reminder">Lembrete</Tabs.Trigger>
				<Tabs.Trigger value="appearance">Aparência</Tabs.Trigger>
				<Tabs.Trigger value="updates">Atualizações</Tabs.Trigger>
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
			<Tabs.Content value="reminder" class="config-tab-panel">
				{@render reminderSettings()}
			</Tabs.Content>
			<Tabs.Content value="appearance" class="config-tab-panel">
				<AppearanceSettings />
			</Tabs.Content>
			<Tabs.Content value="updates" class="config-tab-panel">
				<UpdateSettings />
			</Tabs.Content>
		</Tabs.Root>
		<footer class="config-footer">
			<p>OpenBible v{APP_VERSION}</p>
		</footer>
	{/if}
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
				As notificações estão bloqueadas no navegador. Libere a permissão para receber o lembrete.
			</p>
		{:else if reminderPermission === 'unsupported'}
			<p class="reminder-hint">Este navegador não oferece notificações locais.</p>
		{/if}
		<p class="reminder-hint">
			Sem servidor: o aviso aparece neste dispositivo enquanto o app estiver aberto. No iOS, o
			sistema pode não entregar com o app fechado.
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

	.config-index-title {
		margin: 12px 0 12px;
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1.1;
	}

	.config-index-list {
		border-top: 1px solid var(--border);
	}

	.config-index-row {
		display: flex;
		width: 100%;
		min-height: 52px;
		align-items: center;
		gap: 12px;
		border: 0;
		border-bottom: 1px solid var(--border);
		background: transparent;
		padding: 10px 4px;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.config-index-row:active {
		background: color-mix(in oklch, var(--foreground) 5%, transparent);
	}

	.config-index-icon {
		display: flex;
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
	}

	.config-index-label {
		overflow: hidden;
		min-width: 0;
		flex: 1;
		font-size: 0.92rem;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.config-index-chevron) {
		flex-shrink: 0;
		color: var(--muted-foreground);
	}

	.config-subpage {
		animation: config-push 180ms ease;
	}

	@keyframes config-push {
		from {
			opacity: 0;
			transform: translateX(14px);
		}
	}

	.config-back {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		margin: 0 0 4px -8px;
		border: 0;
		background: transparent;
		padding: 8px;
		color: var(--muted-foreground);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
	}

	.config-back:active {
		color: var(--foreground);
	}

	:global(.config-back-chevron) {
		flex-shrink: 0;
	}

	.config-subpage-title {
		margin: 0 0 20px;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.2;
	}

	.about-settings {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.about-version {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.about-description {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.about-hint {
		max-width: 52ch;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
		line-height: 1.55;
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

	@media (prefers-reduced-motion: reduce) {
		:global(.config-tabs [data-slot='tabs-trigger']) {
			transition: none;
		}

		.config-subpage {
			animation: none;
		}
	}
</style>
