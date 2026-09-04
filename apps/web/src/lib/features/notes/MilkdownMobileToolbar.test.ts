import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import MilkdownMobileToolbar from './MilkdownMobileToolbar.svelte';
import { applyToolbarActionToMarkdown } from './milkdown-markdown-io';

// SPECSFY: US-003 FR-004 NFR-002 AC-003
describe('milkdown mobile toolbar', () => {
	it('renders seven named actions above the navigation', () => {
		const { body } = render(MilkdownMobileToolbar);
		for (const label of [
			'Negrito',
			'Itálico',
			'Título',
			'Lista',
			'Tarefas',
			'Citação',
			'Versículo'
		]) {
			expect(body).toContain(label);
		}
		expect(body).toContain('milkdown-toolbar');
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
});
