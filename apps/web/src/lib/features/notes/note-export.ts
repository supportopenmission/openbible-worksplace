import type { WorkspaceStorage } from '$lib/storage/types';
import {
	loadBibleCatalog,
	readBibleChapter,
	type BibleVersion
} from '$lib/features/bible/bible-reader';
import { markdownBodyToHtml, verseReferenceLabel } from './verse-block-extension';
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
	{ ok: true; markdown: string } | { ok: false; reason: 'missing-verse-text' };

export interface PortableExportSnapshot {
	title: string;
	markdown: string;
	resolveVerse?: VerseTextResolver;
}

export interface PortableMarkdownExport {
	format: 'markdown';
	derived: true;
	source: 'workspace-snapshot';
	markdown: string;
	warnings: string[];
}

export interface PortablePdfFallbackExport {
	format: 'pdf-fallback';
	derived: true;
	source: 'workspace-snapshot';
	title: string;
	markdown: string;
	document: string;
}

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
		const url =
			(attrs.url ?? '').trim() ||
			(videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : '');
		const title = (attrs.title ?? '').trim() || 'Vídeo do YouTube';
		if (videoId === '')
			warnings.push(`Bloco de vídeo sem videoId convertido para fallback (linha ${index + 1}).`);
		out.push(url ? `[${title}](${url})` : title);
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

/** Exporta um snapshot do backend sem escrever Markdown de volta na fonte. */
export function exportPortableMarkdown(snapshot: PortableExportSnapshot): PortableMarkdownExport {
	const markdown = buildExportMarkdown(snapshot.markdown, snapshot.resolveVerse ?? (() => []));
	return {
		format: 'markdown',
		derived: true,
		source: 'workspace-snapshot',
		markdown,
		warnings: []
	};
}

/** Gera o documento de impressão offline; o navegador decide a gravação em PDF. */
export function exportPdfFallback(snapshot: PortableExportSnapshot): PortablePdfFallbackExport {
	const markdown = buildExportMarkdown(snapshot.markdown, snapshot.resolveVerse ?? (() => []));
	return {
		format: 'pdf-fallback',
		derived: true,
		source: 'workspace-snapshot',
		title: snapshot.title,
		markdown,
		document: buildPrintDocument(snapshot.title, markdownBodyToHtml(markdown))
	};
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
		'@font-face{font-family:Geist;src:url("/fonts/Geist-Variable.woff2") format("woff2");font-style:normal;font-weight:100 900;font-display:swap}' +
		'@font-face{font-family:"Geist Mono";src:url("/fonts/GeistMono-Variable.woff2") format("woff2");font-style:normal;font-weight:100 900;font-display:swap}' +
		'@page{size:auto;margin:18mm 17mm 20mm}' +
		'html{color-scheme:light;print-color-adjust:exact;-webkit-print-color-adjust:exact}' +
		'body{font-family:Geist,ui-sans-serif,system-ui,sans-serif;max-width:720px;margin:0 auto;padding:0;line-height:1.62;letter-spacing:-.005em;color:#171717;background:#fff;print-color-adjust:exact;-webkit-print-color-adjust:exact}' +
		'h1.doc-title{font-size:2rem;font-weight:650;line-height:1.15;letter-spacing:-.04em;margin:0 0 24px;padding-bottom:14px;border-bottom:1px solid #d4d4d4}' +
		'p.doc-meta{font-size:.8125rem;color:#666;margin:0 0 24px}' +
		'h1,h2,h3{line-height:1.25;letter-spacing:-.025em;break-after:avoid;page-break-after:avoid}' +
		'h2{font-size:1.375rem;font-weight:620;margin:30px 0 10px}' +
		'h3{font-size:1.125rem;font-weight:600;margin:24px 0 8px}' +
		'p{margin:0 0 13px;orphans:3;widows:3}' +
		'blockquote{margin:18px 0;padding:13px 16px;border-left:3px solid #737373;background:#f5f5f5;border-radius:0 6px 6px 0;break-inside:avoid;page-break-inside:avoid}' +
		'blockquote p{margin:0 0 6px}' +
		'blockquote p:last-child{margin-bottom:0}' +
		'mark{background:#f4d66d;color:#171717;padding:0 2px;border-radius:2px;print-color-adjust:exact;-webkit-print-color-adjust:exact}' +
		'u{text-underline-offset:3px;text-decoration-thickness:1px}' +
		'code{font-family:"Geist Mono",ui-monospace,monospace;font-size:.875em;letter-spacing:0}' +
		'pre{font-family:"Geist Mono",ui-monospace,monospace;background:#f3f3f3;padding:14px 16px;border:1px solid #dedede;border-radius:6px;overflow-x:auto;white-space:pre-wrap;break-inside:avoid;page-break-inside:avoid}' +
		'ul,ol{margin:0 0 13px;padding-left:24px}' +
		'li{margin-bottom:5px}' +
		'hr{border:0;border-top:1px solid #d4d4d4;margin:28px 0}' +
		'iframe{width:100%;aspect-ratio:16/9;border:1px solid #c7c7c7;border-radius:6px;break-inside:avoid;page-break-inside:avoid}' +
		'img{max-width:100%;height:auto}' +
		'@media print{a{color:inherit;text-decoration:none}h1,h2,h3{page-break-after:avoid}blockquote,pre,iframe{page-break-inside:avoid}}' +
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
