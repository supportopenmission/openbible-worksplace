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

	it('expõe exclusão transacional do registro com workspaceId obrigatório', async () => {
		const result = await invokeWorkspaceCommand({
			name: 'database.deleteWorkspace',
			workspaceId: 'workspace-a'
		});

		expect(result.ok).toBe(true);
		await expect(
			invokeWorkspaceCommand({ name: 'database.deleteWorkspace', workspaceId: '  ' })
		).rejects.toMatchObject({ code: 'workspace_id_required' });
	});

	it('expõe exclusão de conteúdo autoral por workspace, tipo e id', async () => {
		await expect(
			invokeWorkspaceCommand({
				name: 'database.deleteContent',
				workspaceId: 'workspace-a',
				kind: 'note',
				id: 'note-a'
			})
		).resolves.toMatchObject({ ok: true });
		await expect(
			invokeWorkspaceCommand({
				name: 'database.deleteContent',
				workspaceId: 'workspace-a',
				kind: 'note',
				id: '../outside'
			})
		).rejects.toMatchObject({ code: 'content_id_required' });
	});

	// SPECSFY: US-001 US-002 FR-002 FR-003 NFR-001 NFR-004 AC-005 AC-020 AC-030
	it('expõe somente comandos de persistência sync allowlisted e escopados', async () => {
		const result = await invokeWorkspaceCommand({
			name: 'sync.writeNote',
			workspaceId: 'workspace-native-001',
			noteId: 'note-001',
			schemaVersion: 1,
			payload: { title: 'Nota local' }
		});

		expect(result.ok).toBe(true);
		await expect(
			invokeWorkspaceCommand({
				name: 'sync.writeNote',
				workspaceId: 'workspace-native-001',
				noteId: '../outside',
				schemaVersion: 1,
				payload: {}
			})
		).rejects.toMatchObject({ code: 'sync_note_id_required' });
		await expect(
			invokeWorkspaceCommand({ name: 'sync.readState', workspaceId: 'workspace-native-001', noteId: 'note-001' })
		).resolves.toMatchObject({ ok: true });
	});

	// SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 AC-001 AC-002 AC-003 AC-015
	it('expõe comandos de credencial sem devolver o segredo no resultado', async () => {
		const result = await invokeWorkspaceCommand({
			name: 'agent.profile.save',
			profileId: 'profile-study',
			provider: 'openai',
			model: 'gpt-5',
			secret: 'sk-test-secret'
		});

		expect(result.ok).toBe(true);
		expect(JSON.stringify(result)).not.toContain('sk-test-secret');
		await expect(
			invokeWorkspaceCommand({
				name: 'agent.profile.save',
				profileId: 'profile-study',
				provider: 'openai',
				model: 'gpt-5',
				secret: ' '
			})
		).rejects.toMatchObject({ code: 'agent_secret_required' });
	});
});
