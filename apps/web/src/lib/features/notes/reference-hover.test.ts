import { describe, expect, it } from 'vitest';
import { matchCatalogVersion, parseBibleReference, resolveHoverCard } from './reference-hover';

// SPECSFY: US-008 US-009 US-010 US-011 US-012 FR-010 FR-011 FR-012 FR-013 FR-014 FR-015 FR-016 AC-028 AC-029 AC-030 AC-031 AC-032 AC-033 AC-034 AC-035 AC-036 AC-037 AC-038 AC-039

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

	it('returns the installed catalog id when the parser only provides an alias', () => {
		const card = resolveHoverCard(parseBibleReference('Gn 3.1'), {
			parserVersionId: 'ARA',
			defaultVersionId: null,
			installedVersions: ['ara.sqlite'],
			lookup: () => 'No princípio...'
		});
		expect(card.versionId).toBe('ara.sqlite');
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

// SPECSFY: US-009 FR-011 NFR-002 AC-030 AC-037 AC-038
describe('catalog version aliases', () => {
	it('matches parser aliases against the installed catalog', () => {
		const versions = [
			{ id: 'nvi.sqlite', fileName: 'nvi.sqlite', name: 'Nova Versão Internacional' },
			{ id: 'ara.sqlite', fileName: 'ara.sqlite', name: 'Almeida Revista e Atualizada' }
		];

		expect(matchCatalogVersion(versions, 'ARA')?.id).toBe('ara.sqlite');
		expect(matchCatalogVersion(versions, 'ara.sqlite')?.id).toBe('ara.sqlite');
		expect(matchCatalogVersion(versions, 'Almeida Revista e Atualizada')?.id).toBe('ara.sqlite');
	});

	it('returns no version when an alias is not installed', () => {
		expect(
			matchCatalogVersion(
				[{ id: 'nvi.sqlite', fileName: 'nvi.sqlite', name: 'Nova Versão Internacional' }],
				'ARA'
			)
		).toBeNull();
	});
});
