<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		Menu,
		Settings,
		Highlighter,
		ScrollText,
		GraduationCap,
		Cloud,
		User,
		CheckCircle2,
		ChevronsUpDown,
		ChevronRight,
		ArrowLeft,
		Download
	} from '@lucide/svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button/index.js';
	import { APP_VERSION } from '$lib/app-version';
	import {
		getActiveWorkspace,
		listCatalog,
		storageBackendLabel
	} from '$lib/storage/workspace-catalog';
	import {
		getStoredAuthUser,
		setStoredAuthUser,
		authClient,
		type AuthUserInfo
	} from '$lib/features/auth/auth-client';
	import WorkspaceSelector from '$lib/features/workspace/WorkspaceSelector.svelte';
	import AccountAuthOverlay from '$lib/features/auth/AccountAuthOverlay.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import {
		getAppUpdateState,
		openAppUpdateDialog
	} from '$lib/updates/app-updates.svelte';

	interface Props {
		currentPath?: string;
	}

	let { currentPath = '/' }: Props = $props();

	let open = $state(false);
	let showingWorkspaces = $state(false);
	let authOpen = $state(false);

	let activeWorkspaceName = $state('Escolher workspace');
	let activeWorkspaceBackend = $state<string | null>(null);
	let activeWorkspaceInitial = $derived(
		activeWorkspaceName.trim().charAt(0).toUpperCase() || 'W'
	);

	let user = $state<AuthUserInfo | null>(getStoredAuthUser());
	const update = getAppUpdateState();

	const isMoreActive = $derived(
		open ||
		currentPath === '/config' ||
		currentPath.startsWith('/config') ||
		currentPath === '/highlights' ||
		currentPath === '/study'
	);

	function refreshWorkspace() {
		try {
			const activeId = getActiveWorkspace().workspaceId;
			const entry = listCatalog().find((item) => item.workspaceId === activeId);
			activeWorkspaceName = entry?.nameCache ?? 'Escolher workspace';
			activeWorkspaceBackend = entry?.backend ? storageBackendLabel(entry.backend) : null;
		} catch {
			activeWorkspaceName = 'Escolher workspace';
			activeWorkspaceBackend = null;
		}
	}

	async function refreshUser() {
		try {
			user = getStoredAuthUser();
			const session = await authClient.getSession();
			if (session.data?.user) {
				user = {
					id: session.data.user.id,
					name: session.data.user.name,
					email: session.data.user.email
				};
				setStoredAuthUser(user);
			} else if (session.error && (session.error.status === 401 || session.error.status === 403)) {
				user = null;
				setStoredAuthUser(null);
			}
		} catch {
			// Mantém usuário em cache local se offline
		}
	}

	function handleNavigate(path: string) {
		open = false;
		showingWorkspaces = false;
		void goto(resolve(path as any));
	}

	onMount(() => {
		refreshWorkspace();
		void refreshUser();

		const workspaceListener = () => refreshWorkspace();
		const authListener = (event: Event) => {
			const customEvent = event as CustomEvent<AuthUserInfo | null>;
			user = customEvent.detail !== undefined ? customEvent.detail : getStoredAuthUser();
		};
		window.addEventListener('openbible:workspace-activated', workspaceListener);
		window.addEventListener('openbible:auth-changed', authListener);

		return () => {
			window.removeEventListener('openbible:workspace-activated', workspaceListener);
			window.removeEventListener('openbible:auth-changed', authListener);
		};
	});
</script>

<Drawer.Root
	bind:open
	onOpenChange={(next) => {
		if (!next) showingWorkspaces = false;
	}}
