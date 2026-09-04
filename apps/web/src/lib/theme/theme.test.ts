import { describe, expect, it, vi } from 'vitest';
import { applyTheme, readTheme, resolveTheme, saveTheme } from './theme';

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

	it('saves and reads the system theme', () => {
		const storage = createStorage();

		expect(saveTheme('system', storage)).toBe(true);
		expect(readTheme(storage)).toBe('system');
	});

	it('resolves the system theme from the OS preference', () => {
		const matchMedia = vi.fn(() => ({
			matches: true,
			addEventListener: vi.fn(),
			addListener: vi.fn()
		}));
		vi.stubGlobal('window', { matchMedia });

		expect(resolveTheme('system')).toBe('dark');
		expect(resolveTheme('light')).toBe('light');
		expect(resolveTheme('dark')).toBe('dark');

		vi.unstubAllGlobals();
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
