import { mergeAttributes, Node as TiptapNode } from '@tiptap/core';
import { displayVersionAbbreviation } from '$lib/features/bible/version-label';
import { isNoteHighlightColor } from './note-highlights';

export interface VerseFenceAttrs {
	versionId: string;
	version?: string;
	bookId: string;
	book: string;
	chapter: string;
	verseStart: string;
	verseEnd: string;
}

export interface ParsedVerseFence {
	attrs: VerseFenceAttrs;
	body: string;
}

const FENCE_OPEN =
	/^:::verse\{([^}]*)\}\s*\n([\s\S]*?)(?:\n:::|\s*:::)\s*$/m;

const ATTR_PATTERN = /(\w+)="([^"]*)"/g;

function parseAttrs(raw: string): VerseFenceAttrs {
	const attrs: Record<string, string> = {};
	for (const match of raw.matchAll(ATTR_PATTERN)) {
		attrs[match[1]] = match[2];
	}
	return {
		versionId: attrs.versionId ?? '',
		version: attrs.version ?? '',
		bookId: attrs.bookId ?? '',
		book: attrs.book ?? '',
		chapter: attrs.chapter ?? '',
		verseStart: attrs.verseStart ?? '',
		verseEnd: attrs.verseEnd ?? ''
	};
}

export function parseVerseFence(source: string): ParsedVerseFence {
	const match = source.match(FENCE_OPEN);
	if (!match) throw new Error('Fence :::verse inválido');
	return { attrs: parseAttrs(match[1]), body: match[2].trimEnd() };
}

export function renderVerseFence(parsed: ParsedVerseFence): string {
	const { attrs, body } = parsed;
	const attrString = [
		`versionId="${attrs.versionId}"`,
		...(attrs.version ? [`version="${attrs.version}"`] : []),
		`bookId="${attrs.bookId}"`,
		`book="${attrs.book}"`,
		`chapter="${attrs.chapter}"`,
		`verseStart="${attrs.verseStart}"`,
		`verseEnd="${attrs.verseEnd}"`
	].join(' ');
	return `:::verse{${attrString}}\n${body}\n:::`;
}

export function versePreviewUsesSnapshotOnly(fence: string): boolean {
	const { body } = parseVerseFence(fence);
	return body.trim().length > 0;
}

export function extractVerseFencesFromMarkdown(markdown: string): ParsedVerseFence[] {
	const fences: ParsedVerseFence[] = [];
	const pattern = /:::verse\{([^}]*)\}\s*\n([\s\S]*?)\n:::/g;
	for (const match of markdown.matchAll(pattern)) {
		fences.push({ attrs: parseAttrs(match[1]), body: match[2].trimEnd() });
	}
	return fences;
}

export function verseVersionLabel(attrs: VerseFenceAttrs): string {
	if (attrs.version?.trim()) return attrs.version.trim();
	if (!attrs.versionId) return '';
	return displayVersionAbbreviation({ name: attrs.versionId, id: attrs.versionId });
}

export function verseReferenceLabel(attrs: VerseFenceAttrs): string {
	const start = attrs.verseStart;
	const end = attrs.verseEnd;
	const range =
		start && end && start !== end ? `${start}–${end}` : start || end || '';
	const reference = `${attrs.book} ${attrs.chapter}:${range}`.trim();
	const version = verseVersionLabel(attrs);
	return version ? `${version} · ${reference}` : reference;
}

function verseFenceToHtml(parsed: ParsedVerseFence): string {
	const { attrs, body } = parsed;
	const dataAttrs = Object.entries(attrs)
		.map(([key, value]) => `data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${value}"`)
		.join(' ');
	return `<div data-type="verse-block" ${dataAttrs} data-snapshot-body="${escapeHtmlAttribute(body)}"><pre class="verse-snapshot">${escapeHtml(body)}</pre></div>`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value: string): string {
	return escapeHtml(value).replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
}

export function markdownBodyToHtml(markdown: string): string {
	const parts: string[] = [];
	const fencePattern = /:::verse\{([^}]*)\}\s*\n([\s\S]*?)\n:::/g;
	let lastIndex = 0;
	for (const match of markdown.matchAll(fencePattern)) {
		const before = markdown.slice(lastIndex, match.index);
		if (before.trim()) parts.push(simpleMarkdownToHtml(before));
		parts.push(verseFenceToHtml({ attrs: parseAttrs(match[1]), body: match[2].trimEnd() }));
		lastIndex = (match.index ?? 0) + match[0].length;
	}
	const tail = markdown.slice(lastIndex);
	if (tail.trim()) parts.push(simpleMarkdownToHtml(tail));
	return parts.join('') || '<p></p>';
}

