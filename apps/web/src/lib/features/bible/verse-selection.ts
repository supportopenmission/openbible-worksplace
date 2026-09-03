export type VerseRange = {
	verseStart: number;
	verseEnd: number;
};

function isVerseNumber(value: number): boolean {
	return Number.isInteger(value) && value > 0;
}

export function formContinuousRange(anchor: number, focus: number): VerseRange | null {
	if (!isVerseNumber(anchor) || !isVerseNumber(focus)) return null;
	return { verseStart: Math.min(anchor, focus), verseEnd: Math.max(anchor, focus) };
}

export function selectionFromVerseNumbers(verses: number[]): VerseRange | null {
	if (verses.length === 0) return null;
	const ordered = [...new Set(verses)].sort((left, right) => left - right);
	if (!ordered.every(isVerseNumber)) return null;
	const hasGap = ordered.some((verse, index) => index > 0 && verse !== ordered[index - 1] + 1);
	if (hasGap) return null;
	return { verseStart: ordered[0], verseEnd: ordered[ordered.length - 1] };
}

export function rangeCoversVerse(range: VerseRange, verse: number): boolean {
	return verse >= range.verseStart && verse <= range.verseEnd;
}

export function versesInRange(range: VerseRange): number[] {
	const verses: number[] = [];
	for (let verse = range.verseStart; verse <= range.verseEnd; verse += 1) verses.push(verse);
	return verses;
}

export function sameRange(left: VerseRange, right: VerseRange): boolean {
	return left.verseStart === right.verseStart && left.verseEnd === right.verseEnd;
}
