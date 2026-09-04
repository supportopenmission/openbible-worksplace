import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { buildBibleReferenceDecorations } from './bibleReferenceDecorations';
import type { BibleReference } from '../parser/types';
import { openBibleReference } from '../stores/bible-reference-viewer.svelte';

export const bibleReferencePluginKey = new PluginKey('bibleReference');

export interface BibleReferencePluginOptions {
	onReferenceClick?: (reference: BibleReference) => void;
}

export function createBibleReferencePlugin(options?: BibleReferencePluginOptions) {
	return new Plugin({
		key: bibleReferencePluginKey,
		state: {
			init(_, state) {
				return buildBibleReferenceDecorations(state.doc);
			},
			apply(tr, oldDecoSet, _oldState, newState) {
				if (!tr.docChanged) {
					return oldDecoSet;
				}
				return buildBibleReferenceDecorations(newState.doc);
			}
		},
		props: {
			decorations(state) {
				return bibleReferencePluginKey.getState(state);
			},
			handleClick(_view, pos, event) {
				const target = event.target as HTMLElement | null;
				const refEl = target?.closest<HTMLElement>('.bible-reference');
				if (!refEl) return false;

				const osis = refEl.getAttribute('data-osis');
				if (!osis) return false;

				const raw = refEl.getAttribute('data-raw') || refEl.textContent || '';
				const translation = refEl.getAttribute('data-version') || undefined;
				const book = refEl.getAttribute('data-book') || '';
				const chapterStr = refEl.getAttribute('data-chapter');
				const chapter = chapterStr ? parseInt(chapterStr, 10) : undefined;
				const verseStartStr = refEl.getAttribute('data-verse-start');
				const verseStart = verseStartStr ? parseInt(verseStartStr, 10) : undefined;
				const verseEndStr = refEl.getAttribute('data-verse-end');
				const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : undefined;

				const ref: BibleReference = {
					raw,
					osis,
					book,
					chapter,
					verseStart,
					verseEnd,
					translation,
					from: pos,
					to: pos + raw.length
				};

				event.preventDefault();

				if (options?.onReferenceClick) {
					options.onReferenceClick(ref);
				} else {
					void openBibleReference(ref);
				}

				return true;
			}
		}
	});
}

/**
 * Milkdown plugin integrating bible reference detection & decorations into the editor.
 */
export const bibleReferencePlugin = $prose(() => {
	return createBibleReferencePlugin();
});
