import { parseVerseFence, type ParsedVerseFence } from './verse-block-extension';

const OPEN_MARKER = /^<!--\s*openbible:block\s+([\s\S]*?)\s*-->\s*\n?/;
const CLOSE_MARKER = '<!-- /openbible:block -->';
const LEGACY_VERSE = /^:::verse\{[^}]*\}\s*\n[\s\S]*?\n:::/;
const MAX_COMMENT_BYTES = 16 * 1024;
const MAX_JSON_DEPTH = 8;

const SHA256_K = [
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

export type PortableBlockState = 'canonical' | 'degraded' | 'conflict';
export type PortableBlockKind = 'verse' | 'video';

export interface PortableDiagnostic {
	code:
		'missing-envelope' | 'invalid-envelope' | 'invalid-json' | 'hash-mismatch' | 'limit-exceeded';
	severity: 'info' | 'warning' | 'error';
	message: string;
}

export interface PortableVerseBlock {
	id?: string;
	kind: 'verse';
	schemaVersion?: 1;
	versionId: string;
	version?: string;
	bookId: number | string;
	book: string;
	chapter: number | string;
	verseStart: number | string;
	verseEnd: number | string;
	snapshotBody: string;
}

export interface PortableVideoBlock {
	id?: string;
	kind: 'video';
	schemaVersion?: 1;
	provider: string;
	title: string;
	url: string;
}

export type PortableBlock = PortableVerseBlock | PortableVideoBlock;

export interface PortableBlockEnvelope {
	schemaVersion: 1;
	id: string;
	kind: PortableBlockKind;
	versionId?: string;
	version?: string;
	bookId?: number | string;
	book?: string;
	chapter?: number | string;
	verseStart?: number | string;
	verseEnd?: number | string;
	snapshotHash?: string;
	provider?: string;
	title?: string;
	url?: string;
}

export interface ParsedBlockEnvelope {
	state: PortableBlockState;
	envelope?: PortableBlockEnvelope;
	fallback: string;
	diagnostics: PortableDiagnostic[];
}

function rightRotate(value: number, bits: number): number {
	return (value >>> bits) | (value << (32 - bits));
}

function sha256(value: string): string {
	const input = new TextEncoder().encode(value);
	const totalLength = Math.ceil((input.length + 9) / 64) * 64;
	const bytes = new Uint8Array(totalLength);
	bytes.set(input);
	bytes[input.length] = 0x80;
	new DataView(bytes.buffer).setUint32(totalLength - 4, input.length * 8, false);

	let h0 = 0x6a09e667;
	let h1 = 0xbb67ae85;
	let h2 = 0x3c6ef372;
	let h3 = 0xa54ff53a;
	let h4 = 0x510e527f;
	let h5 = 0x9b05688c;
	let h6 = 0x1f83d9ab;
	let h7 = 0x5be0cd19;

	for (let offset = 0; offset < bytes.length; offset += 64) {
		const words = new Uint32Array(64);
		for (let index = 0; index < 16; index += 1) {
			const position = offset + index * 4;
			words[index] =
				(bytes[position] << 24) |
				(bytes[position + 1] << 16) |
				(bytes[position + 2] << 8) |
				bytes[position + 3];
		}
		for (let index = 16; index < 64; index += 1) {
			const previous = words[index - 15];
			const earlier = words[index - 2];
			const smallSigma0 = rightRotate(previous, 7) ^ rightRotate(previous, 18) ^ (previous >>> 3);
			const smallSigma1 = rightRotate(earlier, 17) ^ rightRotate(earlier, 19) ^ (earlier >>> 10);
			words[index] = (words[index - 16] + smallSigma0 + words[index - 7] + smallSigma1) >>> 0;
		}

		let a = h0;
		let b = h1;
		let c = h2;
		let d = h3;
		let e = h4;
		let f = h5;
		let g = h6;
		let h = h7;
		for (let index = 0; index < 64; index += 1) {
			const bigSigma1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
			const choose = (e & f) ^ (~e & g);
			const temp1 = (h + bigSigma1 + choose + SHA256_K[index] + words[index]) >>> 0;
			const bigSigma0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
			const majority = (a & b) ^ (a & c) ^ (b & c);
			const temp2 = (bigSigma0 + majority) >>> 0;
			h = g;
			g = f;
			f = e;
			e = (d + temp1) >>> 0;
			d = c;
			c = b;
			b = a;
			a = (temp1 + temp2) >>> 0;
		}

		h0 = (h0 + a) >>> 0;
		h1 = (h1 + b) >>> 0;
		h2 = (h2 + c) >>> 0;
		h3 = (h3 + d) >>> 0;
		h4 = (h4 + e) >>> 0;
		h5 = (h5 + f) >>> 0;
		h6 = (h6 + g) >>> 0;
		h7 = (h7 + h) >>> 0;
	}

	return [h0, h1, h2, h3, h4, h5, h6, h7]
		.map((word) => word.toString(16).padStart(8, '0'))
		.join('');
}

function normalizeVisible(value: string): string {
	return value.replace(/\r\n?/g, '\n').trim();
}

function quoteFallbackLine(line: string): string {
	return line.trim() ? `> ${line}` : '>';
}

function verseReference(block: PortableVerseBlock): string {
	const start = String(block.verseStart ?? '').trim();
	const end = String(block.verseEnd ?? '').trim();
	const range = start && end && start !== end ? `${start}–${end}` : start || end;
	return `${block.book} ${block.chapter}:${range}`.trim();
}

function verseFallback(block: PortableVerseBlock): string {
	const reference = verseReference(block);
	const version = block.version?.trim();
	const heading = `> **${reference}${version ? ` · ${version}` : ''}**`;
	const body = normalizeVisible(block.snapshotBody);
	return [heading, '>', ...body.split('\n').map(quoteFallbackLine)].join('\n');
}

function videoFallback(block: PortableVideoBlock): string {
	const provider = block.provider.trim() || 'Vídeo';
	const title = block.title.trim() || 'Vídeo';
	return `[Vídeo: ${title} — ${provider}](${block.url.trim()})`;
}

function blockIdentity(block: PortableBlock, fallback: string): string {
	if (block.id?.trim()) return block.id.trim();
	return `block-${sha256(`${block.kind}\n${fallback}`).slice(0, 16)}`;
}

function numericValue(value: number | string): number | string {
	const numeric = Number(value);
	return Number.isFinite(numeric) && String(value).trim() !== '' ? numeric : value;
}

function escapeCommentJson(value: PortableBlockEnvelope): string {
	return JSON.stringify(value)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/--/g, '\\u002d\\u002d');
}

