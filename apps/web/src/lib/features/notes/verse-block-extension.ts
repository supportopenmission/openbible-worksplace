import { mergeAttributes, Node } from '@tiptap/core';

export interface VerseFenceAttrs {
	versionId: string;
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

export function verseReferenceLabel(attrs: VerseFenceAttrs): string {
	const start = attrs.verseStart;
	const end = attrs.verseEnd;
	const range =
		start && end && start !== end ? `${start}–${end}` : start || end || '';
	return `${attrs.book} ${attrs.chapter}:${range}`.trim();
}

function verseFenceToHtml(parsed: ParsedVerseFence): string {
	const { attrs, body } = parsed;
	const dataAttrs = Object.entries(attrs)
		.map(([key, value]) => `data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${value}"`)
		.join(' ');
	return `<div data-type="verse-block" ${dataAttrs}><pre class="verse-snapshot">${escapeHtml(body)}</pre></div>`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
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

function simpleMarkdownToHtml(markdown: string): string {
	return markdown
		.split(/\n{2,}/)
		.map((block) => {
			const trimmed = block.trim();
			if (!trimmed) return '';
			const h1 = trimmed.match(/^#\s+(.+)$/);
			if (h1) return `<h1>${escapeHtml(h1[1])}</h1>`;
			const h2 = trimmed.match(/^##\s+(.+)$/);
			if (h2) return `<h2>${escapeHtml(h2[1])}</h2>`;
			return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br>')}</p>`;
		})
		.join('');
}

function htmlToPlainText(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

export function htmlBodyToMarkdown(html: string): string {
	const container = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
	const root = container.body.firstElementChild;
	if (!root) return '';
	const chunks: string[] = [];
	for (const child of root.childNodes) {
		if (child instanceof HTMLElement && child.dataset.type === 'verse-block') {
			const attrs: VerseFenceAttrs = {
				versionId: child.dataset.versionId ?? '',
				bookId: child.dataset.bookId ?? '',
				book: child.dataset.book ?? '',
				chapter: child.dataset.chapter ?? '',
				verseStart: child.dataset.verseStart ?? '',
				verseEnd: child.dataset.verseEnd ?? ''
			};
			const snapshot = child.querySelector('.verse-snapshot')?.textContent ?? '';
			chunks.push(renderVerseFence({ attrs, body: snapshot.trimEnd() }));
			continue;
		}
		if (child instanceof HTMLElement) {
			const tag = child.tagName.toLowerCase();
			const text = htmlToPlainText(child.innerHTML).trim();
			if (!text) continue;
			if (tag === 'h1') chunks.push(`# ${text}`);
			else if (tag === 'h2') chunks.push(`## ${text}`);
			else chunks.push(text);
		}
	}
	return chunks.join('\n\n');
}

export const VerseBlockExtension = Node.create({
	name: 'verseBlock',
	group: 'block',
	atom: true,
	selectable: true,
	draggable: false,

	addAttributes() {
		return {
			versionId: { default: '' },
			bookId: { default: '' },
			book: { default: '' },
			chapter: { default: '' },
			verseStart: { default: '' },
			verseEnd: { default: '' },
			snapshotBody: { default: '' }
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
				'data-book-id': node.attrs.bookId,
				'data-book': node.attrs.book,
				'data-chapter': node.attrs.chapter,
				'data-verse-start': node.attrs.verseStart,
				'data-verse-end': node.attrs.verseEnd,
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
			dom.dataset.bookId = node.attrs.bookId;
			dom.dataset.book = node.attrs.book;
			dom.dataset.chapter = node.attrs.chapter;
			dom.dataset.verseStart = node.attrs.verseStart;
			dom.dataset.verseEnd = node.attrs.verseEnd;

			const ref = document.createElement('p');
			ref.className = 'verse-block-ref';
			ref.textContent = verseReferenceLabel({
				versionId: node.attrs.versionId,
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
			bookId: parsed.attrs.bookId,
			book: parsed.attrs.book,
			chapter: parsed.attrs.chapter,
			verseStart: parsed.attrs.verseStart,
			verseEnd: parsed.attrs.verseEnd,
			snapshotBody: parsed.body
		}
	};
}
