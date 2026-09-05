<script lang="ts">
	import { onMount } from 'svelte';
	import {
		BookOpen,
		Download,
		GraduationCap,
		Highlighter,
		House,
		NotebookPen,
		ScrollText,
		Settings
	} from '@lucide/svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { resolve } from '$app/paths';
	import { APP_VERSION } from '$lib/app-version';
	import { detectStorageKind } from '$lib/storage/environment';
	import {
		checkForAppUpdate,
		getAppUpdateState,
		openAppUpdateDialog
	} from '$lib/updates/app-updates.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { currentPath = '/' }: { currentPath?: string } = $props();

	const links = [
		{ label: 'Início', href: '/', icon: House },
		{ label: 'Bíblia', href: '/bible', icon: BookOpen },
		{ label: 'Notas', href: '/notes', icon: NotebookPen },
		{ label: 'Destaques', href: '/highlights', icon: Highlighter },
		{ label: 'Sermões', href: '/sermons', icon: ScrollText, disabled: true },
		{ label: 'Estudos', href: '/study', icon: GraduationCap, hideOnMobile: true, disabled: true },
		{ label: 'Configurações', href: '/config', icon: Settings }
	];

	function isLinkActive(href: string): boolean {
		if (href === '/notes') {
			return currentPath === '/notes' || currentPath.startsWith('/notes/');
		}
		return currentPath === href;
	}

	const mobileOrder = ['/', '/notes', '/bible', '/sermons', '/config'];
	const mobileLinks = mobileOrder.flatMap((href) => {
		const link = links.find((item) => item.href === href);
		if (!link || ('hideOnMobile' in link && link.hideOnMobile)) return [];
		return [link];
	});
	const update = getAppUpdateState();
	let mobileNavReady = $state(false);
	onMount(() => {
		if (detectStorageKind() === 'native') void checkForAppUpdate();

		// Nudge the fixed layer after the standalone PWA viewport settles.
		// iOS can resolve safe-area insets one frame after the first paint.
		const frame = requestAnimationFrame(() => (mobileNavReady = true));
		const viewport = window.visualViewport;
		const refresh = () => {
			requestAnimationFrame(() => (mobileNavReady = true));
		};
		viewport?.addEventListener('resize', refresh);
		viewport?.addEventListener('scroll', refresh);
		window.addEventListener('orientationchange', refresh);

		return () => {
			cancelAnimationFrame(frame);
			viewport?.removeEventListener('resize', refresh);
			viewport?.removeEventListener('scroll', refresh);
			window.removeEventListener('orientationchange', refresh);
		};
	});
</script>

