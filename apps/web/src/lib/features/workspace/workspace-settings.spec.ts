import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// SPECSFY: US-003 FR-003 FR-004 NFR-003 AC-018 AC-019
	describe('WorkspaceSettings interface contract', () => {
	it('prioriza linguagem humana e mantém detalhes técnicos secundários', () => {
		const source = readFileSync(new URL('./WorkspaceSettings.svelte', import.meta.url), 'utf8');

		expect(source).not.toContain('Trocar armazenamento');
		expect(source).not.toContain('Persistência do navegador');
		expect(source).not.toContain('Manter dados neste dispositivo');
		expect(source).toContain('Banco operacional');
		expect(source).not.toContain('<dt>Fonte local</dt>');
		expect(source).not.toContain('<dt>Nome</dt>');
		expect(source).not.toContain('<dt>Bíblias</dt>');
		expect(source).not.toContain('Importar Bíblias');
		expect(source).not.toContain('RemoteBibleImport');
		expect(source).toContain('Reorganizar dados para pesquisa');
		expect(source).toContain('Ver detalhes técnicos');

		const workspacesView = source.indexOf("{#if view === 'workspaces'}");
		const indexRecovery = source.indexOf('class="index-recovery"');
		expect(workspacesView).toBeGreaterThan(-1);
		expect(indexRecovery).toBeGreaterThan(workspacesView);
	});

	it('separa registro local, remoção recuperável e exclusão destrutiva', () => {
		const source = readFileSync(new URL('./WorkspaceSettings.svelte', import.meta.url), 'utf8');

		expect(source).toContain('storageBackendLabel(entry.backend)');
		expect(source).toContain('Remover da lista');
		expect(source).toContain('Restaurar na lista');
		expect(source).toContain('Excluir espaço de estudo');
		expect(source).toContain('dados preservados');
		expect(source).toContain('aria-live="polite"');
	});

	it('mantém estados de loading, vazio, erro e ação por teclado nomeados', () => {
		const source = readFileSync(new URL('./WorkspaceSettings.svelte', import.meta.url), 'utf8');

		expect(source).toContain('Carregando espaços de estudo');
		expect(source).toContain('Nenhum espaço de estudo cadastrado');
		expect(source).toContain('role="alert"');
		expect(source).toContain('type="submit"');
		expect(source).toContain('Tentar novamente');
	});

	it('anuncia bloqueio transacional e não oferece caminho de força', () => {
		const source = readFileSync(new URL('./WorkspaceSettings.svelte', import.meta.url), 'utf8');

		expect(source).toContain('persistence_conflict');
		expect(source).toContain('aria-live="assertive"');
		expect(source).toContain('Nenhuma opção de forçar está disponível.');
		expect(source).not.toContain('Forçar exclusão');
	});
});
