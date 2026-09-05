import { describe, expect, it } from 'vitest';
import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import {
	isValidVerseInterval,
	sanitizeUnsupportedDirectives,
	verseAttrsToFence,
	verseFenceToAttrs
} from './milkdown-verse-node';

const ATTRS = {
	versionId: 'nvi.sqlite',
	version: 'NVI',
	bookId: '43',
	book: 'João',
	chapter: '3',
	verseStart: '16',
	verseEnd: '18'
};

// SPECSFY: US-002 FR-002 FR-006 NFR-003 AC-004
describe('milkdown verse fence', () => {
	it('serializes reference attrs and snapshot into :::verse', () => {
		const fence = verseAttrsToFence(ATTRS, '16 Porque Deus amou o mundo\n17 Para que creia');
		expect(fence).toContain(':::verse{');
		expect(fence).toContain('versionId="nvi.sqlite"');
		expect(fence).toContain('book="João"');
		expect(fence).toContain('verseStart="16"');
		expect(fence).toContain('verseEnd="18"');
		expect(fence).toContain('16 Porque Deus amou o mundo');
		expect(fence.trimEnd().endsWith(':::')).toBe(true);
	});

	it('roundtrips fence back to identical attrs and body', () => {
		const fence = verseAttrsToFence(ATTRS, '16 texto\n17 texto');
		const parsed = verseFenceToAttrs(fence);
		expect(parsed.attrs).toEqual(ATTRS);
		expect(parsed.body).toBe('16 texto\n17 texto');
	});
});

// SPECSFY: US-002 FR-002 NFR-001 AC-008
describe('milkdown verse snapshot', () => {
	it('preserves multi-verse snapshot verbatim without bible lookup', () => {
		const snapshot = '16 Porque Deus amou o mundo\n17 Deus enviou o Filho\n18 Quem nele crê';
		expect(verseFenceToAttrs(verseAttrsToFence(ATTRS, snapshot)).body).toBe(snapshot);
	});
});

// SPECSFY: US-002 FR-002 FR-006 AC-009
describe('milkdown verse interval validation', () => {
	it('rejects end before start', () => {
		expect(isValidVerseInterval(18, 16)).toBe(false);
		expect(isValidVerseInterval(16, 18)).toBe(true);
		expect(isValidVerseInterval(16, 16)).toBe(true);
	});

	it('rejects malformed fences instead of inserting partial blocks', () => {
		expect(() => verseFenceToAttrs(':::verse\nsem atributos\n:::')).toThrow();
	});
});

// SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-005 AC-012 AC-015
describe('milkdown unsupported directive fallback', () => {
	it('keeps bible references with colon ranges as editable literal text', () => {
		const markdown = 'Estudo em João 4:4-7 e Lucas 3:16.';
		const tree = remark().use(remarkDirective).parse(markdown);

		sanitizeUnsupportedDirectives(tree, markdown);

		const paragraph = tree.children[0] as { children: Array<{ type: string; value?: string }> };
		expect(paragraph.children.some((node) => node.type === 'textDirective')).toBe(false);
		expect(paragraph.children.map((node) => node.value ?? '').join('')).toBe(markdown);
	});
});
