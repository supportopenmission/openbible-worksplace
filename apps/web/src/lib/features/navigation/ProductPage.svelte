<script lang="ts">
	import { ArrowLeft, Sparkles } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	let {
		eyebrow = 'Área do OpenBible',
		title,
		description,
		status = 'empty',
		statusTitle,
		statusBody
	}: {
		eyebrow?: string;
		title: string;
		description: string;
		status?: 'empty' | 'soon';
		statusTitle: string;
		statusBody: string;
	} = $props();
</script>

<svelte:head>
	<title>{title} | OpenBible</title>
	<meta name="description" content={description} />
</svelte:head>

<div class="product-page">
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href={resolve('/')}>OpenBible</a>
		<span aria-hidden="true">/</span>
		<span aria-current="page">{title}</span>
	</nav>

	<header class="page-header">
		<p class="eyebrow">{eyebrow}</p>
		<h1>{title}</h1>
		<p class="description">{description}</p>
	</header>

	<section class:soon={status === 'soon'} class="module-state" aria-live="polite">
		<div class="state-icon" aria-hidden="true"><Sparkles size={22} strokeWidth={1.7} /></div>
		<div>
			<p class="state-label">{status === 'soon' ? 'Próxima etapa' : 'Workspace preparado'}</p>
			<h2>{statusTitle}</h2>
			<p>{statusBody}</p>
		</div>
	</section>

	<a class="back-link" href={resolve('/')}
		><ArrowLeft size={16} strokeWidth={1.8} /> Voltar ao início</a
	>
</div>

<style>
	.product-page {
		max-width: 1120px;
		margin: 0 auto;
		padding: 32px clamp(24px, 5vw, 64px) 64px;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-bottom: clamp(40px, 8vh, 72px);
		color: var(--muted-foreground);
		font-family: var(--font-sans);
		font-size: 0.72rem;
	}

	.breadcrumb a {
		color: var(--foreground);
		font-weight: 500;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.page-header {
		max-width: 660px;
	}

	.eyebrow,
	.state-label {
		margin: 0 0 12px;
		color: var(--muted-foreground);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 500;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.25rem, 6vw, 4rem);
		font-weight: 600;
		letter-spacing: -0.055em;
		line-height: 1;
	}

	.description {
		max-width: 580px;
		margin: 18px 0 0;
		color: var(--muted-foreground);
		font-size: 1rem;
		line-height: 1.6;
	}

	.module-state {
		display: flex;
		align-items: flex-start;
		gap: 18px;
		max-width: 680px;
		margin-top: 54px;
		border-block: 1px solid var(--border);
		background: transparent;
		padding: 24px 0;
	}

	.module-state.soon {
		border-color: var(--border);
	}

	.state-icon {
		display: grid;
		width: 28px;
		height: 28px;
		flex: 0 0 28px;
		place-items: center;
		color: var(--muted-foreground);
	}

	.state-label {
		margin-bottom: 8px;
		font-size: 0.64rem;
	}

	.module-state h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.025em;
	}

	.module-state p:last-child {
		max-width: 500px;
		margin: 8px 0 0;
		color: var(--muted-foreground);
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-top: 30px;
		color: var(--primary);
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-weight: 500;
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	@media (max-width: 767px) {
		.product-page {
			padding-top: 72px;
		}

		.breadcrumb {
			margin-bottom: 72px;
		}
	}

	@media (max-width: 480px) {
		.product-page {
			padding-right: 20px;
			padding-left: 20px;
		}

		.module-state {
			gap: 13px;
			padding: 18px;
		}
	}
</style>
