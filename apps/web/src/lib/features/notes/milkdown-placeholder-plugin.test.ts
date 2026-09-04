import { describe, expect, it } from 'vitest';
import { Schema } from '@milkdown/prose/model';
import { EditorState, TextSelection } from '@milkdown/prose/state';
import {
	createMilkdownPlaceholderPlugin,
	placeholderPluginKey,
	DEFAULT_EMPTY_DOC,
	DEFAULT_EMPTY_BLOCK
} from './milkdown-placeholder-plugin';

describe('milkdown-placeholder-plugin', () => {
	const schema = new Schema({
		nodes: {
			doc: { content: 'block+' },
			paragraph: { group: 'block', content: 'text*', toDOM: () => ['p', 0] },
			text: { group: 'inline' }
		}
	});

	it('decorates empty document with empty-doc placeholder', () => {
		const doc = schema.node('doc', null, [schema.node('paragraph')]);
		const plugin = createMilkdownPlaceholderPlugin();
		const state = EditorState.create({
			schema,
			doc,
			plugins: [plugin]
		});

		const decoSet = placeholderPluginKey.getState(state);
		expect(decoSet).toBeDefined();
		const decos = decoSet!.find();
		expect(decos).toHaveLength(1);
		expect(decos[0].type.attrs.class).toContain('is-editor-empty');
		expect(decos[0].type.attrs['data-placeholder']).toBe(DEFAULT_EMPTY_DOC);
	});

	it('decorates empty cursor block when document has multiple blocks', () => {
		const para1 = schema.node('paragraph', null, [schema.text('Primeiro parágrafo')]);
		const para2 = schema.node('paragraph');
		const doc = schema.node('doc', null, [para1, para2]);
		const plugin = createMilkdownPlaceholderPlugin();

		// Selection placed inside the second (empty) paragraph
		const sel = TextSelection.near(doc.resolve(para1.nodeSize + 1));
		const state = EditorState.create({
			schema,
			doc,
			selection: sel,
			plugins: [plugin]
		});

		const decoSet = placeholderPluginKey.getState(state);
		expect(decoSet).toBeDefined();
		const decos = decoSet!.find();
		expect(decos).toHaveLength(1);
		expect(decos[0].type.attrs.class).toContain('is-cursor-empty');
		expect(decos[0].type.attrs['data-placeholder']).toBe(DEFAULT_EMPTY_BLOCK);
	});

	it('does not decorate blocks when cursor is in a non-empty block and doc is not empty', () => {
		const para1 = schema.node('paragraph', null, [schema.text('Texto com conteúdo')]);
		const doc = schema.node('doc', null, [para1]);
		const plugin = createMilkdownPlaceholderPlugin();

		const state = EditorState.create({
			schema,
			doc,
			selection: TextSelection.create(doc, 3),
			plugins: [plugin]
		});

		const decoSet = placeholderPluginKey.getState(state);
		expect(decoSet).toBeDefined();
		const decos = decoSet!.find();
		expect(decos).toHaveLength(0);
	});
});
