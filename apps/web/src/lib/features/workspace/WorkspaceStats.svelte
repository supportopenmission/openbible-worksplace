<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { collectWorkspaceStats, type WorkspaceStats } from './workspace-stats';

	let { storage = undefined }: { storage?: WorkspaceStorage | null } = $props();

	const workspace = getWorkspaceState();
	const effectiveStorage = $derived(storage ?? workspace?.storage ?? null);

	let stats = $state<WorkspaceStats | null>(null);
	let loading = $state(true);
	let error = $state('');

	async function loadStats() {
		const current = effectiveStorage;
		if (!current) {
			loading = false;
			return;
		}
		loading = true;
		error = '';
		try {
			stats = await collectWorkspaceStats(current);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Não foi possível calcular as estatísticas.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadStats();
	});

	function formatBytes(bytes: number): string {
		if (bytes <= 0) return '0 KB';
		if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	const isEmpty = $derived(
		stats !== null &&
			stats.bibles.count === 0 &&
			stats.notes.active === 0 &&
			stats.notes.trash === 0 &&
			stats.sermons.count === 0
	);
</script>

<section class="workspace-stats" aria-labelledby="workspace-stats-heading">
	<div class="stats-head">
		<p class="eyebrow">Uso</p>
		<h2 id="workspace-stats-heading">Estatísticas do workspace</h2>
		<p class="intro">Contagens calculadas neste dispositivo, sem rede. Valores de tamanho são estimativas.</p>
	</div>

	{#if !effectiveStorage}
		<p class="state-message" role="status">Workspace indisponível. Configure o armazenamento para ver estatísticas.</p>
	{:else if loading}
		<p class="state-message" role="status" aria-live="polite">Calculando estatísticas…</p>
	{:else if error && !stats}
		<div class="state-panel" role="alert">
			<p>{error}</p>
			<Button type="button" variant="outline" onclick={loadStats}>Tentar novamente</Button>
		</div>
	{:else if stats}
		<dl class="stats-grid">
			<div>
				<dt>Bíblias</dt>
				<dd>{stats.bibles.count} <span>{formatBytes(stats.bibles.bytes)}</span></dd>
			</div>
			<div>
				<dt>Notas ativas</dt>
				<dd>{stats.notes.active}</dd>
			</div>
			<div>
				<dt>Notas na lixeira</dt>
				<dd>{stats.notes.trash}</dd>
			</div>
			<div>
				<dt>Sermões</dt>
				<dd>{stats.sermons.count}</dd>
			</div>
			<div>
				<dt>Espaço estimado</dt>
				<dd>{formatBytes(stats.bytesTotal)}</dd>
			</div>
		</dl>
		{#if isEmpty}
			<p class="state-message" role="status">
				Workspace novo: importe uma Bíblia ou crie a primeira nota para começar.
			</p>
		{/if}
	{/if}
</section>

<style>
	.workspace-stats {
		width: 100%;
		display: grid;
		gap: 14px;
	}
	.eyebrow {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}
	h2 {
		margin: 4px 0 0;
		font-size: 1.1rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.intro,
	.state-message {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}
	.state-panel {
		display: grid;
		gap: 12px;
		justify-items: start;
	}
	.state-panel p {
		margin: 0;
		color: var(--destructive);
		font-size: 0.82rem;
	}
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
		margin: 0;
	}
	.stats-grid > div {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 12px 14px;
	}
	.stats-grid dt {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.72rem;
	}
	.stats-grid dd {
		margin: 4px 0 0;
		font-size: 1.15rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.stats-grid dd span {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}
	@media (max-width: 480px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
