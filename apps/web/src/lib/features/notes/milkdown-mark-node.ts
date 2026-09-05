import { $inputRule, $markSchema, $remark } from '@milkdown/kit/utils';
import { InputRule } from '@milkdown/prose/inputrules';

/**
 * Native highlight/underline marks (SPEC-0015, FR-007) following the official
 * marker-plugin recipe: a remark plugin splits `==`/`++` text into `mark`
 * mdast nodes, `$markSchema` bridges mdast and ProseMirror marks, an input
 * rule converts typed markers and a stringify extension writes the
 * conventions back. Files keep `==texto==`, `=={cor}texto==` and `++texto++`.
 */
export type EditorMarkAction = 'bold' | 'italic' | 'highlight' | 'underline';

export interface MarkedSpan {
	text: string;
	mark: 'highlight' | 'underline' | null;
	color?: string;
}

const COLOR_MARK_PATTERN = /==\{([^{}]+)\}([^=]+)==/y;
const HIGHLIGHT_PATTERN = /==([^=]+)==/y;
const UNDERLINE_PATTERN = /\+\+([^+]+)\+\+/y;
const UNDERLINE_OPEN_GUARD = /(^|[\s([>"'“‘])$/;
const UNDERLINE_CLOSE_GUARD = /^($|[\s)\].,"'?!;:“”‘’])/;

function underlineBoundsOk(text: string, index: number, length: number): boolean {
	if (index > 0) {
		const before = text[index - 1];
		if (before === '+' || !UNDERLINE_OPEN_GUARD.test(before)) return false;
	}
	const after = text[index + length];
	if (after === undefined) return true;
	if (after === '+') return false;
	return UNDERLINE_CLOSE_GUARD.test(after);
}

/** Split plain text into marked spans; `C++` never becomes a mark. */
export function extractMarkSpans(text: string): MarkedSpan[] {
	const spans: MarkedSpan[] = [];
	let plain = '';
	const flush = () => {
		if (plain) {
			spans.push({ text: plain, mark: null });
			plain = '';
		}
	};
	let index = 0;
	while (index < text.length) {
		COLOR_MARK_PATTERN.lastIndex = index;
		HIGHLIGHT_PATTERN.lastIndex = index;
		UNDERLINE_PATTERN.lastIndex = index;
		const colorMatch = COLOR_MARK_PATTERN.exec(text);
		if (colorMatch) {
			flush();
			spans.push({ text: colorMatch[2], mark: 'highlight', color: colorMatch[1] });
			index += colorMatch[0].length;
			continue;
		}
		const highlightMatch = HIGHLIGHT_PATTERN.exec(text);
		if (highlightMatch) {
			flush();
			spans.push({ text: highlightMatch[1], mark: 'highlight' });
			index += highlightMatch[0].length;
			continue;
		}
		const underlineMatch = UNDERLINE_PATTERN.exec(text);
		if (underlineMatch && underlineBoundsOk(text, index, underlineMatch[0].length)) {
			flush();
			spans.push({ text: underlineMatch[1], mark: 'underline' });
			index += underlineMatch[0].length;
			continue;
		}
		plain += text[index];
		index += 1;
	}
	flush();
	return spans;
}

/** Serialize one span back to its Markdown convention. */
export function serializeMarkedSpan(span: { text: string; mark: 'highlight' | 'underline' | null; color?: string }): string {
	if (span.mark === 'underline') return `++${span.text}++`;
	if (span.mark === 'highlight') {
		return span.color ? `=={${span.color}}${span.text}==` : `==${span.text}==`;
	}
	return span.text;
}

/** ProseMirror mark name for each popover action. */
export function formatActionMarkName(action: EditorMarkAction): string {
	return { bold: 'strong', italic: 'emphasis', highlight: 'highlight', underline: 'underline' }[action];
}

interface MarkMdastNode {
	type: string;
	value?: string;
	children?: MarkMdastNode[];
	data?: Record<string, unknown>;
}

function spansToMdast(spans: MarkedSpan[]): MarkMdastNode[] {
	return spans.map((span) => {
		if (!span.mark) return { type: 'text', value: span.text };
		return {
			type: 'mark',
			data: {
				kind: span.mark,
				...(span.color ? { color: span.color } : {})
			},
			children: [{ type: 'text', value: span.text }]
		};
	});
}

function hasMarkerSyntax(value: string): boolean {
	return value.includes('==') || value.includes('++');
}

function transformMarkText(tree: unknown): void {
	const visit = (node: MarkMdastNode, insideCode: boolean): void => {
		if (!node.children) return;
		if (node.type === 'mark') return;
		const nestedCode = insideCode || node.type === 'code';
		const next: MarkMdastNode[] = [];
		for (const child of node.children) {
			if (
				!nestedCode &&
				child.type === 'text' &&
				typeof child.value === 'string' &&
				hasMarkerSyntax(child.value)
			) {
				next.push(...spansToMdast(extractMarkSpans(child.value)));
				continue;
			}
			visit(child, nestedCode || child.type === 'inlineCode');
			next.push(child);
		}
		node.children = next;
	};
	if (tree && typeof tree === 'object') visit(tree as MarkMdastNode, false);
}

interface StringifyTracker {
	move: (value: string) => string;
	current: () => Record<string, unknown>;
}

interface StringifyState {
	enter: (name: string) => () => void;
	createTracker: (info: unknown) => StringifyTracker;
	containerPhrasing: (node: unknown, info: Record<string, unknown>) => string;
}

function serializeMarkNode(
	node: MarkMdastNode,
	_parent: unknown,
	state: StringifyState,
	info: unknown
): string {
	const data = node.data ?? {};
	const color = typeof data.color === 'string' && data.color ? data.color : '';
	const [open, close] =
		data.kind === 'underline'
			? ['++', '++']
			: color
				? [`=={${color}}`, '==']
				: ['==', '=='];
	const exit = state.enter('mark');
	const tracker = state.createTracker(info);
	let value = tracker.move(open);
	value += tracker.move(
		state.containerPhrasing(node, { before: value, after: close, ...tracker.current() })
	);
	value += tracker.move(close);
	exit();
	return value;
}

function markRoundtripPlugin(this: {
	data: (key: string, value?: unknown) => unknown;
}): (tree: unknown) => void {
	const existing = (this.data('toMarkdownExtensions') as unknown[] | undefined) ?? [];
	this.data('toMarkdownExtensions', [...existing, { handlers: { mark: serializeMarkNode } }]);
	return (tree: unknown) => {
		transformMarkText(tree);
	};
}

export const markRemarkPlugin = $remark('openbibleMarkSyntax', () => markRoundtripPlugin as never);

function markData(node: unknown): { kind?: unknown; color?: unknown } {
	const data = (node as { data?: unknown }).data;
	return data && typeof data === 'object' ? (data as { kind?: unknown; color?: unknown }) : {};
}

function markColor(node: unknown): string {
	const color = markData(node).color;
	return typeof color === 'string' ? color : '';
}

export const highlightMarkSchema = $markSchema('highlight', () => ({
	attrs: { color: { default: '' } },
	parseDOM: [
		{
			tag: 'mark',
			getAttrs: (dom: HTMLElement) => ({ color: dom.getAttribute('data-color') ?? '' })
		}
	],
	toDOM: (mark) =>
		mark.attrs.color
			? ['mark', { 'data-color': mark.attrs.color }, 0]
			: (['mark', 0] as const),
	parseMarkdown: {
		match: (node) => node.type === 'mark' && markData(node).kind !== 'underline',
		runner: (state, node, markType) => {
			state.openMark(markType, { color: markColor(node) });
			state.next(node.children);
			state.closeMark(markType);
		}
	},
	toMarkdown: {
		match: (mark) => mark.type.name === 'highlight',
		runner: (state, mark) => {
			const color = mark.attrs.color as string;
			state.withMark(mark, 'mark', undefined, {
				data: { kind: 'highlight', ...(color ? { color } : {}) }
			});
		}
	}
}));

export const underlineMarkSchema = $markSchema('underline', () => ({
	parseDOM: [{ tag: 'u' }],
	toDOM: () => ['u', 0],
	parseMarkdown: {
		match: (node) => node.type === 'mark' && markData(node).kind === 'underline',
		runner: (state, node, markType) => {
			state.openMark(markType);
			state.next(node.children);
			state.closeMark(markType);
		}
	},
	toMarkdown: {
		match: (mark) => mark.type.name === 'underline',
		runner: (state, mark) => {
			state.withMark(mark, 'mark', undefined, { data: { kind: 'underline' } });
		}
	}
}));

export const highlightInputRule = $inputRule(
	() =>
		new InputRule(/==(?:\{([^{}]+)\})?([^=]+)==$/, (state, match, start, end) => {
			const markType = state.schema.marks.highlight;
			if (!markType) return null;
			const { tr } = state;
			tr.replaceWith(
				start,
				end,
				state.schema.text(match[2], [markType.create({ color: match[1] ?? '' })])
			);
			return tr;
		})
);

export const underlineInputRule = $inputRule(
	() =>
		new InputRule(/(^|[\s([>"'“‘])\+\+([^+]+)\+\+$/, (state, match, start, end) => {
			const markType = state.schema.marks.underline;
			if (!markType) return null;
			const { tr } = state;
			tr.replaceWith(
				start + match[1].length,
				end,
				state.schema.text(match[2], [markType.create()])
			);
			return tr;
		})
);
