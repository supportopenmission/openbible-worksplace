import { describe, expect, it } from 'vitest';
import { parseVerseFence, renderVerseFence, versePreviewUsesSnapshotOnly } from './verse-block-extension';

const FENCE = `:::verse{versionId="nvi.sqlite" bookId="43" book="João" chapter="3" verseStart="16" verseEnd="18"}
16 Porque Deus amou o mundo...
17 Porque Deus não enviou...
18 Quem crê nele...
:::`;

// SPECSFY: US-003 FR-003 FR-004 FR-006 NFR-002 AC-008
describe('verse-block-extension roundtrip', () => {
	it('preserves fence attributes and snapshot body', () => {
		const parsed = parseVerseFence(FENCE);
		expect(parsed.attrs.versionId).toBe('nvi.sqlite');
		expect(renderVerseFence(parsed)).toContain('verseStart="16"');
	});
});

// SPECSFY: US-003 FR-003 NFR-002 AC-007
describe('verse-block-extension preview', () => {
	it('renders snapshot without querying bibles/', () => {
		expect(versePreviewUsesSnapshotOnly(FENCE)).toBe(true);
	});
});
