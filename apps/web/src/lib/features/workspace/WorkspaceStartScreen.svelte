<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight } from '@lucide/svelte';
	import WorkspaceSelector from './WorkspaceSelector.svelte';
	import {
		readWorkspaceStartupScreen,
		saveWorkspaceStartupScreen
	} from './workspace-startup-preference';

	let { onContinue = () => undefined }: { onContinue?: () => void } = $props();
	let showOnStartup = $state(true);
	let heading = $state<HTMLHeadingElement | null>(null);

	onMount(() => {
		showOnStartup = readWorkspaceStartupScreen();
		heading?.focus({ preventScroll: true });
	});

	function updateStartupPreference() {
		saveWorkspaceStartupScreen(showOnStartup);
	}
</script>

<main class="workspace-start" aria-labelledby="workspace-start-title">
	<section class="workspace-start-panel">
		<header class="workspace-start-header">
			<img class="workspace-start-logo" src="/logo-minimal.png" alt="" aria-hidden="true" />
			<div class="workspace-start-brand">OpenBible</div>
			<p class="workspace-start-kicker">Espaços de estudo</p>
			<h1 id="workspace-start-title" bind:this={heading} tabindex="-1">
				Onde você quer continuar?
			</h1>
			<p class="workspace-start-lead">
				Escolha um workspace local para abrir suas notas, destaques e estudos neste dispositivo.
			</p>
		</header>

		<div class="workspace-start-content">
			<WorkspaceSelector variant="start" onAction={onContinue} />
		</div>

		<footer class="workspace-start-footer">
			<button class="continue-button" type="button" onclick={onContinue}>
				Continuar para o OpenBible
				<ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
			</button>
			<label class="startup-option">
				<input
					type="checkbox"
					bind:checked={showOnStartup}
					onchange={updateStartupPreference}
				/>
				<span>Sempre mostrar esta janela ao iniciar</span>
			</label>
			<p class="workspace-start-note">
				Você pode alterar esta preferência em Configurações → Espaços de estudo.
			</p>
		</footer>
	</section>
</main>

<style>
	.workspace-start {
		display: grid;
		min-height: 100dvh;
		place-items: center;
		padding: max(32px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom));
		background: var(--background);
	}

	.workspace-start-panel {
		width: min(100%, 600px);
		border: 1px solid var(--border);
		border-radius: 16px;
		background: var(--card);
		box-shadow: 0 22px 58px color-mix(in oklch, var(--foreground) 10%, transparent);
	}

	.workspace-start-header {
		padding: 36px 36px 24px;
		text-align: center;
	}

	.workspace-start-logo {
		display: block;
		width: 52px;
		height: 52px;
		margin: 0 auto 14px;
		object-fit: contain;
		filter: invert(1);
	}

	:global(.dark) .workspace-start-logo {
		filter: none;
	}

	.workspace-start-brand {
		font-size: 1.15rem;
		font-weight: 650;
		letter-spacing: -0.03em;
	}

	.workspace-start-kicker {
		margin: 26px 0 10px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 600;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.8rem, 5vw, 2.5rem);
		font-weight: 650;
		letter-spacing: -0.045em;
		line-height: 1.06;
	}

	h1:focus {
		outline: none;
	}

	h1:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 4px;
	}

	.workspace-start-lead {
		max-width: 46ch;
		margin: 14px auto 0;
		color: var(--muted-foreground);
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.workspace-start-content {
		border-block: 1px solid var(--border);
		padding: 22px 28px;
	}

	.workspace-start-footer {
		display: grid;
		gap: 14px;
		padding: 24px 28px 28px;
	}

	.continue-button {
		display: inline-flex;
		min-height: 42px;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid var(--primary);
		border-radius: var(--radius);
		background: var(--primary);
		padding: 0 16px;
		color: var(--primary-foreground);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.continue-button:hover {
		opacity: 0.88;
	}

	.continue-button:focus-visible,
	.startup-option input:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}

	.startup-option {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		color: var(--foreground);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.startup-option input {
		width: 15px;
		height: 15px;
		accent-color: var(--primary);
	}

	.workspace-start-note {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		line-height: 1.45;
		text-align: center;
	}

	@media (max-width: 640px) {
		.workspace-start {
			padding-inline: 14px;
		}

		.workspace-start-panel {
			border-radius: 12px;
		}

		.workspace-start-header {
			padding: 28px 20px 20px;
		}

		.workspace-start-content,
		.workspace-start-footer {
			padding-inline: 18px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.continue-button {
			transition: none;
		}
	}
</style>
