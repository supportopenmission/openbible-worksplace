import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import MilkdownNoteEditor from './MilkdownNoteEditor.svelte';

// SPECSFY: US-003 FR-006 NFR-003 AC-007
describe('milkdown canvas without chrome', () => {
	it('renders a full-bleed host without frame, card or border', () => {
		const { body } = render(MilkdownNoteEditor, { props: { markdown: '# T\n\ntexto' } });
		expect(body).toContain('milkdown');
		expect(body).not.toContain('note-card');
		expect(body).not.toMatch(/border-(rounded|solid)|box-shadow/);
	});
});

// SPECSFY: US-003 FR-001 FR-004 FR-006 NFR-003 AC-014
describe('milkdown theme tokens', () => {
	it('uses app tokens instead of decorative effects', () => {
		const { body } = render(MilkdownNoteEditor, { props: { markdown: 'texto' } });
		expect(body).not.toContain('glow');
		expect(body).not.toContain('gradient');
	});
});
