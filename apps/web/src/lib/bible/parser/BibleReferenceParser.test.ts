import { describe, expect, it } from 'vitest';
import { parseBibleReferences, BibleReferenceParser } from './BibleReferenceParser';

describe('BibleReferenceParser', () => {
	it('recognizes standard and punctuated references for Genesis 3:1', () => {
		const cases = [
			{ input: 'Gn 3.1', raw: 'Gn 3.1', osis: 'Gen.3.1', book: 'Gen', chapter: 3, verseStart: 1 },
			{ input: 'Gn 3:1', raw: 'Gn 3:1', osis: 'Gen.3.1', book: 'Gen', chapter: 3, verseStart: 1 },
			{ input: 'Genesis 3.1', raw: 'Genesis 3.1', osis: 'Gen.3.1', book: 'Gen', chapter: 3, verseStart: 1 },
			{ input: 'Gênesis 3.1', raw: 'Gênesis 3.1', osis: 'Gen.3.1', book: 'Gen', chapter: 3, verseStart: 1 },
			{ input: 'Gênesis 3:1', raw: 'Gênesis 3:1', osis: 'Gen.3.1', book: 'Gen', chapter: 3, verseStart: 1 }
		];

		for (const { input, raw, osis, book, chapter, verseStart } of cases) {
			const refs = parseBibleReferences(input);
			expect(refs).toHaveLength(1);
			expect(refs[0].raw).toBe(raw);
			expect(refs[0].osis).toBe(osis);
			expect(refs[0].book).toBe(book);
			expect(refs[0].chapter).toBe(chapter);
			expect(refs[0].verseStart).toBe(verseStart);
		}
	});

	it('recognizes case-insensitive translations with and without parentheses', () => {
		const cases = [
			{ input: 'Gn 3.1 ARA', raw: 'Gn 3.1 ARA', translation: 'ARA' },
			{ input: 'Gn 3.1 ara', raw: 'Gn 3.1 ara', translation: 'ARA' },
			{ input: 'Gn 3.1 (ARA)', raw: 'Gn 3.1 (ARA)', translation: 'ARA' },
			{ input: 'Gn 3.1 (ara)', raw: 'Gn 3.1 (ara)', translation: 'ARA' },
			{ input: 'Jo 3.16 (NVI)', raw: 'Jo 3.16 (NVI)', translation: 'NVI' },
			{ input: 'Rm 8.1-4 NAA', raw: 'Rm 8.1-4 NAA', translation: 'NAA' }
		];

		for (const { input, raw, translation } of cases) {
			const refs = parseBibleReferences(input);
			expect(refs).toHaveLength(1);
			expect(refs[0].raw).toBe(raw);
			expect(refs[0].translation).toBe(translation);
			expect(refs[0].from).toBe(0);
			expect(refs[0].to).toBe(input.length);
		}
	});

	it('recognizes books with various abbreviations and number prefixes', () => {
		const cases = [
			{ input: 'Jo 3.16', raw: 'Jo 3.16', osis: 'John.3.16', book: 'John' },
			{ input: 'João 3.16', raw: 'João 3.16', osis: 'John.3.16', book: 'John' },
			{ input: '1 Co 13.1', raw: '1 Co 13.1', osis: '1Cor.13.1', book: '1Cor' },
			{ input: '1Co 13.1', raw: '1Co 13.1', osis: '1Cor.13.1', book: '1Cor' },
			{ input: '1 Coríntios 13.1', raw: '1 Coríntios 13.1', osis: '1Cor.13.1', book: '1Cor' }
		];

		for (const { input, raw, osis, book } of cases) {
			const refs = parseBibleReferences(input);
			expect(refs).toHaveLength(1);
			expect(refs[0].raw).toBe(raw);
			expect(refs[0].osis).toBe(osis);
			expect(refs[0].book).toBe(book);
		}
	});

	it('recognizes verse ranges, lists and chapter references', () => {
		const cases = [
			{ input: 'Gn 3.1-5', raw: 'Gn 3.1-5', osis: 'Gen.3.1-Gen.3.5', verseStart: 1, verseEnd: 5 },
			{ input: 'Gn 3:1-5', raw: 'Gn 3:1-5', osis: 'Gen.3.1-Gen.3.5', verseStart: 1, verseEnd: 5 },
			{ input: 'Gn 3.1–5', raw: 'Gn 3.1–5', osis: 'Gen.3.1-Gen.3.5', verseStart: 1, verseEnd: 5 },
			{ input: 'Gn 3.1,4', raw: 'Gn 3.1,4', osis: 'Gen.3.1,Gen.3.4' },
			{ input: 'Gn 3.1-5,8', raw: 'Gn 3.1-5,8', osis: 'Gen.3.1-Gen.3.5,Gen.3.8' },
			{ input: 'Gn 3', raw: 'Gn 3', osis: 'Gen.3', chapter: 3, verseStart: undefined },
			{ input: 'Gn 3-5', raw: 'Gn 3-5', osis: 'Gen.3-Gen.5' },
			{ input: 'Gn 1.1-2.3', raw: 'Gn 1.1-2.3', osis: 'Gen.1.1-Gen.2.3' },
			{ input: 'Sl 23', raw: 'Sl 23', osis: 'Ps.23', book: 'Ps', chapter: 23 },
			{ input: 'Sl 119.1-8', raw: 'Sl 119.1-8', osis: 'Ps.119.1-Ps.119.8' }
		];

		for (const { input, raw, osis } of cases) {
			const refs = parseBibleReferences(input);
			expect(refs).toHaveLength(1);
			expect(refs[0].raw).toBe(raw);
			expect(refs[0].osis).toBe(osis);
		}
	});

	it('handles references within sentences and punctuation without trailing periods', () => {
		const sentence1 = 'Leia Gn 3.1 hoje.';
		const refs1 = parseBibleReferences(sentence1);
		expect(refs1).toHaveLength(1);
		expect(refs1[0].raw).toBe('Gn 3.1');
		expect(refs1[0].from).toBe(5);
		expect(refs1[0].to).toBe(11);
		expect(sentence1.slice(refs1[0].from, refs1[0].to)).toBe('Gn 3.1');

		const sentence2 = 'Leia (Gn 3.1).';
		const refs2 = parseBibleReferences(sentence2);
		expect(refs2).toHaveLength(1);
		expect(refs2[0].raw).toBe('Gn 3.1');
		expect(refs2[0].from).toBe(6);
		expect(refs2[0].to).toBe(12);
		expect(sentence2.slice(refs2[0].from, refs2[0].to)).toBe('Gn 3.1');

		const sentence3 = 'Estudando Gn 3.1 (ARA).';
		const refs3 = parseBibleReferences(sentence3);
		expect(refs3).toHaveLength(1);
		expect(refs3[0].raw).toBe('Gn 3.1 (ARA)');
		expect(refs3[0].translation).toBe('ARA');
		expect(sentence3.slice(refs3[0].from, refs3[0].to)).toBe('Gn 3.1 (ARA)');
	});

	it('extracts multiple distinct references with accurate indices', () => {
		const text = 'Compare Gn 3.1 (ARA) com Rm 5.12 e Jo 3.16.';
		const refs = parseBibleReferences(text);

		expect(refs).toHaveLength(3);

		expect(refs[0].raw).toBe('Gn 3.1 (ARA)');
		expect(refs[0].osis).toBe('Gen.3.1');
		expect(refs[0].translation).toBe('ARA');
		expect(refs[0].from).toBe(8);
		expect(refs[0].to).toBe(20);
		expect(text.slice(refs[0].from, refs[0].to)).toBe('Gn 3.1 (ARA)');

		expect(refs[1].raw).toBe('Rm 5.12');
		expect(refs[1].osis).toBe('Rom.5.12');
		expect(refs[1].from).toBe(25);
		expect(refs[1].to).toBe(32);
		expect(text.slice(refs[1].from, refs[1].to)).toBe('Rm 5.12');

		expect(refs[2].raw).toBe('Jo 3.16');
		expect(refs[2].osis).toBe('John.3.16');
		expect(refs[2].from).toBe(35);
		expect(refs[2].to).toBe(42);
		expect(text.slice(refs[2].from, refs[2].to)).toBe('Jo 3.16');
	});

	it('ignores negative false-positive cases', () => {
		const negativeCases = ['versão 3.1', 'Node 20.1', 'v3.1'];

		for (const input of negativeCases) {
			const refs = parseBibleReferences(input);
			expect(refs).toHaveLength(0);
		}
	});

	it('behaves correctly during keystroke typing sequences', () => {
		expect(parseBibleReferences('G')).toHaveLength(0);
		expect(parseBibleReferences('Gn')).toHaveLength(0);

		const gn3 = parseBibleReferences('Gn 3');
		expect(gn3).toHaveLength(1);
		expect(gn3[0].raw).toBe('Gn 3');
		expect(gn3[0].osis).toBe('Gen.3');

		// Incomplete dot after chapter must not decorate "Gn 3"
		expect(parseBibleReferences('Gn 3.')).toHaveLength(0);

		const gn31 = parseBibleReferences('Gn 3.1');
		expect(gn31).toHaveLength(1);
		expect(gn31[0].raw).toBe('Gn 3.1');
		expect(gn31[0].osis).toBe('Gen.3.1');

		const gn31ara = parseBibleReferences('Gn 3.1 (ARA)');
		expect(gn31ara).toHaveLength(1);
		expect(gn31ara[0].raw).toBe('Gn 3.1 (ARA)');
		expect(gn31ara[0].translation).toBe('ARA');
	});
});
