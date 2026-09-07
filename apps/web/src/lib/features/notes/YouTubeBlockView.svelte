<script lang="ts">
	import { Play } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { youtubeFacadeState } from './youtube-embed';
	import PortableBlockStatus from './PortableBlockStatus.svelte';

	let {
		videoId = '',
		url = '',
		title = 'Vídeo do YouTube',
		state = 'canonical',
		diagnostic = '',
		loaded = false,
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

	const facade = $derived(youtubeFacadeState(videoId, { play: loaded }));
</script>

<div class="youtube-block-view">
	{#if facade.loaded}
		<iframe
			src={`https://www.youtube-nocookie.com/embed/${facade.videoId}`}
			title="Vídeo do YouTube"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
			frameborder="0"
			class="youtube-player"
		></iframe>
	{:else}
		<div class="youtube-fallback">
			<a
				href={url || `https://www.youtube.com/watch?v=${videoId}`}
				target="_blank"
				rel="noreferrer"
			>
				{title}
			</a>
			{#if videoId}
				<Button
					type="button"
					variant="outline"
					class="youtube-facade"
					aria-label={facade.label}
					onmousedown={(e) => e.preventDefault()}
					onclick={onPlay}
				>
					<Play size={20} strokeWidth={1.8} aria-hidden="true" />
					<span>{facade.label}</span>
					<span class="youtube-domain">YouTube</span>
				</Button>
			{/if}
		</div>
	{/if}
	<PortableBlockStatus {state} message={diagnostic} onAction={onStatusAction} />
</div>

<style>
	.youtube-block-view {
		margin: 16px 0;
	}

	.youtube-block-view :global(.youtube-facade) {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 28px 16px;
		border-radius: var(--radius-lg);
	}

	.youtube-fallback {
		display: grid;
		gap: 10px;
	}

	.youtube-fallback > a {
		color: var(--foreground);
		text-underline-offset: 3px;
	}

	.youtube-block-view :global(.youtube-domain) {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}

	.youtube-block-view :global(.youtube-player) {
		width: 100%;
		aspect-ratio: 16 / 9;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}
</style>
