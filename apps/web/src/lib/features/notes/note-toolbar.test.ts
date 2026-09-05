import { describe, expect, it } from 'vitest';
import { resolveToolbarVisibility } from './note-toolbar';

// SPECSFY: US-006 FR-006 NFR-001 AC-016
describe('toolbar default visibility', () => {
	it('is visible while editing and hidden in view mode', () => {
		expect(resolveToolbarVisibility({ mode: 'edit', alwaysVisible: false }).visible).toBe(true);
		expect(resolveToolbarVisibility({ mode: 'view', alwaysVisible: false }).visible).toBe(false);
	});
});

// SPECSFY: US-006 FR-006 NFR-002 AC-017
describe('toolbar preference persistence', () => {
	it('applies the always-visible option immediately in both modes', () => {
		expect(resolveToolbarVisibility({ mode: 'edit', alwaysVisible: true })).toEqual({
			visible: true,
			overlapsContent: false
		});
		expect(resolveToolbarVisibility({ mode: 'view', alwaysVisible: true }).visible).toBe(true);
	});
});

// SPECSFY: US-006 FR-006 NFR-003 AC-018
describe('toolbar consistency across viewports', () => {
	it('never covers content on mobile or desktop', () => {
		for (const viewport of ['mobile', 'desktop'] as const) {
			expect(
				resolveToolbarVisibility({ mode: 'edit', alwaysVisible: false, viewport })
					.overlapsContent
			).toBe(false);
		}
	});
});
