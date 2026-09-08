<script lang="ts">
	import { logoutAndPreserveLocalData } from './auth-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import { User, LogOut, CheckCircle2, ShieldCheck, AlertTriangle } from '@lucide/svelte';

	interface Props {
		user: {
			id?: string;
			name: string;
			email: string;
		};
		onlogout?: () => void;
	}

	let { user, onlogout }: Props = $props();

	let confirmingLogout = $state(false);
	let loggingOut = $state(false);

	async function handleLogout() {
		loggingOut = true;
		try {
			await logoutAndPreserveLocalData();
			onlogout?.();
		} finally {
			loggingOut = false;
			confirmingLogout = false;
		}
	}
</script>

<div class="connected-panel">
	<div class="panel-header">
		<div class="user-avatar" aria-hidden="true">
			<User size={20} />
		</div>
		<div class="user-info">
			<div class="user-name-row">
				<span class="user-name">{user.name}</span>
				<span class="status-badge" role="status">
					<CheckCircle2 size={12} aria-hidden="true" />
					<span>Conectado</span>
				</span>
			</div>
			<span class="user-email">{user.email}</span>
		</div>
	</div>

	<div class="offline-guarantee">
		<ShieldCheck size={16} class="guarantee-icon" aria-hidden="true" />
		<div class="guarantee-text">
			<strong>Filosofia Files Over Apps</strong>
			<p>
				Seus dados e notas locais continuam 100% seguros e independentes neste dispositivo,
				mesmo se você se desconectar ou estiver sem internet.
			</p>
		</div>
	</div>

	{#if confirmingLogout}
		<div class="logout-confirm-box" role="alert">
			<div class="confirm-message">
				<AlertTriangle size={16} class="warning-icon" aria-hidden="true" />
				<span>
					Deseja desconectar sua conta? A sincronização remota será pausada, mas <strong>nenhum dado local será apagado</strong>.
				</span>
			</div>
			<div class="confirm-actions">
				<Button
					variant="outline"
					size="sm"
					disabled={loggingOut}
					onclick={() => (confirmingLogout = false)}
				>
					Cancelar
				</Button>
				<Button
					variant="destructive"
					size="sm"
					disabled={loggingOut}
					onclick={handleLogout}
				>
					{loggingOut ? 'Desconectando...' : 'Confirmar desconexão'}
				</Button>
			</div>
		</div>
	{:else}
		<div class="panel-actions">
			<Button
				variant="outline"
				size="sm"
				class="logout-button"
				onclick={() => (confirmingLogout = true)}
			>
				<LogOut size={14} aria-hidden="true" />
				<span>Desconectar conta</span>
			</Button>
		</div>
	{/if}
</div>

<style>
	.connected-panel {
		border: 1px solid var(--border, #e5e7eb);
		background: var(--background, #ffffff);
		border-radius: 8px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 540px;
		width: 100%;
		font-family: inherit;
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.user-avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--muted, #f3f4f6);
		color: var(--muted-foreground, #6b7280);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border, #e5e7eb);
		flex-shrink: 0;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.user-name-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.user-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--foreground, #111827);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 9999px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #15803d;
		font-size: 0.6875rem;
		font-weight: 500;
	}

	.user-email {
		font-size: 0.8125rem;
		color: var(--muted-foreground, #6b7280);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.offline-guarantee {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 12px;
		border-radius: 6px;
		background: var(--muted, #f9fafb);
		border: 1px solid var(--border, #e5e7eb);
	}

	:global(.guarantee-icon) {
		color: #059669;
		margin-top: 2px;
		flex-shrink: 0;
	}

	.guarantee-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--foreground, #374151);
	}

	.guarantee-text p {
		margin: 0;
		color: var(--muted-foreground, #6b7280);
		font-size: 0.75rem;
	}

	.logout-confirm-box {
		border: 1px solid var(--destructive-border, #fecaca);
		background: var(--destructive-subtle, #fef2f2);
		border-radius: 6px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.confirm-message {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		font-size: 0.8125rem;
		color: var(--destructive, #991b1b);
		line-height: 1.4;
	}

	:global(.warning-icon) {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	.panel-actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
