import { describe, expect, it } from 'vitest';
import { applyTheme, readTheme, saveTheme } from './theme';

function createStorage(initial: string | null = null): Storage {
	let value = initial;
	return {
		getItem: () => value,
		setItem: (_key, next) => {
			value = next;
		},
		removeItem: () => {
			value = null;
		},
		clear: () => {
			value = null;
		},
		key: () => null,
		length: 0
	};
}

describe('theme preference', () => {
	// SPECSFY: US-003 FR-005 NFR-002 AC-005 AC-009
	it('saves and reads the dark theme', () => {
		const storage = createStorage();

		expect(saveTheme('dark', storage)).toBe(true);
		expect(readTheme(storage)).toBe('dark');
	});

	// SPECSFY: US-003 FR-005 NFR-002 AC-010
	it('falls back to light for an unknown value', () => {
		const storage = createStorage('sepia');

		expect(readTheme(storage)).toBe('light');
		expect(storage.getItem('openbible.theme')).toBeNull();
	});

	// SPECSFY: US-003 FR-005 NFR-002 AC-005 AC-009
	it('applies and removes the dark class on the document root', () => {
		const classes = new Set<string>();
		const root = {
			classList: {
				toggle(name: string, force?: boolean) {
					if (force) classes.add(name);
					else classes.delete(name);
				}
			}
		};

		applyTheme('dark', root);
		expect(classes.has('dark')).toBe(true);
		applyTheme('light', root);
		expect(classes.has('dark')).toBe(false);
	});
});
