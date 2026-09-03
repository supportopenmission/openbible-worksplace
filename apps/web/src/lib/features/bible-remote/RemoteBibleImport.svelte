<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { installRemoteBibles } from './remote-install';
	import { loadRemoteCatalog, type RemoteBibleFile } from './remote-manifest';
	import type { ImportResult, WorkspaceStorage } from '$lib/storage/types';

	let {
		storage,
		variant = 'config',
		initialUrl = '',
		bare = false,
		onInstalled = undefined
	}: {
		storage: WorkspaceStorage | null;
		variant?: 'onboarding' | 'bible' | 'config';
		initialUrl?: string;
		bare?: boolean;
		onInstalled?: (results: ImportResult[]) => void;
	} = $props();

	interface RowState extends RemoteBibleFile {
		selected: boolean;
		installed: boolean;
		progress: number | null;
		statusMessage: string;
	}

	let bucketUrl = $state('');
	let urlInitialized = $state(false);

	$effect.pre(() => {
		if (!urlInitialized) {
			bucketUrl = initialUrl;
			urlInitialized = true;
		}
	});
	let loadingList = $state(false);
	let listError = $state('');
	let rows = $state<RowState[]>([]);
	let installing = $state(false);
	let overall = $state({ done: 0, total: 0 });
	let results = $state<ImportResult[]>([]);
	let diagnostics = $state<string[]>([]);

	const selectedCount = $derived(rows.filter((row) => row.selected && !row.installed).length);
	const hasList = $derived(rows.length > 0);

	async function loadList() {
		if (!storage) {
			listError = 'Workspace indisponível. Configure o armazenamento antes de importar.';
			return;
		}
		loadingList = true;
		listError = '';
		results = [];
		try {
			const installedNames = await storage.listFiles('bibles');
			const installed = new Set(installedNames);
			const { catalog } = await loadRemoteCatalog(bucketUrl, fetch, installed);
			diagnostics = catalog.diagnostics;
			rows = catalog.entries.map((entry) => ({
				...entry,
				selected: !installed.has(entry.name),
				installed: installed.has(entry.name),
				progress: null,
				statusMessage: installed.has(entry.name) ? 'Instalado' : ''
			}));
			if (rows.length === 0) listError = 'Nenhum .sqlite encontrado no manifest.';
		} catch (error) {
			listError = error instanceof Error ? error.message : 'Não foi possível carregar a lista.';
		} finally {
			loadingList = false;
		}
	}

	function toggleAll(select: boolean) {
		rows = rows.map((row) => (row.installed ? row : { ...row, selected: select }));
	}

	async function installSelected() {
		if (!storage || installing) return;
		const selected = rows.filter((row) => row.selected && !row.installed);
		if (selected.length === 0) return;
		installing = true;
		results = [];
		overall = { done: 0, total: selected.length };
		rows = rows.map((row) =>
			selected.some((item) => item.url === row.url) ? { ...row, progress: 0, statusMessage: 'Baixando' } : row
		);
		try {
			const outcomes = await installRemoteBibles(storage, selected, {
				onFileProgress: (name, loaded, total) => {
					rows = rows.map((row) =>
						row.name === name
							? {
									...row,
									progress: total ? Math.min(99, Math.round((loaded / total) * 100)) : null,
									statusMessage: 'Baixando'
								}
							: row
					);
				},
				onBatchProgress: (progress) => {
					overall = { done: progress.completedFiles, total: progress.totalFiles };
				}
			});
			results = outcomes;
			if (outcomes.some((outcome) => outcome.status === 'imported')) {
				onInstalled?.(outcomes);
			}
			const byName = new Map(outcomes.map((result) => [result.name, result]));
			const installedNow = new Set(
				[...(await storage.listFiles('bibles'))]
			);
			rows = rows.map((row) => {
				const outcome = byName.get(row.name);
				if (!outcome) return row;
				return {
					...row,
					progress: outcome.status === 'imported' ? 100 : row.progress,
					installed: outcome.status === 'imported' || installedNow.has(row.name),
					selected: false,
					statusMessage:
						outcome.status === 'imported'
							? 'Instalado'
							: outcome.reason === 'duplicate'
								? 'Já existe'
								: 'Falhou ao instalar'
				};
			});
		} finally {
			installing = false;
		}
	}
</script>

