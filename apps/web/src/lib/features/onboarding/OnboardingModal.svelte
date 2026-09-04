<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		CheckCircle2,
		Clock3,
		FolderOpen,
		FolderTree,
		LoaderCircle,
		Upload
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import RemoteBibleImport from '$lib/features/bible-remote/RemoteBibleImport.svelte';
	import { getDirectoryPickerError } from './onboarding-errors';
	import { importBibleFiles, prepareWorkspace } from '$lib/storage/workspace';
	import {
		shouldOfferStorageChoice,
		supportsFileSystemAccess
	} from '$lib/storage/environment';
	import type {
		ImportResult,
		ProgressCallback,
		StorageKind,
		WorkspaceStorage
	} from '$lib/storage/types';
	import { onboardingCopy, type OnboardingStep } from './onboarding-copy';

	let {
		storageMode = 'opfs',
		storage = null,
		initialError = '',
		initialStep = 'intro',
		onChooseStorage = async () => null,
		onChooseBrowserStorage = async () => null,
		onComplete = () => undefined,
		onDeferred = () => undefined
	}: {
		storageMode?: StorageKind;
		storage?: WorkspaceStorage | null;
		initialError?: string;
		initialStep?: OnboardingStep;
		onChooseStorage?: () => Promise<WorkspaceStorage | null>;
		onChooseBrowserStorage?: () => Promise<WorkspaceStorage | null>;
		onComplete?: (results: ImportResult[]) => void;
		onDeferred?: () => void;
	} = $props();

	const steps = Object.keys(onboardingCopy) as OnboardingStep[];

	let step = $state<OnboardingStep>('intro');
	let progress = $state(0);
	let errorMessage = $state('');
	let importTab = $state<'local' | 'remote'>('local');
	let selectedStorage = $state<WorkspaceStorage | null>(null);
	let selectedFiles = $state<File[]>([]);
	let results = $state<ImportResult[]>([]);
	let importStarted = $state(false);
	let processing = $state(false);
	let statusMessage = $state('');
	let fileInput = $state<HTMLInputElement | undefined>();
	let displayedInitialError = $state('');
	let localPickerFailed = $state(false);

	$effect.pre(() => {
		step = initialStep;
	});

	$effect(() => {
		if (initialError !== displayedInitialError) {
			displayedInitialError = initialError;
			errorMessage = initialError;
		}
	});

	$effect(() => {
		if (storage && !selectedStorage) selectedStorage = storage;
	});

	const copy = $derived(onboardingCopy[step]);
	const stepNumber = $derived(steps.indexOf(step) + 1);
	const offersStorageChoice = $derived(
		storageMode === 'opfs' && shouldOfferStorageChoice()
	);
	const showBrowserStorageChoice = $derived(
		step === 'storage' && (storageMode === 'opfs' ? offersStorageChoice : supportsFileSystemAccess())
	);
	const hasImported = $derived(results.some((result) => result.status === 'imported'));
	const hasRejected = $derived(results.some((result) => result.status === 'rejected'));
	const showProgress = $derived(
		processing || progress > 0 || step === 'installing' || (step === 'import' && importStarted)
	);

	onMount(() => {
		void moveFocus();
	});

	const updateProgress: ProgressCallback = (value) => {
		progress = Math.round(value * 100);
	};

	async function moveFocus() {
		await tick();
		document.querySelector<HTMLElement>('[data-onboarding-focus]')?.focus();
	}

	async function start() {
		errorMessage = '';
		if (storageMode === 'native') {
			if (selectedStorage) {
				await install(selectedStorage);
			} else {
				await chooseFolder();
			}
			return;
		}
		if (storageMode === 'opfs' && !offersStorageChoice) {
			if (!selectedStorage) {
				errorMessage = 'Não foi possível acessar o armazenamento deste navegador.';
				return;
			}
			await install(selectedStorage);
			return;
		}

		step = 'storage';
		progress = 0;
		await moveFocus();
	}

	async function chooseFolder() {
		errorMessage = '';
		localPickerFailed = false;
		try {
			selectedStorage = await onChooseStorage();
			if (!selectedStorage) {
				errorMessage = 'Não foi possível acessar a pasta escolhida.';
				localPickerFailed = true;
				return;
			}
			await install(selectedStorage);
		} catch (error) {
			errorMessage = getDirectoryPickerError(error);
			localPickerFailed = true;
			await moveFocus();
		}
	}

	async function chooseBrowserStorage() {
		errorMessage = '';
		localPickerFailed = false;
		try {
			selectedStorage = await onChooseBrowserStorage();
			if (!selectedStorage) {
				errorMessage = 'Não foi possível acessar o armazenamento deste navegador.';
				return;
			}
			await install(selectedStorage);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível configurar o armazenamento.';
			await moveFocus();
		}
	}

	async function install(nextStorage: WorkspaceStorage) {
		processing = true;
		errorMessage = '';
		statusMessage = 'Criando a estrutura do workspace';
		step = 'installing';
		progress = 0;
		await moveFocus();

		try {
			await prepareWorkspace(nextStorage, updateProgress);
			processing = false;
			statusMessage = 'Estrutura criada';
			step = 'import';
			importStarted = false;
			progress = 0;
			await moveFocus();
		} catch (error) {
			processing = false;
			errorMessage = error instanceof Error ? error.message : 'Não foi possível criar a estrutura.';
			statusMessage = '';
			await moveFocus();
		}
	}

	function chooseFiles(files: FileList | File[]) {
		selectedFiles = Array.from(files);
		results = [];
		errorMessage = '';
		if (selectedFiles.length === 0) {
			errorMessage = 'Selecione pelo menos um arquivo com extensão .sqlite.';
		}
	}

	function trapFocus(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;
		const dialog = event.currentTarget as HTMLElement;
		const focusable = [
			...dialog.querySelectorAll<HTMLElement>(
				'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
			)
		].filter((element) => !element.hidden);
		if (focusable.length < 2) return;
		const first = focusable[0];
		const last = focusable.at(-1);
		if (!last) return;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer?.files) chooseFiles(event.dataTransfer.files);
	}

	async function importFiles() {
		if (!selectedStorage || selectedFiles.length === 0) return;
		processing = true;
		errorMessage = '';
		statusMessage = 'Importando Bíblias';
		progress = 0;
		try {
			results = await importBibleFiles(selectedStorage, selectedFiles, updateProgress);
			processing = false;
			statusMessage = results.some((result) => result.status === 'imported')
				? results.some((result) => result.status === 'rejected')
					? 'Importação concluída parcialmente'
					: 'Importação concluída'
				: 'Nenhum arquivo foi importado';
			step = 'complete';
			await moveFocus();
		} catch (error) {
			processing = false;
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível importar as Bíblias.';
			statusMessage = '';
			await moveFocus();
		}
	}

	function deferImport() {
		onDeferred();
	}

	async function startImport() {
		importStarted = true;
		await moveFocus();
	}

	function finish() {
		onComplete(results);
	}