function toEnvelope(block: PortableBlock, fallback: string): PortableBlockEnvelope {
	const base = {
		schemaVersion: 1 as const,
		id: blockIdentity(block, fallback),
		kind: block.kind
	};
	if (block.kind === 'verse') {
		return {
			...base,
			versionId: block.versionId,
			...(block.version ? { version: block.version } : {}),
			bookId: numericValue(block.bookId),
			book: block.book,
			chapter: numericValue(block.chapter),
			verseStart: numericValue(block.verseStart),
			verseEnd: numericValue(block.verseEnd),
			snapshotHash: `sha256:${sha256(fallback)}`
		};
	}
	return {
		...base,
		provider: block.provider,
		title: block.title,
		url: block.url
	};
}

export function serializeBlockEnvelope(block: PortableBlock): string {
	const fallback = block.kind === 'verse' ? verseFallback(block) : videoFallback(block);
	const envelope = toEnvelope(block, fallback);
	return `<!-- openbible:block ${escapeCommentJson(envelope)} -->\n${fallback}\n${CLOSE_MARKER}`;
}

export function serializeVerseEnvelope(parsed: ParsedVerseFence, id?: string): string {
	return serializeBlockEnvelope({
		id,
		kind: 'verse',
		versionId: parsed.attrs.versionId,
		version: parsed.attrs.version,
		bookId: parsed.attrs.bookId,
		book: parsed.attrs.book,
		chapter: parsed.attrs.chapter,
		verseStart: parsed.attrs.verseStart,
		verseEnd: parsed.attrs.verseEnd,
		snapshotBody: parsed.body
	});
}

function jsonDepth(value: unknown, depth = 0): number {
	if (value === null || typeof value !== 'object') return depth;
	const children = Array.isArray(value) ? value : Object.values(value);
	return children.reduce((maximum, child) => Math.max(maximum, jsonDepth(child, depth + 1)), depth);
}

function diagnostic(
	code: PortableDiagnostic['code'],
	message: string,
	severity: PortableDiagnostic['severity'] = 'warning'
): PortableDiagnostic {
	return { code, message, severity };
}

function invalidResult(
	fallback: string,
	code: PortableDiagnostic['code'],
	message: string
): ParsedBlockEnvelope {
	return {
		state: 'degraded',
		fallback,
		diagnostics: [diagnostic(code, message)]
	};
}

