import { getActiveWorkspace, setActiveWorkspace, touchLastOpened } from './workspace-catalog';

export type FlushHandler = () => Promise<void>;

export interface SwitchResult {
	workspaceId: string;
	generation: number;
	committed: true;
}

export class StaleGenerationError extends Error {
	readonly code = 'stale_generation' as const;
	constructor() {
		super('stale_generation: a operação pertence a uma geração antiga e não pode assumir o workspace ativo.');
		this.name = 'StaleGenerationError';
	}
}

export class AutosaveFailedError extends Error {
	readonly code = 'AUTOSAVE_FAILED' as const;
	readonly activeWorkspaceId: string | null;
	readonly actions = ['retry', 'discard-and-switch'] as const;
	constructor(activeWorkspaceId: string | null, cause?: unknown) {
		super('Autosave pendente falhou; a troca foi bloqueada e o workspace atual permanece ativo.');
		this.name = 'AutosaveFailedError';
		this.activeWorkspaceId = activeWorkspaceId;
		this.cause = cause;
	}
}

/**
 * Barreira de troca com token de geração.
 * Fluxo: flush active → persist/discard → increment generation →
 * resolve destination → activate com commit guard.
 * Falha antes da ativação mantém o ponteiro anterior; resultados de
 * gerações antigas nunca vencem a mais nova (stale async).
 */
export class WorkspaceLifecycle {
	private flushHandlers = new Set<FlushHandler>();

	registerFlushHandler(handler: FlushHandler): () => void {
		this.flushHandlers.add(handler);
		return () => {
			this.flushHandlers.delete(handler);
		};
	}

	get activeWorkspaceId(): string | null {
		return getActiveWorkspace().workspaceId;
	}

	get generation(): number {
		return getActiveWorkspace().generation;
	}

	private commitGuard(token: number, requestedId: string): void {
		const current = getActiveWorkspace();
		// Token precisa ser o da geração recém-incrementada; qualquer outro
		// resultado é stale e deve ser descartado sem tocar o ativo.
		if (token !== current.generation + 1) {
			throw new StaleGenerationError();
		}
		void requestedId;
	}

	private commit(targetWorkspaceId: string, baseGeneration: number): SwitchResult {
		const token = baseGeneration + 1;
		this.commitGuard(token, targetWorkspaceId);
		const pointer = setActiveWorkspace(targetWorkspaceId);
		touchLastOpened(targetWorkspaceId);
		return { workspaceId: targetWorkspaceId, generation: pointer.generation, committed: true };
	}

	async flushActive(): Promise<void> {
		for (const handler of [...this.flushHandlers]) {
			await handler();
		}
	}

	/**
	 * Confirma a ativação com guarda de geração, sem passar pela barreira de
	 * autosave. Usado quando o chamador já concluiu (ou dispensou) o flush.
	 */
	commitActivation(
		targetWorkspaceId: string,
		baseGeneration = getActiveWorkspace().generation
	): SwitchResult {
		return this.commit(targetWorkspaceId, baseGeneration);
	}

	async flushAndSwitch(
		targetWorkspaceId: string,
		options: { discard?: boolean } = {}
	): Promise<SwitchResult> {
		const previousActive = getActiveWorkspace().workspaceId;
		// Base capturada antes do flush para invalidar troca concorrente (stale).
		const baseGeneration = getActiveWorkspace().generation;
		if (!options.discard) {
			try {
				await this.flushActive();
			} catch (error) {
				throw new AutosaveFailedError(previousActive, error);
			}
		}
		return this.commit(targetWorkspaceId, baseGeneration);
	}

	async retrySwitch(targetWorkspaceId: string): Promise<SwitchResult> {
		return this.flushAndSwitch(targetWorkspaceId);
	}

	async discardAndSwitch(targetWorkspaceId: string): Promise<SwitchResult> {
		return this.flushAndSwitch(targetWorkspaceId, { discard: true });
	}
}

let sharedLifecycle: WorkspaceLifecycle | null = null;

/** Lifecycle compartilhado da janela; uma instância por sessão. */
export function getWorkspaceLifecycle(): WorkspaceLifecycle {
	if (!sharedLifecycle) sharedLifecycle = new WorkspaceLifecycle();
	return sharedLifecycle;
}

/** Isola o commit guard em função pura para auditoria de concorrência. */
export function isStaleResult(token: number, activeGeneration: number): boolean {
	return token !== activeGeneration + 1;
}
