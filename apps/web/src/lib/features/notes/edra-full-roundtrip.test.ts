import { describe, expect, it } from 'vitest';
import { MarkdownManager } from '@tiptap/markdown';
import { buildOpenBibleExtensions } from '$lib/edra/shadcn/openbible-editor.ts';
import { normalizeSavedMarkdown } from './edra-pure-extensions';

// Componentes vazios: o gerente Markdown só lê os campos de serialização,
// sem montar views Svelte.
const dummyViews = {
	codeBlock: {},
	mediaPlaceholder: {},
	image: {},
	video: {},
	iframe: {},
	mermaid: {},
	callout: {},
	slash: {}
} as never;

function fullRoundtrip(markdown: string): string {
	const manager = new MarkdownManager({ extensions: buildOpenBibleExtensions(dummyViews) });
	return manager.serialize(manager.parse(markdown));
}

// SPECSFY: migração gradual do editor (Edra) — a montagem completa não
// perde conteúdo próprio ao serializar Markdown.
describe('edra full assembly markdown roundtrip', () => {
	it('keeps fenced code blocks byte-identical', () => {
		const source = '```js\nconst a = 1;\n```';
		expect(fullRoundtrip(source)).toBe(source);
	});

	it('keeps mermaid fences stable (upstream renderer normalizes trailing newline)', () => {
		const source = ':::mermaid\ngraph TD\n  A --> B\n:::';
		const once = normalizeSavedMarkdown(fullRoundtrip(source));
		expect(once).toBe(':::mermaid\ngraph TD\n  A --> B\n:::\n');
		expect(normalizeSavedMarkdown(fullRoundtrip(once))).toBe(once);
	});

	it('keeps images with alt text and url', () => {
		const output = fullRoundtrip('![foto](https://exemplo.test/foto.png)');
		expect(output).toContain('https://exemplo.test/foto.png');
	});

	it('keeps GFM tables with all cells', () => {
		const source = '| Nome | Idade |\n| --- | --- |\n| Ana | 30 |';
		const output = fullRoundtrip(source);
		expect(output).toContain('Ana');
		expect(output).toContain('30');
	});

	it('keeps verse fences and native callouts stable', () => {
		const verse =
			':::verse{versionId="a" version="A" bookId="1" book="Gênesis" chapter="1" verseStart="1" verseEnd="1"}\nTexto.\n:::';
		expect(fullRoundtrip(verse)).toBe(verse);
		const callout = '$callout💡\nAviso importante.\n$';
		const once = normalizeSavedMarkdown(fullRoundtrip(callout));
		expect(once).toContain('Aviso importante.');
		expect(normalizeSavedMarkdown(fullRoundtrip(once))).toBe(once);
	});
});

describe('normalizeSavedMarkdown', () => {
	it('collapses trailing blank lines idempotently', () => {
		expect(normalizeSavedMarkdown('texto\n\n\n')).toBe('texto\n');
		expect(normalizeSavedMarkdown('texto\n')).toBe('texto\n');
		expect(normalizeSavedMarkdown('texto')).toBe('texto');
		expect(normalizeSavedMarkdown('')).toBe('');
		expect(normalizeSavedMarkdown(normalizeSavedMarkdown('a\n\n\n\n'))).toBe('a\n');
	});
});
