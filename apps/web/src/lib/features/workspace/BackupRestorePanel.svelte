<script lang="ts">
	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		BACKUP_ARCHIVE_EXTENSION,
		BACKUP_MIME_TYPE
	} from '$lib/storage/backup/backup-contract';
	import {
		buildOperationReportAsync,
		commitRestoreStaging,
		discardStaging,
		findRestoreConflicts,
		openAfterIndexFailure,
		readBackupExclusions,
		readBackupManifest,
		rebuildDerivedIndex,
		restoreIntoStaging,
		validateRestoreArchive,
		writeBackupArchive
	} from '$lib/storage/workspace';
	import type {
		BackupOperationReport,
		BackupOperationReportOptions
	} from '$lib/storage/backup/backup-report';
	import { getWorkspaceLifecycle } from '$lib/storage/workspace-lifecycle';
	import type { WorkspaceStorage } from '$lib/storage/types';

	type BackupMode = 'create' | 'restore';
	type BackupRequestDetail = { mode?: BackupMode };
	type RestoreTarget = 'new' | 'existing';

	// Props are intentionally reactive: switching between PWA and Tauri updates the sink.
	// eslint-disable-next-line prefer-const
	let { storage }: { storage: WorkspaceStorage | null } = $props();

	let open = $state(false);
	let mode = $state<BackupMode>('create');
	let includeBibles = $state(false);
	let bibleAvailable = $state<boolean | null>(null);
	let busy = $state(false);
	let progress = $state(0);
	let statusMessage = $state('');
	let errorMessage = $state('');
	let summaryMessage = $state('');
	let restoreArchive = $state<Uint8Array | null>(null);
	let restoreFileName = $state('');
	let restoreFileSize = $state(0);
	let restoreTarget = $state<RestoreTarget>('new');
	let restoreValidation = $state<ReturnType<typeof validateRestoreArchive> | null>(null);
	let restoreConflicts = $state<Awaited<ReturnType<typeof findRestoreConflicts>>>([]);
	let restoreInput = $state<HTMLInputElement | null>(null);
	let operationReport = $state<BackupOperationReport | null>(null);
	let restoreId = $state<string | null>(null);
	let indexRecovery = $state(false);

	function backendLabel(): string {
		return storage?.kind === 'native' ? 'SQLite nativo no desktop Tauri' : 'IndexedDB no PWA';
	}

	function resetOperation(): void {
		busy = false;
		progress = 0;
		statusMessage = '';
		errorMessage = '';
		summaryMessage = '';
		includeBibles = false;
		bibleAvailable = null;
		restoreArchive = null;
		restoreFileName = '';
		restoreFileSize = 0;
		restoreTarget = 'new';
		restoreValidation = null;
		restoreConflicts = [];
		operationReport = null;
		restoreId = null;
		indexRecovery = false;
		if (restoreInput) restoreInput.value = '';
	}

	async function refreshBibleAvailability(): Promise<void> {
		if (!storage) {
			bibleAvailable = false;
			return;
		}
		try {
			const exclusions = await readBackupExclusions(storage);
			bibleAvailable = exclusions.some((item) => item.category === 'bibles' && item.count > 0);
		} catch {
			bibleAvailable = null;
		}
	}

	function openCreateDialog(): void {
		mode = 'create';
		resetOperation();
		open = true;
		void refreshBibleAvailability();
	}

	function openRestoreDialog(): void {
		mode = 'restore';
		resetOperation();
		open = true;
	}

	function handleBackupRequest(event: Event): void {
		const detail = (event as CustomEvent<BackupRequestDetail>).detail;
		if (detail?.mode === 'create') openCreateDialog();
		if (detail?.mode === 'restore') openRestoreDialog();
	}

	function handleOpenChange(nextOpen: boolean): void {
		if (!busy) open = nextOpen;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		const units = ['KiB', 'MiB', 'GiB'];
		let value = bytes;
		for (const unit of units) {
			value /= 1024;
			if (value < 1024 || unit === 'GiB') return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
		}
		return `${bytes} B`;
	}

	async function setOperationReport(options: BackupOperationReportOptions): Promise<void> {
		if (!storage) return;
		try {
			operationReport = await buildOperationReportAsync(storage, options);
		} catch {
			// A report failure must not change the outcome of the data operation.
			operationReport = null;
		}
	}

	function restoreReportOptions(
		manifest: NonNullable<ReturnType<typeof validateRestoreArchive>['manifest']>,
		extra: BackupOperationReportOptions = {}
	): BackupOperationReportOptions {
		return {
			entries: manifest.totals.entries,
			bytes: manifest.totals.uncompressedBytes,
			archiveBytes: restoreFileSize,
			biblesIncluded: manifest.policy.bibles === 'included' ? 1 : 0,
			biblesOmitted: manifest.policy.bibles === 'excluded' ? 1 : 0,
			omitted: ['index', 'deviceState', ...(manifest.policy.bibles === 'excluded' ? ['bibles'] : [])],
			conflicts: restoreConflicts.length,
			checksums: manifest.files.length,
			stagingStatus: restoreId ? 'prepared' : 'none',
			...extra
		};
	}

	function triggerDownload(bytes: Uint8Array): void {
		if (typeof document === 'undefined' || typeof URL === 'undefined') {
			throw new Error('backup_download_unavailable');
		}
		const copy = new Uint8Array(bytes.byteLength);
		copy.set(bytes);
		const blob = new Blob([copy.buffer], { type: BACKUP_MIME_TYPE });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `openbible-backup-${new Date().toISOString().replaceAll(':', '-')}${BACKUP_ARCHIVE_EXTENSION}`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	async function createBackup(): Promise<void> {
		if (busy) return;
		if (!storage) {
			errorMessage = 'O armazenamento do workspace não está disponível para criar o backup.';
			return;
		}

		busy = true;
		progress = 10;
		statusMessage = 'Capturando um snapshot estável do workspace…';
		errorMessage = '';
		summaryMessage = '';
		try {
			progress = 35;
			statusMessage = 'Aguardando o autosave e fixando a geração…';
			const lifecycle = getWorkspaceLifecycle();
			const generation = lifecycle.generation;
			await lifecycle.flushActive();
			if (lifecycle.generation !== generation) throw new Error('backup_generation_changed');
			statusMessage = 'Enumerando conteúdo autoral e exclusões…';
			const archive = await writeBackupArchive(storage, { includeBibles });
			progress = 80;
			statusMessage = 'Validando manifesto e checksums…';
			const { manifest } = readBackupManifest(archive);
			triggerDownload(archive);
			progress = 100;
			statusMessage = 'Backup criado e pronto para download.';
			summaryMessage = `${manifest.totals.entries} entradas · ${formatBytes(manifest.totals.uncompressedBytes)} · Bíblias ${manifest.policy.bibles === 'included' ? 'incluídas' : 'omitidas'}.`;
			await setOperationReport({
				phase: 'succeeded',
				status: 'success',
				backend: manifest.source.backend,
				entries: manifest.totals.entries,
				bytes: manifest.totals.uncompressedBytes,
				archiveBytes: archive.byteLength,
				biblesIncluded: manifest.policy.bibles === 'included' ? 1 : 0,
				biblesOmitted: manifest.policy.bibles === 'excluded' ? 1 : 0,
				omitted: ['index', 'deviceState', ...(manifest.policy.bibles === 'excluded' ? ['bibles'] : [])],
				checksums: manifest.files.length,
				stagingStatus: 'none',
				recoverable: false
			});
		} catch (error) {
			progress = 0;
			statusMessage = '';
			errorMessage = error instanceof Error ? error.message : 'Não foi possível criar o backup.';
		} finally {
			busy = false;
		}
	}

	function restoreErrorMessage(errors: string[]): string {
		if (errors.some((error) => error.startsWith('sha256:'))) {
			return 'O pacote foi rejeitado: há checksum divergente. Nenhum arquivo foi gravado.';
		}
		if (errors.some((error) => error.startsWith('size:'))) {
			return 'O pacote foi rejeitado: há tamanho divergente. Nenhum arquivo foi gravado.';
		}
		if (errors.some((error) => error.startsWith('missing:') || error.startsWith('unexpected:'))) {
			return 'O pacote foi rejeitado: o manifesto não corresponde às entradas. Nenhum arquivo foi gravado.';
		}
		return 'O pacote não passou na validação. Nenhum arquivo foi gravado.';
	}

	async function refreshRestoreConflicts(): Promise<void> {
		if (!storage || !restoreArchive || restoreTarget !== 'existing' || !restoreValidation?.valid) {
			restoreConflicts = [];
			return;
		}
		restoreConflicts = await findRestoreConflicts(storage, restoreArchive);
	}

	async function handleRestoreFileChange(event: Event): Promise<void> {
		const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
		restoreArchive = null;
		restoreValidation = null;
		restoreConflicts = [];
		errorMessage = '';
		summaryMessage = '';
		if (!file) {
			restoreFileName = '';
			restoreFileSize = 0;
			statusMessage = '';
			return;
		}

		restoreFileName = file.name;
		restoreFileSize = file.size;
		statusMessage = 'Lendo e validando o pacote…';
		try {
			const bytes = new Uint8Array(await file.arrayBuffer());
			const validation = validateRestoreArchive(bytes);
			restoreValidation = validation;
			if (!validation.valid) {
				restoreArchive = null;
				errorMessage = restoreErrorMessage(validation.errors);
				statusMessage = '';
				return;
			}
			restoreArchive = bytes;
			await refreshRestoreConflicts();
			statusMessage = 'Pacote válido. Nenhum arquivo foi gravado.';
			summaryMessage = `${validation.manifest?.totals.entries ?? 0} entradas · ${formatBytes(validation.manifest?.totals.uncompressedBytes ?? 0)} · checksums conferidos.`;
		} catch {
			restoreArchive = null;
			restoreValidation = null;
			statusMessage = '';
			errorMessage = 'Não foi possível ler o pacote. Nenhum arquivo foi gravado.';
		}
	}

	async function handleRestoreTargetChange(target: RestoreTarget): Promise<void> {
		restoreTarget = target;
		errorMessage = '';
		await refreshRestoreConflicts();
	}

	async function restoreBackup(): Promise<void> {
		if (busy) return;
		if (!storage || !restoreArchive) {
			errorMessage = 'Escolha um pacote .openbible-backup.zip válido antes de continuar.';
			return;
		}

		busy = true;
		progress = 20;
		statusMessage = 'Validando manifesto, caminhos e checksums…';
		errorMessage = '';
		summaryMessage = '';
		try {
			const validation = validateRestoreArchive(restoreArchive);
			restoreValidation = validation;
			if (!validation.valid) {
				errorMessage = restoreErrorMessage(validation.errors);
				return;
			}

			progress = 55;
			statusMessage = 'Verificando o destino antes do staging…';
			await refreshRestoreConflicts();
			const differingConflicts = restoreConflicts.filter((conflict) => conflict.reason === 'content_differs');
			if (differingConflicts.length > 0) {
				errorMessage = `${differingConflicts.length} conflito(s) de conteúdo impedem a restauração neste workspace. Nenhum arquivo foi gravado.`;
				return;
			}

			progress = 80;
			statusMessage = 'Preparando um staging privado…';
			const staged = await restoreIntoStaging(storage, restoreArchive);
			if (staged.status !== 'staged') {
				errorMessage = 'O staging não pôde ser preparado. Nenhum arquivo foi gravado; tente novamente ou cancele.';
				return;
			}

			restoreId = staged.restoreId ?? null;
			progress = 100;
			statusMessage = 'Pacote validado e preparado para restauração segura.';
			summaryMessage = `${validation.manifest?.totals.entries ?? 0} entradas · ${formatBytes(validation.manifest?.totals.uncompressedBytes ?? 0)} · destino: ${restoreTarget === 'new' ? 'novo workspace' : 'workspace existente'} · nenhum arquivo comitado.`;
			if (validation.manifest) {
				await setOperationReport(
					restoreReportOptions(validation.manifest, {
						phase: 'staging',
						status: 'pending',
						recoverable: true,
						stagingStatus: 'prepared',
						action: 'discard_staging',
						nextAction: 'Finalizar restauração ou descartar staging'
					})
				);
			}
		} catch {
			progress = 0;
			statusMessage = '';
			errorMessage = 'Não foi possível preparar a restauração. Nenhum arquivo foi gravado; tente novamente ou cancele.';
		} finally {
			busy = false;
		}
	}

	function phaseLabel(phase: string): string {
		const labels: Record<string, string> = {
			staging: 'Staging preparado',
			rebuilding: 'Reconstruindo índice',
			succeeded: 'Concluída',
			failed: 'Falha recuperável',
			cancelled: 'Cancelada'
		};
		return labels[phase] ?? phase;
	}

	function omittedLabel(category: string): string {
		const labels: Record<string, string> = {
			index: 'índice derivado',
			deviceState: 'estado do dispositivo',
			bibles: 'Bíblias'
		};
		return labels[category] ?? category;
	}

	async function discardRestore(): Promise<void> {
		if (busy || !restoreId) return;
		try {
			discardStaging(restoreId);
			restoreId = null;
			indexRecovery = false;
			if (restoreValidation?.manifest) {
				await setOperationReport(
					restoreReportOptions(restoreValidation.manifest, {
						phase: 'cancelled',
						status: 'cancelled',
						recoverable: false,
						stagingStatus: 'rolled_back',
						action: 'close_report',
						nextAction: 'Fechar relatório'
					})
				);
			}
			statusMessage = 'Staging descartado; o workspace anterior permanece intacto.';
			summaryMessage = 'Nenhum arquivo foi comitado.';
		} catch {
			errorMessage = 'Não foi possível descartar o staging. Tente novamente ou feche o dialog.';
		}
	}

	async function retryRestore(): Promise<void> {
		if (busy || !restoreArchive || !restoreValidation?.valid) return;
		restoreId = null;
		operationReport = null;
		indexRecovery = false;
		await restoreBackup();
	}

	async function retryIndexRebuild(): Promise<void> {
		if (busy || !storage || !restoreValidation?.manifest) return;
		busy = true;
		progress = 65;
		statusMessage = 'Tentando reconstruir o índice derivado…';
		errorMessage = '';
		try {
			const rebuilt = await rebuildDerivedIndex(storage);
			if (rebuilt.status === 'deferred') {
				const recovery = await openAfterIndexFailure(storage);
				await setOperationReport(
					restoreReportOptions(restoreValidation.manifest, {
						phase: 'failed',
						status: 'recoverable',
						code: recovery.code,
						recoverable: true,
						stagingStatus: 'committed',
						action: 'retry',
						nextAction: recovery.nextAction
					})
				);
				statusMessage = 'O conteúdo autoral permanece disponível; o índice pode ser reconstruído novamente.';
				return;
			}
			indexRecovery = false;
			progress = 100;
			statusMessage = 'Índice derivado reconstruído; workspace pronto para abrir.';
			await setOperationReport(
				restoreReportOptions(restoreValidation.manifest, {
					phase: 'succeeded',
					status: 'success',
					recoverable: false,
					stagingStatus: 'committed',
					action: 'close_report',
					nextAction: 'Abrir workspace'
				})
			);
		} catch {
			errorMessage = 'Não foi possível reconstruir o índice. O conteúdo autoral continua preservado.';
		} finally {
			busy = false;
		}
	}

	async function commitRestore(): Promise<void> {
		if (busy || !storage || !restoreId || !restoreValidation?.manifest) return;
		busy = true;
		progress = 25;
		statusMessage = 'Comitando o workspace preparado…';
		errorMessage = '';
		try {
			const committed = commitRestoreStaging(restoreId);
			progress = 60;
			statusMessage = 'Reconstruindo a projeção derivada…';
			const rebuilt = await rebuildDerivedIndex(storage);
			if (rebuilt.status === 'deferred') {
				indexRecovery = true;
				const recovery = await openAfterIndexFailure(storage);
				await setOperationReport(
					restoreReportOptions(restoreValidation.manifest, {
						phase: 'failed',
						status: 'recoverable',
						code: recovery.code,
						recoverable: true,
						stagingStatus: 'committed',
						action: 'retry',
						nextAction: recovery.nextAction
					})
				);
				statusMessage = 'Workspace comitado; o conteúdo autoral está disponível, mas o índice precisa de nova tentativa.';
				summaryMessage = `Workspace ${committed.workspaceId} preparado com ${restoreValidation.manifest.totals.entries} entradas.`;
				return;
			}

			progress = 100;
			statusMessage = 'Restauração concluída; workspace pronto para abrir.';
			summaryMessage = `Workspace ${committed.workspaceId} preparado com ${restoreValidation.manifest.totals.entries} entradas e índice reconstruído.`;
			await setOperationReport(
				restoreReportOptions(restoreValidation.manifest, {
					phase: 'succeeded',
					status: 'success',
					recoverable: false,
					stagingStatus: 'committed',
					action: 'close_report',
					nextAction: 'Abrir workspace'
				})
			);
		} catch {
			await setOperationReport(
				restoreReportOptions(restoreValidation.manifest, {
					phase: 'recoverable',
					status: 'recoverable',
					code: 'restore_staging_recoverable',
					recoverable: true,
					stagingStatus: 'prepared',
					action: 'discard_staging',
					nextAction: 'Descartar staging ou tentar novamente'
				})
			);
			errorMessage = 'A restauração falhou durante o commit. O staging continua recuperável; tente novamente ou descarte.';
		} finally {
			busy = false;
		}
	}

	onMount(() => {
		window.addEventListener('openbible:backup-requested', handleBackupRequest);
		return () => window.removeEventListener('openbible:backup-requested', handleBackupRequest);
	});
</script>

{#snippet operationReportView()}
	{#if operationReport}
		<section class="backup-report" aria-labelledby="backup-report-title">
			<div class="backup-report-heading">
				<div>
					<span class="fact-label">Relatório da operação · Fase</span>
					<h3 id="backup-report-title">{phaseLabel(operationReport.phase)}</h3>
				</div>
				<span class="backup-report-status" data-status={operationReport.status}>{operationReport.status}</span>
			</div>
			<dl class="backup-report-grid">
				<div>
					<dt>Backend</dt>
					<dd>{operationReport.backend === 'sqlite' ? 'SQLite nativo' : 'IndexedDB'}</dd>
				</div>
				<div>
					<dt>Entradas</dt>
					<dd>{operationReport.entries}</dd>
				</div>
				<div>
					<dt>Tamanho</dt>
					<dd>{formatBytes(operationReport.bytes)}</dd>
				</div>
				<div>
					<dt>Checksums</dt>
					<dd>{operationReport.checksums}</dd>
				</div>
				<div>
					<dt>Conflitos</dt>
					<dd>{operationReport.conflicts}</dd>
				</div>
				<div>
					<dt>Bíblias</dt>
					<dd>{operationReport.bibles.included} incluída(s) · {operationReport.bibles.omitted} omitida(s)</dd>
				</div>
			</dl>
			<div class="backup-report-exclusions">
				<span class="fact-label">Exclusões</span>
				<p>{operationReport.omitted.map(omittedLabel).join(' · ') || 'Nenhuma'}</p>
			</div>
			<p class="backup-report-next" role="status" aria-live="polite">
				<strong>Próximo passo:</strong> {operationReport.nextAction}
			</p>
			{#if operationReport.action === 'retry'}
				<Button type="button" variant="outline" onclick={indexRecovery ? retryIndexRebuild : retryRestore} disabled={busy}>
					Tentar novamente
				</Button>
			{:else if operationReport.action === 'discard_staging'}
				<div class="backup-report-actions">
					<Button type="button" variant="outline" onclick={discardRestore} disabled={busy}>
						Descartar staging
					</Button>
					<Button type="button" onclick={commitRestore} disabled={busy || !restoreId}>
						Finalizar restauração
					</Button>
				</div>
			{/if}
		</section>
	{/if}
{/snippet}

<Dialog.Root open={open} onOpenChange={handleOpenChange}>
	{#if mode === 'create'}
		<Dialog.Content class="backup-dialog" aria-describedby="backup-create-description">
			<Dialog.Title>Criar backup</Dialog.Title>
			<Dialog.Description id="backup-create-description">
				O pacote portátil preserva o conteúdo autoral e exclui estado operacional do dispositivo.
			</Dialog.Description>

			<div class="backup-dialog-facts">
				<div>
					<span class="fact-label">Backend</span>
					<strong>{backendLabel()}</strong>
				</div>
				<div>
					<span class="fact-label">Formato</span>
					<strong>{BACKUP_ARCHIVE_EXTENSION}</strong>
				</div>
			</div>

			<label class="backup-option">
				<input
					type="checkbox"
					checked={includeBibles}
					disabled={busy || bibleAvailable !== true}
					onchange={(event) => (includeBibles = (event.currentTarget as HTMLInputElement).checked)}
				/>
				<span>
					<strong>Incluir Bíblias importadas</strong>
					<small>
						{bibleAvailable === false
							? 'Nenhuma fonte SQLite está disponível neste workspace.'
							: 'Desligado por padrão; fontes SQLite entram como bytes imutáveis após sua escolha.'}
					</small>
				</span>
			</label>

			<div class="backup-estimate" aria-label="Estimativa do backup">
				<span class="fact-label">Estimativa</span>
				<strong>Calculada após o snapshot e a política escolhida.</strong>
				<small>O arquivo será baixado como {BACKUP_ARCHIVE_EXTENSION}.</small>
			</div>

			{#if busy}
				<div class="backup-progress" aria-label="Progresso do backup">
					<div
						class="progress-track"
						role="progressbar"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={progress}
						aria-label="Progresso do backup"
					>
						<span style={`transform: scaleX(${progress / 100})`}></span>
					</div>
					<p class="backup-status" role="status" aria-live="polite">{statusMessage}</p>
				</div>
			{:else if statusMessage}
				<p class="backup-status" role="status" aria-live="polite">{statusMessage}</p>
			{/if}

			{#if summaryMessage}
				<p class="backup-summary" role="status" aria-live="polite">{summaryMessage}</p>
			{/if}
			{#if errorMessage}
				<p class="backup-error" role="alert">{errorMessage}</p>
			{/if}
			{@render operationReportView()}

			<div class="backup-dialog-actions">
				<Button type="button" variant="outline" onclick={() => (open = false)} disabled={busy}>
					Cancelar
				</Button>
				<Button type="button" onclick={createBackup} disabled={busy || !storage}>
					{busy ? 'Criando backup…' : 'Criar backup'}
				</Button>
			</div>
		</Dialog.Content>
	{:else}
		<Dialog.Content class="backup-dialog" aria-describedby="backup-restore-description">
			<Dialog.Title>Restaurar backup</Dialog.Title>
			<Dialog.Description id="backup-restore-description">
				Valide o manifesto openbible-backup.json e o pacote portátil antes de preparar a restauração. O workspace atual permanece intacto até um commit seguro.
			</Dialog.Description>

			<div class="backup-dialog-facts">
				<div>
					<span class="fact-label">Backend de destino</span>
					<strong>{backendLabel()}</strong>
				</div>
				<div>
					<span class="fact-label">Formato aceito</span>
					<strong>{BACKUP_ARCHIVE_EXTENSION}</strong>
				</div>
			</div>

			<label class="backup-file-picker">
				<span class="fact-label">Pacote de backup</span>
				<input
					bind:this={restoreInput}
					type="file"
					accept={BACKUP_ARCHIVE_EXTENSION}
					disabled={busy}
					onchange={(event) => void handleRestoreFileChange(event)}
				/>
				<small>
					{restoreFileName
						? `${restoreFileName} · ${formatBytes(restoreFileSize)}`
						: `Selecione um arquivo ${BACKUP_ARCHIVE_EXTENSION}.`}
				</small>
			</label>

			<fieldset class="backup-targets" disabled={busy}>
				<legend>Destino da restauração</legend>
				<label class="backup-option">
					<input
						type="radio"
						name="restore-target"
						value="new"
						checked={restoreTarget === 'new'}
						onchange={() => void handleRestoreTargetChange('new')}
					/>
					<span>
						<strong>Novo workspace</strong>
						<small>Cria uma nova identidade e mantém o workspace atual sem alterações.</small>
					</span>
				</label>
				<label class="backup-option">
					<input
						type="radio"
						name="restore-target"
						value="existing"
						checked={restoreTarget === 'existing'}
						onchange={() => void handleRestoreTargetChange('existing')}
					/>
					<span>
						<strong>Workspace existente</strong>
						<small>Conflitos de conteúdo diferente bloqueiam a operação antes de qualquer commit.</small>
					</span>
				</label>
			</fieldset>

			{#if restoreConflicts.length > 0}
				<p class="backup-warning" role="status" aria-live="polite">
					{restoreConflicts.filter((conflict) => conflict.reason === 'content_differs').length} conflito(s) de conteúdo diferente;
					bytes idênticos serão ignorados somente nesta validação explícita.
				</p>
			{/if}

			{#if busy}
				<div class="backup-progress" aria-label="Progresso da restauração">
					<div
						class="progress-track"
						role="progressbar"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={progress}
						aria-label="Progresso da restauração"
					>
						<span style={`transform: scaleX(${progress / 100})`}></span>
					</div>
					<p class="backup-status" role="status" aria-live="polite">{statusMessage}</p>
				</div>
			{:else if statusMessage}
				<p class="backup-status" role="status" aria-live="polite">{statusMessage}</p>
			{/if}

			{#if summaryMessage}
				<p class="backup-summary" role="status" aria-live="polite">{summaryMessage}</p>
			{/if}
			{#if errorMessage}
				<p class="backup-error" role="alert">{errorMessage}</p>
			{/if}
			{@render operationReportView()}

			<div class="backup-dialog-actions">
				<Button type="button" variant="outline" onclick={() => (open = false)} disabled={busy}>
					Cancelar
				</Button>
				<Button
					type="button"
					onclick={restoreBackup}
					disabled={busy || !storage || !restoreArchive || !restoreValidation?.valid}
				>
					{busy ? 'Preparando restauração…' : 'Validar e preparar restauração'}
				</Button>
			</div>
		</Dialog.Content>
	{/if}
</Dialog.Root>

<style>
	:global(.backup-dialog) {
		max-height: min(720px, calc(100dvh - 32px));
		overflow-y: auto;
	}

	.backup-dialog-facts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		border-block: 1px solid var(--border);
		padding-block: 14px;
	}

	.backup-dialog-facts > div,
	.backup-estimate {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 4px;
	}

	.fact-label {
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 500;
	}

	.backup-dialog-facts strong,
	.backup-estimate strong {
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.backup-option {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding-block: 4px;
		font-size: 0.84rem;
	}

	.backup-file-picker,
	.backup-targets {
		display: grid;
		min-width: 0;
		gap: 8px;
		border: 0;
		padding: 0;
	}

	.backup-file-picker {
		padding-block: 4px;
	}

	.backup-file-picker input[type='file'] {
		max-width: 100%;
		font-size: 0.8rem;
	}

	.backup-file-picker small,
	.backup-targets small {
		color: var(--muted-foreground);
		font-size: 0.76rem;
		line-height: 1.5;
	}

	.backup-targets {
		border-top: 1px solid var(--border);
		padding-top: 14px;
	}

	.backup-targets legend {
		padding: 0;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 500;
	}

	.backup-targets .backup-option {
		padding-block: 2px;
	}

	.backup-option input {
		width: 16px;
		height: 16px;
		margin-top: 2px;
		accent-color: var(--foreground);
		flex-shrink: 0;
	}

	.backup-option span {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 3px;
	}

	.backup-option small,
	.backup-estimate small {
		color: var(--muted-foreground);
		font-size: 0.76rem;
		line-height: 1.5;
	}

	.backup-estimate {
		border-top: 1px solid var(--border);
		padding-top: 14px;
	}

	.backup-progress {
		display: grid;
		gap: 8px;
	}

	.progress-track {
		height: 6px;
		overflow: hidden;
		border-radius: 999px;
		background: color-mix(in oklch, var(--foreground) 12%, transparent);
	}

	.progress-track span {
		display: block;
		height: 100%;
		width: 100%;
		transform-origin: left center;
		background: var(--foreground);
		transition: transform 180ms ease;
	}

	.backup-status,
	.backup-summary,
	.backup-error {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.5;
	}

	.backup-summary {
		color: var(--muted-foreground);
	}

	.backup-error {
		color: var(--destructive);
	}

	.backup-warning {
		margin: 0;
		border-left: 2px solid var(--border);
		padding-left: 10px;
		font-size: 0.78rem;
		line-height: 1.5;
	}

	.backup-report {
		display: grid;
		gap: 12px;
		border-top: 1px solid var(--border);
		padding-top: 14px;
	}

	.backup-report-heading,
	.backup-report-actions {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.backup-report-heading h3 {
		margin: 3px 0 0;
		font-size: 0.92rem;
		font-weight: 650;
		line-height: 1.35;
	}

	.backup-report-status {
		color: var(--muted-foreground);
		font-size: 0.72rem;
		line-height: 1.4;
	}

	.backup-report-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
		margin: 0;
	}

	.backup-report-grid > div {
		min-width: 0;
	}

	.backup-report-grid dt {
		color: var(--muted-foreground);
		font-size: 0.7rem;
	}

	.backup-report-grid dd {
		margin: 3px 0 0;
		font-size: 0.78rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.backup-report-exclusions p,
	.backup-report-next {
		margin: 3px 0 0;
		font-size: 0.76rem;
		line-height: 1.5;
	}

	.backup-report-next {
		border-left: 2px solid var(--border);
		padding-left: 10px;
	}

	.backup-dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		flex-wrap: wrap;
	}

	@media (max-width: 560px) {
		.backup-dialog-facts {
			grid-template-columns: 1fr;
		}

		.backup-report-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.backup-dialog-actions :global(button) {
			flex: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.progress-track span {
			transition: none;
		}
	}
</style>
