import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readNoteToolbarEnabled, saveNoteToolbarEnabled } from './note-editor-layout';

describe('note toolbar preference migration', () => {
	const storage = new Map<string, string>();

	beforeEach(() => {
		storage.clear();
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (key: string) => storage.get(key) ?? null,
				setItem: (key: string, val: string) => storage.set(key, val),
				removeItem: (key: string) => storage.delete(key),
				clear: () => storage.clear()
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shows the new static toolbar once even when the legacy flag is off', () => {
		storage.set('openbible:note-toolbar-enabled', 'false');

		expect(readNoteToolbarEnabled()).toBe(true);
		expect(storage.get('openbible:note-toolbar-enabled')).toBe('true');
		expect(storage.get('openbible:note-toolbar-migrated')).toBe('1');
	});

	it('keeps respecting the toggle after the one-time migration', () => {
		expect(readNoteToolbarEnabled()).toBe(true);

		saveNoteToolbarEnabled(false);
		expect(readNoteToolbarEnabled()).toBe(false);

		saveNoteToolbarEnabled(true);
		expect(readNoteToolbarEnabled()).toBe(true);
	});
});
