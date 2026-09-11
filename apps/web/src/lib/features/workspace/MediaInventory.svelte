<script lang="ts">
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import {
		createMediaService,
		MediaInUseError,
		type MediaInventoryItem,
		type MediaService,
		type MediaType
	} from '$lib/features/notes/media/media-service';

	let { storage = null }: { storage?: WorkspaceStorage | null } = $props();

	type Filter = 'all' | MediaType;
	let service = $state<MediaService | null>(null);
	let activeStorage = $state<WorkspaceStorage | null>(null);
	let items = $state<MediaInventoryItem[]>([]);
	let filter = $state<Filter>('all');
	let loading = $state(true);
	let error = $state('');
	let busyId = $state<string | null>(null);
	let requestId = 0;

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function typeLabel(type: MediaType): string {
		return type === 'image' ? 'Imagem' : type === 'video' ? 'Vídeo' : 'Áudio';
	}

	function stateLabel(item: MediaInventoryItem): string {
		return item.state === 'available'
			? item.unused
				? 'Sem uso'
				: 'Disponível'
			: item.state === 'missing'
				? 'Arquivo ausente'
				: 'Arquivo corrompido';
	}

	function formatDate(value: string): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'data desconhecida';
		return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
	}

	async function load(current = service) {
		const currentRequest = ++requestId;
		if (!current) {
			items = [];
			loading = false;
			return;
		}
		loading = true;
		error = '';
		try {
			const result = await current.list({
				mediaType: filter === 'all' ? undefined : filter
			});
			if (currentRequest === requestId) items = result;
		} catch (cause) {
			if (currentRequest === requestId) {
				error = cause instanceof Error ? cause.message : 'Não foi possível carregar as mídias.';
			}
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	async function deleteItem(item: MediaInventoryItem) {
		if (!service || !item.unused || busyId) return;
		busyId = item.mediaId;
		try {
			await service.deleteUnused(item.mediaId);
			toast.success('Mídia removida do workspace');
			await load();
		} catch (cause) {
			if (cause instanceof MediaInUseError) {
				toast.error('Esta mídia ainda está em uso', {
					description: `${cause.asset.references.length} nota(s) ainda referencia(m) este arquivo.`
				});
			} else {
				toast.error(cause instanceof Error ? cause.message : 'Não foi possível remover a mídia.');
			}
		} finally {
			busyId = null;
		}
	}

	async function reimportItem(item: MediaInventoryItem, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file || !service || busyId) return;
		busyId = item.mediaId;
		try {
			await service.reimport(item.mediaId, file);
			toast.success('Mídia reimportada');
			await load();
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : 'Não foi possível reimportar a mídia.');
		} finally {
			busyId = null;
		}
	}

	$effect(() => {
		const nextStorage = storage ?? null;
		if (nextStorage === activeStorage) return;
		activeStorage = nextStorage;
		service?.dispose();
		service = nextStorage ? createMediaService(nextStorage) : null;
		void load(service);
	});

	$effect(() => {
		const current = service;
		const selectedFilter = filter;
		void selectedFilter;
		if (current) void load(current);
	});

	onDestroy(() => service?.dispose());
</script>

