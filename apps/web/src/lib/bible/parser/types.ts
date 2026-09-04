export interface BibleReference {
	raw: string;
	osis: string;
	book: string;
	chapter?: number;
	verseStart?: number;
	verseEnd?: number;
	translation?: string;
	from: number;
	to: number;
}

export interface BibleTranslation {
	id: string;
	abbreviation: string;
	name: string;
}

export interface ParseReferenceOptions {
	defaultTranslation?: string;
}
