import type { EditorState } from '@milkdown/prose/state';
import { TextSelection } from '@milkdown/prose/state';
import type { VerseFenceAttrs } from './verse-block-extension';

export type VerseInsertAttrs = VerseFenceAttrs & { snapshotBody: string };

export function buildVerseInsertTransaction(
	state: EditorState,
	attrs: VerseInsertAttrs
) {
	const verseType = state.schema.nodes.verse;
	const paragraphType = state.schema.nodes.paragraph;
	if (!verseType || !paragraphType) return null;

	const verseNode = verseType.create(attrs);
	const paragraphNode = paragraphType.create();
	let tr = state.tr.replaceSelectionWith(verseNode);
	const afterVerse = tr.selection.from;
	tr = tr.insert(afterVerse, paragraphNode);
	return tr.setSelection(TextSelection.create(tr.doc, afterVerse + 1)).scrollIntoView();
}
