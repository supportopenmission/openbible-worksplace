export const THEME_STORAGE_KEY = 'openbible.theme';

export type Theme = 'light' | 'dark';

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type ThemeRoot = { classList: { toggle: (token: string, force?: boolean) => void } };

function browserStorage(): ThemeStorage | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export function readTheme(storage: ThemeStorage | null = browserStorage()): Theme {
	if (!storage) return 'light';
	try {
		const value = storage.getItem(THEME_STORAGE_KEY);
		if (value === 'dark' || value === 'light') return value;
		if (value !== null) storage.removeItem(THEME_STORAGE_KEY);
	} catch {
		return 'light';
	}
	return 'light';
}

export function saveTheme(theme: Theme, storage: ThemeStorage | null = browserStorage()): boolean {
	if (!storage) return false;
	try {
		storage.setItem(THEME_STORAGE_KEY, theme);
		return true;
	} catch {
		return false;
	}
}

export function applyTheme(theme: Theme, root: ThemeRoot = document.documentElement): void {
	root.classList.toggle('dark', theme === 'dark');
	if (typeof document !== 'undefined') {
		document.documentElement.style.colorScheme = theme;
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', theme === 'dark' ? '#252525' : '#ffffff');
	}
}
