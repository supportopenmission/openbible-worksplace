import { describe, expect, it } from 'vitest';
import { Schema } from '@milkdown/prose/model';
import { EditorState, TextSelection } from '@milkdown/prose/state';
import { buildVideoInsertTransaction } from './milkdown-video-node';

describe('video block insertion', () => {
	const schema = new Schema({
		nodes: {
			doc: { content: 'block+' },
			paragraph: { group: 'block', content: 'text*', toDOM: () => ['p', 0] },
			text: { group: 'inline' },
			video: {
				group: 'block',
				atom: true,
				attrs: {
					videoId: { default: '' },
					url: { default: '' },
					loaded: { default: true }
				},
				toDOM: () => ['figure', { 'data-type': 'video' }]
			}
		}
	});

	it('inserts an empty paragraph and places the selection below the video', () => {
		const doc = schema.node('doc', null, [schema.node('paragraph')]);
		const state = EditorState.create({
			schema,
			doc,
			selection: TextSelection.create(doc, 1)
		});
		const tr = buildVideoInsertTransaction(state, {
			videoId: 'dQw4w9WgXcQ',
			url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
		});
		expect(tr).not.toBeNull();

		const next = state.apply(tr!);
		expect(next.doc.childCount).toBe(2);
		expect(next.doc.child(0).type.name).toBe('video');
		expect(next.doc.child(1).type.name).toBe('paragraph');
		expect(next.doc.child(1).content.size).toBe(0);
		expect(next.doc.resolve(next.selection.from).parent.type.name).toBe('paragraph');
	});
});
