import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { applyToolbarActionToMarkdown } from './milkdown-markdown-io';
import { readNoteToolbarEnabled, saveNoteToolbarEnabled } from './note-editor-layout';

const toolbarSource = readFileSync(new URL('./MilkdownMobileToolbar.svelte', import.meta.url), 'utf8');

// SPECSFY: US-003 FR-004 NFR-002 AC-003
describe('milkdown mobile toolbar', () => {
	it('does not render while the editor is not active', () => {
		expect(toolbarSource).toContain('{#if active && enabled}');
	});

	it('renders named block actions in the sticky top toolbar', () => {
		for (const label of [
			'Negrito',
			'Itálico',
			'Título',
			'Lista',
			'Lista numerada',
			'Checklist',
			'Citação',
			'Versículo'
		]) {
			expect(toolbarSource).toContain(`label: '${label}'`);
		}
		expect(toolbarSource).toContain('class="milkdown-toolbar"');
	});

	it('renders a compact toggle when the formatting tray is collapsed', () => {
		expect(toolbarSource).toContain('class="milkdown-toolbar-toggle"');
		expect(toolbarSource).toContain('aria-label="Abrir ferramentas de formatação"');
		expect(toolbarSource).toContain('aria-expanded="false"');
		expect(toolbarSource).toContain('{:else}');
	});

	// SPECSFY: US-003 FR-004 NFR-002 AC-003 AC-016
	it('uses a labeled toggle and grouped icon actions for the compact mobile surface', () => {
		expect(toolbarSource).toContain('<span>Formatar</span>');
		expect(toolbarSource).toContain('class="toolbar-group"');
		expect(toolbarSource).toContain('class={activeActions[action.id] ? \'toolbar-action active\' : \'toolbar-action\'}');
		expect(toolbarSource).toContain('aria-label="Recolher barra de ferramentas"');
		expect(toolbarSource).toContain('aria-expanded="true"');
	});

	it('can be disabled for direct Markdown editing', () => {
		expect(toolbarSource).toContain('enabled?: boolean');
		expect(toolbarSource).toContain('{#if active && enabled}');
	});

	it('declares a sticky top position for the formatting tray', async () => {
		const { readFile } = await import('node:fs/promises');
		const source = await readFile(
			new URL('./MilkdownMobileToolbar.svelte', import.meta.url),
			'utf8'
		);
		expect(source).toContain('position: sticky');
		expect(source).toContain('top: 0');
	});

	it('keeps the collapsed toggle aligned right with a formatting icon and lower chamfer', async () => {
		const { readFile } = await import('node:fs/promises');
		const source = await readFile(
			new URL('./MilkdownMobileToolbar.svelte', import.meta.url),
			'utf8'
		);
		expect(source).toContain('PanelTop');
		expect(source).toContain('width: fit-content');
		expect(source).toContain('margin-inline-start: auto');
		expect(source).toContain('border-radius: 0 0 8px 8px');
	});

	it('keeps the mobile collapsed toggle at the top instead of floating like a FAB', async () => {
		const { readFile } = await import('node:fs/promises');
		const source = await readFile(
			new URL('./MilkdownMobileToolbar.svelte', import.meta.url),
			'utf8'
		);
		expect(source).toContain('top: env(safe-area-inset-top, 0px)');
		expect(source).not.toContain('position: fixed');
		expect(source).not.toContain('bottom: max(calc(68px');
	});
});

// SPECSFY: US-003 FR-004 NFR-002 NFR-003 AC-016
describe('toolbar markdown actions', () => {
	it('keeps the toolbar enabled by default and persists the direct Markdown choice', () => {
		const values = new Map<string, string>();
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (key: string) => values.get(key) ?? null,
				setItem: (key: string, value: string) => values.set(key, value)
			}
		});
		expect(readNoteToolbarEnabled()).toBe(true);
		saveNoteToolbarEnabled(false);
		expect(readNoteToolbarEnabled()).toBe(false);
		vi.unstubAllGlobals();
	});

	it('bolds the selected text without requiring slash', () => {
		expect(applyToolbarActionToMarkdown('hello world', { from: 6, to: 11 }, 'bold')).toBe(
			'hello **world**'
		);
	});

	it('turns the current line into a heading', () => {
		expect(applyToolbarActionToMarkdown('hello', { from: 0, to: 5 }, 'heading')).toBe('# hello');
	});

	it('turns the current line into an ordered list item', () => {
		expect(applyToolbarActionToMarkdown('hello', { from: 0, to: 5 }, 'ordered')).toBe('1. hello');
	});
});
