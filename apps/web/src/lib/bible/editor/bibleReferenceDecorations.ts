import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import { parseBibleReferences } from '../parser/BibleReferenceParser';
import type { BibleReference } from '../parser/types';

/**
 * Builds a DecorationSet containing inline decorations for all valid bible references
 * in the document, avoiding code blocks, inline code, and links.
 */
export function buildBibleReferenceDecorations(doc: ProseNode): DecorationSet {
	const decorations: Decoration[] = [];

	doc.descendants((node, pos) => {
		// Avoid code blocks and fenced blocks
		if (node.type.name === 'code_block' || node.type.name === 'fence') {
			return false;
		}

		if (node.isTextblock) {
			let childOffset = 0;
			for (let i = 0; i < node.childCount; i++) {
				const child = node.child(i);
				if (child.isText && child.text) {
					// Avoid inline code and links
					const isIgnored = child.marks.some(
						(m) =>
							m.type.name === 'code_inline' ||
							m.type.name === 'code' ||
							m.type.name === 'link'
					);

					if (!isIgnored) {
						const text = child.text;
						const references = parseBibleReferences(text);

						for (const ref of references) {
							const from = pos + 1 + childOffset + ref.from;
							const to = pos + 1 + childOffset + ref.to;

							decorations.push(
								Decoration.inline(
									from,
									to,
									{
										class: 'bible-reference',
										'data-osis': ref.osis,
										'data-version': ref.translation ?? '',
										'data-raw': ref.raw,
										'data-book': ref.book,
										'data-chapter': ref.chapter != null ? String(ref.chapter) : '',
										'data-verse-start':
											ref.verseStart != null ? String(ref.verseStart) : '',
										'data-verse-end':
											ref.verseEnd != null ? String(ref.verseEnd) : '',
										role: 'button',
										tabindex: '0',
										title: `Passagem bíblica: ${ref.raw}`
									},
									{
										reference: ref
									}
								)
							);
						}
					}
					childOffset += child.nodeSize;
				} else {
					childOffset += child.nodeSize;
				}
			}
			return false;
		}

		return true;
	});

	return DecorationSet.create(doc, decorations);
}
