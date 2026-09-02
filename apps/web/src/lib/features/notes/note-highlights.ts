export const NOTE_HIGHLIGHTS = [
	{ color: 'yellow', label: 'Amarelo' },
	{ color: 'green', label: 'Verde' },
	{ color: 'blue', label: 'Azul' },
	{ color: 'pink', label: 'Rosa' }
] as const;

export type NoteHighlightColor = (typeof NOTE_HIGHLIGHTS)[number]['color'];

const COLORS = new Set<string>(NOTE_HIGHLIGHTS.map((option) => option.color));

export function isNoteHighlightColor(value: string | null | undefined): value is NoteHighlightColor {
	return Boolean(value && COLORS.has(value));
}
