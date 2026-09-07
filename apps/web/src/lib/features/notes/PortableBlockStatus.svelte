<script lang="ts">
	let {
		state = 'canonical',
		message = '',
		onAction = () => {}
	}: {
		state?: 'canonical' | 'degraded' | 'conflict';
		message?: string;
		onAction?: () => void;
	} = $props();

	const defaultMessage = $derived(
		state === 'conflict'
			? 'O texto externo diverge do snapshot. Escolha como resolver antes de atualizar.'
			: 'Metadados ausentes: o fallback continua disponível e não será reescrito automaticamente.'
	);
</script>

{#if state !== 'canonical'}
	<div
		class="portable-block-status"
		class:conflict={state === 'conflict'}
		role={state === 'conflict' ? 'alert' : 'status'}
	>
		<strong>{state === 'conflict' ? 'Conflito no bloco' : 'Bloco degradado'}</strong>
		<span>{message || defaultMessage}</span>
		<button type="button" onclick={onAction}>
			{state === 'conflict' ? 'Resolver' : 'Mostrar source'}
		</button>
	</div>
{/if}

<style>
	.portable-block-status {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-top: 10px;
		border-inline-start: 2px solid color-mix(in oklch, var(--muted-foreground) 40%, transparent);
		padding: 8px 0 8px 12px;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.4;
	}

	.portable-block-status.conflict {
		border-inline-start-color: var(--destructive);
		color: var(--foreground);
	}

	.portable-block-status span {
		flex: 1;
	}

	.portable-block-status button {
		border: 0;
		background: transparent;
		color: var(--foreground);
		font: inherit;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.portable-block-status button:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	@media (max-width: 600px) {
		.portable-block-status {
			align-items: flex-start;
			flex-wrap: wrap;
		}
	}
</style>
