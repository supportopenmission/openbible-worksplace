<script lang="ts">
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import AccountAuthCard from './AccountAuthCard.svelte';

	interface Props {
		open?: boolean;
		onsucceed?: () => void;
	}

	let { open = $bindable(false), onsucceed }: Props = $props();
	const isMobile = new IsMobile();

	function handleOpenChange(nextOpen: boolean) {
		open = nextOpen;
	}

	function handleSuccess() {
		open = false;
		onsucceed?.();
	}
</script>

{#if isMobile.current}
	<Drawer.Root {open} onOpenChange={handleOpenChange}>
		<Drawer.Content class="account-auth-drawer">
			<Drawer.Header class="account-auth-header">
				<Drawer.Title>Entrar ou criar conta</Drawer.Title>
				<Drawer.Description>
					Sincronize seus dados entre dispositivos quando quiser. O app continua funcionando localmente.
				</Drawer.Description>
			</Drawer.Header>
			<div class="account-auth-body">
				<AccountAuthCard onsuccess={handleSuccess} />
			</div>
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<Dialog.Root {open} onOpenChange={handleOpenChange}>
		<Dialog.Content class="account-auth-dialog">
			<Dialog.Title>Entrar ou criar conta</Dialog.Title>
			<Dialog.Description>
				Sincronize seus dados entre dispositivos quando quiser. O app continua funcionando localmente.
			</Dialog.Description>
			<AccountAuthCard onsuccess={handleSuccess} />
		</Dialog.Content>
	</Dialog.Root>
{/if}

<style>
	:global(.account-auth-drawer) {
		max-height: min(90dvh, 720px);
		border-top: 1px solid var(--border);
		background: var(--background);
		padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
	}

	:global(.account-auth-header) {
		padding: 16px 18px 4px;
		text-align: left;
	}

	:global(.account-auth-header [data-slot='drawer-title']) {
		font-size: 1rem;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	:global(.account-auth-header [data-slot='drawer-description']),
	:global(.account-auth-dialog [data-slot='dialog-description']) {
		max-width: 38rem;
		color: var(--muted-foreground);
		font-size: 0.8125rem;
		line-height: 1.45;
	}

	.account-auth-body {
		overflow-y: auto;
		padding: 8px 18px 18px;
	}

	:global(.account-auth-body .auth-card),
	:global(.account-auth-dialog .auth-card) {
		max-width: none;
		border-color: var(--border);
		border-radius: 8px;
	}

	:global(.account-auth-dialog) {
		width: min(100% - 32px, 480px);
		gap: 12px;
		border-color: var(--border);
		background: var(--background);
		padding: 24px;
	}

	:global(.account-auth-dialog [data-slot='dialog-title']) {
		padding-right: 28px;
		font-size: 1rem;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.account-auth-dialog),
		:global(.account-auth-drawer) {
			transition: none;
		}
	}
</style>
