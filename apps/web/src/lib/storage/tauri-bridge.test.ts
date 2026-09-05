import { describe, expect, it } from 'vitest';
import { invokeWorkspaceCommand } from './tauri-bridge';

describe('typed Tauri bridge', () => {
	// SPECSFY: US-001 FR-002 NFR-003 AC-004
	it('returns a typed result for a named workspace operation', async () => {
		const result = await invokeWorkspaceCommand({
			name: 'workspace.readFile',
			relativePath: '.openbible/preferences.json'
		});

		expect(result.ok).toBe(true);
	});

	it('allows deleting only a validated workspace-relative file', async () => {
		const result = await invokeWorkspaceCommand({
			name: 'workspace.deleteFile',
			relativePath: 'notes/example.md'
		});

		expect(result.ok).toBe(true);
		await expect(
			invokeWorkspaceCommand({ name: 'workspace.deleteFile', relativePath: '../outside.md' })
		).rejects.toMatchObject({ code: 'path_outside_workspace' });
	});
});
