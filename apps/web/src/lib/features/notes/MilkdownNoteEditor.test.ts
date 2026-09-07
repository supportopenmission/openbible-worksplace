import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const editorSource = readFileSync(new URL('./MilkdownNoteEditor.svelte', import.meta.url), 'utf8');

// SPECSFY: US-003 FR-006 NFR-003 AC-007
describe('milkdown canvas without chrome', () => {
	it('renders a full-bleed host without frame, card or border', () => {
		expect(editorSource).toContain('class="milkdown-editor"');
		expect(editorSource).toContain('data-testid="note-canvas"');
		expect(editorSource).not.toContain('note-card');
		expect(editorSource).toContain('border: 0;');
		expect(editorSource).toContain('box-shadow: none;');
	});
});

// SPECSFY: US-003 FR-001 FR-004 FR-006 NFR-003 AC-014
describe('milkdown theme tokens', () => {
	it('uses app tokens instead of decorative effects', () => {
		expect(editorSource).not.toContain('glow');
		expect(editorSource).not.toContain('gradient');
	});
});
