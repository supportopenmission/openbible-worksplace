import { describe, expect, it } from 'vitest';
import { IOS_EDITOR_INPUT_ATTRIBUTES, measureKeyboardInset } from './note-editor-viewport';
import { buildVerseInsertTransaction } from './milkdown-verse-insert';
import { Schema } from '@milkdown/prose/model';
import { EditorState, TextSelection } from '@milkdown/prose/state';

describe('note editor viewport', () => {
	it('measures keyboard inset from visualViewport', () => {
		expect(
			measureKeyboardInset({
				innerHeight: 844,
				visualViewport: {
					height: 500,
					offsetTop: 0,
					width: 390,
					scale: 1,
					pageLeft: 0,
					pageTop: 0,
					addEventListener: () => {},
					removeEventListener: () => {}
				}
			})
		).toBe(344);
	});

	it('declares iOS autofill suppression attrs', () => {
		expect(IOS_EDITOR_INPUT_ATTRIBUTES.autocomplete).toBe('off');
		expect(IOS_EDITOR_INPUT_ATTRIBUTES.autocorrect).toBe('off');
		expect(IOS_EDITOR_INPUT_ATTRIBUTES.autocapitalize).toBe('sentences');
	});
});

// SPECSFY: US-002 FR-002 FR-006 AC-004
describe('verse insert with following paragraph', () => {
	const schema = new Schema({
		nodes: {
			doc: { content: 'block+' },
			paragraph: { group: 'block', content: 'text*', toDOM: () => ['p', 0] },
			heading: {
				group: 'block',
				content: 'text*',
				attrs: { level: { default: 1 } },
				toDOM: () => ['h1', 0]
			},
			text: { group: 'inline' },
			verse: {
				group: 'block',
				atom: true,
				attrs: {
					versionId: { default: '' },
					version: { default: '' },
					bookId: { default: '' },
					book: { default: '' },
					chapter: { default: '' },
					verseStart: { default: '' },
					verseEnd: { default: '' },
					snapshotBody: { default: '' }
				},
				toDOM: () => ['blockquote', { 'data-type': 'verse' }]
			}
		}
	});

	const attrs = {
		versionId: 'nvi.sqlite',
		version: 'NVI',
		bookId: '43',
		book: 'João',
		chapter: '3',
		verseStart: '16',
		verseEnd: '16',
		snapshotBody: '16 Porque Deus amou o mundo'
	};

	it('inserts verse followed by an empty paragraph and focuses it', () => {
		const doc = schema.node('doc', null, [schema.node('paragraph')]);
		const state = EditorState.create({
			schema,
			doc,
			selection: TextSelection.create(doc, 1)
		});
		const tr = buildVerseInsertTransaction(state, attrs);
		expect(tr).not.toBeNull();

		const next = state.apply(tr!);
		let hasVerse = false;
		next.doc.descendants((node) => {
			if (node.type.name === 'verse') hasVerse = true;
		});
		expect(hasVerse).toBe(true);

		const $from = next.doc.resolve(next.selection.from);
		expect($from.parent.type.name).toBe('paragraph');
		expect($from.parent.content.size).toBe(0);
	});

	it('keeps a titled block intact and places the caret below the verse', () => {
		const heading = schema.node('heading', { level: 1 }, schema.text('Nova nota'));
		const doc = schema.node('doc', null, [heading]);
		const state = EditorState.create({
			schema,
			doc,
			selection: TextSelection.create(doc, 3)
		});
		const tr = buildVerseInsertTransaction(state, attrs);
		expect(tr).not.toBeNull();

		const next = state.apply(tr!);
		expect(next.doc.childCount).toBe(3);
		expect(next.doc.child(0).type.name).toBe('heading');
		expect(next.doc.child(0).textContent).toBe('Nova nota');
		expect(next.doc.child(1).type.name).toBe('verse');
		expect(next.doc.child(2).type.name).toBe('paragraph');
		expect(next.doc.resolve(next.selection.from).parent.type.name).toBe('paragraph');
	});
});
