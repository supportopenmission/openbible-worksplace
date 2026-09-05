import remarkDirective from 'remark-directive';
import { $nodeSchema, $remark } from '@milkdown/kit/utils';
import type { VerseSelectionState } from './verse-selector';
import {
	parseVerseFence,
	renderVerseFence,
	verseReferenceLabel,
	type ParsedVerseFence,
	type VerseFenceAttrs
} from './verse-block-extension';

export function verseAttrsToFence(attrs: VerseFenceAttrs, snapshotBody: string): string {
	return renderVerseFence({ attrs, body: snapshotBody });
}

export function verseFenceToAttrs(source: string): ParsedVerseFence {
	return parseVerseFence(source);
}

export function isValidVerseInterval(start: number, end: number): boolean {
	return Number.isInteger(start) && Number.isInteger(end) && start > 0 && end >= start;
}

type RemarkPosition = {
	start?: { offset?: number };
	end?: { offset?: number };
};

type RemarkNode = {
	type: string;
	name?: string;
	label?: string;
	attributes?: Record<string, string | null | undefined>;
	value?: string;
	children?: RemarkNode[];
	position?: RemarkPosition;
};

function isRemarkNode(value: unknown): value is RemarkNode {
	return Boolean(
		value && typeof value === 'object' && typeof (value as RemarkNode).type === 'string'
	);
}

function directiveSource(node: RemarkNode, source: string): string {
	const start = node.position?.start?.offset;
	const end = node.position?.end?.offset;
	if (typeof start === 'number' && typeof end === 'number' && end >= start) {
		return source.slice(start, end);
	}

	const marker = node.type === 'textDirective' ? ':' : node.type === 'leafDirective' ? '::' : ':::';
	const label = node.label ? `[${node.label}]` : '';
	const attributes = node.attributes
		? `{${Object.entries(node.attributes)
				.filter(([, value]) => value != null)
				.map(([key, value]) => `${key}="${value}"`)
				.join(' ')}}`
		: '';
	return `${marker}${node.name ?? ''}${label}${attributes}`;
}

/**
 * remark-directive also parses ordinary references such as `João 4:4-7` as
 * textDirective nodes. Milkdown only has a parser for the custom verse
 * container, so keep every other directive literal instead of throwing and
 * leaving the editor without an editable document.
 */
export function sanitizeUnsupportedDirectives(tree: unknown, source = ''): void {
	if (!isRemarkNode(tree)) return;

	const visit = (parent: RemarkNode) => {
		if (!parent.children) return;
		const nextChildren: RemarkNode[] = [];
		for (const child of parent.children) {
			if (!child.type.endsWith('Directive')) {
				visit(child);
				nextChildren.push(child);
				continue;
			}

			if (child.type === 'containerDirective' && child.name === 'verse') {
				visit(child);
				nextChildren.push(child);
				continue;
			}

			const textNode: RemarkNode = {
				type: 'text',
				value: directiveSource(child, source),
				...(child.position ? { position: child.position } : {})
			};
			if (child.type === 'containerDirective') {
				nextChildren.push({
					type: 'paragraph',
					children: [textNode],
					...(child.position ? { position: child.position } : {})
				});
			} else {
				nextChildren.push(textNode);
			}
		}
		parent.children = nextChildren;
	};

	visit(tree);
}

export function selectionToVerseAttrs(
	selection: VerseSelectionState,
	versionIds: string[]
):
	| { ok: true; attrs: VerseFenceAttrs }
	| { ok: false; reason: 'missing-version' | 'invalid-range' } {
	if (!selection.versionId || !versionIds.includes(selection.versionId)) {
		return { ok: false, reason: 'missing-version' };
	}
	if (!isValidVerseInterval(selection.verseStart, selection.verseEnd)) {
		return { ok: false, reason: 'invalid-range' };
	}
	return {
		ok: true,
		attrs: {
			versionId: selection.versionId,
			version: selection.version ?? '',
			bookId: String(selection.bookId),
			book: selection.book ?? `Livro ${selection.bookId}`,
			chapter: String(selection.chapter),
			verseStart: String(selection.verseStart),
			verseEnd: String(selection.verseEnd)
		}
	};
}

function directiveText(node: unknown): string {
	if (!node || typeof node !== 'object') return '';
	const candidate = node as { value?: unknown; children?: unknown[] };
	if (typeof candidate.value === 'string') return candidate.value;
	if (!Array.isArray(candidate.children)) return '';
	return candidate.children.map(directiveText).filter(Boolean).join('\n');
}

export const verseDirective = $remark('openbibleVerseDirective', () => remarkDirective);

export const unsupportedDirectiveFallback = $remark(
	'openbibleUnsupportedDirectiveFallback',
	() => () => (tree, file) => {
		sanitizeUnsupportedDirectives(tree, typeof file.value === 'string' ? file.value : '');
	}
);

export const verseNodeSchema = $nodeSchema('verse', () => ({
	group: 'block',
	atom: true,
	selectable: true,
	attrs: {
		versionId: { default: '' },
		version: { default: '' },
		bookId: { default: '' },
		book: { default: '' },
		chapter: { default: '' },
		verseStart: { default: '' },
		verseEnd: { default: '' },
		snapshotBody: { default: '' }
	},
	parseDOM: [
		{
			tag: 'blockquote[data-type="verse"]',
			getAttrs: (dom: HTMLElement) => ({ ...dom.dataset })
		}
	],
	toDOM: (node) => [
		'blockquote',
		{
			'data-type': 'verse',
			'data-version-id': node.attrs.versionId,
			'data-version': node.attrs.version,
			'data-book-id': node.attrs.bookId,
			'data-book': node.attrs.book,
			'data-chapter': node.attrs.chapter,
			'data-verse-start': node.attrs.verseStart,
			'data-verse-end': node.attrs.verseEnd,
			'data-snapshot-body': node.attrs.snapshotBody,
			class: 'verse-block-callout',
			'aria-label': `Versículo ${verseReferenceLabel(node.attrs as VerseFenceAttrs)}`
		},
		['p', { class: 'verse-block-ref' }, verseReferenceLabel(node.attrs as VerseFenceAttrs)],
		['pre', { class: 'verse-snapshot' }, node.attrs.snapshotBody]
	],
	parseMarkdown: {
		match: (node) => node.type === 'containerDirective' && node.name === 'verse',
		runner: (state, node, type) => {
			const directive = node as typeof node & { attributes?: Record<string, string | null> };
			state.addNode(type, {
				versionId: directive.attributes?.versionId ?? '',
				version: directive.attributes?.version ?? '',
				bookId: directive.attributes?.bookId ?? '',
				book: directive.attributes?.book ?? '',
				chapter: directive.attributes?.chapter ?? '',
				verseStart: directive.attributes?.verseStart ?? '',
				verseEnd: directive.attributes?.verseEnd ?? '',
				snapshotBody: directiveText(node)
			});
		}
	},
	toMarkdown: {
		match: (node) => node.type.name === 'verse',
		runner: (state, node) => {
			state.addNode(
				'containerDirective',
				[{ type: 'paragraph', children: [{ type: 'text', value: node.attrs.snapshotBody }] }],
				undefined,
				{
					name: 'verse',
					attributes: {
						versionId: node.attrs.versionId,
						...(node.attrs.version ? { version: node.attrs.version } : {}),
						bookId: node.attrs.bookId,
						book: node.attrs.book,
						chapter: node.attrs.chapter,
						verseStart: node.attrs.verseStart,
						verseEnd: node.attrs.verseEnd
					}
				}
			);
		}
	}
}));
