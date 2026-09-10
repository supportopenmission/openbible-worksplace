import { describe, expect, it } from 'vitest';
import { createPureMarkdownManager } from './edra-pure-extensions';
import { roundtripMarkdown } from './milkdown-markdown-io';

const VERSE_FENCE = `:::verse{versionId="ara.sqlite" version="ARA" bookId="1" book="Gênesis" chapter="1" verseStart="1" verseEnd="2"}
No princípio Deus criou os céus e a terra.
A terra era sem forma e vazia.
:::`;

const VIDEO_FENCE = `:::video{url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" videoId="dQw4w9WgXcQ"}
:::`;

function roundtrip(markdown: string): string {
	const manager = createPureMarkdownManager();
	return manager.serialize(manager.parse(markdown));
}

// SPECSFY: migração gradual do editor (Edra) — o corpo salvo continua Markdown canônico.
describe('edra pure markdown roundtrip', () => {
	it('preserves the verse fence byte-identical', () => {
		expect(roundtrip(VERSE_FENCE)).toBe(VERSE_FENCE);
	});

	it('preserves the video fence byte-identical', () => {
		expect(roundtrip(VIDEO_FENCE)).toBe(VIDEO_FENCE);
	});

	it('preserves plain and colored highlights without leaking markers into text', () => {
		expect(roundtrip('Um ==destaque== simples.')).toBe('Um ==destaque== simples.');
		expect(roundtrip('Um =={yellow}colorido== aqui.')).toBe('Um =={yellow}colorido== aqui.');
		expect(roundtrip('=={green}Cor verde== e =={blue}azul==.')).toBe(
			'=={green}Cor verde== e =={blue}azul==.'
		);
	});

	it('preserves underline markers', () => {
		expect(roundtrip('Texto ++sublinhado++ aqui.')).toBe('Texto ++sublinhado++ aqui.');
	});

	it('keeps C++ as literal text', () => {
		expect(roundtrip('C++ não é sublinhado.')).toBe('C++ não é sublinhado.');
	});

	it('keeps an unclosed verse-like block as text instead of dropping it', () => {
		const source = ':::verse{versionId="x"}\nsem fechamento';
		const output = roundtrip(source);
		expect(output).toContain(':::verse');
		expect(output).toContain('sem fechamento');
	});

	it('roundtrips task lists', () => {
		const source = '- [ ] aberta\n- [x] concluída';
		expect(roundtrip(source)).toBe(source);
	});

	it('roundtrips headings, quotes, code and rules', () => {
		expect(roundtrip('## Título').trim()).toBe('## Título');
		expect(roundtrip('# Título 1').trim()).toBe('# Título 1');
		expect(roundtrip('###### Título 6').trim()).toBe('###### Título 6');
		expect(roundtrip('> citação').trim()).toBe('> citação');
		expect(roundtrip('```\ncódigo\n```').trim()).toBe('```\ncódigo\n```');
		expect(roundtrip('---').trim()).toBe('---');
	});

	it('keeps a mixed note with fences stable across two serializations', () => {
		const source = [
			'## Estudo',
			'',
			'Texto com **negrito**, *itálico* e =={pink}destaque==.',
			'',
			VERSE_FENCE,
			'',
			VIDEO_FENCE,
			'',
			'- [ ] revisar',
			'- item simples'
		].join('\n');
		const once = roundtrip(source);
		expect(roundtrip(once)).toBe(once);
		expect(once).toContain(VERSE_FENCE);
		expect(once).toContain(VIDEO_FENCE);
		expect(once).toContain('=={pink}destaque==');
	});

	it('handles empty and title-only bodies', () => {
		expect(roundtrip('').trim()).toBe('');
		expect(roundtrip('# Nova nota\n').trim()).toBe('# Nova nota');
	});

	it('keeps GitHub-style alerts as plain quotes without losing text', () => {
		// O serializador escapa colchetes em texto puro (comportamento geral
		// do TipTap, estável); links reais não são afetados.
		for (const kind of ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']) {
			const quote = `> [!${kind}]\n> Conteúdo do aviso.`;
			const once = roundtrip(quote);
			expect(once).toContain(`!${kind}`);
			expect(once).toContain('Conteúdo do aviso.');
			expect(roundtrip(once)).toBe(once);
		}
	});

	it('keeps alerts readable in the classic engine pipeline without losing text', () => {
		const source = '> [!WARNING]\n> Cuidado com o texto.';
		const viaEdra = roundtrip(source);
		// O pipeline Markdown do motor clássico preserva o texto do aviso;
		// o comentário de estado do envelope portátil pertence à migração,
		// não ao salvamento.
		const viaMilkdown = roundtripMarkdown(viaEdra);
		expect(viaMilkdown).toContain('WARNING');
		expect(viaMilkdown).toContain('Cuidado com o texto.');
	});

	it('leaves plain blockquotes as blockquotes', () => {
		expect(roundtrip('> só uma citação').trim()).toBe('> só uma citação');
	});

	it('keeps Edra callout fences as text in the pure set', () => {
		const source = '$callout💡\nAviso importante.\n$';
		expect(roundtrip(source)).toContain('Aviso importante.');
	});
});
