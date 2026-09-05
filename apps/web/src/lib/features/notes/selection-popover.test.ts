import { describe, expect, it } from 'vitest';
import {
	formatPopoverActions,
	shouldShowFormatPopover
} from './selection-popover';

// SPECSFY: US-001 FR-001 NFR-001 AC-001
describe('format popover visibility', () => {
	it('shows the four actions on a non-collapsed edit selection', () => {
		expect(
			shouldShowFormatPopover({ from: 2, to: 8, collapsed: false }, { mode: 'edit' })
		).toEqual({ visible: true, actions: formatPopoverActions() });
		expect(formatPopoverActions()).toEqual(['bold', 'italic', 'underline', 'highlight']);
	});
});

// SPECSFY: US-001 FR-001 NFR-002 AC-002
describe('format popover mark application', () => {
	it('reports pressed state for the applied bold mark', () => {
		const state = shouldShowFormatPopover(
			{ from: 2, to: 8, collapsed: false },
			{ mode: 'edit', marks: ['bold'] }
		);
		expect(state.visible).toBe(true);
		expect(state.pressed).toEqual({ bold: true, italic: false, underline: false, highlight: false });
	});
});

// SPECSFY: US-001 FR-001 NFR-003 AC-003
describe('format popover hidden states', () => {
	it('stays hidden on collapsed selection or read mode', () => {
		expect(
			shouldShowFormatPopover({ from: 5, to: 5, collapsed: true }, { mode: 'edit' })
		).toEqual({ visible: false, actions: [] });
		expect(
			shouldShowFormatPopover({ from: 2, to: 8, collapsed: false }, { mode: 'read' })
		).toEqual({ visible: false, actions: [] });
	});
});
