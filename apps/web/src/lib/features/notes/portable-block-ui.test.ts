import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import PortableBlockStatus from './PortableBlockStatus.svelte';
import VerseBlockView from './VerseBlockView.svelte';
import YouTubeBlockView from './YouTubeBlockView.svelte';

// SPECSFY: US-002 FR-002 FR-003 NFR-004 AC-005 AC-006 AC-008
describe('portable block UI states', () => {
	it('exposes conflict and degraded states as text with an action', () => {
		const conflict = render(PortableBlockStatus, { props: { state: 'conflict' } });
		const degraded = render(PortableBlockStatus, { props: { state: 'degraded' } });

		expect(conflict.body).toContain('Conflito no bloco');
		expect(conflict.body).toContain('Resolver');
		expect(degraded.body).toContain('Bloco degradado');
		expect(degraded.body).toContain('Mostrar source');
	});

	it('keeps verse and video fallbacks visible without requiring a player', () => {
		const verse = render(VerseBlockView, {
			props: {
				versionId: 'nvi.sqlite',
				version: 'NVI',
				bookId: 43,
				book: 'João',
				chapter: 3,
				verseStart: 16,
				verseEnd: 16,
				snapshotBody: 'Porque Deus amou o mundo.',
				state: 'conflict'
			}
		});
		const video = render(YouTubeBlockView, {
			props: {
				videoId: 'dQw4w9WgXcQ',
				url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				state: 'degraded'
			}
		});

		expect(verse.body).toContain('Porque Deus amou o mundo.');
		expect(verse.body).toContain('Conflito no bloco');
		expect(video.body).toContain('Vídeo do YouTube');
		expect(video.body).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		expect(video.body).toContain('Bloco degradado');
		expect(video.body).not.toContain('<iframe');
	});
});
