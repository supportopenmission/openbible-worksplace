export interface NoteMeta {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	type: 'note';
	path: string;
}

export interface Note {
	meta: NoteMeta;
	body: string;
	content: string;
	path: string;
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}

export interface VerseBlockAttrs {
	versionId: string;
	bookId: number;
	book: string;
	chapter: number;
	verseStart: number;
	verseEnd: number;
	snapshotBody: string;
}

export interface NoteFile {
	meta: NoteMeta;
	body: string;
}
