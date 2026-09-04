<script lang="ts">
	import { onMount } from 'svelte';
	import { Trash2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { loadWorkspaceConfig } from '$lib/storage/workspace';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import { deleteBibleVersion, listLibraryEntries, type LibraryEntry } from './bible-library';

	let { storage = undefined }: { storage?: WorkspaceStorage | null } = $props();

	const workspace = getWorkspaceState();
	const effectiveStorage = $derived(storage ?? workspace?.storage ?? null);

	let entries = $state<LibraryEntry[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let deleteTarget = $state<LibraryEntry | null>(null);
	let deleting = $state(false);

	const canDelete = $derived(
		!!effectiveStorage && typeof effectiveStorage.deleteFile === 'function'
	);

	function autoReconcileDefaultVersion(currentEntries: LibraryEntry[]) {
		if (!workspace) return;
		const installed = currentEntries.filter((e) => e.status === 'installed');
		if (installed.length === 1) {
			if (workspace.preferences.defaultBibleVersionId !== installed[0].fileName) {
				void workspace.updatePreferences({ defaultBibleVersionId: installed[0].fileName });
			}
		} else if (installed.length > 1) {
			const current = workspace.preferences.defaultBibleVersionId;
			if (!current || !installed.some((e) => e.fileName === current)) {
				void workspace.updatePreferences({ defaultBibleVersionId: installed[0].fileName });
			}
		} else if (installed.length === 0 && workspace.preferences.defaultBibleVersionId) {
			void workspace.updatePreferences({ defaultBibleVersionId: null });
		}
	}

	async function loadEntries() {
		const current = effectiveStorage;
		if (!current) {
			loading = false;
			return;
		}
		loading = true;
		error = '';
		try {
			entries = await listLibraryEntries(current);
			autoReconcileDefaultVersion(entries);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Não foi possível listar as Bíblias.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadEntries();
	});

	async function refreshWorkspaceStatus() {
		const current = effectiveStorage;
		if (!current || !workspace) return;
		try {
			workspace.config = await loadWorkspaceConfig(current);
		} catch {
			// O status local permanece; a lista já reflete o disco.
		}
	}

	async function confirmDelete() {
		const current = effectiveStorage;
		if (!current || !deleteTarget) return;
		deleting = true;
		error = '';
		try {
			const result = await deleteBibleVersion(current, deleteTarget.fileName);
			entries = entries.filter((entry) => entry.fileName !== result.name);
			autoReconcileDefaultVersion(entries);
			notice =
				result.remaining === 0
					? `${result.name} excluída. Nenhuma versão restante.`
					: `${result.name} excluída. ${result.remaining} restante(s).`;
			deleteTarget = null;
			await refreshWorkspaceStatus();
		} catch (err) {
			error = err instanceof Error ? err.message : `Não foi possível excluir ${deleteTarget.fileName}.`;
		} finally {
			deleting = false;
		}
	}

	async function handleSetDefault(fileName: string) {
		if (!workspace) return;
		await workspace.updatePreferences({ defaultBibleVersionId: fileName });
		const found = entries.find((e) => e.fileName === fileName);
		notice = `Versão "${found?.name || fileName}" definida como padrão.`;
	}

	function formatBytes(bytes: number): string {
		if (bytes <= 0) return '0 KB';
		if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}
</script>

<section class="bible-manager" aria-labelledby="bible-manager-heading">
	<div class="manager-head">
		<p class="eyebrow">Biblioteca</p>
		<h2 id="bible-manager-heading">Bíblias instaladas</h2>
		<p class="intro">Versões em <code>bibles/</code>. A exclusão é permanente e não toca em notas ou sermões.</p>
	</div>

	{#if !effectiveStorage}
		<p class="state-message" role="status">Workspace indisponível. Configure o armazenamento para gerenciar Bíblias.</p>
	{:else if loading}
		<p class="state-message" role="status" aria-live="polite">Carregando Bíblias…</p>
	{:else if error && entries.length === 0}
		<div class="state-panel" role="alert">
			<p>{error}</p>
			<Button type="button" variant="outline" onclick={loadEntries}>Tentar novamente</Button>
		</div>
	{:else if entries.length === 0}
		<p class="state-message" role="status">Nenhuma Bíblia instalada. Importe pela aba Armazenamento.</p>
	{:else}
		<ul class="library-list" aria-label="Bíblias instaladas">
			{#each entries as entry (entry.fileName)}
				{@const isInstalled = entry.status === 'installed'}
				{@const installedCount = entries.filter((e) => e.status === 'installed').length}
				{@const isDefault = isInstalled && (workspace?.preferences.defaultBibleVersionId === entry.fileName || installedCount === 1)}
				<li class:invalid={entry.status === 'invalid'}>
					<span class="entry-main">
						<div class="entry-title-row">
							<strong class="entry-name">{entry.name}</strong>
							{#if isDefault}
								<span class="badge-default">Padrão</span>
							{/if}
						</div>
						<small class="entry-meta">
							{entry.fileName}
							{#if entry.status === 'installed'}
								· {entry.books} livro(s) · {formatBytes(entry.size)}
							{:else}
								· {entry.diagnostic ?? 'Arquivo inválido'}
							{/if}
						</small>
					</span>
					<div class="entry-actions">
						{#if isInstalled && !isDefault && installedCount > 1}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={() => void handleSetDefault(entry.fileName)}
							>
								Definir como padrão
							</Button>
						{/if}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={() => (deleteTarget = entry)}
							disabled={!canDelete || deleting}
							aria-label={`Excluir ${entry.fileName}`}
						>
							<Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
							Excluir
						</Button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	{#if error && entries.length > 0}
		<p class="error" role="alert">{error}</p>
	{/if}
	{#if notice}
		<p class="feedback" aria-live="polite">{notice}</p>
	{/if}
	{#if effectiveStorage && !canDelete}
		<p class="feedback">Este armazenamento não permite excluir arquivos.</p>
	{/if}
</section>

<Dialog.Root open={deleteTarget !== null} onOpenChange={(value) => !value && (deleteTarget = null)}>
	<Dialog.Content>
		<Dialog.Title>Excluir Bíblia</Dialog.Title>
		<Dialog.Description>
			{#if deleteTarget}
				Esta ação remove <strong>{deleteTarget.fileName}</strong> permanentemente. Não há lixeira para
				Bíblias. Deseja continuar?
			{/if}
		</Dialog.Description>
		<div class="dialog-actions">
			<Button type="button" variant="outline" onclick={() => (deleteTarget = null)}>Cancelar</Button>
			<Button type="button" variant="destructive" onclick={confirmDelete} disabled={deleting}>
				{deleting ? 'Excluindo…' : 'Excluir'}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.bible-manager {
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
	.state-message,
	.feedback {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}
	.feedback {
		color: var(--foreground);
	}
	code {
		font-family: var(--font-mono);
		font-size: 0.86em;
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
	.error {
		margin: 0;
		color: var(--destructive);
		font-size: 0.82rem;
	}
	.library-list {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.library-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border-top: 1px solid var(--border);
	}
	.library-list li:first-child {
		border-top: 0;
	}
	.library-list li.invalid {
		color: var(--destructive);
	}
	.entry-main {
		display: grid;
		gap: 2px;
		min-width: 0;
	}
	.entry-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.badge-default {
		display: inline-flex;
		align-items: center;
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-weight: 550;
		background: color-mix(in srgb, var(--primary) 12%, transparent);
		color: var(--primary);
		border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
	}
	.entry-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.entry-name {
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}
	.entry-meta {
		color: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		overflow-wrap: anywhere;
	}
	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 16px;
	}
</style>
