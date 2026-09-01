<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowUpRight, BookOpen, GraduationCap, ScrollText } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import * as Item from '$lib/components/ui/item';
	import {
		clearHomeRoute,
		readHomeRoute,
		saveHomeRoute,
		type HomeRoute
	} from '$lib/navigation/home-preference';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	let {
		mode = 'selector',
		showHeading = true,
		embedded = false
	}: {
		mode?: 'selector' | 'config';
		showHeading?: boolean;
		embedded?: boolean;
	} = $props();

	let selectedRoute = $state<HomeRoute | null>(null);
	let feedback = $state('');
	const workspace = getWorkspaceState();

	function notifyPreferenceChanged(route: HomeRoute | null) {
		window.dispatchEvent(new CustomEvent('openbible:home-route-changed', { detail: route }));
	}

	onMount(() => {
		if (mode === 'config') {
			selectedRoute = workspace?.preferences.initialRoute ?? readHomeRoute();
		}
	});

	async function saveSelection() {
		if (!selectedRoute) return;
		const saved = workspace
			? Boolean(await workspace.updatePreferences({ initialRoute: selectedRoute }))
			: saveHomeRoute(selectedRoute);
		feedback = saved
			? `Tela inicial salva. A próxima abertura de / levará você para ${selectedRoute === 'bible' ? 'Bíblia' : 'Sermões'}.`
			: 'Não foi possível salvar a tela inicial. Tente novamente.';
		if (saved) notifyPreferenceChanged(selectedRoute);
	}

	async function removeSelection() {
		const removed = workspace
			? Boolean(await workspace.updatePreferences({ initialRoute: null }))
			: clearHomeRoute();
		if (!removed) {
			feedback = 'Não foi possível remover a tela inicial. Tente novamente.';
			return;
		}
		selectedRoute = null;
		feedback = 'Preferência removida. A rota / voltará a mostrar o seletor.';
		notifyPreferenceChanged(null);
	}
</script>

