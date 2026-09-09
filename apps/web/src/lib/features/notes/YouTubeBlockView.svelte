<script lang="ts">
	import { Play, ExternalLink } from '@lucide/svelte';
	import { youtubeFacadeState, youtubeEmbedUrl } from './youtube-embed';
	import PortableBlockStatus from './PortableBlockStatus.svelte';

	let {
		videoId = '',
		url = '',
		title = 'Vídeo do YouTube',
		state: blockState = 'canonical',
		diagnostic = '',
		loaded = blockState === 'canonical',
		onPlay = () => {},
		onStatusAction = () => {}
	}: {
		videoId?: string;
		url?: string;
		title?: string;
		state?: 'canonical' | 'degraded' | 'conflict';
		diagnostic?: string;
		loaded?: boolean;
		onPlay?: () => void;
		onStatusAction?: () => void;
	} = $props();

	let manualLoaded = $state<boolean | null>(null);
	let fetchedTitle = $state('');
	let author = $state('');

	const isLoaded = $derived(manualLoaded ?? loaded);
	const displayTitle = $derived(fetchedTitle || title);

	// Busca informações detalhadas do vídeo (título e canal) via oEmbed público do YouTube
	$effect(() => {
		if (videoId && (!fetchedTitle || fetchedTitle === 'Vídeo do YouTube')) {
			fetch(
				`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
			)
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => {
					if (data?.title) fetchedTitle = data.title;
					if (data?.author_name) author = data.author_name;
				})
				.catch(() => {});
		}
	});

	function handlePlay() {
		manualLoaded = true;
		onPlay();
	}

	const facade = $derived(youtubeFacadeState(videoId, { play: isLoaded }));
	const videoUrl = $derived(
		url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '')
	);
	const thumbnailUrl = $derived(
		videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''
	);
</script>

<div class="youtube-block-view">
	<div class="youtube-header">
		<div class="youtube-info">
			<a
				href={videoUrl}
				target="_blank"
				rel="noreferrer"
				class="youtube-title"
				title={displayTitle}
			>
				{displayTitle}
			</a>
			{#if author}
				<span class="youtube-author">{author}</span>
			{/if}
		</div>
		<a
			href={videoUrl}
			target="_blank"
			rel="noreferrer"
			class="youtube-ext-badge"
			title="Assistir no YouTube"
			aria-label="Assistir no YouTube"
		>
			<ExternalLink size={12} aria-hidden="true" />
			<span>YouTube</span>
		</a>
	</div>

	{#if facade.loaded}
		<div class="youtube-player-container">
			<iframe
				src={youtubeEmbedUrl(facade.videoId)}
				title={displayTitle}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
				frameborder="0"
				class="youtube-player"
				loading="lazy"
			></iframe>
		</div>
	{:else}
		<div class="youtube-fallback">
			<button
				type="button"
				class="youtube-facade-card"
				aria-label={facade.label}
				onmousedown={(e) => e.preventDefault()}
				onclick={handlePlay}
			>
				{#if thumbnailUrl}
					<div class="thumbnail-wrapper">
						<img src={thumbnailUrl} alt={displayTitle} class="thumbnail-img" loading="lazy" />
						<div class="play-overlay">
							<span class="play-badge" aria-hidden="true">
								<Play size={24} fill="currentColor" />
							</span>
						</div>
					</div>
				{:else}
					<div class="facade-simple">
						<Play size={20} strokeWidth={1.8} aria-hidden="true" />
						<span>{facade.label}</span>
					</div>
				{/if}
				<div class="facade-caption">
					<span class="facade-action-text">Clique para carregar o player</span>
					<span class="youtube-domain">YouTube</span>
				</div>
			</button>
		</div>
	{/if}

	<PortableBlockStatus state={blockState} message={diagnostic} onAction={onStatusAction} />
</div>

<style>
	.youtube-block-view {
		margin: 18px 0;
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
		background: var(--card, var(--background));
	}

	.youtube-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: color-mix(in oklch, var(--foreground) 3%, transparent);
		border-bottom: 1px solid var(--border);
		gap: 12px;
	}

	.youtube-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
		gap: 1px;
	}

	.youtube-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--foreground);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 0.15s;
	}

	.youtube-title:hover {
		color: var(--primary, #3b82f6);
		text-decoration: underline;
	}

	.youtube-author {
		font-size: 0.7rem;
		color: var(--muted-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.youtube-ext-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--muted-foreground);
		text-decoration: none;
		padding: 3px 8px;
		border-radius: 6px;
		background: color-mix(in oklch, var(--foreground) 6%, transparent);
		flex-shrink: 0;
		transition: color 0.15s, background-color 0.15s;
	}

	.youtube-ext-badge:hover {
		color: var(--foreground);
		background: color-mix(in oklch, var(--foreground) 10%, transparent);
	}

	.youtube-player-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: #000;
	}

	.youtube-player {
		width: 100%;
		height: 100%;
		border: none;
		display: block;
	}

	.youtube-fallback {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.youtube-facade-card {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
	}

	.thumbnail-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.thumbnail-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.85;
		transition: transform 0.25s ease, opacity 0.25s ease;
	}

	.youtube-facade-card:hover .thumbnail-img {
		opacity: 1;
		transform: scale(1.02);
	}

	.play-overlay {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.play-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 40px;
		background: #ff0000;
		color: #ffffff;
		border-radius: 10px;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
		transition: transform 0.2s ease;
	}

	.youtube-facade-card:hover .play-badge {
		transform: scale(1.1);
	}

	.facade-simple {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 24px 16px;
		color: var(--foreground);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.facade-caption {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: color-mix(in oklch, var(--foreground) 2%, transparent);
		border-top: 1px solid var(--border);
	}

	.facade-action-text {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	.youtube-domain {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--muted-foreground);
	}
</style>
