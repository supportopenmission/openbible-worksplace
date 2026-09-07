import type { NoteFile, NoteMeta } from './note-types';

const FRONTMATTER = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;
const H1 = /^(?:\s*)#\s+(.+?)\s*$/m;
const KNOWN_FIELDS = new Set([
	'id',
	'type',
	'schemaVersion',
	'title',
	'description',
	'pinned',
	'createdAt',
	'updatedAt'
]);

type Scalar = string | number | boolean | null;

export type PortableNoteFile = NoteFile & {
	meta: NoteMeta & {
		schemaVersion: number;
		unknownFields: Record<string, Scalar>;
	};
};

export function normalizeNoteTitle(value: string): string {
	return value
		.trim()
		.replace(/^(?:#+\s*)+/, '')
		.trim();
}

function quote(value: string): string {
	return JSON.stringify(value);
}

function parseScalar(rawValue: string, key: string): Scalar {
	const value = rawValue.trim();
	if (!value) return '';

	if (value.startsWith('[') || value.startsWith('{') || value === '|' || value === '>') {
		throw new Error(`Frontmatter deve conter apenas valores escalares: ${key}`);
	}

	if (value.startsWith('"')) {
		try {
			const parsed: unknown = JSON.parse(value);
			if (typeof parsed !== 'string') throw new Error('not a string');
			return parsed;
		} catch {
			throw new Error(`Valor escalar inválido no frontmatter: ${key}`);
		}
	}

	if (value.startsWith("'") && value.endsWith("'")) {
		return value.slice(1, -1).replace(/''/g, "'");
	}

	if (value === 'null' || value === '~') return null;
	if (value === 'true') return true;
	if (value === 'false') return false;
	if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return Number(value);

	if (/^[|>{}\[]/.test(value)) {
		throw new Error(`Frontmatter deve conter apenas valores escalares: ${key}`);
	}

	return value;
}

function parseFrontmatter(source: string): Record<string, Scalar> {
	const normalized = source.replace(/\r\n?/g, '\n');
	const match = normalized.match(FRONTMATTER);
	if (!match) throw new Error('Nota inválida: frontmatter ausente');

	const values: Record<string, Scalar> = {};
	for (const line of match[1].split('\n')) {
		if (!line.trim() || line.trimStart().startsWith('#')) continue;
		const property = line.match(/^\s*([A-Za-z][\w-]*)\s*:\s*(.*?)\s*$/);
		if (!property) {
			throw new Error('Frontmatter deve conter apenas valores escalares');
		}
		const [, key, rawValue] = property;
		if (key in values) throw new Error(`Campo duplicado no frontmatter: ${key}`);
		values[key] = parseScalar(rawValue, key);
	}
	return values;
}

function asString(value: Scalar | undefined, fallback = ''): string {
	return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function asBoolean(value: Scalar | undefined): boolean | undefined {
	if (value === true || value === 1 || value === '1' || value === 'true') return true;
	if (value === false || value === 0 || value === '0' || value === 'false' || value == null)
		return undefined;
	throw new Error('Campo pinned deve ser booleano');
}

function asSchemaVersion(value: Scalar | undefined): number {
	const version = typeof value === 'number' ? value : value == null ? 1 : Number(value);
	if (!Number.isInteger(version) || version < 1) {
		throw new Error('schemaVersion deve ser um inteiro positivo');
	}
	return version;
}

function pathId(path?: string): string {
	const basename = path?.split('/').pop()?.replace(/\.md$/i, '').trim();
	return basename || 'untitled';
}

function metaFrom(values: Record<string, Scalar>, path?: string): PortableNoteFile['meta'] {
	const id = asString(values.id, pathId(path));
	const schemaVersion = asSchemaVersion(values.schemaVersion);
	const unknownFields = Object.fromEntries(
		Object.entries(values).filter(([key]) => !KNOWN_FIELDS.has(key))
	) as Record<string, Scalar>;

	return {
		id,
		title: asString(values.title),
		description: values.description == null ? undefined : asString(values.description),
		pinned: asBoolean(values.pinned),
		schemaVersion,
		unknownFields,
		createdAt: asString(values.createdAt),
		updatedAt: asString(values.updatedAt),
		type: 'note',
		path: path || `notes/${id}.md`
	};
}

export function parseNoteFile(source: string, path?: string): PortableNoteFile {
	const normalized = source.replace(/\r\n?/g, '\n');
	const match = normalized.match(FRONTMATTER);
	if (!match) throw new Error('Nota inválida: frontmatter ausente');

	const meta = metaFrom(parseFrontmatter(normalized), path);
	let body = normalized.slice(match[0].length).replace(/^\n/, '');
	if (meta.title) {
		body = H1.test(body) ? body.replace(H1, `# ${meta.title}`) : `# ${meta.title}\n\n${body}`;
	}
	return { meta, body };
}

function serializeScalar(value: Scalar): string {
	if (value === null) return 'null';
	if (typeof value === 'string') return quote(value);
	return String(value);
}

export function serializeNoteFile(note: NoteFile): string {
	const { meta } = note;
	const schemaVersion = meta.schemaVersion ?? 1;
	const unknownFields = meta.unknownFields ?? {};
	const body = note.body.replace(/^\n+/, '');
	const known = new Set(KNOWN_FIELDS);
	const lines = [
		'---',
		`id: ${quote(meta.id)}`,
		'type: "note"',
		`schemaVersion: ${schemaVersion}`,
		...Object.entries(unknownFields)
			.filter(([key]) => !known.has(key))
			.map(([key, value]) => `${key}: ${serializeScalar(value)}`),
		`title: ${quote(meta.title)}`,
		...(meta.description ? [`description: ${quote(meta.description)}`] : []),
		...(meta.pinned ? ['pinned: true'] : []),
		`createdAt: ${quote(meta.createdAt)}`,
		`updatedAt: ${quote(meta.updatedAt)}`,
		'---',
		'',
		body,
		''
	];
	return lines.join('\n');
}

export const parsePortableNote = parseNoteFile;
export const serializePortableNote = serializeNoteFile;

export function syncTitleWithH1(note: NoteFile, title: string): NoteFile {
	const normalizedTitle = normalizeNoteTitle(title);
	const body = H1.test(note.body)
		? note.body.replace(H1, `# ${normalizedTitle}`)
		: note.body.match(/^\s*#{2,6}\s+.+$/m)
			? note.body.replace(/^\s*#{2,6}\s+.+$/m, `# ${normalizedTitle}`)
			: `# ${normalizedTitle}\n\n${note.body}`;
	return { ...note, meta: { ...note.meta, title: normalizedTitle }, body };
}

export function extractContentFromNoteBody(body: string, _title?: string): string {
	if (!body) return '';
	let content = body.replace(FRONTMATTER, '');
	content = content.replace(/^\s*#\s+[^\r\n]*(?:\r?\n)*/, '');
	return content.replace(/^\n+/, '');
}

export function extractTitleFromMarkdown(source: string): string | null {
	if (!source) return null;
	const match = source.match(H1);
	return match ? normalizeNoteTitle(match[1]) : null;
}
