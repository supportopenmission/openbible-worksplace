import { getSchema, type Editor } from '@tiptap/core';
import { EditorState, type Transaction } from '@tiptap/pm/state';
import { describe, expect, it } from 'vitest';
import { defaultExtensions } from '@friendofsvelte/tipex';
import { computeFloatingSurfacePosition, moveTopLevelBlock } from './note-block-interactions';

describe('note editor block interactions', () => {
	// SPECSFY: US-002 US-003 FR-002 FR-005 FR-010 NFR-001 AC-016
	it('keeps a measured floating surface inside every viewport edge', () => {
		const position = computeFloatingSurfacePosition({
			anchor: { left: 4, right: 60, top: 14, bottom: 34 },
			surface: { width: 420, height: 44 },
			viewport: { width: 320, height: 568 },
			padding: 8,
			gap: 6
		});

		expect(position.left).toBe(8);
		expect(position.top).toBe(40);
		expect(position.maxWidth).toBe(304);
		expect(position.placement).toBe('below');
	});

	// SPECSFY: US-002 US-003 FR-002 FR-005 NFR-001 AC-018
	it('moves a selected top-level block while preserving its content', () => {
		const schema = getSchema(defaultExtensions);
		let state = EditorState.create({
			schema,
			doc: schema.nodeFromJSON({
				type: 'doc',
				content: [
					{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Título' }] },
					{ type: 'paragraph', content: [{ type: 'text', text: 'Primeiro' }] },
					{ type: 'paragraph', content: [{ type: 'text', text: 'Segundo' }] }
				]
			})
		});
		const editor = {
			get state() {
				return state;
			},
			view: {
				dispatch(transaction: Transaction) {
					state = state.apply(transaction);
				}
			}
		} as unknown as Editor;
		const secondBlockPos = state.doc.child(0).nodeSize;

		expect(moveTopLevelBlock(editor, secondBlockPos, 1)).toBe(true);
		expect(
			state.doc
				.toJSON()
				.content?.map((node: { content?: Array<{ text?: string }> }) => node.content?.[0]?.text)
		).toEqual(['Título', 'Segundo', 'Primeiro']);
		expect(moveTopLevelBlock(editor, 0, -1)).toBe(false);
	});
});
