import { prepareWorkspace } from '../../storage/workspace';
import type { StorageKind, WorkspaceStorage } from '../../storage/types';
import type { AgentCommandResult } from './agent-command';
import { expect } from 'vitest';

class MemoryWorkspaceStorage implements WorkspaceStorage {
	readonly files = new Map<string, Uint8Array>();
	readonly directories = new Set<string>();

	constructor(
		readonly kind: StorageKind = 'opfs',
		readonly label = 'Fixture workspace'
	) {}

	async ensureDirectory(path: string) {
		this.directories.add(path);
	}

	async writeFile(path: string, content: string | Uint8Array) {
		this.files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
	}

	async readFile(path: string) {
		return this.files.get(path) ?? null;
	}

	async fileExists(path: string) {
		return this.files.has(path);
	}

	async listFiles(path: string) {
		const prefix = `${path.replace(/\/$/, '')}/`;
		return [...this.files.keys()]
			.filter((filePath) => filePath.startsWith(prefix) && !filePath.slice(prefix.length).includes('/'))
			.map((filePath) => filePath.slice(prefix.length))
			.sort();
	}
}

export const authorialText = '# Romanos 8\n\nA esperança permanece.\n';

export async function createWorkspaceAgentFixture() {
	const storage = new MemoryWorkspaceStorage();
	await prepareWorkspace(storage);
	await storage.writeFile('notes/romans-08.md', authorialText);
	return { storage, workspaceId: 'workspace-study', generation: 4 };
}

export async function readFixtureText(storage: WorkspaceStorage, path: string) {
	const bytes = await storage.readFile(path);
	return bytes ? new TextDecoder().decode(bytes) : null;
}

export async function executeAgent(storage: WorkspaceStorage, command: Record<string, unknown>) {
	const workspaceDomain = await import('../../storage/workspace');
	const domain = workspaceDomain as typeof workspaceDomain & {
		executeAgent?: (storage: WorkspaceStorage, command: Record<string, unknown>) => Promise<AgentCommandResult>;
		runAgentCommand?: (storage: WorkspaceStorage, command: Record<string, unknown>) => Promise<AgentCommandResult>;
	};
	const executor = domain.executeAgent ?? domain.runAgentCommand;
	expect(executor).toEqual(expect.any(Function));
	if (typeof executor !== 'function') throw new Error('agent_executor_unavailable');
	return executor(storage, command);
}