function inlineMarkdownToHtml(text: string): string {
	return escapeHtml(text)
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/==\{(yellow|green|blue|pink)\}([^=]+)==/g, '<mark data-color="$1">$2</mark>')
		.replace(/==([^=]+)==/g, '<mark>$1</mark>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
}

function simpleMarkdownToHtml(markdown: string): string {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const html: string[] = [];
	let listType: 'ul' | 'ol' | 'task' | null = null;

	const closeList = () => {
		if (listType === 'task' || listType === 'ul') html.push('</ul>');
		if (listType === 'ol') html.push('</ol>');
		listType = null;
	};

	for (const raw of lines) {
		const line = raw.trimEnd();
		const task = line.match(/^- \[( |x|X)\]\s+(.*)$/);
		const bullet = line.match(/^[-*]\s+(.*)$/);
		const ordered = line.match(/^\d+\.\s+(.*)$/);

		if (task) {
			if (listType !== 'task') {
				closeList();
				html.push('<ul data-type="taskList">');
				listType = 'task';
			}
			const checked = task[1] !== ' ';
			html.push(
				`<li data-type="taskItem" data-checked="${checked}"><p>${inlineMarkdownToHtml(task[2])}</p></li>`
			);
			continue;
		}
		if (bullet) {
			if (listType !== 'ul') {
				closeList();
				html.push('<ul>');
				listType = 'ul';
			}
			html.push(`<li><p>${inlineMarkdownToHtml(bullet[1])}</p></li>`);
			continue;
		}
		if (ordered) {
			if (listType !== 'ol') {
				closeList();
				html.push('<ol>');
				listType = 'ol';
			}
			html.push(`<li><p>${inlineMarkdownToHtml(ordered[1])}</p></li>`);
			continue;
		}

		closeList();
		const trimmed = line.trim();
		if (!trimmed) continue;
		if (trimmed.startsWith('### ')) {
			html.push(`<h3>${inlineMarkdownToHtml(trimmed.slice(4))}</h3>`);
			continue;
		}
		if (trimmed.startsWith('## ')) {
			html.push(`<h2>${inlineMarkdownToHtml(trimmed.slice(3))}</h2>`);
			continue;
		}
		if (trimmed.startsWith('# ')) {
			html.push(`<h1>${inlineMarkdownToHtml(trimmed.slice(2))}</h1>`);
			continue;
		}
		if (trimmed.startsWith('> ')) {
			html.push(`<blockquote><p>${inlineMarkdownToHtml(trimmed.slice(2))}</p></blockquote>`);
			continue;
		}
		if (trimmed.startsWith('```')) continue;
		html.push(`<p>${inlineMarkdownToHtml(trimmed)}</p>`);
	}

	closeList();
	return html.join('');
}

function inlineHtmlToMarkdown(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
	if (!(node instanceof HTMLElement)) return '';
	const inner = [...node.childNodes].map(inlineHtmlToMarkdown).join('');
	const tag = node.tagName.toLowerCase();
	if (tag === 'strong' || tag === 'b') return `**${inner}**`;
	if (tag === 'em' || tag === 'i') return `*${inner}*`;
	if (tag === 'mark') {
		const color = node.getAttribute('data-color');
		return isNoteHighlightColor(color) ? `=={${color}}${inner}==` : `==${inner}==`;
	}
	if (tag === 'code') return `\`${inner}\``;
	if (tag === 'u') return inner;
	if (tag === 's' || tag === 'del') return `~~${inner}~~`;
	if (tag === 'br') return '\n';
	if (tag === 'a') return inner;
	return inner;
}

function blockToMarkdown(node: Node): string {
	if (!(node instanceof HTMLElement)) {
		const text = node.textContent?.trim();
		return text ?? '';
	}
	if (node.dataset.type === 'verse-block') {
		const attrs: VerseFenceAttrs = {
			versionId: node.dataset.versionId ?? '',
			version: node.dataset.version ?? '',
			bookId: node.dataset.bookId ?? '',
			book: node.dataset.book ?? '',
			chapter: node.dataset.chapter ?? '',
			verseStart: node.dataset.verseStart ?? '',
			verseEnd: node.dataset.verseEnd ?? ''
		};
		const snapshot = node.querySelector('.verse-snapshot')?.textContent ?? '';
		return renderVerseFence({ attrs, body: snapshot.trimEnd() });
	}

	const tag = node.tagName.toLowerCase();
	const inline = inlineHtmlToMarkdown(node).trim();

	if (tag === 'h1') return `# ${inline}`;
	if (tag === 'h2') return `## ${inline}`;
	if (tag === 'h3') return `### ${inline}`;
	if (tag === 'blockquote') return inline ? `> ${inline}` : '';
	if (tag === 'pre') return `\`\`\`\n${node.textContent ?? ''}\n\`\`\``;
	if (tag === 'hr') return '---';
	if (tag === 'ul' && node.dataset.type === 'taskList') {
		return [...node.querySelectorAll(':scope > li')]
			.map((item) => {
				const checked = item.getAttribute('data-checked') === 'true' ? 'x' : ' ';
				return `- [${checked}] ${inlineHtmlToMarkdown(item).trim()}`;
			})
			.join('\n');
	}
	if (tag === 'ul') {
		return [...node.querySelectorAll(':scope > li')]
			.map((item) => `- ${inlineHtmlToMarkdown(item).trim()}`)
			.join('\n');
	}
	if (tag === 'ol') {
		return [...node.querySelectorAll(':scope > li')]
			.map((item, index) => `${index + 1}. ${inlineHtmlToMarkdown(item).trim()}`)
			.join('\n');
	}
	if (tag === 'p') return inline;
	if (tag === 'div') {
		return [...node.childNodes].map(blockToMarkdown).filter(Boolean).join('\n\n');
	}
	return inline;
}

