import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: US-003 FR-006 NFR-003 AC-010
describe('config sem tela inicial', () => {
	it('remove qualquer controle de tela inicial da configuração', () => {
		const config = new URL('./ConfigPage.svelte', import.meta.url);
		const source = readFileSync(config, 'utf8');
		expect(source).not.toContain('Tela inicial');
	});

	it('usa navegação lateral vertical e um container desktop mais amplo', () => {
		const source = readFileSync(new URL('./ConfigPage.svelte', import.meta.url), 'utf8');
		expect(source).toContain('config-layout');
		expect(source).toContain('config-sidebar');
		expect(source).toContain('aria-orientation="vertical"');
		expect(source).toContain('max-width: 1120px');
	});

	it('ordena aparência primeiro e backup imediatamente antes de sobre', () => {
		const source = readFileSync(new URL('./ConfigPage.svelte', import.meta.url), 'utf8');
		const appearance = source.indexOf("id: 'appearance'");
		const stats = source.indexOf("id: 'stats'");
		const backups = source.indexOf("id: 'backups'");
		const about = source.indexOf("id: 'about'");

		expect(appearance).toBeGreaterThan(-1);
		expect(appearance).toBeLessThan(stats);
		expect(stats).toBeLessThan(backups);
		expect(backups).toBeLessThan(about);
	});

	it('concentra marca, versão e informações do projeto na seção Sobre', () => {
		const source = readFileSync(new URL('./ConfigPage.svelte', import.meta.url), 'utf8');
		expect(source).toContain('src="/logo.png"');
		expect(source).toContain('alt="OpenBible"');
		expect(source).toContain('about-version-badge');
		expect(source).toContain('Informações do projeto');
		expect(source).toContain('https://github.com/supportopenmission/openbible-worksplace');
		expect(source).not.toMatch(/class="about-version"/);
		expect(source).not.toContain('config-footer');
	});

	it('mantém a seção selecionada em uma URL navegável', () => {
		const source = readFileSync(new URL('./ConfigPage.svelte', import.meta.url), 'utf8');
		expect(source).toContain("searchParams.get('section')");
		expect(source).toContain('replaceState');
		expect(source).toContain('urlSection');
		expect(source).toContain('<svelte:head>');
	});
});
