import { describe, expect, it } from 'vitest';
import { invokeWorkspaceCommand } from './tauri-bridge';

describe('Tauri command boundary', () => {
	// SPECSFY: US-003 FR-002 NFR-001 AC-005
	it('rejects paths outside the workspace and free SQL', async () => {
		await expect(
			invokeWorkspaceCommand({
				name: 'workspace.readFile',
				relativePath: '../../outside.txt'
			})
		).rejects.toMatchObject({ code: 'path_outside_workspace' });

		await expect(
			invokeWorkspaceCommand({ name: 'index.executeSql', sql: 'DROP TABLE note_verse_ref' })
		).rejects.toMatchObject({ code: 'command_not_allowed' });
	});
});
