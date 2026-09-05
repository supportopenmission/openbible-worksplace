<script lang="ts">
	import { Play } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { youtubeFacadeState } from './youtube-embed';

	let {
		videoId = '',
		loaded = false,
		onPlay = () => {}
	}: {
		videoId?: string;
		loaded?: boolean;
		onPlay?: () => void;
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
