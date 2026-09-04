import type { Note } from './note-types';
import type { WorkspaceStorage } from '$lib/storage/types';
import { listNotes, trashNote, saveNote } from './notes-repository';
import { syncTitleWithH1 } from './note-markdown';
import { deleteNoteVerseRefs } from './note-verse-index';

export function getNoteSnippet(content?: string, title?: string, description?: string): string {
	if (description && description.trim()) {
		return description.trim();
	}
	if (!content) return 'Nota vazia';

	// If YAML frontmatter contains a description property, prefer it
	const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\s*/);
	if (frontmatterMatch) {
		const descMatch = frontmatterMatch[1].match(/^\s*description\s*:\s*(.*?)\s*$/m);
		if (descMatch) {
			const parsedDesc = descMatch[1].trim().replace(/^["']|["']$/g, '').trim();
			if (parsedDesc) return parsedDesc;
		}
	}

	// 1. Remove YAML frontmatter if present at the start
	let cleaned = content.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, '').trim();

	// 2. Remove leading heading or title line if it duplicates the note title
	if (title && title.trim()) {
		const escapedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		cleaned = cleaned.replace(new RegExp(`^(?:#+\\s+)?${escapedTitle}(?:\\r?\\n|\\s+|$)`, 'i'), '');
	}

	// 3. Extract readable verse text from directive fences (:::verse{...}\nBody\n:::)
	cleaned = cleaned.replace(/:::verse\{[^}]*\}\s*\r?\n([\s\S]*?)(?:\r?\n:::|\s*:::|$)/g, '$1\n');
	// Remove any remaining directive tags or closing fences
	cleaned = cleaned.replace(/:::[\w-]+(?:\{[^}]*\})?/g, ' ');
	cleaned = cleaned.replace(/:::/g, ' ');

	// 4. Strip HTML comments and HTML tags (<br />, <br>, <p>, <div>, etc.)
	cleaned = cleaned
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/<\/?[a-zA-Z][^>]*>/g, ' ');

	// 5. Decode common HTML entities
	cleaned = cleaned
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&apos;/gi, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

	// 6. Strip task list checkboxes ([ ], [x], [X])
	cleaned = cleaned.replace(/\[[ xX]\]\s*/g, '');

	// 7. Strip markdown code fences (```ts ... ```) keeping content, or inline backticks
	cleaned = cleaned
		.replace(/```[\w-]*\s*([\s\S]*?)```/g, '$1')
		.replace(/`([^`]+)`/g, '$1');

	// 8. Strip markdown images and convert links to link text only
	cleaned = cleaned
		.replace(/!\[.*?\]\(.*?\)/g, '')
		.replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
		.replace(/\[([^\]]+)\]\[.*?\]/g, '$1')
		.replace(/\[\^[^\]]+\]/g, '');

	// 9. Strip markdown block formatting (headings, blockquotes, list markers, horizontal rules)
	cleaned = cleaned
		.replace(/^#+\s+/gm, '')
		.replace(/^>\s+/gm, '')
		.replace(/^[*\-+]\s+/gm, '')
		.replace(/^\d+\.\s+/gm, '')
		.replace(/^[-*_]{3,}\s*$/gm, '');

	// 10. Strip markdown formatting symbols (bold, italic, strikethrough, backticks)
	cleaned = cleaned
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/__([^_]+)__/g, '$1')
		.replace(/_([^_]+)_/g, '$1')
		.replace(/~~([^~]+)~~/g, '$1')
		.replace(/[`*~_]/g, '');

	// 11. Collapse whitespace and trim
	const stripped = cleaned.replace(/\s+/g, ' ').trim();
	return stripped || 'Nota vazia';
}

export function formatNoteDate(iso?: string): string {
	if (!iso) return '—';
	try {
		const date = new Date(iso);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
		if (diffDays === 0) {
			return new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(date);
		}
		if (diffDays < 7) {
			return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date);
		}
		return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
	} catch {
		return iso;
	}
}

class NotesState {
	notes = $state<Note[]>([]);
	loading = $state(false);
	error = $state('');
	searchQuery = $state('');
	activeNoteId = $state<string | null>(null);

	filteredNotes = $derived.by(() => {
		const q = this.searchQuery.trim().toLowerCase();
		const list = !q
			? this.notes
			: this.notes.filter((note) => {
					const titleMatch = (note.title || '').toLowerCase().includes(q);
					const descMatch = (note.description || '').toLowerCase().includes(q);
					const contentMatch = (note.content || note.body || '').toLowerCase().includes(q);
					return titleMatch || descMatch || contentMatch;
			  });
		return [...list].sort((a, b) => {
			const pinA = a.pinned ? 1 : 0;
			const pinB = b.pinned ? 1 : 0;
			if (pinB !== pinA) return pinB - pinA;
			return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
		});
	});

	async loadNotes(storage: WorkspaceStorage) {
		this.loading = true;
		this.error = '';
		try {
			this.notes = await listNotes(storage);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Não foi possível carregar as notas.';
		} finally {
			this.loading = false;
		}
	}

	addNote(note: Note) {
		const existingIndex = this.notes.findIndex((n) => n.id === note.id);
		if (existingIndex >= 0) {
			this.notes[existingIndex] = note;
		} else {
			this.notes = [note, ...this.notes];
		}
	}

	updateNote(note: Note) {
		const index = this.notes.findIndex((n) => n.id === note.id);
		if (index >= 0) {
			this.notes[index] = { ...this.notes[index], ...note };
		} else {
			this.notes = [note, ...this.notes];
		}
	}

	async togglePinNote(storage: WorkspaceStorage, noteId: string): Promise<boolean> {
		const note = this.notes.find((n) => n.id === noteId);
		if (!note) return false;
		const nextPinned = !note.pinned;
		const updatedNote: Note = {
			...note,
			pinned: nextPinned || undefined,
			meta: {
				...note.meta,
				pinned: nextPinned || undefined
			}
		};
		try {
			const saved = await saveNote(storage, updatedNote);
			this.updateNote(saved);
			return true;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Não foi possível alterar a fixação da nota.';
			return false;
		}
	}

	async renameNote(storage: WorkspaceStorage, noteId: string, newTitle: string): Promise<boolean> {
		const note = this.notes.find((n) => n.id === noteId);
		if (!note) return false;
		const trimmedTitle = newTitle.trim();
		if (!trimmedTitle) return false;
		const noteFile = syncTitleWithH1(
			{
				meta: {
					...note.meta,
					title: trimmedTitle
				},
				body: note.body || note.content || ''
			},
			trimmedTitle
		);
		try {
			const saved = await saveNote(storage, {
				...note,
				title: trimmedTitle,
				body: noteFile.body,
				content: noteFile.body,
				meta: noteFile.meta
			});
			this.updateNote(saved);
			return true;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Não foi possível renomear a nota.';
			return false;
		}
	}

	async deleteNote(storage: WorkspaceStorage, noteId: string): Promise<boolean> {
		try {
			const target = this.notes.find((n) => n.id === noteId);
			await trashNote(storage, noteId);
			if (target?.path) {
				await deleteNoteVerseRefs(target.path);
			}
			this.notes = this.notes.filter((n) => n.id !== noteId);
			return true;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Não foi possível apagar a nota.';
			return false;
		}
	}
}

export const notesState = new NotesState();