export function htmlBodyToMarkdown(html: string): string {
	const container = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
	const root = container.body.firstElementChild;
	if (!root) return '';
	return [...root.childNodes]
		.map(blockToMarkdown)
		.filter((chunk) => chunk.trim().length > 0)
		.join('\n\n');
}

export const VerseBlockExtension = TiptapNode.create({
	name: 'verseBlock',
	group: 'block',
	atom: true,
	selectable: true,
	draggable: false,

	addAttributes() {
		return {
			versionId: { default: '', parseHTML: (element) => element.getAttribute('data-version-id') ?? '' },
			version: { default: '', parseHTML: (element) => element.getAttribute('data-version') ?? '' },
			bookId: { default: '', parseHTML: (element) => element.getAttribute('data-book-id') ?? '' },
			book: { default: '', parseHTML: (element) => element.getAttribute('data-book') ?? '' },
			chapter: { default: '', parseHTML: (element) => element.getAttribute('data-chapter') ?? '' },
			verseStart: { default: '', parseHTML: (element) => element.getAttribute('data-verse-start') ?? '' },
			verseEnd: { default: '', parseHTML: (element) => element.getAttribute('data-verse-end') ?? '' },
			snapshotBody: {
				default: '',
				parseHTML: (element) =>
					element.getAttribute('data-snapshot-body') ??
					element.querySelector('.verse-snapshot')?.textContent ??
					''
			}
		};
	},

	parseHTML() {
		return [{ tag: 'div[data-type="verse-block"]' }];
	},

	renderHTML({ node, HTMLAttributes }) {
		return [
			'div',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'verse-block',
				'data-version-id': node.attrs.versionId,
				'data-version': node.attrs.version,
				'data-book-id': node.attrs.bookId,
				'data-book': node.attrs.book,
				'data-chapter': node.attrs.chapter,
				'data-verse-start': node.attrs.verseStart,
				'data-verse-end': node.attrs.verseEnd,
				'data-snapshot-body': node.attrs.snapshotBody,
				class: 'verse-block-callout'
			}),
			['pre', { class: 'verse-snapshot' }, node.attrs.snapshotBody]
		];
	},

	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('div');
			dom.className = 'verse-block-callout';
			dom.dataset.type = 'verse-block';
			dom.dataset.versionId = node.attrs.versionId;
			dom.dataset.version = node.attrs.version;
			dom.dataset.bookId = node.attrs.bookId;
			dom.dataset.book = node.attrs.book;
			dom.dataset.chapter = node.attrs.chapter;
			dom.dataset.verseStart = node.attrs.verseStart;
			dom.dataset.verseEnd = node.attrs.verseEnd;

			const ref = document.createElement('p');
			ref.className = 'verse-block-ref';
			ref.textContent = verseReferenceLabel({
				versionId: node.attrs.versionId,
				version: node.attrs.version,
				bookId: node.attrs.bookId,
				book: node.attrs.book,
				chapter: node.attrs.chapter,
				verseStart: node.attrs.verseStart,
				verseEnd: node.attrs.verseEnd
			});

			const pre = document.createElement('pre');
			pre.className = 'verse-snapshot';
			pre.textContent = node.attrs.snapshotBody;

			dom.append(ref, pre);
			return { dom };
		};
	}
});

export function verseBlockFromFence(parsed: ParsedVerseFence) {
	return {
		type: 'verseBlock',
		attrs: {
			versionId: parsed.attrs.versionId,
			version: parsed.attrs.version ?? '',
			bookId: parsed.attrs.bookId,
			book: parsed.attrs.book,
			chapter: parsed.attrs.chapter,
			verseStart: parsed.attrs.verseStart,
			verseEnd: parsed.attrs.verseEnd,
			snapshotBody: parsed.body
		}
	};
}
