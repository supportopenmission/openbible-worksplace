import { bcv_parser } from 'bible-passage-reference-parser';
import * as ptLang from 'bible-passage-reference-parser/esm/lang/pt.js';
import type { BibleReference, ParseReferenceOptions } from './types';
import { parseTranslationSuffix } from './normalize';

export class BibleReferenceParser {
	private bcv: bcv_parser;

	constructor() {
		this.bcv = new bcv_parser(ptLang);
		this.bcv.set_options({
			book_alone_strategy: 'ignore',
			sequence_combination_strategy: 'combine',
			consecutive_combination_strategy: 'combine'
		});
	}

	/**
	 * Parses all bible references found within the provided plain text.
	 */
	parse(text: string, options?: ParseReferenceOptions): BibleReference[] {
		if (!text || typeof text !== 'string') return [];

		const parsed = this.bcv.parse(text);
		const topEntities = parsed.parsed_entities();
		if (!topEntities || topEntities.length === 0) return [];

		interface ReferenceCluster {
			osisList: string[];
			from: number;
			to: number;
			book: string;
			chapter?: number;
			verseStart?: number;
			verseEnd?: number;
			isChapterOnly: boolean;
		}

		const clusters: ReferenceCluster[] = [];

		for (const top of topEntities) {
			let current: ReferenceCluster | null = null;

			for (const sub of top.entities) {
				const isDependent =
					sub.type === 'integer' ||
					sub.type === 'cv' ||
					(sub.type === 'range' && (!sub.start || !sub.start.b));

				if (!isDependent && current) {
					clusters.push(current);
					current = null;
				}

				if (!current) {
					const hasVerse = sub.start?.v != null;
					const isChapterOnly = sub.type === 'bc';
					const vStart = isChapterOnly ? undefined : sub.start?.v;
					const vEnd =
						isChapterOnly
							? undefined
							: sub.end && sub.end.v !== sub.start?.v
								? sub.end.v
								: undefined;

					current = {
						osisList: [sub.osis],
						from: sub.indices[0],
						to: sub.indices[1],
						book: sub.start.b,
						chapter: sub.start.c,
						verseStart: vStart,
						verseEnd: vEnd,
						isChapterOnly
					};
				} else {
					current.osisList.push(sub.osis);
					current.to = sub.indices[1];
					if (sub.end?.v != null) {
						current.verseEnd = sub.end.v;
					}
				}
			}

			if (current) {
				clusters.push(current);
			}
		}

		const references: BibleReference[] = [];

		for (let i = 0; i < clusters.length; i++) {
			const cluster = clusters[i];
			const from = cluster.from;
			let to = cluster.to;

			// If it's only a chapter reference (e.g. "Gn 3") and the very next character is "." or ":",
			// the user is in the process of typing a verse (e.g. "Gn 3." or "Gn 3:"), so it is incomplete.
			const afterImmediate = text.slice(to);
			if (cluster.isChapterOnly && (afterImmediate.startsWith('.') || afterImmediate.startsWith(':'))) {
				continue;
			}

			const nextFrom = clusters[i + 1] ? clusters[i + 1].from : text.length;
			let translation: string | undefined;

			const suffix = parseTranslationSuffix(text, to, nextFrom);
			if (suffix) {
				to += suffix.consumedLength;
				translation = suffix.translation;
			} else if (options?.defaultTranslation) {
				// Default translation if specified by caller
			}

			const raw = text.slice(from, to).replace(/\u00a0/g, ' ');
			const osis = cluster.osisList.join(',');

			references.push({
				raw,
				osis,
				book: cluster.book,
				chapter: cluster.chapter,
				...(cluster.verseStart != null ? { verseStart: cluster.verseStart } : {}),
				...(cluster.verseEnd != null ? { verseEnd: cluster.verseEnd } : {}),
				...(translation ? { translation } : {}),
				from,
				to
			});
		}

		return references;
	}
}

// Global shared singleton parser instance
export const defaultBibleReferenceParser = new BibleReferenceParser();

/**
 * Convenience function to parse bible references from text using default parser.
 */
export function parseBibleReferences(
	text: string,
	options?: ParseReferenceOptions
): BibleReference[] {
	return defaultBibleReferenceParser.parse(text, options);
}
