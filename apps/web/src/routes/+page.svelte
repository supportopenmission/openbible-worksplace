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
	import type { ImportResult, StorageKind, WorkspaceStorage } from '$lib/storage/types';
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
	let importStatus = $state<'pending' | 'complete' | 'partial'>('pending');
	let initialError = $state('');
	let redirecting = $state(false);
	let onboardingStep = $state<OnboardingStep>('intro');
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
		if (workspace.config) importStatus = workspace.config.bibleImportStatus;
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
					importStatus = config.bibleImportStatus;
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
		importStatus = 'pending';
		await closeOnboarding();
	}

	async function finishOnboarding(results: ImportResult[]) {
		if (results.some((result) => result.status === 'imported')) {
			importStatus = results.every((result) => result.status === 'imported')
				? 'complete'
				: 'partial';
		}
		await closeOnboarding();
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
				<img class="home-logo" src="/logo.png" alt="Logo do OpenBible" />
				<p class="eyebrow">Seu espaço de estudo</p>
				<h1>OpenBible</h1>
				<p class="description">
					Um lugar calmo para ler, estudar e preparar o que você vai compartilhar.
				</p>
			</div>
			<div class="home-actions">
				<InitialScreenPicker />
				<div class="workspace-status" aria-live="polite">
					<span
						class:status-complete={importStatus === 'complete'}
						class="status-dot"
						aria-hidden="true"
					></span>
					<strong
						>{importStatus === 'pending'
							? 'Bíblias pendentes'
							: importStatus === 'partial'
								? 'Importação parcial'
								: 'Bíblias prontas'}</strong
					>
					<span
						>{importStatus === 'pending'
							? 'Você pode importar seus arquivos SQLite quando quiser.'
							: importStatus === 'partial'
								? 'Alguns arquivos precisam de atenção.'
								: 'Sua biblioteca está disponível no workspace.'}</span
					>
				</div>
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

	.workspace-status {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: 10px;
		margin-top: 48px;
		padding: 16px 0;
		border-block: 1px solid var(--border);
	}

	.workspace-status > span:last-child {
		grid-column: 2;
		color: var(--muted-foreground);
		font-size: 0.84rem;
		line-height: 1.5;
	}

	.status-dot {
		width: 7px;
		height: 7px;
		margin-top: 6px;
		border-radius: 50%;
		background: var(--muted-foreground);
	}

	.status-dot.status-complete {
		background: var(--foreground);
	}

	@media (max-width: 760px) {
		.project-home {
			grid-template-columns: 1fr;
			align-content: center;
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
