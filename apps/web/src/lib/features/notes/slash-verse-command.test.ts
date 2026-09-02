import { describe, expect, it } from 'vitest';
import { openVerseSelectorFromSlash } from './slash-verse-command';

// SPECSFY: US-002 US-003 FR-003 FR-005 NFR-001 AC-004
describe('slash-verse-command', () => {
	it('opens the verse selector when choosing /versiculo', () => {
		const result = openVerseSelectorFromSlash('/versiculo');
		expect(result.open).toBe(true);
		expect(result.command).toBe('verse');
	});
});