export function parseBlockEnvelope(source: string): ParsedBlockEnvelope {
	const normalized = source.replace(/\r\n?/g, '\n');
	const marker = normalized.match(OPEN_MARKER);
	if (!marker) {
		return invalidResult(
			normalized,
			'missing-envelope',
			'Envelope ausente; fallback visível mantido.'
		);
	}
	if (marker[0].length > MAX_COMMENT_BYTES) {
		return invalidResult(normalized, 'limit-exceeded', 'Envelope excede o limite de 16 KiB.');
	}

	const closeIndex = normalized.indexOf(CLOSE_MARKER, marker[0].length);
	if (closeIndex < 0) {
		return invalidResult(normalized, 'invalid-envelope', 'Marcador final do envelope ausente.');
	}
	const commentBytes = new TextEncoder().encode(normalized.slice(0, marker[0].length)).length;
	if (commentBytes > MAX_COMMENT_BYTES) {
		return invalidResult(normalized, 'limit-exceeded', 'Envelope excede o limite de 16 KiB.');
	}

	let value: unknown;
	try {
		value = JSON.parse(marker[1]);
	} catch {
		return invalidResult(
			normalized,
			'invalid-json',
			'JSON do envelope inválido; fallback preservado.'
		);
	}
	if (jsonDepth(value) > MAX_JSON_DEPTH || !value || typeof value !== 'object') {
		return invalidResult(
			normalized,
			'limit-exceeded',
			'JSON do envelope excede a profundidade permitida.'
		);
	}

	const envelope = value as Partial<PortableBlockEnvelope>;
	if (
		envelope.schemaVersion !== 1 ||
		typeof envelope.id !== 'string' ||
		!envelope.id ||
		(envelope.kind !== 'verse' && envelope.kind !== 'video')
	) {
		return invalidResult(
			normalized,
			'invalid-envelope',
			'Campos obrigatórios do envelope inválidos.'
		);
	}

	const fallback = normalizeVisible(normalized.slice(marker[0].length, closeIndex));
	if (envelope.kind === 'verse') {
		const expectedHash = `sha256:${sha256(fallback)}`;
		if (typeof envelope.snapshotHash !== 'string' || envelope.snapshotHash !== expectedHash) {
			return {
				state: 'conflict',
				envelope: envelope as PortableBlockEnvelope,
				fallback,
				diagnostics: [
					diagnostic('hash-mismatch', 'Snapshot do verso diverge do fallback exportado.')
				]
			};
		}
	}

	return {
		state: 'canonical',
		envelope: envelope as PortableBlockEnvelope,
		fallback,
		diagnostics: []
	};
}

function appendState(
	source: string,
	state: Exclude<PortableBlockState, 'canonical'>,
	id?: string
): string {
	const metadata = id ? ` {"state":"${state}","blockId":"${id}"}` : ` ${state}`;
	return `${source.trimEnd()}\n<!-- openbible:state${metadata} -->`;
}

export function roundtripPortableMarkdown(markdown: string): string {
	const normalized = markdown.replace(/\r\n?/g, '\n');
	const trimmed = normalized.trim();
	if (!trimmed) return normalized;

	if (trimmed.startsWith('<!-- openbible:block')) {
		const parsed = parseBlockEnvelope(normalized);
		if (parsed.state === 'canonical') return normalized;
		return appendState(normalized, parsed.state, parsed.envelope?.id);
	}

	const legacyMatch = normalized.match(LEGACY_VERSE);
	if (legacyMatch && normalized.startsWith(legacyMatch[0])) {
		try {
			const parsed = parseVerseFence(legacyMatch[0]);
			const completeReference = [
				parsed.attrs.versionId,
				parsed.attrs.book,
				parsed.attrs.chapter,
				parsed.attrs.verseStart,
				parsed.attrs.verseEnd
			].every((value) => value.trim().length > 0);
			if (!completeReference) return normalized;
			const canonical = serializeVerseEnvelope(parsed);
			const remainder = normalized.slice(legacyMatch[0].length).trim();
			return remainder
				? `${canonical}\n\n${remainder}\n<!-- openbible:state conflict -->`
				: canonical;
		} catch {
			return normalized;
		}
	}

	if (trimmed.split('\n').every((line) => !line.trim() || line.trimStart().startsWith('>'))) {
		return appendState(normalized, 'degraded');
	}

	return normalized;
}

export { sha256 as hashPortableText };
