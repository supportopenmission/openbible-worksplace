import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import type { EditorState } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';

export const placeholderPluginKey = new PluginKey('milkdownPlaceholder');

export interface MilkdownPlaceholderOptions {
	emptyDocPlaceholder?: string;
	emptyBlockPlaceholder?: string;
}

export const DEFAULT_EMPTY_DOC = "Comece a escrever ou digite '/' para comandos…";
export const DEFAULT_EMPTY_BLOCK = "Digite '/' para comandos…";

export function createMilkdownPlaceholderPlugin(options?: MilkdownPlaceholderOptions) {
	const emptyDocText = options?.emptyDocPlaceholder ?? DEFAULT_EMPTY_DOC;
	const emptyBlockText = options?.emptyBlockPlaceholder ?? DEFAULT_EMPTY_BLOCK;

	function buildDecorations(state: EditorState): DecorationSet {
		const { doc, selection } = state;

		// Check if document is completely empty:
		// 1) doc.childCount === 0
		// 2) or doc.childCount === 1 and firstChild is an empty textblock
		const isDocEmpty =
			doc.childCount === 0 ||
			(doc.childCount === 1 && doc.firstChild?.isTextblock === true && doc.firstChild.content.size === 0);

		if (isDocEmpty && doc.firstChild) {
			const deco = Decoration.node(
				0,
				doc.firstChild.nodeSize,
				{
					class: 'is-empty is-editor-empty',
					'data-placeholder': emptyDocText
				}
			);
			return DecorationSet.create(doc, [deco]);
		}

		// When document is not empty, check if selection is an empty text selection inside an empty textblock
		if (selection.empty) {
			const { $from } = selection;
			const parent = $from.parent;
			if (parent.isTextblock && parent.content.size === 0) {
				const start = $from.before();
				const end = $from.after();
				const deco = Decoration.node(
					start,
					end,
					{
						class: 'is-empty is-cursor-empty',
						'data-placeholder': emptyBlockText
					}
				);
				return DecorationSet.create(doc, [deco]);
			}
		}

		return DecorationSet.empty;
	}

	return new Plugin({
		key: placeholderPluginKey,
		state: {
			init(_, state) {
				return buildDecorations(state);
			},
			apply(tr, oldDecos, _oldState, newState) {
				if (!tr.docChanged && !tr.selectionSet) {
					return oldDecos;
				}
				return buildDecorations(newState);
			}
		},
		props: {
			decorations(state) {
				return placeholderPluginKey.getState(state);
			}
		}
	});
}

export function milkdownPlaceholderPlugin(options?: MilkdownPlaceholderOptions) {
	return $prose(() => createMilkdownPlaceholderPlugin(options));
}
