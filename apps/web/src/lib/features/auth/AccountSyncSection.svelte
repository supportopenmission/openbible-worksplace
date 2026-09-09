<script lang="ts">
	import { onMount } from 'svelte';
	import {
		authClient,
		getStoredAuthUser,
		setStoredAuthUser,
		setStoredAuthToken
	} from './auth-client';
	import AccountAuthOverlay from './AccountAuthOverlay.svelte';
	import ConnectedAccountPanel from './ConnectedAccountPanel.svelte';
	import SyncServerConfigCard from './SyncServerConfigCard.svelte';
	import CloudWorkspacesList from '../sync/CloudWorkspacesList.svelte';
	import SyncSettings from '../sync/SyncSettings.svelte';

	interface SessionUser {
		id?: string;
		name: string;
		email: string;
	}

	let user = $state<SessionUser | null>(getStoredAuthUser());
	let loading = $state(false);
	let authOpen = $state(false);

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
			<h3 class="intro-title">Conta e sincronização</h3>
			<p class="intro-desc">
				A conta é opcional. Seus dados ficam locais até você ativar a sincronização.
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
			<div class="auth-prompt">
				<div class="auth-prompt-copy">
					<strong>Conecte sua conta</strong>
					<p>Sincronize notas e espaços de estudo entre dispositivos.</p>
				</div>
				<button
					type="button"
					class="auth-prompt-action"
					aria-haspopup="dialog"
					onclick={() => (authOpen = true)}
				>
					Entrar ou criar conta
				</button>
			</div>
		</div>
	{/if}

	<AccountAuthOverlay bind:open={authOpen} onsucceed={() => void refreshSession()} />

	<SyncServerConfigCard
		onchange={() => {
			void refreshSession();
		}}
	/>

	<SyncSettings />
</div>

<style>
	.account-sync-section {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
		font-family: inherit;
	}

	.section-intro {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.intro-title {
		font-size: 1rem;
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

	.auth-prompt {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 12px;
		border-block: 1px solid var(--border, #e5e7eb);
		padding: 14px 0;
	}

	.auth-prompt-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 3px;
	}

	.auth-prompt-copy strong {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--foreground, #111827);
	}

	.auth-prompt-copy p {
		margin: 0;
		color: var(--muted-foreground, #6b7280);
		font-size: 0.8125rem;
		line-height: 1.45;
	}

	.auth-prompt-action {
		min-height: 36px;
		border: 1px solid var(--foreground, #111827);
		border-radius: 8px;
		background: var(--foreground, #111827);
		padding: 8px 12px;
		color: var(--background, #fff);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}

	.auth-prompt-action:hover {
		opacity: 0.9;
	}

	.auth-prompt-action:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.auth-prompt {
			grid-template-columns: 1fr;
		}

		.auth-prompt-action {
			width: 100%;
		}
	}

	@media (max-width: 767px) {
		.intro-title {
			display: none;
		}
	}
</style>
