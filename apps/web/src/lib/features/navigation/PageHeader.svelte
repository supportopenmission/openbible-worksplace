<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		eyebrow,
		title,
		description,
		actions
	}: {
		eyebrow?: string;
		title: string;
		description?: string;
		actions?: Snippet;
	} = $props();
</script>

<header class="page-header">
	{#if eyebrow}
		<p class="eyebrow">{eyebrow}</p>
	{/if}
	<div class="header-row">
		<div class="header-text">
			<h1>{title}</h1>
			{#if description}
				<p class="description">{description}</p>
			{/if}
		</div>
		{#if actions}
			<div class="header-actions">
				{@render actions()}
			</div>
		{/if}
	</div>
</header>

<style>
	.page-header {
		max-width: 1120px;
	}

	.eyebrow {
		margin: 0 0 12px;
		color: var(--muted-foreground);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.header-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px 24px;
	}

	.header-text {
		min-width: 0;
		flex: 1 1 280px;
	}

	h1 {
		width: 100%;
		margin: 0;
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1.1;
	}

	.description {
		max-width: 580px;
		margin: 12px 0 0;
		color: var(--muted-foreground);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.header-actions {
		display: flex;
		flex-shrink: 0;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding-top: 4px;
	}

	@media (max-width: 767px) {
		.header-row {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}

		.header-text {
			width: 100%;
			flex: none;
		}

		.header-actions {
			display: none;
		}
	}
</style>
