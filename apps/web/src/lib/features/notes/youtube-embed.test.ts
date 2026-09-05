import { describe, expect, it } from 'vitest';
import { parseYouTubeUrl, youtubeFacadeState } from './youtube-embed';

// SPECSFY: US-004 FR-004 NFR-001 AC-010
describe('youtube embed insertion', () => {
	it('accepts a valid watch URL with an accessible facade', () => {
		const parsed = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		expect(parsed).toEqual({ ok: true, videoId: 'dQw4w9WgXcQ' });
		if (parsed.ok) {
			expect(youtubeFacadeState(parsed.videoId)).toEqual({
				videoId: 'dQw4w9WgXcQ',
				loaded: false,
				label: 'Reproduzir vídeo do YouTube'
			});
		}
	});
});

// SPECSFY: US-004 FR-004 NFR-002 AC-011
describe('youtube on-demand loading', () => {
	it('keeps the player unloaded until play is pressed', () => {
		const before = youtubeFacadeState('dQw4w9WgXcQ');
		expect(before.loaded).toBe(false);
		expect(youtubeFacadeState('dQw4w9WgXcQ', { play: true }).loaded).toBe(true);
	});
});

// SPECSFY: US-004 FR-004 NFR-003 AC-012
describe('youtube invalid urls', () => {
	it('refuses non-youtube providers with an inline error reason', () => {
		expect(parseYouTubeUrl('https://vimeo.com/123456')).toEqual({
			ok: false,
			reason: 'unsupported-provider'
		});
		expect(parseYouTubeUrl('nota válida sem url')).toEqual({ ok: false, reason: 'invalid-url' });
	});
});
