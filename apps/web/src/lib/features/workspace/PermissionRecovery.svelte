<script lang="ts">
	import { onMount } from 'svelte';
	import { FolderOpen, FolderSearch, RefreshCw } from '@lucide/svelte';
	import { getWorkspaceState } from './workspace-state.svelte';
	import { nativeWorkspaceStates, type NativeWorkspaceReason } from './native-workspace-states';
	import WorkspaceSelector from './WorkspaceSelector.svelte';

export type RecoveryReason =
	| 'permission'
	| 'missing'
	| 'locked'
	| 'invalid'
	| 'needs-reconnect'
	| 'schema-unavailable'
	| 'migration'
	| 'persistence-unavailable'
	| 'autosave';

	let {
		reason = 'permission',
		workspaceName = null,
		autosaveMessage = null,
		onRetry,
		onReconnect,
		onDiscard,
		onResumeMigration,
		onRestoreLegacy
	}: {
		reason?: RecoveryReason;
		workspaceName?: string | null;
		autosaveMessage?: string | null;
		onRetry?: () => void | Promise<void>;
		onReconnect?: () => void | Promise<void>;
		onDiscard?: () => void | Promise<void>;
		onResumeMigration?: () => void | Promise<void>;
		onRestoreLegacy?: () => void | Promise<void>;
	} = $props();

	const workspace = getWorkspaceState();
	const recoveryStates = nativeWorkspaceStates({ reducedMotion: false });

	const stateKey = $derived<NativeWorkspaceReason | null>(
		reason === 'permission'
			? 'permission'
			: reason === 'missing' || reason === 'needs-reconnect'
				? 'unavailable'
			: reason === 'locked'
					? 'lock'
					: reason === 'invalid'
						? 'invalid'
						: reason === 'schema-unavailable' || reason === 'persistence-unavailable'
							? 'schema'
							: reason === 'migration'
								? 'migration'
							: null
	);
	const stateDescriptor = $derived(
		stateKey === 'permission'
			? recoveryStates.permissionDenied
			: stateKey === 'unavailable'
				? recoveryStates.unavailable
				: stateKey === 'lock'
					? recoveryStates.lockConflict
			: stateKey === 'invalid'
					? recoveryStates.invalid
					: stateKey === 'schema'
						? recoveryStates.schema
						: stateKey === 'migration'
							? recoveryStates.migration
					: null
	);
	const liveLevel = $derived(stateDescriptor?.ariaLive ?? 'polite');

	let busy = $state(false);
	let busyAction = $state<string | null>(null);
	let announcement = $state('');
	let pageError = $state('');
	let heading = $state<HTMLHeadingElement | null>(null);
	let retryButton = $state<HTMLButtonElement | null>(null);
	let reconnectButton = $state<HTMLButtonElement | null>(null);

	const displayName = $derived(
		workspaceName ?? (workspace ? String(workspace.workspaceId ?? '') : '') ?? ''
	);

	const copy = $derived(
		reason === 'missing'
			? {
					eyebrow: 'Workspace não encontrado',
					title: 'A pasta saiu do lugar',
					lead: `“${displayName || 'O workspace ativo'}” não foi encontrado. O cadastro foi preservado: localize a raiz de novo ou escolha outro workspace. Nada será ativado silenciosamente.`
				}
			: reason === 'locked'
				? {
						eyebrow: 'Workspace em uso',
						title: 'Raiz aberta em outro lugar',
						lead: `“${displayName || 'O workspace ativo'}” está com lock de escritor em outra janela ou processo. Feche lá e tente de novo, ou escolha outro workspace. O cadastro foi preservado.`
					}
			: reason === 'invalid'
					? {
							eyebrow: 'Workspace inválido',
							title: 'Manifesto ausente ou incompatível',
							lead: `A raiz de “${displayName || 'o workspace ativo'}” não tem um manifesto válido (.openbible/config.json v2). Nada foi sobrescrito e o cadastro foi preservado: localize a raiz certa ou escolha outro workspace.`
						}
					: reason === 'schema-unavailable' || reason === 'persistence-unavailable'
						? {
								eyebrow: 'Armazenamento indisponível',
								title: 'O banco local precisa de atenção',
								lead: `O registro de “${displayName || 'o workspace ativo'}” não pôde ser aberto porque o schema ou o banco local não está disponível. Tente novamente ou escolha outro workspace; nada foi trocado silenciosamente.`
							}
					: reason === 'migration'
						? {
								eyebrow: 'Migração pendente',
								title: 'Finalize a migração do workspace',
								lead: `O registro de “${displayName || 'o workspace ativo'}” ainda precisa ser reconciliado com o banco local. Retome a migração, restaure a fonte legada ou escolha outro workspace. A fonte original permanece preservada.`
							}
					: reason === 'needs-reconnect'
						? {
								eyebrow: 'Reconexão necessária',
								title: 'Autorize a pasta de novo',
								lead: `O navegador revogou o acesso à pasta de “${displayName || 'o workspace ativo'}”. Permita de novo ou localize a raiz. O cadastro foi preservado.`
							}
						: reason === 'autosave'
							? {
									eyebrow: 'Alterações não salvas',
									title: 'Conclua o autosave para trocar',
									lead:
										autosaveMessage ??
										'O workspace atual tem alterações pendentes que falharam ao salvar. Ele permanece ativo: tente de novo ou descarte explicitamente para trocar.'
								}
							: {
									eyebrow: 'Acesso ao workspace',
									title: 'Permitir acesso à sua pasta',
									lead: 'O OpenBible encontrou o workspace neste navegador, mas precisa da permissão de leitura e escrita para abrir os arquivos.'
								}
	);

	const showReconnect = $derived(
		reason !== 'autosave' &&
		reason !== 'schema-unavailable' &&
		reason !== 'migration' &&
		reason !== 'persistence-unavailable'
	);
	const showRetry = $derived(reason !== 'permission');
	const showChooseOther = $derived(reason !== 'permission' && reason !== 'autosave');

	function announce(message: string) {
		announcement = message;
	}

	function focusHeading() {
		try {
			heading?.focus({ preventScroll: false });
		} catch {
			// Foco é melhor esforço; o anúncio live já comunica o estado.
		}
	}

	/** Foco de recuperação do contrato de estados (alvo do descritor). */
	function focusRecoveryTarget() {
		const target = stateDescriptor?.focusTarget ?? null;
		try {
			if (target === 'retry') retryButton?.focus();
			else if (target === 'reconnect' || target === 'choose-folder') reconnectButton?.focus();
			else focusHeading();
		} catch {
			// Foco é melhor esforço.
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			focusHeading();
		}
	}

	async function run(action: string, fn: () => void | Promise<void>) {
		if (busy) return;
		busy = true;
		busyAction = action;
		pageError = '';
		try {
			await fn();
		} catch (error) {
			pageError = error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
			focusRecoveryTarget();
		} finally {
			busy = false;
			busyAction = null;
		}
	}

	async function defaultRetry() {
		if (onRetry) return onRetry();
		if (!workspace) return;
		await workspace.boot({ requestPermission: true, requestPersist: true });
		if (workspace.recoveryReason) {
			announce('Ainda não foi possível abrir. Veja a causa e as ações abaixo.');
			focusRecoveryTarget();
		} else {
			announce('Workspace aberto.');
		}
	}

	async function defaultReconnect() {
		if (onReconnect) return onReconnect();
		if (!workspace) return;
		try {
			await workspace.reconnectFolder();
			announce('Pasta reconectada.');
		} catch (error) {
			workspace.error =
				error instanceof DOMException && error.name === 'AbortError'
					? 'A escolha da pasta foi cancelada.'
					: error instanceof Error
						? error.message
						: 'Não foi possível acessar a pasta.';
		}
	}

	async function defaultResumeMigration() {
		if (!workspace) return;
		await workspace.boot({ requestPermission: true, requestPersist: true });
		announce('Migração retomada.');
	}

	async function defaultRestoreLegacy() {
		await defaultReconnect();
		announce('Fonte legada restaurada para uma nova tentativa.');
	}

	onMount(() => {
		focusHeading();
	});
