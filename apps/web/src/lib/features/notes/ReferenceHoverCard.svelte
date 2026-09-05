<script lang="ts">
	import { BookOpen } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		visible = false,
		top = 0,
		left = 0,
		status = 'ready',
		reference = '',
		text = null,
		versionLabel = null,
		loading = false,
		onOpen = () => {},
		onClose = () => {}
	}: {
		visible?: boolean;
		top?: number;
		left?: number;
		status?: 'ready' | 'missing-bible' | 'unavailable' | 'loading';
		reference?: string;
		text?: string | null;
		versionLabel?: string | null;
		loading?: boolean;
		onOpen?: () => void;
		onClose?: () => void;
	} = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	}
</script>

{#if visible}
	<div
		class="reference-hover-card"
		role="dialog"
		aria-label={reference ? `Prévia de ${reference}` : 'Prévia bíblica'}
		tabindex="-1"
		style:top={`${top}px`}
		style:left={`${left}px`}
		onkeydown={handleKeydown}
	>
		<p class="hover-reference">
			<BookOpen size={14} strokeWidth={1.8} aria-hidden="true" />
			<span>{reference}</span>
			{#if versionLabel}
				<span class="hover-version">{versionLabel}</span>
			{/if}
		</p>
		{#if loading || status === 'loading'}
			<p class="hover-status" role="status">Carregando texto…</p>
		{:else if status === 'ready' && text}
			<blockquote class="hover-text">{text}</blockquote>
		{:else if status === 'missing-bible'}
			<p class="hover-status" role="status">Nenhuma Bíblia instalada para mostrar este texto.</p>
		{:else}
			<p class="hover-status" role="status">Não foi possível carregar este texto agora.</p>
		{/if}
		<div class="hover-actions">
			<Button type="button" variant="ghost" size="sm" onclick={onOpen} onmousedown={(e) => e.preventDefault()}>
				Abrir no leitor
			</Button>
			<Button type="button" variant="ghost" size="sm" onclick={onClose} onmousedown={(e) => e.preventDefault()}>
				Fechar
			</Button>
		</div>
	</div>
{/if}

<style>
	.reference-hover-card {
		position: fixed;
		z-index: 60;
		width: min(320px, calc(100vw - 24px));
		padding: 12px 14px;
		background-color: var(--background);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		transform: translate(-50%, 8px);
	}

	.hover-reference {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0 0 8px;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.hover-version {
		margin-inline-start: auto;
		font-weight: 400;
		color: var(--muted-foreground);
	}

	.hover-text {
		margin: 0 0 8px;
		border-inline-start: 2px solid var(--border);
		padding-inline-start: 10px;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.hover-status {
		margin: 0 0 8px;
		font-size: 0.8125rem;
		color: var(--muted-foreground);
	}

	.hover-actions {
		display: flex;
		gap: 4px;
		justify-content: flex-end;
	}
</style>
