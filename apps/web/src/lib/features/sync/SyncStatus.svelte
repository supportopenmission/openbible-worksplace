<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	export type SyncStatusKind =
		| 'local'
		| 'offline'
		| 'connecting'
		| 'syncing'
		| 'synced'
		| 'error';

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
		offline: 'Offline',
		connecting: 'Conectando',
		syncing: 'Sincronizando',
		synced: 'Sincronizado',
		error: 'Erro de sincronização'
	};

	const statusDescriptions: Record<SyncStatusKind, string> = {
		local: 'As notas permanecem disponíveis neste dispositivo.',
		offline: 'A rede está indisponível; mudanças locais continuam permitidas.',
		connecting: 'Tentando alcançar o endpoint configurado.',
		syncing: 'Enviando e recebendo somente as mudanças pendentes.',
		synced: 'A réplica local está alinhada com o último sucesso.',
		error: 'A edição local continua disponível e a tentativa pode ser repetida.'
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

<section class="sync-status" data-state={status} aria-labelledby="sync-status-title" role="status" aria-live="polite">
	<div class="status-heading">
		<div>
			<p class="status-eyebrow">Estado da sincronização</p>
			<h3 id="sync-status-title">{statusLabel}</h3>
		</div>
		<span class="status-dot" aria-hidden="true"></span>
	</div>

	<p class="status-description">{statusDescription}</p>

	<dl class="status-details">
		<div>
			<dt>Fila local</dt>
			<dd>{hasPending ? `${pendingCount} pendente${pendingCount === 1 ? '' : 's'}` : 'Vazia'}</dd>
		</div>
		<div>
			<dt>Último sucesso</dt>
			<dd>{lastSuccessLabel}</dd>
		</div>
	</dl>

	{#if status === 'error'}
		<div class="status-error" role="alert">
			<span>{lastErrorCode ? `Código: ${lastErrorCode}` : 'A última tentativa falhou.'}</span>
			{#if onRetry}
				<Button type="button" variant="outline" size="sm" onclick={onRetry}>Tentar novamente</Button>
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

	.status-eyebrow,
	.status-description,
	.status-details,
	.status-error {
		margin: 0;
	}

	.status-eyebrow,
	.status-description,
	dt,
	.status-error {
		color: var(--muted-foreground);
		font-size: 0.78rem;
		line-height: 1.45;
	}

	.status-eyebrow {
		margin-bottom: 3px;
		font-weight: 600;
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
