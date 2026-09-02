import { describe, expect, it } from 'vitest';
import { filterSlashCommands, isDirectVerseSlash, openVerseSelectorFromSlash } from './slash-commands';

// SPECSFY: US-002 US-003 FR-003 FR-005 NFR-001 AC-004
describe('slash-verse-command', () => {
	it('opens the verse selector when choosing /versiculo', () => {
		const result = openVerseSelectorFromSlash('/versiculo');
		expect(result.open).toBe(true);
		expect(result.command).toBe('verse');
	});

	it('keeps a bare slash for the block menu instead of the verse selector', () => {
		expect(openVerseSelectorFromSlash('/').open).toBe(false);
		expect(isDirectVerseSlash('/')).toBe(false);
	});

	it('filters title and list blocks from the slash query', () => {
		expect(filterSlashCommands('/tit').some((command) => command.id === 'heading1')).toBe(true);
		expect(filterSlashCommands('/lista').some((command) => command.id === 'bullet')).toBe(true);
	});
});