</script>

<div class="onboarding-shell">
	<div class="onboarding-backdrop" aria-hidden="true"></div>
	<dialog
		class="onboarding-dialog"
		open
		aria-modal="true"
		aria-labelledby="onboarding-title"
		aria-describedby="onboarding-description"
		onkeydown={trapFocus}
	>
		<article class="onboarding-card">
			<header class="onboarding-header">
				<div class="brand-row">
					<img class="brand-logo" src="/logo.png" alt="" aria-hidden="true" />
					<div class="brand-copy">
						<span class="eyebrow">{copy.eyebrow}</span>
						<span class="step-count">Etapa {stepNumber} de {steps.length}</span>
					</div>
				</div>

				<ol class="step-track" aria-label="Progresso das etapas">
					{#each steps as trackStep, index (trackStep)}
						<li
							class:active={index + 1 === stepNumber}
							class:complete={index + 1 < stepNumber}
							aria-current={index + 1 === stepNumber ? 'step' : undefined}
						>
							<span class="step-dot" aria-hidden="true"></span>
							<span class="visually-hidden">{onboardingCopy[trackStep].title}</span>
						</li>
					{/each}
				</ol>

				{#if showProgress}
					<div class="progress-wrap" aria-label="Progresso da operação">
						<progress
							min="0"
							max="100"
							value={progress}
							aria-valuemin="0"
							aria-valuemax="100"
							aria-valuenow={progress}
							aria-label="Progresso da operação"
						></progress>
						<span>{progress}%</span>
					</div>
				{/if}
			</header>

			<div class="onboarding-content">
				<h2 id="onboarding-title" data-onboarding-focus tabindex="-1">{copy.title}</h2>
				<p id="onboarding-description">{copy.body}</p>

				{#if step === 'intro'}
					<p class="storage-note">
						{offersStorageChoice
							? 'Neste app instalado, você escolherá entre uma pasta do computador e o armazenamento do navegador.'
							: storageMode === 'native'
								? 'Neste app, os arquivos ficam em uma pasta nativa do seu computador.'
							: storageMode === 'opfs'
								? 'Neste ambiente, os arquivos ficam no armazenamento privado do navegador.'
								: 'Neste ambiente, você escolherá uma pasta local para guardar os arquivos.'}
					</p>

					<ul class="feature-list" aria-label="Como funciona">
						<li>
							<span class="feature-icon" aria-hidden="true"
								><FolderOpen size={16} strokeWidth={1.75} /></span
							>
							<div>
								<strong>Arquivos seus</strong>
								<span>Markdown e SQLite ficam no armazenamento escolhido.</span>
							</div>
						</li>
						<li>
							<span class="feature-icon" aria-hidden="true"
								><FolderTree size={16} strokeWidth={1.75} /></span
							>
							<div>
								<strong>Estrutura clara</strong>
								<span>Pastas separadas para estudos, sermões, notas e anexos.</span>
							</div>
						</li>
						<li>
							<span class="feature-icon" aria-hidden="true"
								><Clock3 size={16} strokeWidth={1.75} /></span
							>
							<div>
								<strong>Comece no seu ritmo</strong>
								<span>Você pode importar Bíblias agora ou continuar depois.</span>
							</div>
						</li>
					</ul>
				{:else if step === 'storage'}
					<div class="panel storage-choice">
						<span class="panel-icon" aria-hidden="true"
							><FolderOpen size={18} strokeWidth={1.75} /></span
						>
						<div>
							<strong>Escolha uma pasta raiz</strong>
							<span>O conteúdo existente será preservado.</span>
						</div>
					</div>
					{#if showBrowserStorageChoice}
						<p class="storage-alt">
							Prefere não vincular uma pasta? Use o armazenamento privado do navegador.
						</p>
					{/if}
				{:else if step === 'installing'}
					<div class="panel operation-state" aria-live="polite">
						<LoaderCircle class="spinner" size={22} strokeWidth={1.75} aria-hidden="true" />
						<div>
							<strong>{statusMessage}</strong>
							<span>Você pode acompanhar cada etapa aqui.</span>
						</div>
					</div>
				{:else if step === 'import'}
					{#if !importStarted}
						<div class="panel import-choice">
							<span class="panel-icon" aria-hidden="true"
								><Upload size={18} strokeWidth={1.75} /></span
							>
							<div>
								<strong>Importe suas Bíblias quando estiver pronto</strong>
								<span
									>Escolha arquivos do dispositivo ou a URL do bucket R2 nas abas abaixo. Você
									poderá adicionar mais arquivos ao workspace depois.</span
								>
							</div>
						</div>
					{/if}
					<Tabs.Root bind:value={importTab} class="import-tabs">
						<Tabs.List aria-label="Método de importação">
							<Tabs.Trigger value="local">Arquivos locais</Tabs.Trigger>
							<Tabs.Trigger value="remote">Bucket R2</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="local" forceMount class="import-tab-panel">
							{#if importStarted}
								<div
									class="dropzone"
									role="button"
									tabindex="0"
									aria-label="Selecionar Bíblias SQLite"
									onkeydown={(event) =>
										event.key === 'Enter' || event.key === ' ' ? fileInput?.click() : undefined}
									ondragover={(event) => event.preventDefault()}
									ondrop={handleDrop}
								>
									<span class="dropzone-icon" aria-hidden="true"
										><Upload size={20} strokeWidth={1.75} /></span
									>
									<strong>Arraste seus arquivos SQLite</strong>
									<span>ou selecione pelo diálogo de arquivos</span>
									<Button
										variant="outline"
										size="sm"
										type="button"
										onclick={() => fileInput?.click()}
										disabled={processing}
									>
										Selecionar arquivos
									</Button>
									<input
										bind:this={fileInput}
										class="visually-hidden"
										type="file"
										accept=".sqlite"
										multiple
										onchange={(event) =>
											chooseFiles((event.currentTarget as HTMLInputElement).files ?? [])}
									/>
								</div>
								{#if selectedFiles.length > 0}
									<div class="file-summary" aria-live="polite">
										{selectedFiles.length} arquivo(s) pronto(s) para importar.
									</div>
								{/if}
							{:else}
								<p class="tab-hint">
									Clique em Importar agora para enviar arquivos do dispositivo, ou use a aba Bucket
									R2.
								</p>
							{/if}
						</Tabs.Content>
						<Tabs.Content value="remote" forceMount class="import-tab-panel">
							{#if selectedStorage}
								<div class="remote-onboarding">
									<RemoteBibleImport storage={selectedStorage} variant="onboarding" />
								</div>
							{/if}
						</Tabs.Content>
					</Tabs.Root>
				{:else if step === 'complete'}
					<div
						class:partial={hasImported && hasRejected}
						class="panel result-card"
						aria-live="polite"
					>
						<span class="panel-icon" aria-hidden="true"
							><CheckCircle2 size={18} strokeWidth={1.75} /></span
						>
						<div>
							<strong
								>{hasImported && hasRejected
									? 'Importação parcial'
									: hasImported
										? 'Bíblias importadas'
										: results.length
											? 'Nenhuma Bíblia importada'
											: 'Estrutura pronta'}</strong
							>
							<span
								>{hasImported && hasRejected
									? 'Os arquivos válidos foram copiados. Confira os itens rejeitados antes de tentar novamente.'
									: results.length && !hasImported
										? 'Nenhum arquivo válido foi importado. Você pode tentar novamente depois.'
										: 'Seu workspace está pronto para começar.'}</span
							>
						</div>
					</div>
					{#if results.length > 0}
						<ul class="results" aria-label="Resultado da importação">
							{#each results as result, index (result.name + index)}
								<li class:rejected={result.status === 'rejected'}>
									<span>{result.name}</span>
									<small
										>{result.status === 'imported'
											? 'Importado'
											: result.reason === 'duplicate'
												? 'Já existe'
												: result.reason === 'copy-failed'
													? 'Falha ao copiar'
													: 'SQLite inválido'}</small
									>
								</li>
							{/each}
						</ul>
					{/if}
				{/if}

				{#if errorMessage}
					<div class="error" role="alert">{errorMessage}</div>
				{/if}
				{#if statusMessage && step !== 'installing'}
					<div class="status" aria-live="polite">{statusMessage}</div>
				{/if}
			</div>

			<footer class="onboarding-actions">
				{#if step === 'intro'}
					<Button type="button" onclick={start} data-onboarding-focus>Começar</Button>
				{:else if step === 'storage'}
					<Button
						variant="outline"
						type="button"
						onclick={() => (step = 'intro')}
						disabled={processing}
					>
						Voltar
					</Button>
					{#if showBrowserStorageChoice}
						<Button
							variant="outline"
							type="button"
							onclick={chooseBrowserStorage}
							disabled={processing}
						>
							Usar armazenamento do navegador
						</Button>
					{/if}
					<Button type="button" onclick={chooseFolder} data-onboarding-focus>Escolher pasta</Button>
				{:else if step === 'installing'}
					<Button type="button" disabled>Configurando...</Button>
				{:else if step === 'import'}
					<Button variant="ghost" type="button" onclick={deferImport} disabled={processing}>
						Fazer depois
					</Button>
					{#if importStarted}
						<Button
							type="button"
							onclick={importFiles}
							disabled={processing || selectedFiles.length === 0}
							data-onboarding-focus
						>
							{processing ? 'Importando...' : 'Importar Bíblias'}
						</Button>
					{:else}
						<Button variant="outline" type="button" onclick={startImport} data-onboarding-focus>
							Importar agora
						</Button>
					{/if}
				{:else if step === 'complete'}
					<Button type="button" onclick={finish} data-onboarding-focus>Ir para o projeto</Button>
				{/if}
			</footer>
		</article>
	</dialog>
</div>

<style>
	.onboarding-shell {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
			max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
	}

	.onboarding-backdrop {
		position: absolute;
		inset: 0;
		background: color-mix(in oklch, var(--background) 12%, var(--foreground));
		opacity: 0.36;
	}

	.onboarding-dialog {
		position: relative;
		display: block;
		width: min(100%, 560px);
		max-width: none;
		max-height: min(680px, calc(100dvh - 32px));
		margin: 0;
		border: 0;
		padding: 0;
		background: transparent;
		overflow: visible;
	}

	.onboarding-card {
		display: flex;
		max-height: inherit;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) + 2px);
		background: var(--background);
		box-shadow: 0 24px 64px color-mix(in oklch, var(--foreground) 8%, transparent);
		overflow: hidden;
	}

	.onboarding-header {
		padding: 24px 24px 0;
	}

	.brand-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.brand-logo {
		display: block;
		width: 36px;
		height: auto;
		flex: 0 0 auto;
		filter: invert(1);
	}

	:global(.dark) .brand-logo {
		filter: none;
	}

	.brand-copy {
		display: flex;
		min-width: 0;
		flex: 1;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}

	.eyebrow,
	.step-count {
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 500;
		line-height: 1.2;
	}

	.step-track {
		display: flex;
		gap: 6px;
		margin: 18px 0 0;
		padding: 0;
		list-style: none;
	}

	.step-track li {
		flex: 1;
	}

	.step-dot {
		display: block;
		height: 3px;
		border-radius: 999px;
		background: color-mix(in oklch, var(--foreground) 10%, transparent);
	}

	.step-track li.active .step-dot {
		background: var(--foreground);
	}

	.step-track li.complete .step-dot {
		background: color-mix(in oklch, var(--foreground) 34%, transparent);
	}

	.progress-wrap {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 16px;
	}

	progress {
		width: 100%;
		height: 6px;
		accent-color: var(--foreground);
	}

	.progress-wrap > span {
		min-width: 38px;
		color: var(--foreground);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		text-align: right;
	}

	.onboarding-content {
		overflow-y: auto;
		padding: 28px 24px 8px;
	}

	h2 {
		margin: 0;
		font-size: clamp(1.45rem, 4.5vw, 1.85rem);
		font-weight: 600;
		letter-spacing: -0.035em;
		line-height: 1.12;
	}

	h2:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 6px;
		border-radius: 4px;
	}

	.onboarding-content > p {
		margin: 12px 0 0;
		color: var(--muted-foreground);
		font-size: 0.92rem;
		line-height: 1.6;
	}

	.storage-note {
		margin-top: 8px !important;
		color: var(--foreground) !important;
		font-size: 0.82rem !important;
	}

	.storage-alt {
		margin: 12px 0 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.feature-list {
		display: grid;
		gap: 8px;
		margin: 24px 0 0;
		padding: 0;
		list-style: none;
	}

	.feature-list li,
	.panel {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: transparent;
	}

	.feature-list li {
		padding: 14px;
	}

	.feature-icon,
	.panel-icon {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		flex: 0 0 auto;
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--foreground);
	}

	.feature-list div,
	.panel div {
		display: grid;
		min-width: 0;
		gap: 2px;
	}

	.feature-list strong,
	.panel strong {
		font-size: 0.86rem;
		font-weight: 600;
	}

	.feature-list span,
	.panel span {
		color: var(--muted-foreground);
		font-size: 0.8rem;
		line-height: 1.45;
	}

	.panel {
		margin-top: 24px;
		padding: 16px;
	}

	.panel.partial {
		border-color: color-mix(in oklch, var(--muted-foreground) 40%, var(--border));
	}

	:global(.spinner) {
		flex: 0 0 auto;
		color: var(--foreground);
		animation: spin 0.9s linear infinite;
	}

	.dropzone {
		display: grid;
		place-items: center;
		gap: 8px;
		margin-top: 24px;
		padding: 28px 18px;
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
		line-height: 1.45;
	}

	.dropzone-icon {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--foreground);
	}

	.file-summary,
	.status,
	.error {
		margin-top: 12px;
		font-size: 0.82rem;
		line-height: 1.5;
	}

	.remote-onboarding {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid var(--border);
	}

	:global(.import-tabs) {
		margin-top: 20px;
	}

	:global(.import-tabs [data-slot='tabs-content'][data-state='inactive']) {
		display: none;
	}

	:global(.import-tab-panel) {
		margin-top: 14px;
		outline: none;
	}

	.tab-hint {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.file-summary,
	.status {
		color: var(--foreground);
	}

	.error {
		padding: 12px 14px;
		border: 1px solid color-mix(in oklch, var(--destructive) 40%, var(--border));
		border-radius: var(--radius);
		background: color-mix(in oklch, var(--destructive) 6%, transparent);
		color: var(--destructive);
	}

	.results {
		display: grid;
		gap: 0;
		margin: 14px 0 0;
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
		background: transparent;
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

	.onboarding-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 16px 24px 24px;
		border-top: 1px solid var(--border);
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

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.spinner) {
			animation: none;
		}
	}

	@media (max-width: 480px) {
		.onboarding-header,
		.onboarding-content,
		.onboarding-actions {
			padding-inline: 18px;
		}

		.onboarding-actions {
			align-items: stretch;
			flex-direction: column-reverse;
		}

		.onboarding-actions :global([data-slot='button']) {
			width: 100%;
		}
	}
</style>
