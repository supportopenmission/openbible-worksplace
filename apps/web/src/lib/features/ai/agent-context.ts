import type { WorkspaceStorage } from '$lib/storage/types';

export interface AgentContextSelection {
	workspaceId: string;
	generation: number;
	selectedPaths: string[];
	contentPolicy: 'selected-files-only';
}

export interface AgentContextDocument {
	path: string;
	content: string;
	bytes: number;
}

export interface PreparedAgentContext extends AgentContextSelection {
	documents: AgentContextDocument[];
	tools: [];
}

function relativePath(path: string): boolean {
	return Boolean(path) && !path.startsWith('/') && !path.includes('\\') && !path.split('/').includes('..');
}

export async function prepareAgentContext(
	storage: WorkspaceStorage,
	selection: AgentContextSelection
): Promise<PreparedAgentContext> {
	if (!selection.workspaceId.trim()) throw new Error('agent_workspace_required');
	if (!Number.isInteger(selection.generation) || selection.generation < 4) {
		throw new Error('agent_stale_generation');
	}
	const paths = [...new Set(selection.selectedPaths)].filter(relativePath);
	if (paths.length !== selection.selectedPaths.length) throw new Error('agent_relative_path_required');
	const documents: AgentContextDocument[] = [];
	for (const path of paths) {
		const bytes = await storage.readFile(path);
		if (!bytes) throw new Error('agent_context_file_missing');
		const content = new TextDecoder().decode(bytes);
		documents.push({ path, content, bytes: bytes.byteLength });
	}
	return {
		...selection,
		contentPolicy: 'selected-files-only',
		documents,
		tools: []
	};
}
