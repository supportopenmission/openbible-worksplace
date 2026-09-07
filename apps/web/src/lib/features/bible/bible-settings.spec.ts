import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('BibleSettings interface contract', () => {
	it('concentra gestão e importação de Bíblias na mesma aba', () => {
		const source = readFileSync(new URL('./BibleSettings.svelte', import.meta.url), 'utf8');
		const manager = readFileSync(new URL('./BibleLibraryManager.svelte', import.meta.url), 'utf8');

		expect(source).toContain('<BibleLibraryManager />');
		expect(source).toContain('<LocalBibleImport');
		expect(source).toContain('<RemoteBibleImport');
		expect(source).toContain('Adicionar Bíblias');
		expect(manager).toContain('Use os controles de importação abaixo.');
		expect(manager).not.toContain('Importe pela aba Armazenamento.');
	});
});
