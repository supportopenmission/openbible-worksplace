/**
 * Note index helpers (SPEC-0015): derive H1–H3 navigation from Markdown or
 * from the live editor DOM, with stable anchors for scroll-to-section.
 */
export interface NoteHeading {
	level: 1 | 2 | 3;
	title: string;
	anchor: string;
}

function slugifyTitle(title: string): string {
	return title
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function headingAnchorId(level: number, title: string, occurrence = 0): string {
	const slug = slugifyTitle(title) || 'secao';
	const base = `h${level}-${slug}`;
	return occurrence > 0 ? `${base}-${occurrence}` : base;
}

/** Extract H1–H3 headings in document order, tracking duplicate titles. */
export function extractNoteHeadings(markdown: string): NoteHeading[] {
	const headings: NoteHeading[] = [];
	const seen = new Map<string, number>();
	for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
		const match = line.match(/^(#{1,3})\s+(.+?)\s*(?:#+\s*)?$/);
		if (!match) continue;
		const level = match[1].length as 1 | 2 | 3;
		const title = match[2].trim();
		if (!title) continue;
		const key = `${level}:${title}`;
		const occurrence = seen.get(key) ?? 0;
		seen.set(key, occurrence + 1);
		headings.push({ level, title, anchor: headingAnchorId(level, title, occurrence) });
	}
	return headings;
}

/**
 * Enumerate rendered headings inside the editor, tagging each node with a
 * stable `data-note-anchor` used by scroll navigation.
 */
export function collectEditorHeadings(host: HTMLElement): NoteHeading[] {
	const headings: NoteHeading[] = [];
	const seen = new Map<string, number>();
	const nodes = host.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3');
	for (const node of nodes) {
		const element = node as HTMLElement;
		const level = Number(element.tagName.slice(1)) as 1 | 2 | 3;
		if (level < 1 || level > 3) continue;
		const title = (element.textContent ?? '').trim();
		if (!title) continue;
		const key = `${level}:${title}`;
		const occurrence = seen.get(key) ?? 0;
		seen.set(key, occurrence + 1);
		const anchor = headingAnchorId(level, title, occurrence);
		element.setAttribute('data-note-anchor', anchor);
		headings.push({ level, title, anchor });
	}
	return headings;
}

/** Scroll the anchored heading into view; no-op when absent. */
export function scrollToHeadingAnchor(root: ParentNode, anchor: string): boolean {
	const element = root.querySelector(`[data-note-anchor="${CSS.escape(anchor)}"]`);
	if (!(element instanceof HTMLElement)) return false;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	element.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
	return true;
}
