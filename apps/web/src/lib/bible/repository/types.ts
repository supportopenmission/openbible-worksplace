export interface BibleVerseItem {
	number: number;
	text: string;
}

export interface BiblePassage {
	osis: string;
	translation: string;
	requestedTranslation?: string;
	versionMismatch?: boolean;
	bookName: string;
	chapter: number;
	verses: BibleVerseItem[];
}

export interface GetPassageInput {
	osis: string;
	translation?: string;
}

export interface BibleRepository {
	getPassage(input: GetPassageInput): Promise<BiblePassage>;
}