<section class="remote-import" data-variant={variant}>
	{#if !bare}
		<div class="remote-head">
			<h2>Bucket R2</h2>
			<p class="intro">Informe a URL pública do bucket. Listamos os <code>.sqlite</code> e instalamos com progresso por arquivo.</p>
		</div>
	{/if}

	<form
		onsubmit={(event) => {
			event.preventDefault();
			void loadList();
		}}
	>
		<label class="url-field">
			<span>URL do bucket</span>
			<InputGroup.Root class="url-group">
				<InputGroup.Input
					type="url"
					inputmode="url"
					placeholder="https://..."
					bind:value={bucketUrl}
					autocomplete="url"
					required
				/>
				<InputGroup.Addon align="inline-end">
					<InputGroup.Button
						type="submit"
						variant="default"
						size="sm"
						disabled={loadingList || installing || bucketUrl.trim().length === 0}
					>
						{loadingList ? 'Carregando…' : 'Carregar'}
					</InputGroup.Button>
				</InputGroup.Addon>
			</InputGroup.Root>
		</label>
	</form>
	<p class="hint">Lemos <code>manifest.json</code> na raiz (ou <code>index.json</code>). Uma URL direta <code>.sqlite</code> importa um único arquivo.</p>

	{#if listError}
		<p class="error" role="alert">{listError}</p>
		<div class="help" aria-live="polite">
			<strong>Como corrigir no R2:</strong>
			<span>1. Abra <code>{bucketUrl.trim().replace(/\/$/, '')}/manifest.json</code> em nova aba. Se der 404/NoSuchKey, suba o manifest.</span>
			<span>2. Use URL pública (r2.dev ou domínio próprio), não o endpoint <code>r2.cloudflarestorage.com</code>.</span>
			<span>3. Em R2 → bucket → Settings → CORS Policy, libere GET para este origin.</span>
		</div>
	{/if}

	{#if hasList}
		<div class="list-toolbar">
			<span aria-live="polite">{rows.length} arquivo(s) · {selectedCount} selecionado(s)</span>
			<div class="toolbar-actions">
				<Button variant="ghost" size="sm" type="button" onclick={() => toggleAll(true)} disabled={installing}>Selecionar todos</Button>
				<Button variant="ghost" size="sm" type="button" onclick={() => toggleAll(false)} disabled={installing}>Limpar</Button>
			</div>
		</div>

		<ul class="remote-list" aria-label="Arquivos SQLite disponíveis">
			{#each rows as row (row.url)}
				<li class:installed={row.installed}>
					<label class="row-select">
						<input type="checkbox" bind:checked={row.selected} disabled={row.installed || installing} />
						<span class="row-main">
							<strong class="row-name">{row.name}</strong>
							<small class="row-meta">
								{row.size ? `${(row.size / 1024 / 1024).toFixed(1)} MB` : 'tamanho desconhecido'} · {row.statusMessage || 'Disponível'}
							</small>
						</span>
					</label>
					{#if row.progress !== null}
						<div class="row-progress">
							<progress
								max="100"
								value={row.progress}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-valuenow={row.progress}
								aria-label={`Progresso de ${row.name}`}
							></progress>
							<span>{row.progress}%</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if diagnostics.length > 0}
			<p class="feedback" aria-live="polite">{diagnostics.length} item(ns) ignorado(s) no manifest.</p>
		{/if}

		<div class="install-bar">
			{#if overall.total > 0}
				<span aria-live="polite">{overall.done} de {overall.total} concluído(s)</span>
			{/if}
			<Button type="button" onclick={installSelected} disabled={installing || selectedCount === 0}>
				{installing ? 'Instalando...' : `Instalar selecionadas (${selectedCount})`}
			</Button>
		</div>
	{/if}

	{#if results.length > 0}
		<ul class="results" aria-label="Resultado da instalação" aria-live="polite">
			{#each results as result (result.name)}
				<li class:rejected={result.status === 'rejected'}>
					<span>{result.name}</span>
					<small>{result.status === 'imported' ? 'Instalado' : (result.reason ?? 'rejeitado')}</small>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.remote-import {
		width: 100%;
		display: grid;
		gap: 14px;
	}
	h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.intro,
	.hint,
	.feedback {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}
	code {
		font-family: var(--font-mono);
		font-size: 0.86em;
	}
	.url-field {
		display: grid;
		gap: 6px;
		font-size: 0.8rem;
		font-weight: 600;
	}
	.url-field :global(.url-group) {
		min-height: 42px;
	}
	.url-field :global(.url-group:focus-within) {
		border-color: color-mix(in oklch, var(--foreground) 35%, var(--border));
		box-shadow: none;
		outline: none;
		--tw-ring-shadow: 0 0 #0000;
		--tw-ring-offset-shadow: 0 0 #0000;
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
	.help {
		display: grid;
		gap: 4px;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.55;
	}
	.list-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		font-size: 0.8rem;
	}
	.toolbar-actions {
		display: flex;
		gap: 8px;
	}
	.remote-list,
	.results {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.remote-list li,
	.results li {
		display: grid;
		gap: 8px;
		padding: 10px 12px;
		border-top: 1px solid var(--border);
		font-size: 0.82rem;
	}
	.remote-list li:first-child,
	.results li:first-child {
		border-top: 0;
	}
	.row-select {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		cursor: pointer;
	}
	.row-main {
		display: grid;
		gap: 2px;
		min-width: 0;
	}
	.row-name {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		overflow-wrap: anywhere;
	}
	.row-meta {
		color: var(--muted-foreground);
	}
	.row-progress {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.row-progress progress {
		flex: 1;
		height: 6px;
		accent-color: var(--foreground);
	}
	.install-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		font-size: 0.82rem;
	}
	.results li {
		display: flex;
		justify-content: space-between;
	}
	.results li.rejected {
		color: var(--destructive);
	}
	@media (max-width: 560px) {
		.list-toolbar,
		.install-bar {
			flex-direction: column;
			align-items: stretch;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		* {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
