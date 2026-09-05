<script lang="ts">
	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		getAppUpdateState,
		installAppUpdate,
		checkForAppUpdate
	} from '$lib/updates/app-updates.svelte';

	let open = $state(false);
	const update = getAppUpdateState();

	onMount(() => {
		const handleOpen = () => (open = true);
		window.addEventListener('openbible:update-open', handleOpen);
		if (update.status === 'available' && !update.version) open = true;
		return () => window.removeEventListener('openbible:update-open', handleOpen);
	});

	async function install() {
		await installAppUpdate();
	}

	async function retry() {
		await checkForAppUpdate();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content showCloseButton={true} class="update-dialog">
		<Dialog.Title>Atualização do OpenBible</Dialog.Title>
		<Dialog.Description>
			{#if update.status === 'available'}
				{#if update.version}
					A versão v{update.version} está pronta para ser baixada.
				{:else}
					Uma nova versão do app está disponível.
				{/if}
			{:else if update.status === 'downloading'}
				Baixando e instalando a nova versão…
			{:else if update.status === 'restarting'}
				Atualização instalada. Reiniciando o OpenBible…
			{:else if update.status === 'error'}
				Não foi possível concluir a atualização.
			{:else}
				Não há atualização pendente no momento.
			{/if}
		</Dialog.Description>

		{#if update.status === 'available'}
			<p class="update-notes">{update.notes}</p>
			<div class="update-dialog-actions">
				<Button type="button" onclick={install}
					>{update.version ? 'Baixar e instalar' : 'Atualizar agora'}</Button
				>
				<Button type="button" variant="outline" onclick={() => (open = false)}>Agora não</Button>
			</div>
		{:else if update.status === 'downloading'}
			<div class="progress-track" aria-label={`Download ${update.progress}%`}>
				<div class="progress-value" style={`width: ${update.progress}%`}></div>
			</div>
			<p class="progress-label" role="status" aria-live="polite">
				{update.progress > 0 ? `${update.progress}% concluído` : 'Preparando download…'}
			</p>
		{:else if update.status === 'error'}
			<p class="update-error" role="alert">{update.error}</p>
			<Button type="button" variant="outline" onclick={retry}>Tentar novamente</Button>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.update-dialog) {
		gap: 14px;
	}

	.update-notes {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.update-dialog-actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.progress-track {
		height: 6px;
		overflow: hidden;
		border-radius: 999px;
		background: color-mix(in oklch, var(--foreground) 12%, transparent);
	}

	.progress-value {
		height: 100%;
		background: var(--foreground);
		transition: width 180ms ease;
	}

	.progress-label,
	.update-error {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.78rem;
	}

	.update-error {
		color: var(--destructive);
	}
</style>
