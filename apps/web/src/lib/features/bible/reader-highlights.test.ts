import { describe, expect, it } from 'vitest';
import {
	READER_HIGHLIGHT_PALETTE,
	applyHighlight,
	buildVerseFenceFromRange,
	eraseHighlight,
	formatCopyReference,
	formatCopyTextAndReference,
	highlightsCoveringVerse,
	type HighlightSelection,
	type ReaderHighlight
} from './reader-highlights';

const chapter = {
	versionId: 'ara.sqlite',
	bookId: 1,
	chapter: 1
};

function range(verseStart: number, verseEnd: number): HighlightSelection {
	return { ...chapter, verseStart, verseEnd };
}

describe('reader-highlights', () => {
	it('applies a solid pen to the exact selected range', () => {
		// SPECSFY: US-002 FR-003 FR-009 NFR-003 AC-004
		const next = applyHighlight([], range(2, 5), 'pen-gold');
		expect(next).toHaveLength(1);
		expect(next[0]).toMatchObject({
			...chapter,
			verseStart: 2,
			verseEnd: 5,
			styleId: 'pen-gold'
		});
	});

	it('keeps overlapping ranges as distinct annotations', () => {
		// SPECSFY: US-002 FR-004 FR-008 AC-005
		const withInner = applyHighlight([], range(3, 3), 'pen-gold');
		const withBoth = applyHighlight(withInner, range(2, 5), 'underline');
		expect(withBoth).toHaveLength(2);
		expect(highlightsCoveringVerse(withBoth, 3)).toHaveLength(2);
		expect(withBoth.filter((item) => item.verseStart === 3 && item.verseEnd === 3)).toHaveLength(1);
		expect(withBoth.filter((item) => item.verseStart === 2 && item.verseEnd === 5)).toHaveLength(1);
	});

	it('edits or erases only the annotation with the exact selected range', () => {
		// SPECSFY: US-002 FR-003 FR-004 FR-005 AC-006
		const existing: ReaderHighlight[] = [
			{ ...chapter, verseStart: 3, verseEnd: 3, styleId: 'pen-gold' },
			{ ...chapter, verseStart: 2, verseEnd: 5, styleId: 'underline' }
		];
		const erased = eraseHighlight(existing, range(3, 3));
		expect(erased).toHaveLength(1);
		expect(erased[0]).toMatchObject({ verseStart: 2, verseEnd: 5, styleId: 'underline' });
		const swapped = applyHighlight(existing, range(3, 3), 'wavy');
		expect(swapped.find((item) => item.verseStart === 3 && item.verseEnd === 3)?.styleId).toBe(
			'wavy'
		);
		expect(swapped.find((item) => item.verseStart === 2 && item.verseEnd === 5)?.styleId).toBe(
			'underline'
		);
	});

	it('erases the exact range and leaves other covering intervals', () => {
		// SPECSFY: US-002 FR-005 FR-009 AC-007
		const existing: ReaderHighlight[] = [
			{ ...chapter, verseStart: 3, verseEnd: 3, styleId: 'pen-gold' },
			{ ...chapter, verseStart: 2, verseEnd: 5, styleId: 'box' }
		];
		expect(eraseHighlight(existing, range(3, 3))).toEqual([
			{ ...chapter, verseStart: 2, verseEnd: 5, styleId: 'box' }
		]);
	});

	it('serializes a local copy of the reference only', () => {
		// SPECSFY: US-003 FR-006 NFR-002 AC-008
		expect(
			formatCopyReference({
				book: 'Gênesis',
				chapter: 1,
				verseStart: 2,
				verseEnd: 5,
				versionLabel: 'ARA'
			})
		).toBe('Gênesis 1.2–5 (ARA)');
	});

	it('serializes verse text plus the reference', () => {
		// SPECSFY: US-003 FR-006 AC-009
		const copied = formatCopyTextAndReference({
			book: 'Gênesis',
			chapter: 1,
			verseStart: 2,
			verseEnd: 5,
			versionLabel: 'ARA',
			verses: [
				{ number: 2, text: 'A terra era sem forma e vazia.' },
				{ number: 3, text: 'Disse Deus: Haja luz.' },
				{ number: 4, text: 'Viu Deus que a luz era boa.' },
				{ number: 5, text: 'Chamou Deus à luz Dia.' }
			]
		});
		expect(copied).toContain('A terra era sem forma e vazia.');
		expect(copied).toContain('Chamou Deus à luz Dia.');
		expect(copied).toContain('Gênesis 1.2–5 (ARA)');
	});

	it('exposes the Q6 palette without Logos extras', () => {
		// SPECSFY: US-002 FR-009 NFR-003 AC-013
		const kinds = READER_HIGHLIGHT_PALETTE.map((style) => style.kind);
		const pens = kinds.filter((kind) => kind === 'pen');
		expect(pens.length).toBeGreaterThanOrEqual(4);
		expect(pens.length).toBeLessThanOrEqual(8);
		expect(kinds).toEqual(expect.arrayContaining(['underline', 'wavy', 'box', 'erase']));
		expect(READER_HIGHLIGHT_PALETTE.map((style) => style.id)).not.toEqual(
			expect.arrayContaining(['cloud', 'strike-through', 'double', 'dashed'])
		);
		expect(READER_HIGHLIGHT_PALETTE.some((style) => /[BGORY]/.test(style.id) && style.id.length === 1)).toBe(
			false
		);
	});

	it('builds a :::verse fence snapshot for the selected range', () => {
		// SPECSFY: US-004 FR-007 AC-016
		const fence = buildVerseFenceFromRange({
			versionId: 'ara.sqlite',
			bookId: 1,
			book: 'Gênesis',
			chapter: 1,
			verseStart: 2,
			verseEnd: 5,
			snapshot: 'A terra era sem forma e vazia.\nDisse Deus: Haja luz.'
		});
		expect(fence).toContain(':::verse');
		expect(fence).toContain('verseStart="2"');
		expect(fence).toContain('verseEnd="5"');
		expect(fence).toContain('A terra era sem forma e vazia.');
	});

	it('replaces the style of the exact range without touching others', () => {
		// SPECSFY: US-002 FR-003 FR-004 AC-018
		const existing: ReaderHighlight[] = [
			{ ...chapter, verseStart: 2, verseEnd: 5, styleId: 'pen-gold' },
			{ ...chapter, verseStart: 3, verseEnd: 3, styleId: 'underline' }
		];
		const next = applyHighlight(existing, range(2, 5), 'box');
		expect(next.filter((item) => item.verseStart === 2 && item.verseEnd === 5)).toEqual([
			{ ...chapter, verseStart: 2, verseEnd: 5, styleId: 'box' }
		]);
		expect(next.find((item) => item.verseStart === 3)?.styleId).toBe('underline');
	});

	it('does not invent a highlight when erasing a range that has no exact match', () => {
		// SPECSFY: FR-005 AC-019
		const existing: ReaderHighlight[] = [{ ...chapter, verseStart: 2, verseEnd: 5, styleId: 'pen-gold' }];
		expect(eraseHighlight(existing, range(3, 3))).toEqual(existing);
	});
});
