/**
 * Conjunto puro do motor Edra (fase 1 da migração gradual).
 *
 * Usa o núcleo TipTap v3 vendorado em `$lib/edra` com serialização
 * Markdown (`@tiptap/markdown`), de modo que o corpo salvo em
 * `workspace_notes.body` permanece o Markdown canônico — o mesmo formato
 * do motor Milkdown, no SQLite `app.sqlite` (Tauri) e no IndexedDB (PWA).
 *
 * Convenções próprias preservadas no roundtrip:
 * - `==texto==` e `=={cor}texto==` (destaque, com cor);
 * - `++texto++` (sublinhado, via StarterKit v3);
 * - fences `:::verse{...}` e `:::video{...}` como blocos atômicos
 *   somente-leitura, reemitidos byte-idênticos (o bloco de versículo
 *   editável fica para uma fase posterior).
 */
import { mergeAttributes, Node } from '@tiptap/core';
import type { Extensions, MarkdownToken } from '@tiptap/core';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { Markdown, MarkdownManager } from '@tiptap/markdown';
import {
	parseVerseFence,
	renderVerseFence,
	verseReferenceLabel
} from './verse-block-extension';

export const EDRA_PURE_PLACEHOLDER = 'Comece a escrever…';

const VERSE_FENCE_TOKEN = /^:::verse\{[^}]*\}[ \t]*\r?\n([\s\S]*?\r?\n)?:::[ \t]*(?=\r?\n|$)/;
const VIDEO_FENCE_TOKEN =
	/^:::video[ \t]*(\{[^}]*\})?[ \t]*\r?\n([\s\S]*?\r?\n)?:::[ \t]*(?=\r?\n|$)/;
const FENCE_ATTR_PATTERN = /(\w+)="([^"]*)"/g;

function parseFenceAttrs(source: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	for (const match of source.matchAll(FENCE_ATTR_PATTERN)) {
		attrs[match[1]] = match[2];
	}
	return attrs;
}

/**
 * Bloco atômico somente-leitura para o fence `:::verse{...}`.
 * A serialização reemite o `raw` capturado, então o fence sobrevive
 * byte-idêntico mesmo que os atributos tenham ordem ou espaços próprios.
 */
export const verseFenceNode = Node.create({
	name: 'verseFence',
	group: 'block',
	atom: true,
	selectable: true,
	draggable: false,

	addAttributes() {
		return {
			versionId: { default: '' },
			version: { default: '' },
			bookId: { default: '' },
			book: { default: '' },
			chapter: { default: '' },
			verseStart: { default: '' },
			verseEnd: { default: '' },
			body: { default: '' },
			raw: { default: '' }
		};
	},

	parseHTML() {
		return [{ tag: 'div[data-type="verse-fence"]' }];
	},

	renderHTML({ node }) {
		const reference = verseReferenceLabel({
			versionId: String(node.attrs.versionId ?? ''),
			version: String(node.attrs.version ?? ''),
			bookId: String(node.attrs.bookId ?? ''),
			book: String(node.attrs.book ?? ''),
			chapter: String(node.attrs.chapter ?? ''),
			verseStart: String(node.attrs.verseStart ?? ''),
			verseEnd: String(node.attrs.verseEnd ?? '')
		});
		return [
			'div',
			mergeAttributes({ 'data-type': 'verse-fence', class: 'openbible-verse-fence' }),
			['p', { class: 'openbible-verse-fence-ref' }, reference],
			['pre', { class: 'openbible-verse-fence-body' }, String(node.attrs.body ?? '')]
		];
	},

	markdownTokenizer: {
		name: 'verseFence',
		level: 'block',
		start: (src: string) => src.indexOf(':::verse'),
		tokenize: (src: string) => {
			const match = VERSE_FENCE_TOKEN.exec(src);
			if (!match) return undefined;
			return { type: 'verseFence', raw: match[0] };
		}
	},

	parseMarkdown: (token, helpers) => {
		try {
			const parsed = parseVerseFence(token.raw ?? '');
			return helpers.createNode('verseFence', { ...parsed.attrs, body: parsed.body, raw: token.raw });
		} catch {
			return helpers.createNode('paragraph', {}, [helpers.createTextNode(token.raw ?? '')]);
		}
	},

	renderMarkdown: (node) => {
		const raw = (node.attrs?.raw as string | undefined) ?? '';
		if (raw) return raw;
		try {
			return renderVerseFence({
				attrs: {
					versionId: String(node.attrs?.versionId ?? ''),
					version: String(node.attrs?.version ?? ''),
					bookId: String(node.attrs?.bookId ?? ''),
					book: String(node.attrs?.book ?? ''),
					chapter: String(node.attrs?.chapter ?? ''),
					verseStart: String(node.attrs?.verseStart ?? ''),
					verseEnd: String(node.attrs?.verseEnd ?? '')
				},
				body: String(node.attrs?.body ?? '')
			});
		} catch {
			return '';
		}
	}
});

/**
 * Bloco atômico somente-leitura para o fence `:::video{...}`.
 * Também reemite o `raw` para preservar o fence byte-idêntico.
 */
