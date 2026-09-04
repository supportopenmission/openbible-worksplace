import { extractVerseFencesFromMarkdown } from './verse-block-extension';

export type ToolbarAction =
	| 'bold'
	| 'italic'
	| 'heading'
	| 'bullet'
	| 'task'
	| 'quote'
	| 'verse';

export interface MarkdownSelection {
	from: number;
	to: number;
}

export type MarkdownPart =
	| { type: 'markdown'; value: string }
	| { type: 'verse'; value: string; index: number };

const VERSE_FENCE = /:::verse\{[^}]*\}\s*\n[\s\S]*?\n:::/g;

export function roundtripMarkdown(markdown: string): string {
	return markdown;
}

export function extractFirstH1(markdown: string): string | null {
	return markdown.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim() ?? null;
}

export function splitMarkdownByVerseFences(markdown: string): MarkdownPart[] {
	const parts: MarkdownPart[] = [];
	let cursor = 0;
	let verseIndex = 0;
	for (const match of markdown.matchAll(VERSE_FENCE)) {
		const index = match.index ?? 0;
		if (index > cursor) parts.push({ type: 'markdown', value: markdown.slice(cursor, index) });
		parts.push({ type: 'verse', value: match[0], index: verseIndex++ });
		cursor = index + match[0].length;
	}
	if (cursor < markdown.length) parts.push({ type: 'markdown', value: markdown.slice(cursor) });
	return parts;
}

export function validateVerseMarkdown(markdown: string): boolean {
	try {
		extractVerseFencesFromMarkdown(markdown);
		return true;
	} catch {
		return false;
	}
}

function currentLineRange(markdown: string, selection: MarkdownSelection) {
	const start = markdown.lastIndexOf('\n', Math.max(0, selection.from - 1)) + 1;
	const endIndex = markdown.indexOf('\n', selection.to);
	return { start, end: endIndex < 0 ? markdown.length : endIndex };
}

export function applyToolbarActionToMarkdown(
	markdown: string,
	selection: MarkdownSelection,
	action: Exclude<ToolbarAction, 'verse'>
): string {
	const from = Math.max(0, Math.min(selection.from, markdown.length));
	const to = Math.max(from, Math.min(selection.to, markdown.length));
	const selected = markdown.slice(from, to);
	if (action === 'bold' || action === 'italic') {
		const marker = action === 'bold' ? '**' : '*';
		return `${markdown.slice(0, from)}${marker}${selected}${marker}${markdown.slice(to)}`;
	}

	const line = currentLineRange(markdown, { from, to });
	const value = markdown.slice(line.start, line.end).replace(/^(?:#{1,6}|[-*>]|- \[[ xX]\])\s+/, '');
	const prefix = {
		heading: '# ',
		bullet: '- ',
		task: '- [ ] ',
		quote: '> '
	}[action];
	return `${markdown.slice(0, line.start)}${prefix}${value}${markdown.slice(line.end)}`;
}
