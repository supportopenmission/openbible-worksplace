import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: migração gradual do editor (Edra) — chave de motor em Configurações.
describe('editor engine settings', () => {
	it('renders the engine selector inside the appearance panel', () => {
		const source = readFileSync(new URL('./ConfigPage.svelte', import.meta.url), 'utf8');
		expect(source).toContain('<EditorSettings />');
		expect(source).toContain('settings-stack');
	});

	it('offers the new Edra engine first and the classic one as fallback', () => {
		const source = readFileSync(new URL('./EditorSettings.svelte', import.meta.url), 'utf8');
		expect(source).toContain("value: 'edra'");
		expect(source).toContain("value: 'milkdown'");
		expect(source).toContain('name="openbible-editor-engine"');
		expect(source.indexOf("value: 'edra'")).toBeLessThan(source.indexOf("value: 'milkdown'"));
	});

	it('defaults to the Edra engine and persists the choice in the workspace', () => {
		const source = readFileSync(new URL('./EditorSettings.svelte', import.meta.url), 'utf8');
		expect(source).toContain("let engine = $state<NoteEditorEngine>('edra')");
		expect(source).toContain('workspace.updatePreferences({ editorEngine: value })');
		expect(source).toContain('openbible:editor-engine-changed');
	});

	it('documents that the saved note format does not change with the engine', () => {
		const source = readFileSync(new URL('./EditorSettings.svelte', import.meta.url), 'utf8');
		expect(source).toContain('o conteúdo salvo não muda de formato');
	});
});
