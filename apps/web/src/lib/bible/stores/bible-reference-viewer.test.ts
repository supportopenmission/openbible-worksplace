import { describe, expect, it } from 'vitest';
import {
	bibleReferenceViewer,
	openBibleReference,
	closeBibleReference
} from './bible-reference-viewer.svelte';
import { MockBibleRepository } from '../repository/mock-bible-repository';

describe('bibleReferenceViewer controller', () => {
	it('starts closed with no reference', () => {
		expect(bibleReferenceViewer.open).toBe(false);
		expect(bibleReferenceViewer.reference).toBeNull();
		expect(bibleReferenceViewer.passage).toBeNull();
	});

	it('opens a reference and loads its passage', async () => {
		const mockRepo = new MockBibleRepository();
		await openBibleReference(
			{
				raw: 'Gn 3.1 (ARA)',
				osis: 'Gen.3.1',
				book: 'Gen',
				chapter: 3,
				verseStart: 1,
				translation: 'ARA',
				from: 0,
				to: 12
			},
			mockRepo
		);

		expect(bibleReferenceViewer.open).toBe(true);
		expect(bibleReferenceViewer.reference?.raw).toBe('Gn 3.1 (ARA)');
		expect(bibleReferenceViewer.passage?.bookName).toBe('Gênesis');
		expect(bibleReferenceViewer.passage?.verses[0].text).toContain('Ora, a serpente era mais sagaz');
	});

	it('closes cleanly and resets state', () => {
		closeBibleReference();
		expect(bibleReferenceViewer.open).toBe(false);
		expect(bibleReferenceViewer.reference).toBeNull();
		expect(bibleReferenceViewer.passage).toBeNull();
		expect(bibleReferenceViewer.error).toBeNull();
	});
});