</script>

<svelte:window onkeydown={handleEscape} />

<main class="permission-page">
	<p class="eyebrow">{copy.eyebrow}</p>
	<h1 bind:this={heading} tabindex="-1">{copy.title}</h1>
	<p class="lead">{copy.lead}</p>
	<div
		class="sr-only"
		role="status"
		aria-live={liveLevel}
	>
		{announcement}
	</div>

	<div class="actions">
		{#if reason === 'permission'}
			<button
				class="primary"
				type="button"
				bind:this={retryButton}
				onclick={() => void run('allow', defaultRetry)}
				disabled={busy}
			>
				<FolderOpen size={16} strokeWidth={1.8} aria-hidden="true" />
				{busy && busyAction === 'allow' ? 'Solicitando acesso...' : 'Permitir acesso'}
			</button>
			<button
				class="secondary"
				type="button"
				bind:this={reconnectButton}
				onclick={() => void run('choose', defaultReconnect)}
				disabled={busy}
			>
				Escolher pasta novamente
			</button>
		{:else if reason === 'autosave'}
			{#if onRetry}
				<button
					class="primary"
					type="button"
					bind:this={retryButton}
					onclick={() => void run('retry', () => onRetry?.())}
					disabled={busy}
				>
					<RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
					{busy && busyAction === 'retry' ? 'Tentando de novo...' : 'Tentar novamente'}
				</button>
			{/if}
			{#if onDiscard}
				<button
					class="secondary"
					type="button"
					onclick={() => void run('discard', () => onDiscard?.())}
					disabled={busy}
				>
					Descartar e trocar
				</button>
			{/if}
		{:else}
			{#if showRetry}
				<button
					class="primary"
					type="button"
					bind:this={retryButton}
					onclick={() => void run('retry', defaultRetry)}
					disabled={busy}
				>
					<RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
					{busy && busyAction === 'retry' ? 'Tentando de novo...' : 'Tentar novamente'}
				</button>
			{/if}
			{#if showReconnect}
				<button
					class="secondary"
					type="button"
					bind:this={reconnectButton}
					onclick={() => void run('reconnect', defaultReconnect)}
					disabled={busy}
				>
					<FolderSearch size={16} strokeWidth={1.8} aria-hidden="true" />
					Localizar novamente
				</button>
			{/if}
			{#if reason === 'migration' && (onResumeMigration || onRestoreLegacy)}
				{#if onResumeMigration}
					<button
						class="secondary"
						type="button"
						onclick={() => void run('resume-migration', onResumeMigration ?? defaultResumeMigration)}
						disabled={busy}
					>
						{busy && busyAction === 'resume-migration' ? 'Retomando…' : 'Retomar migração'}
					</button>
				{/if}
				{#if onRestoreLegacy}
					<button
						class="secondary"
						type="button"
						onclick={() => void run('restore-legacy', onRestoreLegacy ?? defaultRestoreLegacy)}
						disabled={busy}
					>
						{busy && busyAction === 'restore-legacy' ? 'Restaurando…' : 'Restaurar fonte legada'}
					</button>
				{/if}
			{/if}
		{/if}
	</div>

	{#if pageError}
		<p class="error" role="alert" aria-live="assertive">{pageError}</p>
	{:else if workspace?.error}
		<p class="error" role="alert" aria-live="assertive">{workspace.error}</p>
	{/if}

	{#if showChooseOther}
		<section class="choose-other" aria-labelledby="choose-other-heading">
			<h2 id="choose-other-heading">Escolher outro workspace</h2>
			<p class="choose-hint">O registro atual é preservado em qualquer escolha.</p>
			<WorkspaceSelector variant="start" />
		</section>
	{/if}
	<p class="escape-hint">Pressione Escape para voltar ao início desta página.</p>
</main>

<style>
	.permission-page {
		max-width: 640px;
		margin: 0 auto;
		padding: max(64px, env(safe-area-inset-top)) 24px 48px;
	}

	.eyebrow {
		margin: 0 0 12px;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-weight: 500;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 6vw, 3.25rem);
		font-weight: 600;
		letter-spacing: -0.05em;
		line-height: 1.05;
	}

	h1:focus {
		outline: none;
	}

	h1:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 4px;
	}

	.lead {
		max-width: 520px;
		margin: 16px 0 0;
		color: var(--muted-foreground);
		line-height: 1.6;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 32px;
	}

	.primary,
	.secondary {
		display: inline-flex;
		min-height: 46px;
		align-items: center;
		gap: 8px;
		border-radius: var(--radius);
		padding: 0 16px;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	.primary {
		border: 1px solid var(--primary);
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.secondary {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--foreground);
	}

	.primary:focus-visible,
	.secondary:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}

	.primary:disabled,
	.secondary:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.error {
		margin-top: 16px;
		color: var(--destructive);
		font-size: 0.88rem;
	}

	.choose-other {
		margin-top: 40px;
		border-top: 1px solid var(--border);
		padding-top: 24px;
	}

	.choose-other h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.choose-hint {
		margin: 8px 0 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
	}

	.escape-hint {
		margin: 24px 0 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}

	.sr-only {
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

	@media (max-width: 480px) {
		.permission-page {
			padding-top: max(40px, env(safe-area-inset-top));
		}

		.actions {
			flex-direction: column;
		}

		.primary,
		.secondary {
			width: 100%;
			justify-content: center;
		}

	}

	@media (prefers-reduced-motion: reduce) {
		.primary,
		.secondary {
			transition: none;
		}
	}
</style>
