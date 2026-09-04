export const THEME_STORAGE_KEY = 'openbible.theme';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type ThemeRoot = { classList: { toggle: (token: string, force?: boolean) => void } };

let followedTheme: Theme = 'light';
let systemQuery: MediaQueryList | null = null;

export function prefersDark(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	try {
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	} catch {
		return false;
	}
}

export function resolveTheme(theme: Theme): ResolvedTheme {
	if (theme === 'dark') return 'dark';
	if (theme === 'light') return 'light';
	return prefersDark() ? 'dark' : 'light';
}

function watchSystemTheme(): void {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
	if (systemQuery) return;
	try {
		systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const rerender = () => {
			if (followedTheme === 'system') applyTheme('system');
		};
		if (typeof systemQuery.addEventListener === 'function') {
			systemQuery.addEventListener('change', rerender);
		} else if (typeof systemQuery.addListener === 'function') {
			systemQuery.addListener(rerender);
		}
	} catch {
		systemQuery = null;
	}
}

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
		if (value === 'dark' || value === 'light' || value === 'system') return value;
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
	followedTheme = theme;
	const resolved = resolveTheme(theme);
	root.classList.toggle('dark', resolved === 'dark');
	if (typeof document !== 'undefined') {
		document.documentElement.style.colorScheme = resolved;
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', resolved === 'dark' ? '#282828' : '#ffffff');
	}
	watchSystemTheme();
}
