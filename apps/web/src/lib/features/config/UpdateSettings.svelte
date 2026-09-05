<script lang="ts">
	import { APP_VERSION } from '$lib/app-version';
	import { Button } from '$lib/components/ui/button/index.js';
	import { detectStorageKind } from '$lib/storage/environment';
	import {
		checkForAppUpdate,
		getAppUpdateState,
		installAppUpdate,
		openAppUpdateDialog
	} from '$lib/updates/app-updates.svelte';

	const update = getAppUpdateState();
	const native = detectStorageKind() === 'native';

	async function verify() {
		if (!native) {
			await installAppUpdate();
			return;
		}
		await checkForAppUpdate();
		if (update.status === 'available') openAppUpdateDialog();
	}
</script>

<section class="update-settings" aria-labelledby="update-settings-title">
	<div>
		<p class="eyebrow">Atualizações</p>
		<h2 id="update-settings-title">Mantenha o OpenBible atualizado</h2>
		<p class="intro">
			{native
				? 'O app nativo verifica a versão publicada e pode baixar e instalar a atualização.'
				: 'O PWA recebe a atualização do app shell ao recarregar a página.'}
		</p>
	</div>

	<div class="update-actions">
		<Button
			type="button"
			onclick={verify}
			disabled={update.status === 'checking' || update.status === 'downloading'}
		>
			{native ? 'Verificar atualização' : 'Atualizar PWA'}
		</Button>
		<span class="current-version">Versão atual: v{APP_VERSION}</span>
	</div>

	{#if update.status === 'checking'}
		<p class="update-feedback" role="status" aria-live="polite">Verificando atualizações…</p>
	{:else if update.status === 'up-to-date'}
		<p class="update-feedback" role="status" aria-live="polite">{update.notes}</p>
	{:else if update.status === 'error'}
		<p class="update-feedback error" role="alert">{update.error}</p>
	{/if}
</section>

<style>
	.update-settings {
		display: grid;
		gap: 20px;
	}

	h2 {
		margin: 4px 0 8px;
		font-size: 1.2rem;
		font-weight: 650;
		letter-spacing: -0.025em;
	}

	.intro {
		max-width: 56ch;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.update-actions {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
	}

	.current-version {
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	.update-feedback {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
	}

	.update-feedback.error {
		color: var(--destructive);
	}
</style>
