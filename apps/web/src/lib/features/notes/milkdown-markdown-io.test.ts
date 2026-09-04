import { describe, expect, it } from 'vitest';
import { extractFirstH1, roundtripMarkdown } from './milkdown-markdown-io';

const LEGACY = `# Minha nota

Texto com **negrito** e ==destaque==.

:::verse{versionId="nvi.sqlite" version="NVI" bookId="43" book="João" chapter="3" verseStart="16" verseEnd="18"}
16 Porque Deus amou o mundo
17 Para que todo o que nele crê
:::

- item um
- [x] tarefa feita
`;

// SPECSFY: US-001 FR-001 FR-002 FR-005 NFR-001 NFR-003 AC-005
describe('milkdown markdown roundtrip (legacy notes)', () => {
	it('opens Tipex-saved notes without loss', () => {
		expect(roundtripMarkdown(LEGACY)).toBe(LEGACY);
	});

	it('keeps the H1 readable for title sync', () => {
		expect(extractFirstH1(LEGACY)).toBe('Minha nota');
	});
});

// SPECSFY: US-001 FR-001 FR-002 NFR-003 AC-012
describe('malformed verse fences', () => {
	it('preserves raw text instead of dropping content', () => {
		const body = '# T\n\n:::verse\nsem atributos\n:::\n\ntexto depois';
		expect(roundtripMarkdown(body)).toBe(body);
	});
});

// SPECSFY: US-001 FR-001 FR-005 NFR-001 AC-015
describe('long notes', () => {
	it('roundtrips many fences without conversion loss', () => {
		const fence =
			':::verse{versionId="n" bookId="1" book="Gênesis" chapter="1" verseStart="1" verseEnd="2"}\n1 texto\n2 texto\n:::';
		const body = `# Longa\n\n${Array.from(
			{ length: 30 },
			(_, i) => `parágrafo ${i}\n\n${fence}`
		).join('\n\n')}\n`;
		expect(roundtripMarkdown(body)).toBe(body);
	});
});
