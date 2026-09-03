import { describe, expect, it } from 'vitest';
import { formContinuousRange, selectionFromVerseNumbers } from './verse-selection';

describe('verse-selection', () => {
	it('forms a continuous range for Gn 1.2–5', () => {
		// SPECSFY: US-001 FR-001 FR-002 AC-002
		expect(formContinuousRange(2, 5)).toEqual({ verseStart: 2, verseEnd: 5 });
		expect(formContinuousRange(5, 2)).toEqual({ verseStart: 2, verseEnd: 5 });
	});

	it('rejects a disjoint pair such as 1.3 and 1.7 as one range', () => {
		// SPECSFY: US-001 FR-001 NFR-001 AC-003
		expect(selectionFromVerseNumbers([3, 7])).toBeNull();
		expect(formContinuousRange(3, 3)).toEqual({ verseStart: 3, verseEnd: 3 });
	});
});
