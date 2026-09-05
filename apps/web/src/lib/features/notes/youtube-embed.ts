/**
 * YouTube embed contract (SPEC-0015): validate URLs, restrict to YouTube
 * and keep the player unloaded until the person presses play.
 */
export type YouTubeParseResult =
	| { ok: true; videoId: string }
	| { ok: false; reason: 'invalid-url' | 'unsupported-provider' };

export interface YouTubeFacadeOptions {
	play?: boolean;
}

export interface YouTubeFacadeState {
	videoId: string;
	loaded: boolean;
	label: string;
}

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
	'youtube.com',
	'm.youtube.com',
	'music.youtube.com',
	'youtube-nocookie.com'
]);

function validId(value: string | null): value is string {
	return typeof value === 'string' && VIDEO_ID_PATTERN.test(value);
}

/** Parse a YouTube URL; anything else is refused with an explicit reason. */
export function parseYouTubeUrl(input: string): YouTubeParseResult {
	const text = input.trim();
	if (!text) return { ok: false, reason: 'invalid-url' };
	let url: URL;
	try {
		url = new URL(text);
	} catch {
		return { ok: false, reason: 'invalid-url' };
	}
	const host = url.hostname.toLowerCase().replace(/^www\./, '');
	if (host === 'youtu.be') {
		const id = url.pathname.slice(1).split('/')[0] ?? '';
		return validId(id) ? { ok: true, videoId: id } : { ok: false, reason: 'invalid-url' };
	}
	if (!YOUTUBE_HOSTS.has(host)) return { ok: false, reason: 'unsupported-provider' };
	if (url.pathname === '/watch') {
		const id = url.searchParams.get('v') ?? '';
		return validId(id) ? { ok: true, videoId: id } : { ok: false, reason: 'invalid-url' };
	}
	const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/);
	if (match && validId(match[2])) return { ok: true, videoId: match[2] };
	return { ok: false, reason: 'invalid-url' };
}

/** Privacy-friendly embed URL (no cookies until play). */
export function youtubeEmbedUrl(videoId: string): string {
	return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/** Facade state: poster button until play, iframe only after. */
export function youtubeFacadeState(videoId: string, options?: YouTubeFacadeOptions): YouTubeFacadeState {
	return {
		videoId,
		loaded: options?.play === true,
		label: 'Reproduzir vídeo do YouTube'
	};
}
