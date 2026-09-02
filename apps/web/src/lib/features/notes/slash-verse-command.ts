const VERSE_COMMANDS = new Set(['/', '/versiculo', '/verse', 'versiculo', 'verse']);

export interface SlashVerseResult {
	open: boolean;
	command: string | null;
}

export function openVerseSelectorFromSlash(input: string): SlashVerseResult {
	const normalized = input.trim().toLowerCase();
	if (!VERSE_COMMANDS.has(normalized)) {
		return { open: false, command: null };
	}
	return { open: true, command: 'verse' };
}

export function isSlashVerseTrigger(text: string): boolean {
	const trimmed = text.trim();
	if (!trimmed.startsWith('/')) return false;
	const token = trimmed.split(/\s/)[0]?.toLowerCase() ?? '';
	return VERSE_COMMANDS.has(token);
}
