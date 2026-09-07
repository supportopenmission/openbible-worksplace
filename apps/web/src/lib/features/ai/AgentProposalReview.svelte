<script lang="ts">
	import { AlertTriangle, Check, Clock3, FileDiff, ShieldAlert, X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	export type AgentProposalState = 'review' | 'applied' | 'rejected' | 'stale' | 'error';

	export interface AgentProposal {
		proposalId: string;
		workspaceId: string;
		generation: number;
		relativePath: string;
		baseHash: string;
		originalText: string;
		proposedText: string;
		origin?: string;
		state?: AgentProposalState;
		errorMessage?: string;
	}

	export interface AgentProposalApplyRequest {
		proposalId: string;
		workspaceId: string;
		generation: number;
		relativePath: string;
		baseHash: string;
		proposedText: string;
		confirmation: 'explicit-user-action';
	}

	export interface AgentProposalRejectRequest {
		proposalId: string;
		reason: 'author-declined' | 'stale' | 'error';
	}

	export interface AgentProposalReviewProps {
		proposal?: AgentProposal | null;
		currentWorkspaceId?: string | null;
		currentGeneration?: number | null;
		onApply?: (request: AgentProposalApplyRequest) => void | Promise<void>;
		onReject?: (request: AgentProposalRejectRequest) => void | Promise<void>;
		onRetry?: () => void | Promise<void>;
	}

	const props: AgentProposalReviewProps = $props();
	const proposal = $derived(props.proposal ?? null);
	const currentWorkspaceId = $derived(props.currentWorkspaceId ?? null);
	const currentGeneration = $derived(props.currentGeneration ?? null);
	let action = $state<'apply' | 'reject' | 'retry' | null>(null);
	let actionError = $state('');

	interface DiffLine {
		kind: 'same' | 'removed' | 'added';
		text: string;
		lineNumber: number;
	}

	function isRelativeAuthorialPath(path: string): boolean {
		return (
			Boolean(path) &&
			(path.startsWith('notes/') || path.startsWith('sermons/')) &&
			!path.startsWith('/') &&
			!path.includes('\\') &&
			!path.split('/').some((part) => part === '..' || part === '.')
		);
	}

	function diffLines(original: string, proposed: string): DiffLine[] {
		const originalLines = original.split(/\r?\n/);
		const proposedLines = proposed.split(/\r?\n/);
		const lines: DiffLine[] = [];
		const limit = Math.max(originalLines.length, proposedLines.length);
		for (let index = 0; index < limit; index += 1) {
			const before = originalLines[index];
			const after = proposedLines[index];
			if (before !== undefined && after !== undefined && before === after) {
				lines.push({ kind: 'same', text: before, lineNumber: index + 1 });
				continue;
			}
			if (before !== undefined) lines.push({ kind: 'removed', text: before, lineNumber: index + 1 });
			if (after !== undefined) lines.push({ kind: 'added', text: after, lineNumber: index + 1 });
		}
		return lines;
	}

	const safePath = $derived(Boolean(proposal && isRelativeAuthorialPath(proposal.relativePath)));
	const scopeMismatch = $derived(
		Boolean(
			proposal &&
			((currentWorkspaceId !== null && proposal.workspaceId !== currentWorkspaceId) ||
				(currentGeneration !== null && proposal.generation !== currentGeneration))
		)
	);
	const effectiveState = $derived<AgentProposalState>(
		proposal?.state ?? (scopeMismatch || !safePath ? 'stale' : 'review')
	);
	const diff = $derived(proposal ? diffLines(proposal.originalText, proposal.proposedText) : []);
	const hasAction = $derived(action !== null);
	const canApply = $derived(Boolean(proposal && effectiveState === 'review' && !scopeMismatch && safePath && !hasAction));

	function errorMessage(value: unknown): string {
		return value instanceof Error ? value.message : 'Não foi possível concluir esta ação. Tente novamente.';
	}

	async function applyProposal() {
		if (!proposal || !canApply) return;
		actionError = '';
		action = 'apply';
		try {
			await props.onApply?.({
				proposalId: proposal.proposalId,
				workspaceId: proposal.workspaceId,
				generation: proposal.generation,
				relativePath: proposal.relativePath,
				baseHash: proposal.baseHash,
				proposedText: proposal.proposedText,
				confirmation: 'explicit-user-action'
			});
		} catch (error) {
			actionError = errorMessage(error);
		} finally {
			action = null;
		}
	}

	async function rejectProposal(reason: AgentProposalRejectRequest['reason'] = 'author-declined') {
		if (!proposal || hasAction) return;
		actionError = '';
		action = 'reject';
		try {
			await props.onReject?.({ proposalId: proposal.proposalId, reason });
		} catch (error) {
			actionError = errorMessage(error);
		} finally {
			action = null;
		}
	}

	async function retry() {
		actionError = '';
		action = 'retry';
		try {
			await props.onRetry?.();
		} catch (error) {
			actionError = errorMessage(error);
		} finally {
			action = null;
		}
	}

	function stateLabel(state: AgentProposalState): string {
		return state === 'applied'
			? 'Aplicada'
			: state === 'rejected'
				? 'Recusada'
				: state === 'stale'
					? 'Fora de validade'
					: state === 'error'
						? 'Erro recuperável'
						: 'Aguardando revisão';
	}
</script>

<div
	class="proposal-review"
	role="region"
	data-testid="agent-proposal-review"
	aria-label="Revisão de proposta"
	aria-labelledby="agent-proposal-title"
>
	{#if !proposal}
		<div class="empty-state" role="status">
			<FileDiff size={19} strokeWidth={1.7} aria-hidden="true" />
			<div>
				<strong>Nenhuma proposta pendente</strong>
				<p>O resultado da assistência aparecerá aqui para revisão antes de tocar no documento.</p>
			</div>
		</div>
	{:else}
		<div class="panel-heading">
			<div>
				<p class="eyebrow">Revisão de assistência</p>
				<h2 id="agent-proposal-title">Revise antes de aplicar</h2>
				<p class="intro">
					A fonte canônica permanece intacta até uma confirmação explícita. Esta tela mostra uma única proposta para um documento.
				</p>
			</div>
			<span class="state-label" data-state={effectiveState}>{stateLabel(effectiveState)}</span>
		</div>

		<div class="proposal-summary" aria-label="Resumo da proposta">
			<div>
				<span>Documento</span>
				{#if safePath}
					<code>{proposal.relativePath}</code>
				{:else}
					<strong>Path fora do escopo</strong>
				{/if}
			</div>
			<div>
				<span>Origem</span>
				<strong>{proposal.origin ?? 'Assistência textual'}</strong>
			</div>
			<div>
				<span>Geração capturada</span>
				<strong>{proposal.generation}</strong>
			</div>
		</div>

		{#if effectiveState === 'stale'}
			<div class="state-panel state-panel-warning" role="alert">
				<ShieldAlert size={18} strokeWidth={1.7} aria-hidden="true" />
				<div>
					<strong>Esta proposta não corresponde mais à fonte</strong>
					<p>
						O workspace ou o documento mudou desde a captura. Nada será sobrescrito; descarte a proposta ou inicie uma nova consulta.
					</p>
				</div>
			</div>
		{:else if effectiveState === 'error'}
			<div class="state-panel" role="alert">
				<AlertTriangle size={18} strokeWidth={1.7} aria-hidden="true" />
				<div>
					<strong>Não foi possível concluir a execução</strong>
					<p>{proposal.errorMessage ?? 'A proposta precisa ser reprocessada.'}</p>
				</div>
				<Button type="button" variant="outline" onclick={retry} disabled={hasAction}>
					{#if action === 'retry'}Tentando…{:else}Tentar novamente{/if}
				</Button>
			</div>
		{/if}

		<div class="diff-heading">
			<div>
				<h3>Alteração proposta</h3>
				<p>Linhas removidas aparecem antes das linhas adicionadas. Conteúdo longo permanece rolável e quebrável.</p>
			</div>
			<Clock3 size={17} strokeWidth={1.7} aria-hidden="true" />
		</div>

		<div class="diff" aria-label="Diff da proposta">
			{#each diff as line, index (index)}
				<div class="diff-line" class:is-added={line.kind === 'added'} class:is-removed={line.kind === 'removed'}>
					<span class="diff-marker" aria-hidden="true">{line.kind === 'added' ? '+' : line.kind === 'removed' ? '−' : ' '}</span>
					<span class="diff-number" aria-hidden="true">{line.lineNumber}</span>
					<code>{line.text || ' '}</code>
				</div>
			{/each}
		</div>

		{#if actionError}
			<p class="action-error" role="alert">{actionError}</p>
		{/if}

		<div class="panel-actions">
			{#if effectiveState === 'review'}
				<Button type="button" variant="outline" onclick={() => rejectProposal()} disabled={hasAction}>
					<X size={15} aria-hidden="true" />
					{#if action === 'reject'}Recusando…{:else}Recusar proposta{/if}
				</Button>
				<Button type="button" onclick={applyProposal} disabled={!canApply}>
					<Check size={15} aria-hidden="true" />
					{#if action === 'apply'}Aplicando…{:else}Aplicar proposta{/if}
				</Button>
			{:else if effectiveState === 'stale'}
				<Button type="button" variant="outline" onclick={() => rejectProposal('stale')} disabled={hasAction}>
					Descartar proposta antiga
				</Button>
			{:else if effectiveState === 'error'}
				<Button type="button" variant="outline" onclick={retry} disabled={hasAction}>
					Tentar novamente
				</Button>
			{:else}
				<p class="terminal-state"><Check size={15} aria-hidden="true" /> Fonte preservada após {stateLabel(effectiveState).toLowerCase()}.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.proposal-review {
		display: grid;
		gap: 16px;
		width: 100%;
	}

	.panel-heading,
	.diff-heading,
	.panel-actions {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
	}

	.eyebrow,
	.intro,
	.diff-heading p,
	.state-panel p,
	.empty-state p,
	.action-error,
	.terminal-state {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.eyebrow {
		margin-bottom: 4px;
		font-weight: 600;
	}

	h2,
	h3 {
		margin: 0;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	h2 {
		font-size: 1.15rem;
	}

	h3 {
		font-size: 0.92rem;
	}

	.intro {
		max-width: 720px;
		margin-top: 6px;
	}

	.state-label {
		flex: 0 0 auto;
		border: 1px solid var(--border);
		padding: 5px 8px;
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-weight: 650;
	}

	.state-label[data-state='review'] {
		border-color: var(--foreground);
		color: var(--foreground);
	}

	.state-label[data-state='stale'],
	.state-label[data-state='error'] {
		border-color: var(--destructive);
		color: var(--destructive);
	}

	.proposal-summary {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) repeat(2, minmax(0, 1fr));
		gap: 1px;
		background: var(--border);
		border-block: 1px solid var(--border);
	}

	.proposal-summary > div {
		display: grid;
		align-content: start;
		gap: 4px;
		min-width: 0;
		background: var(--background);
		padding: 12px 14px;
	}

	.proposal-summary span {
		color: var(--muted-foreground);
		font-size: 0.74rem;
	}

	.proposal-summary strong,
	.proposal-summary code {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.proposal-summary code,
	.diff code {
		font-family: var(--font-mono, ui-monospace, monospace);
	}

	.state-panel,
	.empty-state {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		border: 1px solid var(--border);
		padding: 14px;
	}

	.state-panel > :global(svg),
	.empty-state > :global(svg) {
		flex: 0 0 auto;
		color: var(--muted-foreground);
		margin-top: 2px;
	}

	.state-panel-warning {
		border-color: var(--destructive);
	}

	.state-panel-warning > :global(svg),
	.action-error {
		color: var(--destructive);
	}

	.state-panel strong,
	.empty-state strong {
		display: block;
		font-size: 0.86rem;
		font-weight: 650;
	}

	.state-panel :global(button) {
		margin-left: auto;
		flex: 0 0 auto;
	}

	.diff-heading {
		align-items: center;
	}

	.diff-heading > :global(svg) {
		flex: 0 0 auto;
		color: var(--muted-foreground);
	}

	.diff-heading p {
		margin-top: 4px;
	}

	.diff {
		display: grid;
		max-height: 420px;
		overflow: auto;
		border: 1px solid var(--border);
		background: var(--background);
		font-size: 0.76rem;
	}

	.diff-line {
		display: grid;
		grid-template-columns: 22px 38px minmax(0, 1fr);
		min-width: 0;
		border-block-end: 1px solid color-mix(in srgb, var(--border) 65%, transparent);
		padding: 3px 8px 3px 0;
		line-height: 1.55;
	}

	.diff-line:last-child {
		border-block-end: 0;
	}

	.diff-line.is-added {
		background: color-mix(in srgb, var(--foreground) 7%, var(--background));
	}

	.diff-line.is-removed {
		background: color-mix(in srgb, var(--destructive) 8%, var(--background));
	}

	.diff-marker,
	.diff-number {
		color: var(--muted-foreground);
		text-align: right;
		user-select: none;
	}

	.diff-marker {
		font-weight: 700;
	}

	.diff-line.is-added .diff-marker {
		color: var(--foreground);
	}

	.diff-line.is-removed .diff-marker {
		color: var(--destructive);
	}

	.diff code {
		min-width: 0;
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}

	.action-error {
		font-weight: 550;
	}

	.panel-actions {
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.terminal-state {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.terminal-state :global(svg) {
		color: var(--foreground);
	}

	@media (max-width: 640px) {
		.panel-heading,
		.panel-actions {
			align-items: stretch;
			flex-direction: column;
		}

		.proposal-summary {
			grid-template-columns: 1fr;
		}

		.panel-actions :global(button) {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.diff,
		.diff-line {
			transition: none;
		}
	}
</style>
