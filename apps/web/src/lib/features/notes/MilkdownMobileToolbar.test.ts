import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import MilkdownMobileToolbar from './MilkdownMobileToolbar.svelte';
import { applyToolbarActionToMarkdown } from './milkdown-markdown-io';

// SPECSFY: US-003 FR-004 NFR-002 AC-003
describe('milkdown mobile toolbar', () => {
	it('does not render while the editor is not active', () => {
		const { body } = render(MilkdownMobileToolbar, { props: { active: false } });
		expect(body).not.toContain('milkdown-toolbar');
	});

	it('renders named block actions above the navigation', () => {
		const { body } = render(MilkdownMobileToolbar);
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
			expect(body).toContain(label);
		}
		expect(body).toContain('milkdown-toolbar');
	});

	it('renders a compact toggle when the formatting tray is collapsed', () => {
		const { body } = render(MilkdownMobileToolbar, { props: { visible: false } });
		expect(body).toContain('milkdown-toolbar-fab');
		expect(body).toContain('Abrir ferramentas de formatação');
		expect(body).not.toContain('role="toolbar"');
	});
});

// SPECSFY: US-003 FR-004 NFR-002 NFR-003 AC-016
describe('toolbar markdown actions', () => {
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
