import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// SPECSFY: migração gradual do editor (Edra) — chave de motor sem migração de dados.
describe('note editor engine switch', () => {
	it('selects the editor from the workspace engine preference', () => {
		const source = readFileSync(new URL('./NoteEditorSwitch.svelte', import.meta.url), 'utf8');
		expect(source).toContain('resolveEditorEngine(workspace?.preferences)');
		expect(source).toContain('{#key engine}');
		expect(source).toContain('<EdraNoteEditor');
		expect(source).toContain('<MilkdownNoteEditor');
	});

	it('keeps the same persistence contract on both engines', () => {
		const source = readFileSync(new URL('./NoteEditorSwitch.svelte', import.meta.url), 'utf8');
		expect(source).toContain('{note}');
		expect(source).toContain('{storage}');
		expect(source).toContain('{onSaved}');
		expect(source).toContain('{onStatusChange}');
		expect(source).toContain('não migra nem converte dados');
	});

	it('renders the switch on the note page instead of a fixed engine', () => {
		const source = readFileSync(
			new URL('../../../routes/notes/[id]/+page.svelte', import.meta.url),
			'utf8'
		);
		expect(source).toContain('NoteEditorSwitch');
		expect(source).not.toContain('<MilkdownNoteEditor');
	});

	it('renders the switch in the bible reader note split', () => {
		const source = readFileSync(
			new URL('../bible/BibleNoteSplit.svelte', import.meta.url),
			'utf8'
		);
		expect(source).toContain('NoteEditorSwitch');
		expect(source).not.toContain('<MilkdownNoteEditor');
	});
});

describe('edra full note editor', () => {
	it('follows the official example shape with markdown persistence', () => {
		const source = readFileSync(new URL('./EdraNoteEditor.svelte', import.meta.url), 'utf8');
		expect(source).toContain('createOpenBibleEditor');
		expect(source).toContain('<Edra.Toolbar');
		expect(source).toContain('<Edra.BubbleMenu');
		expect(source).toContain('<Edra.DragHandle');
		expect(source).toContain('<Edra.Content');
		expect(source).toContain("contentType: 'markdown'");
		expect(source).toContain('updated.getMarkdown()');
		expect(source).toContain('saveService?.scheduleSave(');
		expect(source).toContain('data-engine="edra"');
		expect(source).toContain('data-testid="note-canvas"');
	});

	it('inserts verses through the slash event instead of a custom toolbar', () => {
		const source = readFileSync(new URL('./EdraNoteEditor.svelte', import.meta.url), 'utf8');
		expect(source).toContain('VerseSelector');
		expect(source).toContain('openbible:insert-verse');
		expect(source).toContain("type: 'verseFence'");
	});

	it('keeps title, description and read-only semantics like the classic engine', () => {
		const source = readFileSync(new URL('./EdraNoteEditor.svelte', import.meta.url), 'utf8');
		expect(source).toContain('class="note-title"');
		expect(source).toContain('class="note-description"');
		expect(source).toContain('saveService?.updateTitle(text)');
		expect(source).toContain('saveService?.updateDescription(text)');
		expect(source).toContain('editor.setEditable(wantEditable)');
	});
});

describe('openbible edra assembly', () => {
	it('swaps the stock highlight and placeholder for the app ones', () => {
		const source = readFileSync(
			new URL('../../edra/shadcn/openbible-editor.ts', import.meta.url),
			'utf8'
		);
		expect(source).toContain('openBibleHighlight');
		expect(source).toContain('verseFenceNode');
		expect(source).toContain('Callout(');
		expect(source).toContain("extension.name !== 'highlight'");
	});

	it('routes the verse item to the app selector', () => {
		const source = readFileSync(
			new URL('../../edra/tiptap/extensions/slash/index.ts', import.meta.url),
			'utf8'
		);
		expect(source).toContain('Versículo');
		expect(source).toContain('openbible:insert-verse');
	});
});
