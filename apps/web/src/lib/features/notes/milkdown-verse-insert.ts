import { Fragment } from '@milkdown/prose/model';
import type { EditorState } from '@milkdown/prose/state';
import { TextSelection } from '@milkdown/prose/state';
import type { VerseFenceAttrs } from './verse-block-extension';

export type VerseInsertAttrs = VerseFenceAttrs & { snapshotBody: string };

export function buildVerseInsertTransaction(state: EditorState, attrs: VerseInsertAttrs) {
	const verseType = state.schema.nodes.verse;
	const paragraphType = state.schema.nodes.paragraph;
	if (!verseType || !paragraphType) return null;

	const verseNode = verseType.create(attrs);
	const paragraphNode = paragraphType.create();
	const selection = state.selection;
	const blockStart = 'node' in selection ? selection.from : selection.$from.before(1);
	const currentBlock = state.doc.nodeAt(blockStart);
	if (!currentBlock) return null;

	// Keep the active block intact and append the verse after it. Replacing a
	// text selection with a block node can split a heading/paragraph in two,
	// which makes the caret appear above the inserted verse on mobile.
	const insertion = Fragment.fromArray([verseNode, paragraphNode]);
	const replaceEmptyParagraph =
		currentBlock.type === paragraphType && currentBlock.content.size === 0;
	const insertAt = blockStart + currentBlock.nodeSize;
	let tr = replaceEmptyParagraph
		? state.tr.replaceWith(blockStart, insertAt, insertion)
		: state.tr.insert(insertAt, insertion);
	const paragraphCursor = (replaceEmptyParagraph ? blockStart : insertAt) + verseNode.nodeSize + 1;
	return tr.setSelection(TextSelection.create(tr.doc, paragraphCursor)).scrollIntoView();
}
