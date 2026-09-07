<script lang="ts">
	import { AlertTriangle, Check, FileText, RefreshCw, ShieldCheck } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { listNotes } from '$lib/features/notes/notes-repository';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import type { WorkspaceStorage } from '$lib/storage/types';
	import type { AgentContextSelection } from './agent-context';

	export interface AgentContextFile {
		path: string;
		title?: string;
		bytes?: number;
	}

	export interface AgentContextPickerProps {
		workspaceId?: string | null;
		generation?: number | null;
		storage?: WorkspaceStorage | null;
		files?: AgentContextFile[];
		maxBytes?: number;
		initialSelectedPaths?: string[];
		disabled?: boolean;
		onSelectionChange?: (selection: AgentContextSelection) => void;
		onPrepare?: (selection: AgentContextSelection) => void | Promise<void>;
	}

	const props: AgentContextPickerProps = $props();
	const workspace = getWorkspaceState();
	const effectiveWorkspaceId = $derived(props.workspaceId ?? workspace?.workspaceId ?? null);
	const effectiveGeneration = $derived(props.generation ?? workspace?.generation ?? null);
	const effectiveStorage = $derived(props.storage ?? workspace?.storage ?? null);
	const maxBytes = $derived(props.maxBytes ?? 100_000);
	const suppliedFiles = $derived(props.files);

	let loadedFiles = $state<AgentContextFile[]>([]);
	let loading = $state(false);
	let loadError = $state('');
	let preparing = $state(false);
	let selectionError = $state('');
	let selectedPaths = $state<string[]>([]);
	let loadRequest = 0;
	let lastLoadKey = $state('');
	let lastSelectionKey = $state('');
	let initialSelectionApplied = $state(false);

	function isRelativeAuthorialPath(path: string): boolean {
		return (
			Boolean(path) &&
			(path.startsWith('notes/') || path.startsWith('sermons/')) &&
			!path.startsWith('/') &&
			!path.includes('\\') &&
			!path.split('/').some((part) => part === '..' || part === '.')
		);
	}

	function normalizeFiles(files: AgentContextFile[]): AgentContextFile[] {
		const unique: AgentContextFile[] = [];
		for (const file of files) {
			if (!isRelativeAuthorialPath(file.path) || unique.some((entry) => entry.path === file.path)) continue;
			unique.push({
				path: file.path,
				title: file.title?.trim() || undefined,
				bytes: Number.isFinite(file.bytes) && (file.bytes ?? 0) >= 0 ? file.bytes : undefined
			});
		}
		return unique.sort((left, right) => left.path.localeCompare(right.path));
	}

	const visibleFiles = $derived(normalizeFiles(suppliedFiles ?? loadedFiles));
	const selectedFiles = $derived(
		visibleFiles.filter((file) => selectedPaths.includes(file.path))
	);
	const selectedBytes = $derived(
		selectedFiles.reduce((total, file) => total + (file.bytes ?? 0), 0)
	);
	const hasValidScope = $derived(
		Boolean(effectiveWorkspaceId?.trim()) &&
		Number.isInteger(effectiveGeneration) &&
		(effectiveGeneration ?? 0) >= 4
	);
	const selection = $derived<AgentContextSelection | null>(
		hasValidScope && effectiveWorkspaceId && effectiveGeneration !== null
			? {
					workspaceId: effectiveWorkspaceId,
					generation: effectiveGeneration,
					selectedPaths: [...selectedPaths],
					contentPolicy: 'selected-files-only'
				}
			: null
	);
	const overBudget = $derived(selectedBytes > maxBytes);
	const canPrepare = $derived(
		Boolean(selection) && selectedFiles.length > 0 && !overBudget && !loading && !preparing && !props.disabled
	);

	function formatBytes(bytes?: number): string {
		if (!bytes || bytes <= 0) return 'Tamanho não informado';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function formatSelectionCount(count: number): string {
		return `${count} ${count === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}`;
	}

	function emitSelection(paths = selectedPaths) {
		if (!selection) return;
		props.onSelectionChange?.({ ...selection, selectedPaths: [...paths] });
	}

	function togglePath(path: string) {
		if (!visibleFiles.some((file) => file.path === path)) return;
		selectionError = '';
		const next = selectedPaths.includes(path)
			? selectedPaths.filter((selectedPath) => selectedPath !== path)
			: [...selectedPaths, path];
		const nextBytes = visibleFiles
			.filter((file) => next.includes(file.path))
			.reduce((total, file) => total + (file.bytes ?? 0), 0);
		if (nextBytes > maxBytes) {
			selectionError = `O contexto excede o limite de ${formatBytes(maxBytes)}. Remova um arquivo para continuar.`;
			return;
		}
		selectedPaths = next;
		emitSelection(next);
	}

	function clearSelection() {
		selectedPaths = [];
		selectionError = '';
		emitSelection([]);
	}

	async function prepareContext() {
		if (!selection) {
			selectionError = 'O workspace ativo não está disponível para esta seleção.';
			return;
		}
		if (selectedFiles.length === 0) {
			selectionError = 'Selecione pelo menos um arquivo autoral.';
			return;
		}
		if (overBudget) {
			selectionError = `O contexto excede o limite de ${formatBytes(maxBytes)}.`;
			return;
		}

		selectionError = '';
		preparing = true;
		try {
			await props.onPrepare?.(selection);
		} catch {
			selectionError = 'Não foi possível preparar este contexto. Tente novamente.';
		} finally {
			preparing = false;
		}
	}

	async function loadFiles(storage: WorkspaceStorage, workspaceId: string, generation: number) {
		const request = ++loadRequest;
		loading = true;
		loadError = '';
		try {
			const notes = await listNotes(storage);
			if (request !== loadRequest || effectiveWorkspaceId !== workspaceId || effectiveGeneration !== generation) {
				return;
			}
			loadedFiles = notes.map((note) => ({
				path: note.path,
				title: note.title || note.path,
				bytes: new TextEncoder().encode(note.content ?? note.body ?? '').byteLength
			}));
		} catch {
			if (request === loadRequest) loadError = 'Não foi possível listar as notas deste workspace.';
		} finally {
			if (request === loadRequest) loading = false;
		}
	}

	function retryLoad() {
		lastLoadKey = '';
	}

	$effect(() => {
		if (initialSelectionApplied) return;
		selectedPaths = props.initialSelectedPaths ? [...props.initialSelectedPaths] : [];
		initialSelectionApplied = true;
	});

	$effect(() => {
		const workspaceId = effectiveWorkspaceId;
		const generation = effectiveGeneration;
		const storage = effectiveStorage;
		if (suppliedFiles !== undefined) {
			loading = false;
			loadError = '';
			return;
		}
		if (!storage || !workspaceId || !Number.isInteger(generation) || (generation ?? 0) < 4) {
			loadedFiles = [];
			loading = false;
			return;
		}
		const key = `${workspaceId}:${generation}`;
		if (key === lastLoadKey) return;
		lastLoadKey = key;
		void loadFiles(storage, workspaceId, generation);
	});

	$effect(() => {
		const key = `${effectiveWorkspaceId ?? 'none'}:${effectiveGeneration ?? 'none'}:${visibleFiles.map((file) => file.path).join('|')}`;
		if (key === lastSelectionKey) return;
		lastSelectionKey = key;
		selectedPaths = selectedPaths.filter((path) => visibleFiles.some((file) => file.path === path));
	});
</script>

<section class="context-picker" aria-labelledby="agent-context-title">
	<div class="panel-heading">
		<div>
			<p class="eyebrow">Escopo da execução</p>
			<h2 id="agent-context-title">Escolha o contexto</h2>
			<p class="intro">
				Selecione somente arquivos autorais do workspace ativo. O agente recebe os paths relativos e o conteúdo escolhido, não a raiz inteira.
			</p>
		</div>
		<ShieldCheck size={20} strokeWidth={1.7} aria-hidden="true" />
	</div>

	{#if !hasValidScope}
		<div class="state-panel" role="alert">
			<AlertTriangle size={18} strokeWidth={1.7} aria-hidden="true" />
			<div>
				<strong>Workspace ativo indisponível</strong>
				<p>Abra um workspace pronto antes de selecionar contexto para a assistência.</p>
			</div>
		</div>
	{:else}
		<div class="scope-summary" aria-label="Escopo atual">
			<div>
				<span>Workspace</span>
				<strong>Ativo</strong>
			</div>
			<div>
				<span>Geração</span>
				<strong>{effectiveGeneration}</strong>
			</div>
			<div>
				<span>Limite</span>
				<strong>{formatBytes(maxBytes)}</strong>
			</div>
		</div>

		{#if loading}
			<p class="state-message" role="status" aria-live="polite">Carregando arquivos autorais…</p>
		{:else if loadError}
			<div class="state-panel" role="alert">
				<AlertTriangle size={18} strokeWidth={1.7} aria-hidden="true" />
				<div>
					<strong>Não foi possível carregar o contexto</strong>
					<p>{loadError}</p>
				</div>
				<Button type="button" variant="outline" onclick={retryLoad}>
					<RefreshCw size={15} aria-hidden="true" />
					Tentar novamente
				</Button>
			</div>
		{:else if visibleFiles.length === 0}
			<p class="state-message" role="status">
				Nenhum arquivo autoral elegível foi encontrado neste workspace.
			</p>
		{:else}
			<div class="selection-toolbar">
				<p class="selection-status" role="status" aria-live="polite">
					{formatSelectionCount(selectedFiles.length)}
					{#if selectedFiles.length > 0} · {formatBytes(selectedBytes)}{/if}
				</p>
				{#if selectedFiles.length > 0}
					<Button type="button" variant="ghost" onclick={clearSelection}>Limpar seleção</Button>
				{/if}
			</div>

			<fieldset class="file-list" disabled={props.disabled || preparing}>
				<legend class="sr-only">Arquivos autorais disponíveis</legend>
				{#each visibleFiles as file (file.path)}
					<label class="file-row" class:is-selected={selectedPaths.includes(file.path)}>
						<input
							type="checkbox"
							checked={selectedPaths.includes(file.path)}
							onchange={() => togglePath(file.path)}
							aria-label={`Selecionar ${file.title ?? file.path}`}
						/>
						<span class="file-icon" aria-hidden="true"><FileText size={16} strokeWidth={1.7} /></span>
						<span class="file-copy">
							<strong>{file.title ?? file.path}</strong>
							<code>{file.path}</code>
						</span>
						<span class="file-size">{formatBytes(file.bytes)}</span>
						{#if selectedPaths.includes(file.path)}
							<Check class="selected-icon" size={16} strokeWidth={2} aria-hidden="true" />
						{/if}
					</label>
				{/each}
			</fieldset>

			{#if selectionError}
				<p class="selection-error" role="alert">{selectionError}</p>
			{/if}

			<div class="panel-actions">
				<Button type="button" disabled={!canPrepare} onclick={prepareContext}>
					{#if preparing}Preparando…{:else}Preparar contexto{/if}
				</Button>
			</div>
		{/if}
	{/if}
</section>

<style>
	.context-picker {
		display: grid;
		gap: 16px;
		width: 100%;
	}

	.panel-heading,
	.selection-toolbar,
	.panel-actions {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
	}

	.panel-heading > :global(svg) {
		flex: 0 0 auto;
		color: var(--muted-foreground);
		margin-top: 3px;
	}

	.eyebrow,
	.intro,
	.selection-status,
	.state-message,
	.state-panel p,
	.selection-error {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.eyebrow {
		margin-bottom: 4px;
		font-weight: 600;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	.intro {
		max-width: 720px;
		margin-top: 6px;
	}

	.scope-summary {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1px;
		background: var(--border);
		border-block: 1px solid var(--border);
	}

	.scope-summary > div {
		display: grid;
		gap: 3px;
		background: var(--background);
		padding: 12px 14px;
	}

	.scope-summary span,
	.file-size {
		color: var(--muted-foreground);
		font-size: 0.74rem;
	}

	.scope-summary strong {
		font-size: 0.82rem;
		font-weight: 600;
	}

	.state-panel {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		border: 1px solid var(--border);
		padding: 14px;
	}

	.state-panel > :global(svg) {
		flex: 0 0 auto;
		color: var(--destructive);
		margin-top: 2px;
	}

	.state-panel strong {
		display: block;
		font-size: 0.86rem;
		font-weight: 650;
	}

	.state-panel :global(button) {
		margin-left: auto;
	}

	.selection-toolbar {
		align-items: center;
	}

	.selection-status {
		font-weight: 550;
	}

	.file-list {
		display: grid;
		gap: 1px;
		border: 1px solid var(--border);
		padding: 0;
		margin: 0;
		background: var(--border);
	}

	.file-row {
		display: grid;
		grid-template-columns: auto auto minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 10px;
		min-width: 0;
		background: var(--background);
		padding: 12px 14px;
		cursor: pointer;
	}

	.file-row:hover,
	.file-row.is-selected {
		background: var(--muted);
	}

	.file-row:focus-within {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	.file-row input {
		width: 16px;
		height: 16px;
		margin: 0;
		accent-color: var(--primary);
	}

	.file-icon,
	:global(.selected-icon) {
		color: var(--muted-foreground);
	}

	:global(.selected-icon) {
		color: var(--foreground);
	}

	.file-copy {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.file-copy strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.84rem;
		font-weight: 600;
	}

	.file-copy code {
		overflow-wrap: anywhere;
		color: var(--muted-foreground);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.72rem;
	}

	.file-size {
		white-space: nowrap;
	}

	.selection-error {
		color: var(--destructive);
	}

	.panel-actions {
		justify-content: flex-end;
		align-items: center;
	}

	@media (max-width: 640px) {
		.scope-summary {
			grid-template-columns: 1fr;
		}

		.file-row {
			grid-template-columns: auto auto minmax(0, 1fr) auto;
		}

		.file-size {
			grid-column: 3 / 4;
			font-size: 0.7rem;
		}

		:global(.selected-icon) {
			grid-column: 4;
			grid-row: 1 / span 2;
		}

		.panel-actions :global(button) {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.file-row {
			transition: none;
		}
	}
</style>