{#if mode === 'selector'}
	<section class="start-panel" aria-labelledby="start-heading">
		{#if showHeading}
			<p class="eyebrow">Seu próximo passo</p>
			<h2 id="start-heading">Por onde você quer começar?</h2>
			<p class="intro">
				Escolha uma área para entrar no OpenBible. Você pode mudar essa decisão depois em
				Configuração.
			</p>
		{/if}

		<Item.Group class="start-items" aria-label="Opções para começar">
			<Item.Root variant="outline" class="start-item">
				<a class="item-link" href={resolve('/bible')}>
					<Item.Media variant="icon" class="item-icon bible-icon"
						><BookOpen size={21} strokeWidth={1.8} /></Item.Media
					>
					<Item.Content>
						<Item.Title>Ler a Bíblia <ArrowUpRight size={15} strokeWidth={1.8} /></Item.Title>
						<Item.Description>Leia os textos que sustentam seus estudos.</Item.Description>
					</Item.Content>
				</a>
			</Item.Root>

			<Item.Root variant="outline" class="start-item">
				<a class="item-link" href={resolve('/sermons')}>
					<Item.Media variant="icon" class="item-icon sermon-icon"
						><ScrollText size={21} strokeWidth={1.8} /></Item.Media
					>
					<Item.Content>
						<Item.Title>Montar um sermão <ArrowUpRight size={15} strokeWidth={1.8} /></Item.Title>
						<Item.Description>Organize a mensagem que você quer compartilhar.</Item.Description>
					</Item.Content>
				</a>
			</Item.Root>

			<Item.Root variant="outline" class="start-item is-coming-soon">
				<button class="item-link" type="button" disabled aria-label="Montar um estudo, em breve">
					<Item.Media variant="icon" class="item-icon study-icon"
						><GraduationCap size={21} strokeWidth={1.8} /></Item.Media
					>
					<Item.Content>
						<Item.Title>Montar um estudo <span class="coming-soon">Em breve</span></Item.Title>
						<Item.Description
							>Uma forma estruturada de aprofundar suas descobertas.</Item.Description
						>
					</Item.Content>
				</button>
			</Item.Root>
		</Item.Group>
	</section>
{:else}
	<section
		class="config-picker"
		class:embedded
		aria-labelledby={embedded ? undefined : 'config-picker-heading'}
	>
		{#if !embedded}
			<div class="section-heading">
				<p class="eyebrow">Preferência local</p>
				<h2 id="config-picker-heading">Escolha sua tela inicial</h2>
				<p class="intro">Ao entrar em /, o OpenBible abrirá a área que você escolher aqui.</p>
			</div>
		{:else}
			<p class="panel-lead">Ao abrir /, o OpenBible redireciona para a área selecionada abaixo.</p>
		{/if}

		<fieldset class="route-options">
			<legend class="sr-only">Telas iniciais disponíveis</legend>
			<label class:selected={selectedRoute === 'bible'} class="route-option">
				<input bind:group={selectedRoute} type="radio" name="home-route" value="bible" />
				<Item.Root variant="outline" class="config-item">
					<Item.Media variant="icon" class="item-icon bible-icon"
						><BookOpen size={20} strokeWidth={1.8} /></Item.Media
					>
					<Item.Content>
						<Item.Title>Ler a Bíblia</Item.Title>
						<Item.Description>Abrir o leitor ao entrar em /.</Item.Description>
					</Item.Content>
				</Item.Root>
			</label>

			<label class:selected={selectedRoute === 'sermons'} class="route-option">
				<input bind:group={selectedRoute} type="radio" name="home-route" value="sermons" />
				<Item.Root variant="outline" class="config-item">
					<Item.Media variant="icon" class="item-icon sermon-icon"
						><ScrollText size={20} strokeWidth={1.8} /></Item.Media
					>
					<Item.Content>
						<Item.Title>Montar um sermão</Item.Title>
						<Item.Description>Abrir o construtor ao entrar em /.</Item.Description>
					</Item.Content>
				</Item.Root>
			</label>

			<div class="route-option disabled-option" aria-disabled="true">
				<Item.Root variant="outline" class="config-item">
					<Item.Media variant="icon" class="item-icon study-icon"
						><GraduationCap size={20} strokeWidth={1.8} /></Item.Media
					>
					<Item.Content>
						<Item.Title>Montar um estudo <span class="coming-soon">Em breve</span></Item.Title>
						<Item.Description>Essa área estará disponível em uma próxima etapa.</Item.Description>
					</Item.Content>
				</Item.Root>
			</div>
		</fieldset>

		<div class="actions">
			<button
				class="primary-action"
				type="button"
				disabled={!selectedRoute}
				onclick={saveSelection}
			>
				Salvar tela inicial
			</button>
			<button
				class="secondary-action"
				type="button"
				disabled={!selectedRoute}
				onclick={removeSelection}
			>
				Remover preferência
			</button>
		</div>
		{#if feedback}
			<p class="feedback" aria-live="polite">{feedback}</p>
		{/if}
	</section>
{/if}

<style>
	.start-panel,
	.config-picker {
		width: 100%;
	}

	.start-panel {
		max-width: 700px;
	}

	.eyebrow {
		margin: 0 0 12px;
		color: var(--muted-foreground);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 500;
	}

	h2 {
		margin: 0;
		font-size: clamp(1.25rem, 3vw, 1.65rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.panel-lead {
		max-width: 560px;
		margin: 0 0 4px;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.intro {
		max-width: 520px;
		margin: 14px 0 0;
		color: var(--muted-foreground);
		font-size: 1rem;
		line-height: 1.6;
	}

	:global(.start-items),
	.route-options {
		margin-top: 24px;
	}

	.config-picker.embedded :global(.start-items),
	.config-picker.embedded .route-options {
		margin-top: 18px;
	}

	:global(.start-item) {
		padding: 0;
		background: transparent;
		transition:
			background-color 160ms ease,
			border-color 160ms ease,
			color 160ms ease;
	}

	:global(.start-item:hover) {
		border-color: var(--foreground);
		background: var(--muted);
	}

	:global(.item-link) {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 16px;
		padding: 18px;
		color: inherit;
		text-align: left;
		text-decoration: none;
	}

	:global(.item-link:focus-visible) {
		border-radius: inherit;
		outline: 3px solid color-mix(in oklch, var(--ring) 45%, transparent);
		outline-offset: -3px;
	}

	:global(.item-link:disabled) {
		cursor: not-allowed;
		opacity: 0.66;
	}

	:global(.item-icon) {
		display: grid;
		width: 42px;
		height: 42px;
		flex: 0 0 42px;
		place-items: center;
		border-radius: 12px;
	}

	:global(.bible-icon) {
		color: var(--primary);
	}

	:global(.sermon-icon) {
		color: var(--foreground);
	}

	:global(.study-icon) {
		color: var(--muted-foreground);
	}

	:global([data-slot='item-title']) {
		font-family: var(--font-sans);
		font-size: 0.98rem;
	}

	:global([data-slot='item-title'] svg) {
		color: var(--muted-foreground);
	}

	.coming-soon {
		margin-left: 8px;
		color: var(--muted-foreground);
		font-family: var(--font-sans);
		font-size: 0.62rem;
		font-weight: 600;
	}

	.section-heading {
		max-width: 560px;
	}

	.route-options {
		display: grid;
		gap: 12px;
		border: 0;
		padding: 0;
	}

	.route-option {
		position: relative;
		display: block;
		cursor: pointer;
	}

	.route-option input {
		position: absolute;
		inset: 0;
		z-index: 1;
		width: 100%;
		height: 100%;
		cursor: pointer;
		opacity: 0;
	}

	:global(.config-item) {
		min-height: 80px;
		background: transparent;
	}

	.route-option:has(input:focus-visible) :global([data-slot='item']) {
		border-color: var(--ring);
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 25%, transparent);
	}

	.route-option.selected :global([data-slot='item']) {
		border-color: var(--primary);
		background: var(--muted);
	}

	.disabled-option {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin-top: 28px;
	}

	.primary-action,
	.secondary-action {
		min-height: 42px;
		border-radius: 10px;
		padding: 0 16px;
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 600;
		transition:
			opacity 160ms ease,
			background 160ms ease;
	}

	.primary-action {
		border: 1px solid var(--primary);
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.secondary-action {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--foreground);
	}

	.primary-action:hover:not(:disabled),
	.secondary-action:hover:not(:disabled) {
		opacity: 0.82;
	}

	.primary-action:focus-visible,
	.secondary-action:focus-visible {
		outline: 3px solid color-mix(in oklch, var(--ring) 35%, transparent);
		outline-offset: 2px;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.feedback {
		margin: 16px 0 0;
		color: var(--primary);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		line-height: 1.5;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.start-item),
		.primary-action,
		.secondary-action {
			transition: none;
		}
	}

	@media (max-width: 560px) {
		:global(.item-link) {
			align-items: flex-start;
			padding: 16px;
		}

		:global(.item-icon) {
			width: 38px;
			height: 38px;
			flex-basis: 38px;
		}

		.actions {
			align-items: stretch;
			flex-direction: column;
		}

		.primary-action,
		.secondary-action {
			width: 100%;
		}
	}
</style>
