import type { WorkspaceStorage } from '$lib/storage/types';
import {
	loadBibleCatalog,
	readBibleChapter,
	type BibleVersion
} from '$lib/features/bible/bible-reader';
import { verseReferenceLabel } from './verse-block-extension';
import { matchCatalogBook } from '$lib/bible/reference-parser';
import { youtubeEmbedUrl } from './youtube-embed';

export interface ExportVerse {
	reference: string;
	text: string;
}

export type VerseTextResolver = (fence: {
	attrs: Record<string, string>;
	body: string;
}) => ExportVerse[];

export type ExpandResult =
	| { ok: true; markdown: string }
	| { ok: false; reason: 'missing-verse-text' };

const VERSE_FENCE_PATTERN = /:::verse\s*\{([^}]*)\}\s*\n([\s\S]*?)\n:::/g;
const FENCE_ATTR_PATTERN = /(\w+)="([^"]*)"/g;

function parseFenceAttrs(raw: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	for (const match of raw.matchAll(FENCE_ATTR_PATTERN)) {
		attrs[match[1]] = match[2];
	}
	return attrs;
}

function quoteVerse(verse: ExportVerse): string {
	const lines = [`> ${verse.reference}`];
	for (const line of verse.text.split('\n')) {
		lines.push(line.trim() ? `> ${line.trim()}` : '>');
	}
	return lines.join('\n');
}

const VIDEO_FENCE_OPEN = /^:::video\s*(\{[^}]*\})?\s*$/;

