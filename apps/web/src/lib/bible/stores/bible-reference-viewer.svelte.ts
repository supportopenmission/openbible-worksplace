import type { BibleReference } from '../parser/types';
import type { BiblePassage, BibleRepository } from '../repository/types';
import { MockBibleRepository } from '../repository/mock-bible-repository';

export class BibleReferenceViewerController {
	open = $state(false);
	reference = $state<BibleReference | null>(null);
	passage = $state<BiblePassage | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	private repository: BibleRepository = new MockBibleRepository();

	setRepository(repo: BibleRepository) {
		this.repository = repo;
	}

	async openBibleReference(reference: BibleReference, customRepo?: BibleRepository) {
		this.reference = reference;
		this.open = true;
		this.loading = true;
		this.error = null;
		this.passage = null;

		const repo = customRepo ?? this.repository;

		try {
			const passage = await repo.getPassage({
				osis: reference.osis,
				translation: reference.translation
			});
			this.passage = passage;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Erro ao carregar a passagem bíblica.';
		} finally {
			this.loading = false;
		}
	}

	closeBibleReference() {
		this.open = false;
		this.reference = null;
		this.passage = null;
		this.error = null;
		this.loading = false;
	}

	async navigateAdjacent(direction: 'prev' | 'next') {
		if (!this.reference) return;
		const currentChapter = this.reference.chapter ?? 1;
		const nextChapter = direction === 'next' ? currentChapter + 1 : Math.max(1, currentChapter - 1);
		const osis = `${this.reference.book}.${nextChapter}`;

		const updatedRef: BibleReference = {
			...this.reference,
			chapter: nextChapter,
			verseStart: 1,
			verseEnd: undefined,
			osis,
			raw: `${this.reference.book} ${nextChapter}`
		};

		await this.openBibleReference(updatedRef);
	}
}

export const bibleReferenceViewer = new BibleReferenceViewerController();

export function openBibleReference(reference: BibleReference, repo?: BibleRepository) {
	return bibleReferenceViewer.openBibleReference(reference, repo);
}

export function closeBibleReference() {
	bibleReferenceViewer.closeBibleReference();
}
