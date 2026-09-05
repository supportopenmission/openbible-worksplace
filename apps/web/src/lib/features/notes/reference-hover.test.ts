import { describe, expect, it } from 'vitest';
import { parseBibleReference, resolveHoverCard } from './reference-hover';

// SPECSFY: US-002 FR-002 NFR-001 AC-004
describe('hover card with parser version', () => {
	it('resolves Gn 3.1 to the parser version text', () => {
		const parsed = parseBibleReference('Gn 3.1');
		expect(parsed).toEqual({ book: 'Gn', chapter: 3, verse: 1 });
		const card = resolveHoverCard(parsed, {
			parserVersionId: 'acf.sqlite',
			defaultVersionId: 'nvi.sqlite',
			installedVersions: ['acf.sqlite', 'nvi.sqlite'],
			lookup: () => 'No princípio...'
		});
		expect(card).toEqual({
			status: 'ready',
			versionId: 'acf.sqlite',
			reference: 'Gn 3.1',
			text: 'No princípio...'
		});
	});
});

// SPECSFY: US-002 FR-002 NFR-002 AC-005
describe('hover card with default version', () => {
	it('falls back to the default version without a network lookup', () => {
		const parsed = parseBibleReference('Gn 3.1');
		let lookups = 0;
		const card = resolveHoverCard(parsed, {
			parserVersionId: null,
			defaultVersionId: 'nvi.sqlite',
			installedVersions: ['nvi.sqlite'],
			lookup: () => {
				lookups += 1;
				return 'No princípio...';
			}
		});
		expect(card.versionId).toBe('nvi.sqlite');
		expect(lookups).toBe(1);
	});
});

// SPECSFY: US-002 FR-002 NFR-003 AC-006
describe('hover card without an installed bible', () => {
	it('warns explicitly instead of inventing text', () => {
		const parsed = parseBibleReference('Gn 3.1');
		const card = resolveHoverCard(parsed, {
			parserVersionId: null,
			defaultVersionId: null,
			installedVersions: [],
			lookup: () => {
				throw new Error('must not be called');
			}
		});
		expect(card).toEqual({ status: 'missing-bible', reference: 'Gn 3.1', text: null });
	});
});
