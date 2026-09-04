import { describe, expect, it } from 'vitest';
import { MockBibleRepository } from './mock-bible-repository';

describe('MockBibleRepository', () => {
	const repo = new MockBibleRepository();

	it('returns passage for a single verse', async () => {
		const passage = await repo.getPassage({ osis: 'Gen.3.1', translation: 'ARA' });
		expect(passage.bookName).toBe('Gênesis');
		expect(passage.chapter).toBe(3);
		expect(passage.translation).toBe('ARA');
		expect(passage.verses).toHaveLength(1);
		expect(passage.verses[0].number).toBe(1);
		expect(passage.verses[0].text).toContain('Ora, a serpente era mais sagaz');
	});

	it('returns passage for John 3:16', async () => {
		const passage = await repo.getPassage({ osis: 'John.3.16', translation: 'NVI' });
		expect(passage.bookName).toBe('João');
		expect(passage.chapter).toBe(3);
		expect(passage.translation).toBe('NVI');
		expect(passage.verses).toHaveLength(1);
		expect(passage.verses[0].text).toContain('Porque Deus amou ao mundo');
	});

	it('returns passage for verse ranges', async () => {
		const passage = await repo.getPassage({ osis: 'Gen.3.1-Gen.3.5', translation: 'ARA' });
		expect(passage.bookName).toBe('Gênesis');
		expect(passage.chapter).toBe(3);
		expect(passage.verses).toHaveLength(5);
		expect(passage.verses[0].number).toBe(1);
		expect(passage.verses[4].number).toBe(5);
	});

	it('generates readable verses for arbitrary passages not in predefined dictionary', async () => {
		const passage = await repo.getPassage({ osis: 'Rom.12.1-Rom.12.2', translation: 'ARA' });
		expect(passage.bookName).toBe('Romanos');
		expect(passage.chapter).toBe(12);
		expect(passage.verses).toHaveLength(2);
		expect(passage.verses[0].number).toBe(1);
		expect(passage.verses[1].number).toBe(2);
	});
});