>
	<Drawer.Trigger
		class={[
			'mobile-nav-link flex min-w-0 h-12 min-h-[48px] flex-col items-center justify-center gap-[3px] rounded-lg px-[2px] py-1 bg-transparent border-none cursor-pointer font-inherit text-[0.65rem] leading-[1.1] text-center no-underline box-border transition-colors',
			isMoreActive
				? 'active font-semibold text-foreground'
				: 'font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5'
		].join(' ')}
		aria-label="Mais opções"
	>
		<Menu size={17} strokeWidth={1.75} aria-hidden="true" />
		<span class="mobile-nav-label truncate max-w-full">Mais</span>
	</Drawer.Trigger>

	<Drawer.Content class="more-drawer">
		<Drawer.Header class="px-5 pt-3 pb-2 text-left">
			{#if showingWorkspaces}
				<div class="header-with-back">
					<button
						type="button"
						class="back-button"
						onclick={() => (showingWorkspaces = false)}
						aria-label="Voltar para o menu Mais"
					>
						<ArrowLeft size={16} aria-hidden="true" />
						<span>Voltar</span>
					</button>
					<Drawer.Title class="text-lg font-bold text-foreground m-0">Workspaces</Drawer.Title>
				</div>
				<Drawer.Description class="text-xs text-muted-foreground mt-0.5">
					Troque, adicione ou gerencie workspaces locais.
				</Drawer.Description>
			{:else}
				<Drawer.Title class="text-lg font-bold text-foreground m-0">Mais</Drawer.Title>
			{/if}
		</Drawer.Header>

		<div class="more-drawer-body">
			{#if showingWorkspaces}
				<div class="workspaces-body">
					<WorkspaceSelector
						variant="mobile"
					manageLabel="Gerenciar espaços de estudo"
						onManage={() => handleNavigate('/config')}
						onAction={() => {
							open = false;
							showingWorkspaces = false;
						}}
					/>
				</div>
			{:else}
				<!-- 1. Seletor de Workspace Ativo -->
				<div class="drawer-group" role="region" aria-label="Workspace ativo">
					<button
						type="button"
						class="workspace-card"
						onclick={() => (showingWorkspaces = true)}
						aria-label={`Trocar workspace, ativo: ${activeWorkspaceName}`}
					>
						<span class="workspace-avatar" aria-hidden="true">
							{activeWorkspaceInitial}
						</span>
						<div class="workspace-info">
							<span class="workspace-name">{activeWorkspaceName}</span>
							{#if activeWorkspaceBackend}
								<span class="workspace-backend">{activeWorkspaceBackend}</span>
							{/if}
						</div>
						<div class="workspace-switch-badge">
							<span>Trocar</span>
							<ChevronsUpDown size={14} aria-hidden="true" />
						</div>
					</button>
				</div>

				<!-- 2. Profile Card ou Banner "Conecte-se para sincronizar" -->
				<div class="drawer-group" role="region" aria-label="Conta e sincronização">
					{#if user}
						<button
							type="button"
							class="profile-card"
							onclick={() => handleNavigate('/config')}
							aria-label={`Conta conectada: ${user.name}, gerenciar sincronização`}
						>
							<div class="profile-avatar" aria-hidden="true">
								<User size={18} />
							</div>
							<div class="profile-info">
								<div class="profile-name-row">
									<span class="profile-name">{user.name}</span>
									<span class="status-badge" role="status">
										<CheckCircle2 size={11} aria-hidden="true" />
										<span>Conectado</span>
									</span>
								</div>
								<span class="profile-email">{user.email}</span>
							</div>
							<ChevronRight size={16} class="chevron-icon" aria-hidden="true" />
						</button>
					{:else}
						<div class="sync-banner">
							<div class="sync-banner-top">
								<div class="sync-icon-box" aria-hidden="true">
									<Cloud size={18} />
								</div>
								<div class="sync-text-box">
									<strong class="sync-title">Conecte-se para sincronizar</strong>
									<p class="sync-description">
										Mantenha suas notas e destaques sincronizados entre seus dispositivos com total privacidade.
									</p>
								</div>
							</div>
							<Button
								size="sm"
								class="sync-cta-button"
								aria-haspopup="dialog"
								onclick={() => {
									open = false;
									authOpen = true;
								}}
							>
								Entrar ou criar conta
							</Button>
						</div>
					{/if}
				</div>

				<!-- 3. Links do Menu: Configurações como primário -->
				<div class="drawer-group" role="navigation" aria-label="Links rápidos">
					<div class="menu-list">
						<button
							type="button"
							class="menu-item primary"
							class:active={currentPath === '/config' || currentPath.startsWith('/config')}
							onclick={() => handleNavigate('/config')}
						>
							<div class="item-left">
								<Settings size={18} class="item-icon" aria-hidden="true" />
								<span class="item-label">Configurações</span>
							</div>
							<ChevronRight size={16} class="chevron-icon" aria-hidden="true" />
						</button>

						<button
							type="button"
							class="menu-item"
							class:active={currentPath === '/highlights'}
							onclick={() => handleNavigate('/highlights')}
						>
							<div class="item-left">
								<Highlighter size={18} class="item-icon" aria-hidden="true" />
								<span class="item-label">Destaques</span>
							</div>
							<ChevronRight size={16} class="chevron-icon" aria-hidden="true" />
						</button>

						<div class="menu-item disabled" aria-disabled="true" title="Em breve">
							<div class="item-left">
								<ScrollText size={18} class="item-icon" aria-hidden="true" />
								<span class="item-label">Sermões</span>
							</div>
							<span class="soon-badge">Em breve</span>
						</div>

						<div class="menu-item disabled" aria-disabled="true" title="Em breve">
							<div class="item-left">
								<GraduationCap size={18} class="item-icon" aria-hidden="true" />
								<span class="item-label">Estudos</span>
							</div>
							<span class="soon-badge">Em breve</span>
						</div>
					</div>
				</div>

				<!-- 4. Rodapé e Utilidades -->
				<div class="drawer-footer-custom">
					{#if update.status === 'available'}
						<button
							type="button"
							class="update-row-button"
							onclick={() => {
								open = false;
								openAppUpdateDialog();
							}}
						>
							<Download size={15} aria-hidden="true" />
							<span>Atualização disponível ({update.version ? `v${update.version}` : 'Nova'})</span>
						</button>
					{/if}

					<div class="footer-meta">
						<ThemeToggle />
						<span class="version-tag">OpenBible v{APP_VERSION}</span>
					</div>
				</div>
			{/if}
		</div>
	</Drawer.Content>
</Drawer.Root>

<AccountAuthOverlay bind:open={authOpen} />

<style>
	:global(.mobile-nav-link) {
		display: flex;
		min-width: 0;
		min-height: 48px;
		height: 48px;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		border-radius: 8px;
		padding: 4px 2px;
		color: var(--muted-foreground);
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.65rem;
		font-weight: 500;
		line-height: 1.1;
		text-align: center;
		text-decoration: none;
		box-sizing: border-box;
	}

	:global(.mobile-nav-link:hover) {
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
		color: var(--foreground);
	}

	:global(.mobile-nav-link.active) {
		color: var(--foreground);
		font-weight: 600;
	}

	:global(.mobile-nav-link:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	:global(.mobile-nav-link .mobile-nav-label) {
		overflow: hidden;
		max-width: 100%;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.more-drawer) {
		max-height: 90dvh;
		font-family: inherit;
		border-top: 1px solid var(--border);
		background: var(--background);
	}

	.header-with-back {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 8px;
		margin-left: -8px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--muted);
		color: var(--foreground);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
	}

	.more-drawer-body {
		padding: 4px 18px calc(24px + env(safe-area-inset-bottom, 0px));
		display: flex;
		flex-direction: column;
		gap: 14px;
		overflow-y: auto;
	}

	.workspaces-body {
		padding-top: 4px;
	}

	.drawer-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	/* Card de Workspace */
	.workspace-card {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--background);
		color: var(--foreground);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s ease, border-color 0.15s ease;
	}

	.workspace-card:hover {
		background: var(--muted);
	}

	.workspace-card:focus-visible {
		outline: 2px solid var(--foreground);
		outline-offset: 1px;
	}

	.workspace-avatar {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: var(--muted);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--foreground);
		flex-shrink: 0;
	}

	.workspace-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
		gap: 1px;
	}

	.workspace-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.workspace-backend {
		font-size: 0.72rem;
		font-family: var(--font-mono, monospace);
		color: var(--muted-foreground);
	}

	.workspace-switch-badge {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 3px 7px;
		border-radius: 6px;
		background: var(--muted);
		border: 1px solid var(--border);
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--muted-foreground);
	}

	/* Profile Card */
	.profile-card {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 14px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--background);
		color: var(--foreground);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s ease;
	}

	.profile-card:hover {
		background: var(--muted);
	}

	.profile-card:focus-visible {
		outline: 2px solid var(--foreground);
		outline-offset: 1px;
	}

	.profile-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--muted);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted-foreground);
		flex-shrink: 0;
	}

	.profile-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
		gap: 2px;
	}

	.profile-name-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.profile-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--foreground);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 1px 6px;
		border-radius: 9999px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #15803d;
		font-size: 0.625rem;
		font-weight: 550;
	}

	.profile-email {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Banner Conecte-se */
	.sync-banner {
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--muted);
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.sync-banner-top {
		display: flex;
		align-items: flex-start;
		gap: 10px;
	}

	.sync-icon-box {
		color: var(--foreground);
		margin-top: 2px;
		flex-shrink: 0;
	}

	.sync-text-box {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sync-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--foreground);
	}

	.sync-description {
		font-size: 0.76rem;
		color: var(--muted-foreground);
		line-height: 1.4;
		margin: 0;
	}

	:global(.sync-cta-button) {
		width: 100%;
		font-weight: 550;
	}

	/* Menu List */
	.menu-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--background);
		overflow: hidden;
	}

	.menu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border);
		color: var(--foreground);
		font-size: 0.875rem;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s ease;
		width: 100%;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-item:hover:not(.disabled) {
		background: var(--muted);
	}

	.menu-item:focus-visible {
		outline: 2px solid var(--foreground);
		outline-offset: -2px;
	}

	.menu-item.primary {
		font-weight: 600;
	}

	.menu-item.active {
		background: var(--muted);
	}

	.menu-item.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.item-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	:global(.item-icon) {
		color: var(--muted-foreground);
		flex-shrink: 0;
	}

	.menu-item.primary :global(.item-icon) {
		color: var(--foreground);
	}

	.item-label {
		font-size: 0.875rem;
	}

	:global(.chevron-icon) {
		color: var(--muted-foreground);
		opacity: 0.6;
		flex-shrink: 0;
	}

	.soon-badge {
		font-size: 0.65rem;
		font-weight: 500;
		color: var(--muted-foreground);
		padding: 1px 6px;
		border-radius: 4px;
		background: var(--muted);
		border: 1px solid var(--border);
	}

	/* Footer do Drawer */
	.drawer-footer-custom {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 4px;
	}

	.update-row-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid #bfdbfe;
		background: #eff6ff;
		color: #1d4ed8;
		font-size: 0.78rem;
		font-weight: 550;
		cursor: pointer;
	}

	.footer-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4px 2px;
	}

	.version-tag {
		font-size: 0.72rem;
		font-family: var(--font-mono, monospace);
		color: var(--muted-foreground);
	}
</style>
