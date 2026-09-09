<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	export type SyncStatusKind = 'local' | 'offline' | 'connecting' | 'syncing' | 'synced' | 'error';

	interface SyncStatusProps {
		status?: SyncStatusKind;
		pendingCount?: number;
		lastSuccessAt?: string | null;
		lastErrorCode?: string | null;
		onRetry?: () => void | Promise<void>;
	}

	const props: SyncStatusProps = $props();
	const status = $derived(props.status ?? 'local');
	const pendingCount = $derived(props.pendingCount ?? 0);
	const lastSuccessAt = $derived(props.lastSuccessAt ?? null);
	const lastErrorCode = $derived(props.lastErrorCode ?? null);
	const onRetry = $derived(props.onRetry);

	const statusLabels: Record<SyncStatusKind, string> = {
		local: 'Somente local',
		offline: 'Sem conexão',
		connecting: 'Conectando…',
		syncing: 'Sincronizando',
		synced: 'Sincronizado',
		error: 'Erro de sincronização'
	};

	const statusDescriptions: Record<SyncStatusKind, string> = {
		local: 'As notas permanecem disponíveis neste dispositivo.',
		offline: 'Sem internet no momento; as mudanças continuam salvas neste dispositivo.',
		connecting: 'Tentando conectar ao servidor configurado.',
		syncing: 'Enviando e recebendo apenas as mudanças pendentes.',
		synced: 'Este dispositivo está atualizado com a última sincronização.',
		error: 'As edições continuam disponíveis e você pode tentar novamente.'
	};

	const statusLabel = $derived(statusLabels[status]);
	const statusDescription = $derived(statusDescriptions[status]);
	const hasPending = $derived(pendingCount > 0);
	const lastSuccessLabel = $derived(formatLastSuccess(lastSuccessAt));

	function formatLastSuccess(value: string | null): string {
		if (!value) return 'Ainda não sincronizado';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return new Intl.DateTimeFormat('pt-BR', {
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(date);
	}
</script>

<section
	class="sync-status"
	data-state={status}
	aria-labelledby="sync-status-title"
	role="status"
	aria-live="polite"
>
	<div class="status-heading">
		<div>
			<h3 id="sync-status-title">{statusLabel}</h3>
		</div>
		<span class="status-dot" aria-hidden="true"></span>
	</div>

	<p class="status-description">{statusDescription}</p>

	<dl class="status-details">
		<div>
			<dt>Alterações pendentes</dt>
			<dd>{hasPending ? `${pendingCount} pendente${pendingCount === 1 ? '' : 's'}` : 'Vazia'}</dd>
		</div>
		<div>
			<dt>Última sincronização</dt>
			<dd>{lastSuccessLabel}</dd>
		</div>
	</dl>

	{#if status === 'error'}
		<div class="status-error" role="alert">
			<span>A última tentativa falhou.</span>
			{#if lastErrorCode}
				<details class="technical-details">
					<summary>Ver detalhes técnicos</summary>
					<code>{lastErrorCode}</code>
				</details>
			{/if}
			{#if onRetry}
				<Button type="button" variant="outline" size="sm" onclick={onRetry}>Tentar novamente</Button
				>
			{/if}
		</div>
	{/if}
</section>

<style>
	.sync-status {
		display: grid;
		gap: 12px;
		border-block: 1px solid var(--border);
		padding: 16px 0;
		color: var(--foreground);
	}

	.status-heading,
	.status-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.status-description,
	.status-details,
	.status-error {
		margin: 0;
	}

	.status-description,
	dt,
	.status-error {
		color: var(--muted-foreground);
		font-size: 0.78rem;
		line-height: 1.45;
	}

	h3 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 650;
	}

	.status-description {
		max-width: 70ch;
	}

	.status-dot {
		width: 9px;
		height: 9px;
		flex: 0 0 auto;
		border-radius: 50%;
		background: var(--muted-foreground);
	}

	.sync-status[data-state='synced'] .status-dot {
		background: var(--foreground);
	}

	.sync-status[data-state='error'] .status-dot {
		background: var(--destructive);
	}

	.status-details {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}

	.status-details > div {
		display: grid;
		gap: 3px;
	}

	dt {
		font-size: 0.72rem;
	}

	dd {
		margin: 0;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.78rem;
	}

	.status-error {
		justify-content: flex-start;
		flex-wrap: wrap;
		color: var(--destructive);
	}

	.technical-details {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		line-height: 1.45;
	}

	.technical-details summary {
		cursor: pointer;
		font-weight: 600;
	}

	.technical-details code {
		display: block;
		margin-top: 4px;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.72rem;
	}

	@media (max-width: 640px) {
		.status-details {
			grid-template-columns: 1fr;
			gap: 10px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.status-dot {
			transition: none;
		}
	}
</style>
