<script lang="ts">
	import LocalBibleImport from './LocalBibleImport.svelte';
	import BibleLibraryManager from './BibleLibraryManager.svelte';
	import RemoteBibleImport from '$lib/features/bible-remote/RemoteBibleImport.svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';

	const workspace = getWorkspaceState();
	const storage = $derived(workspace?.storage ?? null);
	let libraryVersion = $state(0);

	function refreshLibrary() {
		libraryVersion += 1;
	}
</script>

<div class="bible-settings">
	{#key libraryVersion}
		<BibleLibraryManager />
	{/key}

	<section class="import-section" aria-labelledby="bible-import-heading">
		<div class="section-head">
			<p class="eyebrow">Importação</p>
			<h2 id="bible-import-heading">Adicionar Bíblias</h2>
			<p class="intro">
				Instale Bíblias do seu computador ou carregue uma versão disponível online.
			</p>
		</div>

		{#if storage}
			<div class="import-sources">
				<section class="import-source" aria-labelledby="local-bible-import-heading">
					<h3 id="local-bible-import-heading">Do seu computador</h3>
					<p>Arraste ou selecione uma ou mais Bíblias para instalar no espaço de estudo.</p>
					<LocalBibleImport {storage} onInstalled={refreshLibrary} />
				</section>

				<section class="import-source" aria-labelledby="remote-bible-import-heading">
					<h3 id="remote-bible-import-heading">De um endereço online</h3>
					<p>Informe um endereço público para listar e instalar arquivos de Bíblia.</p>
					<RemoteBibleImport {storage} variant="config" bare onInstalled={refreshLibrary} />
				</section>
			</div>
		{:else}
			<p class="state-message" role="status">
				Espaço de estudo indisponível. Configure o armazenamento antes de importar Bíblias.
			</p>
		{/if}
	</section>
</div>

<style>
	.bible-settings {
		display: grid;
		gap: 28px;
		width: 100%;
	}

	.import-section {
		margin-top: 4px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
	}

	.section-head {
		display: grid;
		gap: 4px;
	}

	.eyebrow {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	h2,
	h3 {
		margin: 0;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	h2 {
		font-size: 1.1rem;
	}

	h3 {
		font-size: 0.95rem;
	}

	.intro,
	.state-message,
	.import-source > p {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.import-sources {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 28px;
		margin-top: 24px;
	}

	.import-source {
		display: grid;
		align-content: start;
		gap: 10px;
		min-width: 0;
	}

	.import-source > p {
		margin-bottom: 4px;
	}

	@media (max-width: 720px) {
		.import-sources {
			grid-template-columns: 1fr;
		}
	}
</style>
