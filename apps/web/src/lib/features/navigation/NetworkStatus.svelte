<script lang="ts">
	import { WifiOff } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let isOnline = $state(true);

	onMount(() => {
		const updateStatus = () => {
			isOnline = navigator.onLine;
		};

		updateStatus();
		window.addEventListener('online', updateStatus);
		window.addEventListener('offline', updateStatus);
		return () => {
			window.removeEventListener('online', updateStatus);
			window.removeEventListener('offline', updateStatus);
		};
	});
</script>

{#if !isOnline}
	<div class="offline-status" role="status" aria-live="polite">
		<WifiOff size={15} strokeWidth={1.8} aria-hidden="true" />
		<span>Você está offline. O conteúdo já carregado continua disponível.</span>
	</div>
{/if}

<style>
	.offline-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border-bottom: 1px solid color-mix(in oklch, var(--destructive) 25%, var(--border));
		background: color-mix(in oklch, var(--destructive) 9%, var(--background));
		padding: 8px 20px;
		color: var(--foreground);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		line-height: 1.35;
		text-align: center;
	}

	:global(.offline-status svg) {
		flex: 0 0 auto;
		color: var(--destructive);
	}

	@media (max-width: 767px) {
		.offline-status {
			padding-right: 16px;
			padding-left: 16px;
		}
	}
</style>
