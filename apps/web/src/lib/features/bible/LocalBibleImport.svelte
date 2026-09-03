<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { importBibleFiles } from '$lib/storage/workspace';
	import type { ImportResult, WorkspaceStorage } from '$lib/storage/types';

	let {
		storage,
		onInstalled = undefined
	}: {
		storage: WorkspaceStorage | null;
		onInstalled?: (results: ImportResult[]) => void;
	} = $props();

	let fileInput = $state<HTMLInputElement | undefined>();
	let selectedFiles = $state<File[]>([]);
	let results = $state<ImportResult[]>([]);
	let importing = $state(false);
	let progress = $state(0);
	let errorMessage = $state('');

	function chooseFiles(files: FileList | File[]) {
		selectedFiles = Array.from(files);
		results = [];
		errorMessage = '';
		if (selectedFiles.length === 0) {
			errorMessage = 'Selecione pelo menos um arquivo com extensão .sqlite.';
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer?.files) chooseFiles(event.dataTransfer.files);
	}

	async function importFiles() {
		if (!storage || selectedFiles.length === 0 || importing) return;
		importing = true;
		errorMessage = '';
		progress = 0;
		try {
			results = await importBibleFiles(storage, selectedFiles, (value) => {
				progress = Math.round(value * 100);
			});
			if (results.some((result) => result.status === 'imported')) {
				onInstalled?.(results);
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível importar as Bíblias.';
		} finally {
			importing = false;
		}
	}
</script>

<div class="local-import">
	<div
		class="dropzone"
		role="button"
		tabindex="0"
		aria-label="Selecionar Bíblias SQLite"
		onkeydown={(event) => (event.key === 'Enter' || event.key === ' ' ? fileInput?.click() : undefined)}
		ondragover={(event) => event.preventDefault()}
		ondrop={handleDrop}
	>
		<strong>Arraste seus arquivos SQLite</strong>
		<span>ou selecione pelo diálogo de arquivos</span>
		<Button variant="outline" size="sm" type="button" onclick={() => fileInput?.click()} disabled={importing}>
			Selecionar arquivos
		</Button>
		<input
			bind:this={fileInput}
			class="visually-hidden"
			type="file"
			accept=".sqlite"
			multiple
			onchange={(event) => chooseFiles((event.currentTarget as HTMLInputElement).files ?? [])}
		/>
	</div>

	{#if selectedFiles.length > 0}
		<p class="file-summary" aria-live="polite">
			{selectedFiles.length} arquivo(s) pronto(s) para importar.
		</p>
	{/if}

	{#if importing || progress > 0}
		<div class="progress-wrap" aria-label="Progresso da importação">
			<progress
				min="0"
				max="100"
				value={progress}
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={progress}
				aria-label="Progresso da importação"
			></progress>
			<span>{progress}%</span>
		</div>
	{/if}

	{#if results.length > 0}
		<ul class="results" aria-label="Resultado da importação" aria-live="polite">
			{#each results as result, index (result.name + index)}
				<li class:rejected={result.status === 'rejected'}>
					<span>{result.name}</span>
					<small>
						{result.status === 'imported'
							? 'Importado'
							: result.reason === 'duplicate'
								? 'Já existe'
								: result.reason === 'copy-failed'
									? 'Falha ao copiar'
									: 'SQLite inválido'}
					</small>
				</li>
			{/each}
		</ul>
	{/if}

	{#if errorMessage}
		<p class="error" role="alert">{errorMessage}</p>
	{/if}

	<div class="import-actions">
		<Button type="button" onclick={importFiles} disabled={importing || selectedFiles.length === 0}>
			{importing ? 'Importando…' : 'Importar Bíblias'}
		</Button>
	</div>
</div>

<style>
	.local-import {
		display: grid;
		gap: 12px;
	}
	.dropzone {
		display: grid;
		place-items: center;
		gap: 8px;
		padding: 24px 16px;
		border: 1px dashed color-mix(in oklch, var(--foreground) 22%, var(--border));
		border-radius: var(--radius);
		background: color-mix(in oklch, var(--foreground) 2%, transparent);
		text-align: center;
	}
	.dropzone:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}
	.dropzone strong {
		font-size: 0.88rem;
		font-weight: 600;
	}
	.dropzone span {
		color: var(--muted-foreground);
		font-size: 0.8rem;
	}
	.file-summary {
		margin: 0;
		font-size: 0.82rem;
	}
	.progress-wrap {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.progress-wrap progress {
		flex: 1;
		height: 6px;
		accent-color: var(--foreground);
	}
	.progress-wrap > span {
		min-width: 38px;
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		text-align: right;
	}
	.results {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.results li {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 10px 12px;
		border-top: 1px solid var(--border);
		font-size: 0.8rem;
	}
	.results li:first-child {
		border-top: 0;
	}
	.results li.rejected {
		color: var(--destructive);
	}
	.results small {
		font-weight: 600;
	}
	.error {
		margin: 0;
		padding: 12px 14px;
		border: 1px solid color-mix(in oklch, var(--destructive) 40%, var(--border));
		border-radius: var(--radius);
		background: color-mix(in oklch, var(--destructive) 6%, transparent);
		color: var(--destructive);
		font-size: 0.82rem;
	}
	.import-actions {
		display: flex;
		justify-content: flex-end;
	}
	.visually-hidden {
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
</style>
