import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

const SPLIT = new URL('./BibleNoteSplit.svelte', import.meta.url);
const READER = new URL('./BibleReader.svelte', import.meta.url);

describe('BibleNoteSplit', () => {
	it('exposes note actions and keeps reader controls in the Bible tab', async () => {
		const source = await readFile(SPLIT, 'utf8');
		expect(source).toContain('onDelete');
		expect(source).toContain('Apagar nota');
		expect(source).toContain('Barra de formatação');
		expect(source).toContain('toolbar?.()');
		expect(source).toContain('note-split-tab-list');
		expect(source).toContain('onTabChange');
		expect(source).toContain('<X');
		expect(source).toContain('aria-label="Fechar nota"');
	});

	it('keeps reader controls in the Bible tab with a single persistent toolbar', async () => {
		const source = await readFile(READER, 'utf8');
		expect(source).toContain('toolbar={readerToolbar}');
		expect(source).not.toContain('reader-fab');
		expect(source).not.toContain('fabOpen');
		expect(source).not.toContain('toolbar-hidden');
		expect(source).not.toContain('toolbarVisible');
		expect(source).toContain('reader-toolbar-group');
		expect(source).toContain('reader-toolbar-actions');
	});
});
