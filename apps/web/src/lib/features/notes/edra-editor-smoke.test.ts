// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { createPureEditorExtensions } from './edra-pure-extensions';

const editors: Editor[] = [];
afterEach(() => {
	while (editors.length) editors.pop()?.destroy();
});

function edit(markdown: string): { markdown: string; html: string } {
	const editor = new Editor({
		extensions: createPureEditorExtensions(),
		content: markdown,
		contentType: 'markdown'
	});
	editors.push(editor);
	return { markdown: editor.getMarkdown(), html: editor.getHTML() };
}

// SPECSFY: migração gradual do editor (Edra) — schema e serialização no Editor real.
describe('edra pure editor smoke', () => {
	it('builds the schema without warnings on representative content', () => {
		const { markdown, html } = edit(
			[
				'## Estudo',
				'',
				'Texto com **negrito** e =={yellow}destaque== e ++sublinhado++.',
				'',
				':::verse{versionId="ara.sqlite" version="ARA" bookId="1" book="Gênesis" chapter="1" verseStart="1" verseEnd="1"}',
				'No princípio Deus criou os céus e a terra.',
				':::',
				'',
				'- [ ] revisar'
			].join('\n')
		);
		expect(markdown).toContain('=={yellow}destaque==');
		expect(markdown).toContain(':::verse{versionId="ara.sqlite"');
		expect(markdown).toContain('- [ ] revisar');
		expect(html).toContain('data-type="verse-fence"');
	});

	it('roundtrips an empty document without throwing', () => {
		const { markdown } = edit('');
		expect(markdown.trim()).toBe('');
	});

	it('toggles marks through commands', () => {
		const editor = new Editor({
			extensions: createPureEditorExtensions(),
			content: 'texto',
			contentType: 'markdown'
		});
		editors.push(editor);
		editor.commands.setTextSelection({ from: 1, to: 6 });
		editor.commands.toggleBold();
		expect(editor.getMarkdown()).toBe('**texto**');
	});
});
