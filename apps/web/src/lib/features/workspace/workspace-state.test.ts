import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapWorkspace } from '$lib/storage/session';
import { DEFAULT_PREFERENCES } from '$lib/storage/preferences';
import { WorkspaceState } from './workspace-state.svelte';

vi.mock('$lib/storage/session', () => ({
	bootstrapWorkspace: vi.fn()
}));

vi.mock('$lib/theme/theme', () => ({
	applyTheme: vi.fn()
}));

const mockedBootstrap = vi.mocked(bootstrapWorkspace);

function readySnapshot() {
	return {
		status: 'ready' as const,
		storage: null,
		config: null,
		preferences: DEFAULT_PREFERENCES,
		persisted: true,
		permission: 'granted' as const,
		error: ''
	};
}

describe('workspace boot', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedBootstrap.mockResolvedValue(readySnapshot());
	});

	// SPECSFY: BOOT-001
	it('executa o bootstrap uma única vez para chamadas concorrentes', async () => {
		const workspace = new WorkspaceState();

		await Promise.all([workspace.boot(), workspace.boot(), workspace.boot()]);

		expect(mockedBootstrap).toHaveBeenCalledTimes(1);
		expect(workspace.status).toBe('ready');
	});

	// SPECSFY: BOOT-001
	it('não recarrega quando o workspace já está pronto', async () => {
		const workspace = new WorkspaceState();

		await workspace.boot();
		await workspace.boot();

		expect(mockedBootstrap).toHaveBeenCalledTimes(1);
	});

	// SPECSFY: BOOT-001
	it('permite novo boot no fluxo de permissão', async () => {
		const workspace = new WorkspaceState();

		await workspace.boot();
		await workspace.grantPermission();

		expect(mockedBootstrap).toHaveBeenCalledTimes(2);
	});
});
