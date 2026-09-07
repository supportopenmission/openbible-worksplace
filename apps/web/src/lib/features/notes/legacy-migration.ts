import {
	parseBlockEnvelope,
	serializeBlockEnvelope,
	serializeVerseEnvelope,
	type PortableDiagnostic,
	type PortableVideoBlock
} from './portable-envelope';
import { parseVerseFence } from './verse-block-extension';

const VERSE_FENCE = /:::verse\{[^}]*\}\s*\n[\s\S]*?\n:::/g;
const VIDEO_FENCE = /:::video\s*(\{[^}]*\})?\s*\n[\s\S]*?\n:::/g;
const HAS_VERSE_FENCE = /:::verse\{[^}]*\}\s*\n[\s\S]*?\n:::/;
const HAS_VIDEO_FENCE = /:::video\s*(\{[^}]*\})?\s*\n[\s\S]*?\n:::/;
const ATTR = /(\w+)="([^"]*)"/g;

export type PortableSourceKind = 'canonical' | 'legacy' | 'degraded' | 'conflict';

export interface PortableMarkdownRead {
	source: string;
	markdown: string;
	sourceKind: PortableSourceKind;
	diagnostics: PortableDiagnostic[];
}

function parseAttrs(raw: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	for (const match of raw.matchAll(ATTR)) attrs[match[1]] = match[2];
	return attrs;
}

function youtubeUrl(videoId: string): string {
	return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function sourceKindFor(markdown: string): PortableSourceKind {
	if (HAS_VERSE_FENCE.test(markdown) || HAS_VIDEO_FENCE.test(markdown)) return 'legacy';
	if (markdown.trimStart().startsWith('<!-- openbible:block')) {
		const parsed = parseBlockEnvelope(markdown);
		return parsed.state;
	}
	return 'canonical';
}

export function readPortableMarkdown(markdown: string): PortableMarkdownRead {
	const source = markdown.replace(/\r\n?/g, '\n');
	const sourceKind = sourceKindFor(source);
	const diagnostics: PortableDiagnostic[] = [];
	if (sourceKind === 'degraded' || sourceKind === 'conflict') {
		diagnostics.push(...parseBlockEnvelope(source).diagnostics);
	}
	return { source, markdown: source, sourceKind, diagnostics };
}

function migrateVerseFence(source: string, diagnostics: PortableDiagnostic[]): string {
	try {
		return serializeVerseEnvelope(parseVerseFence(source));
	} catch {
		diagnostics.push({
			code: 'invalid-envelope',
			severity: 'warning',
			message: 'Fence de verso inválido preservado como texto legado.'
		});
		return source;
	}
}

function migrateVideoFence(source: string, diagnostics: PortableDiagnostic[]): string {
	const open = source.match(/^:::video\s*(\{[^}]*\})?\s*\n/);
	if (!open) return source;
	const attrs = parseAttrs(open[1] ?? '');
	const body = source
		.slice(open[0].length)
		.replace(/\n:::\s*$/, '')
		.trim();
	const videoId = attrs.videoId?.trim() ?? '';
	const url = attrs.url?.trim() || (videoId ? youtubeUrl(videoId) : '');
	if (!url) {
		diagnostics.push({
			code: 'invalid-envelope',
			severity: 'warning',
			message: 'Vídeo sem URL preservado como texto legado.'
		});
		return source;
	}
	const block: PortableVideoBlock = {
		kind: 'video',
		provider: attrs.provider?.trim() || 'YouTube',
		title: attrs.title?.trim() || body.split('\n')[0]?.trim() || 'Vídeo do YouTube',
		url
	};
	return serializeBlockEnvelope(block);
}

export function migrateLegacyMarkdown(markdown: string): {
	markdown: string;
	diagnostics: PortableDiagnostic[];
} {
	const diagnostics: PortableDiagnostic[] = [];
	let migrated = markdown.replace(/\r\n?/g, '\n');
	migrated = migrated.replace(VERSE_FENCE, (match) => migrateVerseFence(match, diagnostics));
	migrated = migrated.replace(VIDEO_FENCE, (match) => migrateVideoFence(match, diagnostics));
	return { markdown: migrated, diagnostics };
}

export function saveCanonicalMarkdown(input: string | PortableMarkdownRead): string {
	const read = typeof input === 'string' ? readPortableMarkdown(input) : input;
	return migrateLegacyMarkdown(read.source).markdown;
}
