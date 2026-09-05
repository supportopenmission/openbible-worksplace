import { describe, expect, it } from 'vitest';
import { extractNoteHeadings, headingAnchorId } from './note-index';

// SPECSFY: US-003 FR-003 NFR-001 AC-007
describe('note index on desktop', () => {
	it('lists H1-H3 in document order with stable anchors', () => {
		const headings = extractNoteHeadings('# Estudo\n## Criação\n### Dia 1\nTexto\n');
		expect(headings).toEqual([
			{ level: 1, title: 'Estudo', anchor: headingAnchorId(1, 'Estudo') },
			{ level: 2, title: 'Criação', anchor: headingAnchorId(2, 'Criação') },
			{ level: 3, title: 'Dia 1', anchor: headingAnchorId(3, 'Dia 1') }
		]);
	});
});

// SPECSFY: US-003 FR-003 NFR-002 AC-008
describe('note index anchors for mobile navigation', () => {
	it('derives distinct anchors per heading for drawer scrolling', () => {
		const first = headingAnchorId(2, 'Criação');
		const second = headingAnchorId(2, 'Criação', 1);
		expect(first).not.toBe(second);
		expect(extractNoteHeadings('## Criação\n## Criação\n')[1].anchor).toBe(second);
	});
});

// SPECSFY: US-003 FR-003 NFR-003 AC-009
describe('note index without headings', () => {
	it('returns an empty list so the menu shows the empty state', () => {
		expect(extractNoteHeadings('Só parágrafos, sem títulos.\n')).toEqual([]);
	});
});