export function renderVideoIframe(videoId: string): string {
	return `<iframe width="100%" height="360" src="${youtubeEmbedUrl(videoId)}" title="Vídeo do YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

/**
 * Replace every `:::video` fence with an embed iframe for external readers.
 * Blocks without `videoId` are omitted and reported; the source is untouched.
 */
export function expandVideoFences(markdown: string): { markdown: string; warnings: string[] } {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const out: string[] = [];
	const warnings: string[] = [];
	let index = 0;
	while (index < lines.length) {
		const open = lines[index].match(VIDEO_FENCE_OPEN);
		if (!open) {
			out.push(lines[index]);
			index += 1;
			continue;
		}
		const attrs = parseFenceAttrs(open[1] ?? '');
		let end = index + 1;
		while (end < lines.length && lines[end].trim() !== ':::') end += 1;
		const videoId = (attrs.videoId ?? '').trim();
		if (videoId) {
			out.push(renderVideoIframe(videoId));
		} else {
			warnings.push(`Bloco de vídeo sem videoId omitido (linha ${index + 1}).`);
		}
		index = end < lines.length ? end + 1 : lines.length;
	}
	return { markdown: out.join('\n'), warnings };
}

/**
 * Replace every `:::verse` fence with blockquote citations. The source file
 * is never touched; the result is a derived export document.
 */
export function expandVerseFences(markdown: string, resolve: VerseTextResolver): ExpandResult {
	let missing = false;
	const expanded = markdown.replace(
		VERSE_FENCE_PATTERN,
		(match, attrsSource: string, body: string) => {
			const verses = resolve({ attrs: parseFenceAttrs(attrsSource), body: body.trimEnd() });
			if (!verses.length) {
				missing = true;
				return match;
			}
			return verses.map(quoteVerse).join('\n\n');
		}
	);
	if (missing) return { ok: false, reason: 'missing-verse-text' };
	return { ok: true, markdown: expanded };
}

/**
 * Build the printable/exportable Markdown for a note. Throws explicitly when
 * a fence has no resolvable verse text so the UI can report the failure.
 */
export function buildExportMarkdown(markdown: string, resolve: VerseTextResolver): string {
	const expanded = expandVerseFences(markdown, resolve);
	if (!expanded.ok) throw new Error('missing-verse-text');
	return sanitizeBreakTags(expandVideoFences(expanded.markdown).markdown);
}

/**
 * Async variant for UI flows where verse text comes from the installed
 * catalog. Same contract: throws explicitly when a fence is unresolvable.
 */
export async function buildExportMarkdownAsync(
	markdown: string,
	resolve: (fence: { attrs: Record<string, string>; body: string }) => Promise<ExportVerse[]>
): Promise<string> {
	VERSE_FENCE_PATTERN.lastIndex = 0;
	const matches = [...markdown.matchAll(VERSE_FENCE_PATTERN)];
	let missing = false;
	let cursor = 0;
	const parts: string[] = [];
	for (const match of matches) {
		const index = match.index ?? 0;
		parts.push(markdown.slice(cursor, index));
		const verses = await resolve({
			attrs: parseFenceAttrs(match[1]),
			body: (match[2] ?? '').trimEnd()
		});
		if (!verses.length) {
			missing = true;
			parts.push(match[0]);
		} else {
			parts.push(verses.map(quoteVerse).join('\n\n'));
		}
		cursor = index + match[0].length;
	}
	parts.push(markdown.slice(cursor));
	if (missing) throw new Error('missing-verse-text');
	return sanitizeBreakTags(expandVideoFences(parts.join('')).markdown);
}

const BR_TAG_PATTERN = /<br\s*\/?>/gi;

/**
 * Turn literal `<br>` tags into real breaks, leaving fenced code untouched.
 * Legacy notes and pastes carry these tags; the preview renderer escapes
 * them, so exports must normalize first.
 */
export function sanitizeBreakTags(markdown: string): string {
	return markdown
		.split(/(```[\s\S]*?```)/g)
		.map((part, index) => {
			if (index % 2 === 1) return part;
			return part.replace(BR_TAG_PATTERN, '\n\n').replace(/\n{3,}/g, '\n\n');
		})
		.join('');
}

function escapePrintText(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Wrap rendered body HTML in an editorial print document with title block,
 * verse callouts, typography and margins.
 */
export function buildPrintDocument(title: string, bodyHtml: string): string {
	const safeTitle = escapePrintText(title) || 'Nota';
	const bodyWithoutTitleDup = bodyHtml.replace(/^<h1>.*?<\/h1>/, '');
	return (
		'<!doctype html>' +
		'<html lang="pt-BR"><head><meta charset="utf-8">' +
		`<title>${safeTitle}</title>` +
		'<style>' +
		'html{color-scheme:light}' +
		'body{font-family:Georgia,"Times New Roman",serif;max-width:680px;margin:32px auto;padding:0 20px;line-height:1.65;color:#1a1a1a;background:#fff}' +
		'h1.doc-title{font-size:1.75rem;line-height:1.25;margin:0 0 4px}' +
		'p.doc-meta{font-size:.8125rem;color:#666;margin:0 0 24px}' +
		'h1,h2,h3{line-height:1.3;break-after:avoid}' +
		'h2{font-size:1.375rem;margin:28px 0 8px}' +
		'h3{font-size:1.125rem;margin:24px 0 8px}' +
		'p{margin:0 0 12px}' +
		'blockquote{margin:16px 0;padding:12px 16px;border-left:3px solid #999;background:#f7f7f5;border-radius:0 8px 8px 0;break-inside:avoid}' +
		'blockquote p{margin:0 0 6px}' +
		'blockquote p:last-child{margin-bottom:0}' +
		'mark{background:#fff3bf;padding:0 2px;border-radius:2px}' +
		'u{text-underline-offset:2px}' +
		'code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.875em}' +
		'pre{background:#f4f4f2;padding:14px 16px;border-radius:8px;overflow-x:auto;white-space:pre-wrap}' +
		'ul,ol{margin:0 0 12px;padding-left:24px}' +
		'li{margin-bottom:4px}' +
		'hr{border:0;border-top:1px solid #ccc;margin:24px 0}' +
		'iframe{width:100%;aspect-ratio:16/9;border:1px solid #ccc;border-radius:8px}' +
		'img{max-width:100%}' +
		'</style>' +
		'</head><body>' +
		`<h1 class="doc-title">${safeTitle}</h1>` +
		bodyWithoutTitleDup +
		'</body></html>'
	);
}

function fenceRange(attrs: Record<string, string>): { start: number; end: number } {
	const start = Number(attrs.verseStart);
	const end = Number(attrs.verseEnd);
	const safeStart = Number.isFinite(start) && start > 0 ? start : 1;
	const safeEnd = Number.isFinite(end) && end >= safeStart ? end : safeStart;
	return { start: safeStart, end: safeEnd };
}

/** Resolve fence verses against the installed Bible catalog. Never throws. */
export async function resolveFenceVerses(
	storage: WorkspaceStorage | undefined,
	fence: { attrs: Record<string, string>; body: string }
): Promise<ExportVerse[]> {
	try {
		if (!storage) return [];
		const catalog = await loadBibleCatalog(storage);
		const candidates = catalog.versions;
		const wanted = fence.attrs.versionId || '';
		const version: BibleVersion | undefined =
			candidates.find((candidate) => candidate.id === wanted) ?? candidates[0];
		if (!version) return [];
		const book = matchCatalogBook(version.books, {
			raw: '',
			osis: '',
			book: fence.attrs.book || '',
			chapter: Number(fence.attrs.chapter) || 1,
			verseStart: 1,
			verseEnd: 1,
			from: 0,
			to: 0
		});
		if (!book) return [];
		const chapter = Number(fence.attrs.chapter);
		if (!Number.isFinite(chapter)) return [];
		const { start, end } = fenceRange(fence.attrs);
		const verses = await readBibleChapter(version, book.id, chapter);
		const filtered = verses.filter((verse) => verse.number >= start && verse.number <= end);
		if (!filtered.length) return [];
		const reference = verseReferenceLabel({
			versionId: version.id,
			version: fence.attrs.version ?? '',
			bookId: String(book.id),
			book: book.name,
			chapter: String(chapter),
			verseStart: String(start),
			verseEnd: String(end)
		});
		return filtered.map((verse) => ({
			reference: filtered.length > 1 ? `${reference} · v${verse.number}` : reference,
			text: verse.text
		}));
	} catch {
		return [];
	}
}
