<script lang="ts">
	import { onMount } from 'svelte';
	import OnboardingModal from '$lib/features/onboarding/OnboardingModal.svelte';
	import HomePage from '$lib/features/home/HomePage.svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { detectStorageKind } from '$lib/storage/environment';
	import {
		chooseBrowserWorkspaceStorage,
		chooseWorkspaceStorage,
		createConfiguredStorage
	} from '$lib/storage/storage-registry';
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
	let onboardingStep = $state<OnboardingStep>('intro');
	let storageMode = $state<StorageKind>(
		typeof window === 'undefined' ? 'opfs' : detectStorageKind()
	);
	let storage = $derived(storageOverride ?? selectedStorage ?? workspace?.storage ?? null);
	let showOnboarding = $derived(
		importRequested || (!onboardingClosed && !initialWorkspaceConfigured)
	);

	async function syncFromWorkspace() {
		if (!workspace) return;
		if (workspace.error) initialError = workspace.error;
		if (workspace.status === 'ready' && !importRequested) onboardingClosed = true;
		if (workspace.status === 'unconfigured') onboardingClosed = false;
	}

	function clearLegacyHomeRoute() {
		try {
			window.localStorage.removeItem('openbible.initial-route');
		} catch {
			// Cache legível indisponível não impede a home.
		}
	}

	onMount(async () => {
		clearLegacyHomeRoute();
		importRequested = new URLSearchParams(window.location.search).get('import') === 'bible';
		if (importRequested) onboardingStep = 'import';
		if (initialWorkspaceConfigured && !importRequested) {
			onboardingClosed = true;
			return;
		}

		storageMode = detectStorageKind();
		if (workspace) {
			await syncFromWorkspace();
			return;
		}

		try {
			selectedStorage = storageOverride ?? (await createConfiguredStorage());
			if (selectedStorage) {
				const config = await loadWorkspaceConfig(selectedStorage);
				if (config && !importRequested) onboardingClosed = true;
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

	async function chooseBrowserStorage() {
		selectedStorage = await chooseBrowserWorkspaceStorage();
		return selectedStorage;
	}

	async function closeOnboarding() {
		importRequested = false;
		onboardingClosed = true;
		if (storage && workspace) await workspace.markConfigured(storage);
	}

	async function deferImport() {
		await closeOnboarding();
	}

	function finishOnboarding() {
		void closeOnboarding();
	}
</script>

<svelte:head>
	<title>Início | OpenBible</title>
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
			onChooseBrowserStorage={chooseBrowserStorage}
			onDeferred={deferImport}
			onComplete={finishOnboarding}
		/>
	{/key}
{:else}
	<HomePage {storage} />
{/if}