<Sidebar.Root collapsible="icon" class="app-sidebar">
	<Sidebar.Header class="sidebar-header">
		<a class="brand-link" href={resolve('/')} aria-label="OpenBible, início">
			<img class="brand-logo-full" src="/logo.png" alt="" aria-hidden="true" />
			<img class="brand-logo-mark" src="/logo-minimal.png" alt="" aria-hidden="true" />
		</a>
	</Sidebar.Header>

	<Sidebar.Content role="navigation" aria-label="Navegação principal" class="sidebar-content">
		<Sidebar.Group class="sidebar-group">
			<Sidebar.Menu class="sidebar-menu">
				{#each links as link (link.href)}
					{@const Icon = link.icon}
					{@const isActive = isLinkActive(link.href)}
					{@const isDisabled = 'disabled' in link && link.disabled === true}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton {isActive} class="nav-link" tooltipContent={link.label}>
							{#snippet child({ props })}
								<a
									{...props}
									href={isDisabled ? undefined : resolve(link.href)}
									aria-current={isActive ? 'page' : undefined}
									aria-disabled={isDisabled || undefined}
									tabindex={isDisabled ? -1 : undefined}
									title={isDisabled ? 'Em breve' : undefined}
									onclick={isDisabled ? (event) => event.preventDefault() : undefined}
								>
									<Icon size={16} strokeWidth={1.75} aria-hidden="true" />
									<span>{link.label}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
			{#if update.status === 'available'}
				<Sidebar.Menu class="update-menu">
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							class="nav-link update-link"
							tooltipContent="Atualização disponível"
						>
							{#snippet child({ props })}
								<button
									{...props}
									type="button"
									onclick={openAppUpdateDialog}
									aria-label={`Abrir atualização v${update.version}`}
								>
									<Download size={16} strokeWidth={1.75} aria-hidden="true" />
									<span>Atualização disponível</span>
									<small class="update-badge">v{update.version}</small>
								</button>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			{/if}
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer class="sidebar-footer">
		<ThemeToggle />
		<p class="sidebar-version">OpenBible v{APP_VERSION}</p>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>

<nav
	class="mobile-bottom-nav"
	class:viewport-ready={mobileNavReady}
	aria-label="Navegação mobile"
	data-safe-area="bottom"
>
	{#each mobileLinks as link (link.href)}
		{@const Icon = link.icon}
		{@const isActive = isLinkActive(link.href)}
		{@const isDisabled = 'disabled' in link && link.disabled === true}
		<a
			class:active={isActive}
			class:bible-home={link.href === '/bible'}
			class="mobile-nav-link"
			href={isDisabled ? undefined : resolve(link.href)}
			aria-current={isActive ? 'page' : undefined}
			aria-label={link.href === '/bible' ? 'Bíblia' : undefined}
			aria-disabled={isDisabled || undefined}
			tabindex={isDisabled ? -1 : undefined}
			title={isDisabled ? 'Em breve' : undefined}
			onclick={isDisabled ? (event) => event.preventDefault() : undefined}
		>
			{#if link.href === '/bible'}
				<span class="bible-home-circle" aria-hidden="true">
					<img class="bible-home-logo" src="/logo-minimal.png" alt="" aria-hidden="true" />
				</span>
			{:else}
				<Icon size={17} strokeWidth={1.75} aria-hidden="true" />
			{/if}
			<span class="mobile-nav-label">{link.label}</span>
		</a>
	{/each}
</nav>

<style>
	:global(.app-sidebar) {
		border-inline-end-color: color-mix(in oklch, var(--sidebar-foreground) 8%, transparent);
	}

	:global(.app-sidebar [data-slot='sidebar-inner']) {
		background: var(--sidebar);
	}

	:global(.sidebar-header) {
		padding: 18px 14px 14px;
	}

	.brand-link {
		display: flex;
		align-items: center;
		min-height: 32px;
		color: inherit;
		text-decoration: none;
	}

	.brand-logo-full {
		display: block;
		height: 24px;
		width: auto;
		filter: invert(1);
	}

	.brand-logo-mark {
		display: none;
		height: 28px;
		width: 28px;
		object-fit: contain;
		filter: invert(1);
	}

	:global(.dark) .brand-logo-full,
	:global(.dark) .brand-logo-mark {
		filter: none;
	}

	:global(.sidebar-content) {
		padding-top: 6px;
	}

	:global(.sidebar-group) {
		padding-inline: 8px;
	}

	:global(.sidebar-menu) {
		gap: 2px;
	}

	:global(.nav-link) {
		position: relative;
		min-height: 34px;
		border-radius: 8px;
		padding-inline: 10px;
		color: color-mix(in oklch, var(--sidebar-foreground) 72%, transparent);
		font-size: 0.8rem;
		font-weight: 500;
	}

	:global(.nav-link:hover) {
		background: color-mix(in oklch, var(--sidebar-foreground) 6%, transparent);
		color: var(--sidebar-foreground);
	}

	:global(.nav-link[aria-disabled='true']) {
		opacity: 0.45;
	}

	:global(.nav-link[aria-disabled='true']:hover) {
		background: transparent;
	}

	:global(.nav-link[data-active='true']) {
		background: color-mix(in oklch, var(--sidebar-foreground) 7%, transparent);
		color: var(--sidebar-foreground);
		font-weight: 550;
	}

	:global(.nav-link[data-active='true']::before) {
		content: '';
		position: absolute;
		top: 7px;
		bottom: 7px;
		left: 0;
		width: 2px;
		border-radius: 1px;
		background: var(--sidebar-foreground);
	}

	:global(.update-link button) {
		width: 100%;
		color: var(--sidebar-foreground);
	}

	.update-badge {
		margin-inline-start: auto;
		border: 1px solid color-mix(in oklch, var(--sidebar-foreground) 22%, transparent);
		border-radius: 999px;
		padding: 1px 5px;
		font-family: var(--font-mono);
		font-size: 0.62rem;
		font-weight: 600;
	}

	:global(.sidebar-footer) {
		margin-top: auto;
		border-top: 1px solid color-mix(in oklch, var(--sidebar-foreground) 8%, transparent);
		padding: 10px 8px 14px;
	}

	.sidebar-version {
		margin: 8px 0 0;
		padding-inline: 10px;
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.68rem;
	}

	:global(.sidebar-footer .theme-toggle) {
		width: 100%;
		justify-content: flex-start;
		border-color: transparent;
		border-radius: 8px;
		padding-inline: 10px;
		font-size: 0.78rem;
		font-weight: 500;
	}

	:global(.sidebar-footer .theme-toggle:hover) {
		background: color-mix(in oklch, var(--sidebar-foreground) 6%, transparent);
	}

	:global([data-collapsible='icon'] .brand-logo-full) {
		display: none;
	}

	:global([data-collapsible='icon'] .brand-link) {
		justify-content: center;
	}

	:global([data-collapsible='icon'] .brand-logo-mark) {
		display: block;
	}

	:global([data-collapsible='icon'] .nav-link[data-active='true']::before) {
		display: none;
	}

	:global([data-collapsible='icon'] .sidebar-footer) {
		padding-inline: 6px;
	}

	:global([data-collapsible='icon'] .sidebar-footer .theme-toggle) {
		justify-content: center;
		padding-inline: 7px;
	}

	:global([data-collapsible='icon'] .sidebar-footer .theme-toggle span) {
		display: none;
	}

	:global([data-collapsible='icon'] .sidebar-version) {
		display: none;
	}

	.mobile-bottom-nav {
		display: none;
	}

	@media (max-width: 767px) {
		:global(.app-sidebar) {
			display: none;
		}

		.mobile-bottom-nav {
			position: fixed;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 60;
			display: grid;
			grid-template-columns: repeat(5, minmax(0, 1fr));
			border-top: 1px solid var(--border);
			background: color-mix(in oklch, var(--background) 92%, transparent);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			/* Composited fixed layer avoids the first-paint offset in standalone iOS PWAs. */
			transform: translate3d(0, 0, 0);
			-webkit-backface-visibility: hidden;
			backface-visibility: hidden;
			min-height: calc(64px + env(safe-area-inset-bottom, 0px));
			padding: 6px 8px max(6px, env(safe-area-inset-bottom, 0px));
		}

		.mobile-bottom-nav.viewport-ready {
			transform: translate3d(0, 0, 0.001px);
		}

		.mobile-nav-link {
			display: flex;
			min-width: 0;
			min-height: 52px;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 4px;
			border-radius: 8px;
			padding: 4px 2px;
			color: var(--muted-foreground);
			font-size: 0.62rem;
			font-weight: 500;
			line-height: 1.1;
			text-align: center;
			text-decoration: none;
		}

		.mobile-nav-link:hover {
			background: color-mix(in oklch, var(--foreground) 6%, transparent);
			color: var(--foreground);
		}

		.mobile-nav-link[aria-disabled='true'] {
			opacity: 0.45;
		}

		.mobile-nav-link[aria-disabled='true']:hover {
			background: transparent;
		}

		.mobile-nav-link.active {
			color: var(--foreground);
			font-weight: 600;
		}

		.mobile-nav-link:focus-visible {
			outline: 2px solid var(--ring);
			outline-offset: -2px;
		}

		.mobile-nav-link span {
			overflow: hidden;
			max-width: 100%;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.mobile-nav-link.bible-home {
			overflow: visible;
		}

		.mobile-nav-link.bible-home .mobile-nav-label {
			display: none;
		}

		.mobile-nav-link.bible-home:hover .bible-home-circle {
			transform: scale(1.06);
		}

		.mobile-nav-link.bible-home:active .bible-home-circle {
			transform: scale(0.96);
		}

		.bible-home-circle {
			position: relative;
			z-index: 61;
			display: flex;
			width: 56px;
			height: 56px;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			margin-top: -28px;
			border: 1px solid var(--border);
			border-radius: 999px;
			background: var(--primary);
			transition: transform 160ms ease;
		}

		.bible-home-logo {
			display: block;
			width: 30px;
			height: 30px;
			object-fit: contain;
			filter: none;
		}

		:global(.dark) .bible-home-logo {
			filter: invert(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.nav-link),
		.mobile-nav-link,
		.bible-home-circle {
			transition: none;
		}
	}
</style>
