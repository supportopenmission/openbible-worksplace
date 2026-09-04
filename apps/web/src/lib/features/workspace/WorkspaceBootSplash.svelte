<script lang="ts">
	let {
		message = 'Abrindo seu workspace...',
		hint = 'Reencontrando seus arquivos locais.'
	}: {
		message?: string;
		hint?: string;
	} = $props();
</script>

<main class="boot-splash" aria-busy="true" aria-live="polite" aria-label="Carregando workspace">
	<img class="boot-logo" src="/logo-minimal.png" alt="" aria-hidden="true" />
	<p class="boot-title">OpenBible</p>
	<div class="boot-bars" aria-hidden="true">
		<span class="boot-bar"></span>
		<span class="boot-bar"></span>
		<span class="boot-bar"></span>
	</div>
	<p class="boot-status">{message}</p>
	<p class="boot-hint">{hint}</p>
</main>

<style>
	.boot-splash {
		display: flex;
		min-height: 100dvh;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0;
		padding: 48px 24px max(48px, env(safe-area-inset-bottom));
		text-align: center;
	}

	.boot-logo {
		display: block;
		width: 56px;
		height: 56px;
		object-fit: contain;
		filter: invert(1);
	}

	:global(.dark) .boot-logo {
		filter: none;
	}

	.boot-title {
		margin: 20px 0 0;
		font-size: 1.4rem;
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	.boot-bars {
		display: grid;
		gap: 8px;
		width: min(280px, 72vw);
		margin-top: 28px;
	}

	.boot-bar {
		display: block;
		height: 10px;
		border-radius: 6px;
		background: var(--muted);
		animation: boot-pulse 1.6s ease-in-out infinite;
	}

	.boot-bar:nth-child(2) {
		width: 82%;
		animation-delay: 0.15s;
	}

	.boot-bar:nth-child(3) {
		width: 64%;
		animation-delay: 0.3s;
	}

	.boot-status {
		margin: 20px 0 0;
		color: var(--foreground);
		font-size: 0.88rem;
		font-weight: 500;
	}

	.boot-hint {
		margin: 6px 0 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
		line-height: 1.5;
	}

	@keyframes boot-pulse {
		0%,
		100% {
			opacity: 0.45;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.boot-bar {
			animation: none;
		}
	}
</style>