export const videoFenceNode = Node.create({
	name: 'videoFence',
	group: 'block',
	atom: true,
	selectable: true,
	draggable: false,

	addAttributes() {
		return {
			url: { default: '' },
			videoId: { default: '' },
			title: { default: '' },
			raw: { default: '' }
		};
	},

	parseHTML() {
		return [{ tag: 'figure[data-type="video-fence"]' }];
	},

	renderHTML({ node }) {
		const url = String(node.attrs.url ?? '');
		const label = String(node.attrs.title ?? '') || 'Vídeo do YouTube';
		return [
			'figure',
			mergeAttributes({ 'data-type': 'video-fence', class: 'openbible-video-fence' }),
			['a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, label]
		];
	},

	markdownTokenizer: {
		name: 'videoFence',
		level: 'block',
		start: (src: string) => src.indexOf(':::video'),
		tokenize: (src: string) => {
			const match = VIDEO_FENCE_TOKEN.exec(src);
			if (!match) return undefined;
			return { type: 'videoFence', raw: match[0] };
		}
	},

	parseMarkdown: (token, helpers) => {
		const raw: string = token.raw ?? '';
		const open = raw.split('\n', 1)[0] ?? '';
		const attrs = parseFenceAttrs(open.slice(open.indexOf('{') + 1, open.lastIndexOf('}')));
		return helpers.createNode('videoFence', {
			url: attrs.url ?? '',
			videoId: attrs.videoId ?? '',
			title: attrs.title ?? '',
			raw
		});
	},

	renderMarkdown: (node) => {
		const raw = (node.attrs?.raw as string | undefined) ?? '';
		if (raw) return raw;
		const url = String(node.attrs?.url ?? '');
		const videoId = String(node.attrs?.videoId ?? '');
		const title = String(node.attrs?.title ?? '');
		const attrs = [`url="${url}"`, `videoId="${videoId}"`, ...(title ? [`title="${title}"`] : [])].join(
			' '
		);
		return `:::video{${attrs}}\n:::\n`;
	}
});

const COLORED_HIGHLIGHT_TOKEN = /^(==)\{([^{}]+)\}([^=]+)(==)/;
const PLAIN_HIGHLIGHT_TOKEN = /^(==)([^=]+)(==)/;

/**
 * Destaque com as convenções do OpenBible: `==texto==` e
 * `=={cor}texto==`. Estende o Highlight do TipTap v3 (que só conhece a
 * forma simples) sem o estilo inline do modo multicolor: a cor viaja em
 * `data-color` e o tema aplica a paleta.
 */
export const openBibleHighlight = Highlight.configure({
	multicolor: true,
	HTMLAttributes: { class: 'openbible-highlight' }
}).extend({
	addAttributes() {
		return {
			color: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute('data-color'),
				renderHTML: (attributes: Record<string, unknown>) => {
					if (!attributes.color) return {};
					return { 'data-color': attributes.color };
				}
			}
		};
	},

	renderMarkdown: (node, helpers) => {
		const color = (node.attrs?.color as string | null | undefined) ?? '';
		const inner = helpers.renderChildren(node);
		return color ? `=={${color}}${inner}==` : `==${inner}==`;
	},

	parseMarkdown: (token, helpers) =>
		helpers.applyMark(
			'highlight',
			helpers.parseInline(token.tokens ?? []),
			token.color ? { color: token.color } : undefined
		),

	markdownTokenizer: {
		name: 'highlight',
		level: 'inline',
		start: (src: string) => src.indexOf('=='),
		tokenize: (src: string, _: unknown, lexer: { inlineTokens: (value: string) => MarkdownToken[] }) => {
			const colored = COLORED_HIGHLIGHT_TOKEN.exec(src);
			if (colored) {
				const inner = colored[3].trim();
				if (!inner) return undefined;
				return {
					type: 'highlight',
					raw: colored[0],
					text: inner,
					color: colored[2],
					tokens: lexer.inlineTokens(inner)
				};
			}
			const plain = PLAIN_HIGHLIGHT_TOKEN.exec(src);
			if (!plain) return undefined;
			const inner = plain[2].trim();
			if (!inner) return undefined;
			return {
				type: 'highlight',
				raw: plain[0],
				text: inner,
				tokens: lexer.inlineTokens(inner)
			};
		}
	}
});

export function createPureEditorExtensions(
	placeholder: string = EDRA_PURE_PLACEHOLDER
): Extensions {
	return [
		StarterKit.configure({
			heading: { levels: [1, 2, 3, 4, 5, 6] },
			link: { openOnClick: false, autolink: true, linkOnPaste: true }
		}),
		Markdown,
		Placeholder.configure({
			placeholder,
			emptyEditorClass: 'is-editor-empty',
			emptyNodeClass: 'is-empty'
		}),
		openBibleHighlight,
		TaskList,
		TaskItem.configure({ nested: true }),
		verseFenceNode,
		videoFenceNode
	];
}

/**
 * Gerente Markdown puro (sem DOM) para testes de roundtrip e utilidades.
 * Usa exatamente o mesmo conjunto de extensões do editor.
 */
export function createPureMarkdownManager(): MarkdownManager {
	return new MarkdownManager({ extensions: createPureEditorExtensions() });
}

/**
 * Normaliza o Markdown serializado antes de persistir: colapsa 2+ quebras
 * finais em uma. Sem isso, o `renderMarkdown` upstream do nó `mermaid`
 * (que termina com `\n\n`) acumularia linhas em branco a cada save, pois o
 * parser recria parágrafos vazios do sufixo. Idempotente por construção.
 */
export function normalizeSavedMarkdown(markdown: string): string {
	return markdown.replace(/\n{2,}$/, '\n');
}
