import { describe, expect, it } from 'vitest';
import {
	filterSlashItems,
	getSlashItems,
	moveSlashSelection
} from './milkdown-slash';

// SPECSFY: US-001 US-002 FR-001 FR-003 NFR-002 AC-001
describe('milkdown slash menu (desktop)', () => {
	it('offers verse, headings, lists, task, quote, code and divider', () => {
		const ids = getSlashItems().map((item) => item.id);
		for (const id of ['verse', 'heading', 'bullet', 'ordered', 'task', 'quote', 'code', 'divider']) {
			expect(ids).toContain(id);
		}
	});

	it('filters down to the verse command for /vers', () => {
		expect(filterSlashItems(getSlashItems(), '/vers').map((item) => item.id)).toEqual(['verse']);
	});
});

// SPECSFY: US-001 US-002 US-003 FR-003 FR-004 NFR-002 AC-013
describe('milkdown slash keyboard navigation', () => {
	it('moves the selection with wrap-around', () => {
		expect(moveSlashSelection(7, 6, 'next')).toBe(0);
		expect(moveSlashSelection(7, 0, 'prev')).toBe(6);
		expect(moveSlashSelection(7, 2, 'next')).toBe(3);
	});
});
