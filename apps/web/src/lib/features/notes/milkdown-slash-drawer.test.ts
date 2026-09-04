import { describe, expect, it } from 'vitest';
import { filterSlashItems, getSlashItems } from './milkdown-slash';

// SPECSFY: US-002 FR-003 NFR-002 AC-002
describe('milkdown slash drawer (mobile)', () => {
	it('exposes the same command list as desktop for the bottom sheet', () => {
		const ids = getSlashItems().map((item) => item.id);
		expect(ids.length).toBeGreaterThanOrEqual(7);
		expect(ids).toContain('verse');
	});

	it('searches commands by label or alias', () => {
		expect(filterSlashItems(getSlashItems(), '/cit').some((item) => item.id === 'quote')).toBe(
			true
		);
	});

	it('shows the full list again when the query is cleared', () => {
		expect(filterSlashItems(getSlashItems(), '/')).toEqual(getSlashItems());
	});
});