<section class="media-inventory" aria-labelledby="media-inventory-heading">
	<div class="media-inventory-heading">
		<div>
			<h3 id="media-inventory-heading">Mídias das notas</h3>
			<p class="switch-hint">
				Arquivos ficam no workspace e continuam disponíveis offline. Uma mídia em uso não pode ser removida.
			</p>
		</div>
		<label class="media-filter">
			<span>Filtrar por tipo</span>
			<select bind:value={filter} aria-label="Filtrar mídias por tipo">
				<option value="all">Todos</option>
				<option value="image">Imagens</option>
				<option value="video">Vídeos</option>
				<option value="audio">Áudios</option>
			</select>
		</label>
	</div>

	{#if !storage}
		<p class="media-state" role="status">Configure um espaço de estudo para gerenciar as mídias.</p>
	{:else if loading}
		<p class="media-state" role="status" aria-live="polite">Carregando mídias…</p>
	{:else if error}
		<div class="media-state media-state-error" role="alert">
			<p>{error}</p>
			<button class="secondary" type="button" onclick={() => void load()}>Tentar novamente</button>
		</div>
	{:else if items.length === 0}
		<p class="media-state" role="status">
			{filter === 'all' ? 'Nenhuma mídia foi anexada às notas.' : 'Nenhuma mídia corresponde a este filtro.'}
		</p>
	{:else}
		<ul class="media-list">
			{#each items as item (item.mediaId)}
				<li class="media-row" data-media-state={item.state}>
					<div class="media-identity">
						<strong title={item.originalName}>{item.originalName}</strong>
						<span>{typeLabel(item.mediaType)} · {formatBytes(item.byteSize)} · {item.format.toUpperCase()}</span>
					</div>
					<div class="media-usage">
						<span class:media-state-warning={item.state !== 'available'}>{stateLabel(item)}</span>
						<span>{item.usageCount} {item.usageCount === 1 ? 'nota' : 'notas'}</span>
						<span>Usada {formatDate(item.lastUsedAt)}</span>
					</div>
					<div class="media-actions">
						{#if item.state !== 'available'}
							<label class="secondary media-action" class:disabled={busyId === item.mediaId}>
								Reimportar
								<input
									type="file"
									accept={item.mediaType === 'image'
										? 'image/png,image/jpeg,image/webp,image/gif'
										: item.mediaType === 'video'
											? 'video/mp4,video/webm'
											: 'audio/mpeg,audio/mp4,audio/ogg'}
									onchange={(event) => void reimportItem(item, event)}
									disabled={busyId === item.mediaId}
								/>
							</label>
						{:else if item.unused}
							<button
								class="secondary"
								type="button"
								onclick={() => void deleteItem(item)}
								disabled={busyId === item.mediaId}
							>
								{busyId === item.mediaId ? 'Removendo…' : 'Remover'}
							</button>
						{:else}
							<span class="media-protected">Em uso</span>
						{/if}
					</div>
					{#if item.references.length > 0}
						<details class="media-references">
							<summary>Ver notas relacionadas</summary>
							<ul>
								{#each item.references as reference (reference.mediaId + ':' + (reference.noteId ?? '') + ':' + (reference.blockId ?? ''))}
									<li>Nota <code>{reference.noteId ?? 'sem identificador'}</code></li>
								{/each}
							</ul>
						</details>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.media-inventory {
		display: grid;
		gap: 16px;
		margin-top: 28px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
	}
	.media-inventory-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
	}
	.media-inventory h3 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
	}
	.media-filter {
		display: grid;
		gap: 4px;
		min-width: 140px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}
	.media-filter select {
		min-height: 34px;
		padding: 0 8px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--background);
		color: var(--foreground);
	}
	.media-state {
		margin: 0;
		padding: 14px 0;
		color: var(--muted-foreground);
		font-size: 0.875rem;
	}
	.media-state-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		color: var(--destructive);
	}
	.media-list {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--border);
	}
	.media-row {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(180px, 1fr) auto;
		align-items: center;
		gap: 16px;
		padding: 14px 0;
		border-bottom: 1px solid var(--border);
	}
	.media-identity,
	.media-usage {
		display: grid;
		gap: 3px;
		min-width: 0;
	}
	.media-identity strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.875rem;
	}
	.media-identity span,
	.media-usage span,
	.media-references {
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}
	.media-usage {
		grid-template-columns: repeat(3, minmax(0, auto));
		gap: 4px 10px;
	}
	.media-usage span:not(:last-child)::after {
		content: '·';
		margin-left: 10px;
	}
	.media-state-warning {
		color: var(--destructive);
	}
	.media-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		min-width: 96px;
	}
	.media-action {
		position: relative;
		cursor: pointer;
	}
	.media-action.disabled {
		cursor: wait;
		opacity: 0.6;
	}
	.media-action input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	.media-protected {
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}
	.media-references {
		grid-column: 1 / -1;
		margin: -4px 0 0;
	}
	.media-references summary {
		cursor: pointer;
		width: fit-content;
	}
	.media-references ul {
		margin: 8px 0 0;
		padding-left: 18px;
	}
	@media (max-width: 640px) {
		.media-inventory-heading,
		.media-row {
			display: flex;
			flex-direction: column;
			align-items: stretch;
		}
		.media-filter {
			width: 100%;
		}
		.media-actions {
			justify-content: flex-start;
		}
		.media-usage {
			grid-template-columns: 1fr;
		}
		.media-usage span:not(:last-child)::after {
			content: none;
		}
	}
</style>
