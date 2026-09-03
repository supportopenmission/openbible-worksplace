<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import OnboardingModal from '$lib/features/onboarding/OnboardingModal.svelte';
	import InitialScreenPicker from '$lib/features/navigation/InitialScreenPicker.svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { homeRoutePath, readHomeRoute } from '$lib/navigation/home-preference';
	import { detectStorageKind } from '$lib/storage/environment';
	import { chooseWorkspaceStorage, createConfiguredStorage } from '$lib/storage/storage-registry';
	import { loadWorkspaceConfig } from '$lib/storage/workspace';
	import type { StorageKind, WorkspaceStorage } from '$lib/storage/types';
	import type { OnboardingStep } from '$lib/features/onboarding/onboarding-copy';

	let {
		initialWorkspaceConfigured = false,
		storageOverride = null
	}: {
		initialWorkspaceConfigured?: boolean;
		storageOverride?: WorkspaceStorage | null;
	} = $props();

	const workspace = getWorkspaceState();

	let selectedStorage = $state<WorkspaceStorage | null>(null);
	let onboardingClosed = $state(false);
	let importRequested = $state(false);
	let initialError = $state('');
	let redirecting = $state(false);
	let onboardingStep = $state<OnboardingStep>('intro');
	let logoFailed = $state(false);
	let storageMode = $state<StorageKind>(
		typeof window === 'undefined' ? 'opfs' : detectStorageKind()
	);
	let storage = $derived(storageOverride ?? selectedStorage ?? workspace?.storage ?? null);
	let showOnboarding = $derived(
		importRequested || (!onboardingClosed && !initialWorkspaceConfigured)
	);

	function preferredHomeRoute() {
		return workspace?.preferences.initialRoute ?? readHomeRoute();
	}

	async function syncFromWorkspace() {
		if (!workspace) return;
		if (workspace.error) initialError = workspace.error;
		if (workspace.status === 'ready' && !importRequested) onboardingClosed = true;
		if (workspace.status === 'unconfigured') onboardingClosed = false;
	}

	onMount(async () => {
		importRequested = new URLSearchParams(window.location.search).get('import') === 'bible';
		if (importRequested) onboardingStep = 'import';
		if (initialWorkspaceConfigured && !importRequested) {
			onboardingClosed = true;
			redirectToPreferredHome();
			return;
		}

		storageMode = detectStorageKind();
		if (workspace) {
			await syncFromWorkspace();
			if (workspace.status === 'ready' && !importRequested) redirectToPreferredHome();
			return;
		}

		try {
			selectedStorage = storageOverride ?? (await createConfiguredStorage());
			if (selectedStorage) {
				const config = await loadWorkspaceConfig(selectedStorage);
				if (config) {
					if (!importRequested) {
						onboardingClosed = true;
						redirectToPreferredHome();
					}
				}
			}
		} catch (error) {
			initialError =
				error instanceof Error ? error.message : 'Não foi possível acessar o armazenamento.';
		}
	});

	async function chooseStorage() {
		selectedStorage = await chooseWorkspaceStorage();
		return selectedStorage;
	}

	async function closeOnboarding() {
		importRequested = false;
		onboardingClosed = true;
		if (storage && workspace) await workspace.markConfigured(storage);
		redirectToPreferredHome();
	}

	async function deferImport() {
		await closeOnboarding();
	}

	function finishOnboarding() {
		void closeOnboarding();
	}

	function redirectToPreferredHome() {
		const route = preferredHomeRoute();
		if (!route) return;
		redirecting = true;
		void goto(resolve(homeRoutePath(route)));
	}
</script>

<svelte:head>
	<title>OpenBible</title>
	<meta name="description" content="Seu espaço local para estudos bíblicos." />
</svelte:head>

{#if showOnboarding}
	{#key onboardingStep}
		<OnboardingModal
			{storageMode}
			{storage}
			{initialError}
			initialStep={onboardingStep}
			onChooseStorage={chooseStorage}
			onDeferred={deferImport}
			onComplete={finishOnboarding}
		/>
	{/key}
{:else}
	{#if redirecting}
		<main class="project-home redirecting" aria-live="polite">
			<p class="eyebrow">Seu espaço de estudo</p>
			<p class="description">Abrindo sua tela inicial...</p>
		</main>
	{:else}
		<main class="project-home">
			<div class="home-intro">
				{#if !logoFailed}
					<h1 class="sr-only">OpenBible</h1>
					<img class="home-logo" src="/logo.png" alt="" aria-hidden="true" onerror={() => (logoFailed = true)} />
				{:else}
					<h1>OpenBible</h1>
				{/if}
				<p class="eyebrow">Seu espaço de estudo</p>
				<p class="description">
					Um lugar calmo para ler, estudar e preparar o que você vai compartilhar.
				</p>
			</div>
			<div class="home-actions">
				<InitialScreenPicker />
			</div>
		</main>
	{/if}
{/if}

<style>
	.project-home {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(320px, 520px);
		align-items: center;
		gap: clamp(48px, 9vw, 128px);
		max-width: 1120px;
		min-height: 100dvh;
		margin: 0 auto;
		padding: max(48px, env(safe-area-inset-top)) clamp(24px, 5vw, 64px)
			max(48px, env(safe-area-inset-bottom));
	}

	.project-home.redirecting {
		display: grid;
		grid-template-columns: 1fr;
		place-content: center;
		max-width: 720px;
	}

	.home-logo {
		display: block;
		width: min(240px, 72vw);
		height: auto;
		margin-bottom: 32px;
		filter: invert(1);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
		white-space: nowrap;
	}

	:global(.dark) .home-logo {
		filter: none;
	}

	.eyebrow {
		margin: 0 0 10px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.75rem, 7vw, 4.5rem);
		font-weight: 600;
		letter-spacing: -0.06em;
		line-height: 1;
	}

	.description {
		max-width: 430px;
		margin: 20px 0 0;
		color: var(--muted-foreground);
		font-size: 1rem;
		line-height: 1.6;
	}

	.home-actions {
		min-width: 0;
	}

	@media (max-width: 1024px) {
		.project-home {
			grid-template-columns: minmax(0, 560px);
			justify-content: center;
			gap: 48px;
			padding-right: max(24px, env(safe-area-inset-right));
			padding-bottom: max(24px, env(safe-area-inset-bottom));
			padding-left: max(24px, env(safe-area-inset-left));
		}

		.home-logo {
			margin-bottom: 24px;
		}
	}
</style>
