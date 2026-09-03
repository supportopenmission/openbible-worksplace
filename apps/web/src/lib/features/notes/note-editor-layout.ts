const NOTE_EDITOR_WIDTH_KEY = 'openbible:note-editor-width';

export type NoteEditorWidth = 'default' | 'wide' | 'full';

export const NOTE_EDITOR_WIDTHS: Record<
	NoteEditorWidth,
	{ label: string; description: string; maxWidth: string }
> = {
	default: { label: 'Padrão', description: '760px', maxWidth: '760px' },
	wide: { label: 'Ampla', description: '960px', maxWidth: '960px' },
	full: { label: 'Máxima', description: '1200px', maxWidth: 'min(100%, 1200px)' }
};

export function readNoteEditorWidth(): NoteEditorWidth {
	if (typeof window === 'undefined') return 'default';
	try {
		const stored = window.localStorage.getItem(NOTE_EDITOR_WIDTH_KEY);
		if (stored === 'wide' || stored === 'full') return stored;
	} catch {
		// Private browsing may deny localStorage.
	}
	return 'default';
}

export function saveNoteEditorWidth(width: NoteEditorWidth): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(NOTE_EDITOR_WIDTH_KEY, width);
	} catch {
		// Private browsing may deny localStorage.
	}
}
