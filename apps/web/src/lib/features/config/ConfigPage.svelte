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
		ExternalLink,
		Info,
		SunMoon
	} from '@lucide/svelte';
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
	type ConfigSectionId =
		'storage' | 'bibles' | 'stats' | 'reminder' | 'about' | 'appearance' | 'updates';
	let activeSection = $state<ConfigSectionId>('storage');

	const configSections: Array<{ id: ConfigSectionId; label: string; icon: Component }> = [
		{ id: 'storage', label: 'Armazenamento', icon: Database },
		{ id: 'bibles', label: 'Bíblias', icon: BookOpen },
		{ id: 'stats', label: 'Estatísticas', icon: ChartColumn },
		{ id: 'reminder', label: 'Lembrete diário', icon: Bell },
		{ id: 'appearance', label: 'Aparência', icon: SunMoon },
		{ id: 'updates', label: 'Atualizações', icon: Download },
		{ id: 'about', label: 'Sobre', icon: Info }
	];

	let mobileSection = $state<ConfigSectionId | null>(null);
	let mobileSubheading = $state<HTMLElement | null>(null);
	const mobileSectionLabel = $derived(
		configSections.find((section) => section.id === mobileSection)?.label ?? ''
	);

	function openMobileSection(id: ConfigSectionId) {
		mobileSection = id;
		document.querySelector('.shell-main')?.scrollTo({ top: 0 });
	}

	function closeMobileSection() {
		mobileSection = null;
		document.querySelector('.shell-main')?.scrollTo({ top: 0 });
	}

	function handleSectionKeydown(event: KeyboardEvent) {
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		const ids = configSections.map((section) => section.id);
		const currentIndex = ids.indexOf(activeSection);
		const nextIndex =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? ids.length - 1
					: (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + ids.length) % ids.length;
		event.preventDefault();
		activeSection = ids[nextIndex];
		void tick().then(() => document.getElementById(`config-tab-${activeSection}`)?.focus());
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
					{#each configSections as section (section.id)}
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
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
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
							{@render aboutSettings()}
						{/if}
					</div>
				</div>
			{/key}
		{/if}
	{:else}
		<div class="config-layout">
			<nav class="config-sidebar" aria-label="Seções de configuração">
				<h2 class="config-sidebar-title">Configurações</h2>
				<div
					class="config-sidebar-list"
					role="tablist"
					aria-orientation="vertical"
					aria-label="Seções de configuração"
				>
					{#each configSections as section (section.id)}
						{@const Icon = section.icon}
						<button
							id={`config-tab-${section.id}`}
							type="button"
							class="config-sidebar-item"
							class:active={activeSection === section.id}
							role="tab"
							aria-selected={activeSection === section.id}
							aria-controls={`config-panel-${section.id}`}
							tabindex={activeSection === section.id ? 0 : -1}
							onclick={() => (activeSection = section.id)}
							onkeydown={handleSectionKeydown}
						>
							<Icon size={16} strokeWidth={1.8} aria-hidden="true" />
							<span>{section.label}</span>
						</button>
					{/each}
				</div>
			</nav>

			<div class="config-content">
				{#if activeSection === 'storage'}
					<div
						id="config-panel-storage"
						class="config-panel"
						role="region"
						aria-labelledby="config-tab-storage"
					>
						<WorkspaceSettings embedded />
					</div>
				{:else if activeSection === 'bibles'}
					<div
						id="config-panel-bibles"
						class="config-panel"
						role="region"
						aria-labelledby="config-tab-bibles"
					>
						<BibleLibraryManager />
					</div>
				{:else if activeSection === 'stats'}
					<div
						id="config-panel-stats"
						class="config-panel"
						role="region"
						aria-labelledby="config-tab-stats"
					>
						<WorkspaceStats />
					</div>
				{:else if activeSection === 'reminder'}
					<div
						id="config-panel-reminder"
						class="config-panel"
						role="region"
						aria-labelledby="config-tab-reminder"
					>
						{@render reminderSettings()}
					</div>
				{:else if activeSection === 'appearance'}
					<div
						id="config-panel-appearance"
						class="config-panel"
						role="region"
						aria-labelledby="config-tab-appearance"
					>
						<AppearanceSettings />
					</div>
				{:else if activeSection === 'updates'}
					<div
						id="config-panel-updates"
						class="config-panel"
						role="region"
						aria-labelledby="config-tab-updates"
					>
						<UpdateSettings />
					</div>
				{:else}
					<div
						id="config-panel-about"
						class="config-panel"
						role="region"
						aria-labelledby="config-tab-about"
					>
						{@render aboutSettings()}
					</div>
				{/if}
			</div>
		</div>
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

{#snippet aboutSettings()}
	<div class="about-settings">
		<div class="about-brand">
			<div class="about-brand-line">
				<img class="about-logo" src="/logo.png" alt="OpenBible" />
				<span class="about-version-badge">v{APP_VERSION}</span>
			</div>
			<p class="about-description">
				Seu espaço local para ler a Bíblia, estudar e preparar o que você vai compartilhar.
			</p>
		</div>
		<div class="about-project">
			<h3 class="about-project-title">Informações do projeto</h3>
			<p class="about-project-description">
				OpenBible é um aplicativo local e de código aberto para leitura, estudo e preparação de
				conteúdo bíblico.
			</p>
			<a
				class="about-repository-link"
				href="https://github.com/supportopenmission/openbible-worksplace"
				target="_blank"
				rel="noreferrer"
			>
				<span>Repositório no GitHub</span>
				<ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
			</a>
		</div>
		<p class="about-hint">
			Seus dados ficam guardados neste dispositivo, no workspace que você configurou. Sem conta e
			sem servidor.
		</p>
	</div>
{/snippet}

<style>
	.config-page {
		max-width: 1120px;
		width: 100%;
		margin: 0 auto;
		padding: 8px clamp(20px, 4vw, 48px) 80px;
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

	.config-layout {
		display: grid;
		grid-template-columns: minmax(190px, 220px) minmax(0, 1fr);
		align-items: start;
		gap: clamp(32px, 5vw, 64px);
	}

	.config-sidebar {
		position: sticky;
		top: 16px;
		min-width: 0;
	}

	.config-sidebar-title {
		margin: 12px 0 16px;
		font-size: 1.1rem;
		font-weight: 600;
		letter-spacing: -0.025em;
	}

	.config-sidebar-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.config-sidebar-item {
		display: flex;
		width: 100%;
		min-height: 40px;
		align-items: center;
		gap: 10px;
		border: 0;
		border-inline-start: 2px solid transparent;
		border-radius: 0 6px 6px 0;
		background: transparent;
		padding: 8px 12px;
		color: var(--muted-foreground);
		font: inherit;
		font-size: 0.84rem;
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition:
			background-color 120ms ease,
			color 120ms ease,
			border-color 120ms ease;
	}

	.config-sidebar-item:hover {
		background: color-mix(in oklch, var(--foreground) 5%, transparent);
		color: var(--foreground);
	}

	.config-sidebar-item.active {
		border-inline-start-color: var(--foreground);
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
		color: var(--foreground);
	}

	.config-sidebar-item:focus-visible,
	.config-panel:focus-visible,
	.config-index-row:focus-visible,
	.config-back:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.config-content {
		min-width: 0;
		padding-top: 12px;
	}

	.config-panel {
		min-width: 0;
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
		gap: 20px;
	}

	.about-brand {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding-bottom: 20px;
	}

	.about-brand-line {
		display: flex;
		width: 100%;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
	}

	.about-logo {
		display: block;
		width: min(220px, 100%);
		height: auto;
		filter: invert(1);
	}

	:global(.dark) .about-logo {
		filter: none;
	}

	.about-version-badge {
		display: inline-flex;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--muted);
		padding: 3px 7px;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 600;
		line-height: 1.2;
	}

	.about-description,
	.about-project-description {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.about-project {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}

	.about-project-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.about-project-description {
		max-width: 58ch;
	}

	.about-repository-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 2px;
		color: var(--foreground);
		font-size: 0.84rem;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.about-repository-link:hover {
		color: var(--muted-foreground);
	}

	.about-hint {
		max-width: 52ch;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
		line-height: 1.55;
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
		.config-sidebar-item {
			transition: none;
		}

		.config-subpage {
			animation: none;
		}
	}
</style>
