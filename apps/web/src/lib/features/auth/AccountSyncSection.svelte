<script lang="ts">
	import { onMount } from 'svelte';
	import {
		authClient,
		getStoredAuthUser,
		setStoredAuthUser,
		setStoredAuthToken
	} from './auth-client';
	import AccountAuthCard from './AccountAuthCard.svelte';
	import ConnectedAccountPanel from './ConnectedAccountPanel.svelte';
	import SyncServerConfigCard from './SyncServerConfigCard.svelte';
	import CloudWorkspacesList from '../sync/CloudWorkspacesList.svelte';
	import SyncSettings from '../sync/SyncSettings.svelte';
	import { Cloud, ShieldCheck } from '@lucide/svelte';

	interface SessionUser {
		id?: string;
		name: string;
		email: string;
	}

	let user = $state<SessionUser | null>(getStoredAuthUser());
	let loading = $state(false);

	async function refreshSession() {
		try {
			const session = await authClient.getSession();
			if (session.data?.user) {
				user = {
					id: session.data.user.id,
					name: session.data.user.name,
					email: session.data.user.email
				};
				setStoredAuthUser(user);
				if (session.data.session?.token) {
					setStoredAuthToken(session.data.session.token);
				}
			} else if (session.error && (session.error.status === 401 || session.error.status === 403)) {
				user = null;
				setStoredAuthUser(null);
				setStoredAuthToken(null);
			}
		} catch {
			// Em caso de falha de rede/offline, mantém usuário armazenado localmente
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void refreshSession();
	});
</script>

<div class="account-sync-section">
	<div class="section-intro">
		<div class="intro-header">
			<Cloud size={20} class="intro-icon" aria-hidden="true" />
			<h3 class="intro-title">Conta e Sincronização em Nuvem</h3>
		</div>
		<p class="intro-desc">
			Conecte sua conta para manter seus workspaces e notas sincronizados entre seus dispositivos
			de forma automática e privada.
		</p>
	</div>

	{#if loading}
		<div class="loading-panel" role="status">
			<span>Carregando dados da conta...</span>
		</div>
	{:else if user}
		<div class="connected-content">
			<ConnectedAccountPanel
				{user}
				onlogout={() => {
					user = null;
				}}
			/>
			<CloudWorkspacesList />
		</div>
	{:else}
		<div class="unauthenticated-content">
			<AccountAuthCard
				onsuccess={() => {
					void refreshSession();
				}}
			/>
		</div>
	{/if}

	<SyncServerConfigCard
		onchange={() => {
			void refreshSession();
		}}
	/>

	<div class="workspace-sync-divider">
		<span class="divider-text">Sincronização do Workspace</span>
	</div>

	<SyncSettings />
</div>

<style>
	.account-sync-section {
		display: flex;
		flex-direction: column;
		gap: 24px;
		width: 100%;
		font-family: inherit;
	}

	.section-intro {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.intro-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	:global(.intro-icon) {
		color: var(--foreground, #111827);
	}

	.intro-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--foreground, #111827);
		margin: 0;
	}

	.intro-desc {
		font-size: 0.875rem;
		color: var(--muted-foreground, #6b7280);
		margin: 0;
		max-width: 600px;
		line-height: 1.5;
	}

	.loading-panel {
		padding: 24px 0;
		font-size: 0.875rem;
		color: var(--muted-foreground, #6b7280);
	}

	.connected-content,
	.unauthenticated-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.workspace-sync-divider {
		display: flex;
		align-items: center;
		margin-top: 12px;
		margin-bottom: -8px;
		border-top: 1px solid var(--border, #e5e7eb);
		padding-top: 16px;
	}

	.divider-text {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--muted-foreground, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
