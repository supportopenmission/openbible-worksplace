import type { NoteFile, NoteMeta } from './note-types';

const FRONTMATTER = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/;
const H1 = /^(?:\s*)#\s+(.+?)\s*$/m;

export function normalizeNoteTitle(value: string): string {
	return value.trim().replace(/^(?:#+\s*)+/, '').trim();
}

function yamlValue(value: string): string {
	return value.trim().replace(/^["']|["']$/g, '');
}

function quote(value: string): string {
	return JSON.stringify(value);
}

function parseFrontmatter(source: string): Record<string, string> {
	const match = source.match(FRONTMATTER);
	if (!match) throw new Error('Nota inválida: frontmatter ausente');
	return Object.fromEntries(
		match[1]
			.split(/\r?\n/)
			.map((line) => line.match(/^\s*([A-Za-z][\w]*)\s*:\s*(.*?)\s*$/))
			.filter((line): line is RegExpMatchArray => Boolean(line))
			.map((line) => [line[1], yamlValue(line[2])])
	);
}

function metaFrom(source: string, values: Record<string, string>): NoteMeta {
	const path = values.path ?? '';
	const id = values.id ?? path.replace(/^notes\//, '').replace(/\.md$/, '');
	return {
		id,
		title: values.title ?? '',
		createdAt: values.createdAt ?? '',
		updatedAt: values.updatedAt ?? '',
		type: 'note',
		path: path || `notes/${id}.md`
	};
}

export function parseNoteFile(source: string, path?: string): NoteFile {
	const match = source.match(FRONTMATTER);
	if (!match) throw new Error('Nota inválida: frontmatter ausente');
	const values = parseFrontmatter(source);
	const meta = metaFrom(source, { ...values, ...(path ? { path } : {}) });
	let body = source.slice(match[0].length).replace(/^\n/, '');
	if (meta.title) {
		body = H1.test(body) ? body.replace(H1, `# ${meta.title}`) : `# ${meta.title}\n\n${body}`;
	}
	return { meta, body };
}

export function serializeNoteFile(note: NoteFile): string {
	const { meta } = note;
	const body = note.body.replace(/^\n+/, '');
	return [
		'---',
		`title: ${quote(meta.title)}`,
		`createdAt: ${quote(meta.createdAt)}`,
		`updatedAt: ${quote(meta.updatedAt)}`,
		'type: "note"',
		'---',
		'',
		body,
		''
	].join('\n');
}

export function syncTitleWithH1(note: NoteFile, title: string): NoteFile {
	const normalizedTitle = normalizeNoteTitle(title);
	const body = H1.test(note.body)
		? note.body.replace(H1, `# ${normalizedTitle}`)
		: note.body.match(/^\s*#{2,6}\s+.+$/m)
			? note.body.replace(/^\s*#{2,6}\s+.+$/m, `# ${normalizedTitle}`)
			: `# ${normalizedTitle}\n\n${note.body}`;
	return { ...note, meta: { ...note.meta, title: normalizedTitle }, body };
}
