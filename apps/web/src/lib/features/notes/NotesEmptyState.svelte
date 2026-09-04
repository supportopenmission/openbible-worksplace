<script lang="ts">
	import { NotebookPen, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		onCreate,
		creating = false
	}: {
		onCreate: () => void;
		creating?: boolean;
	} = $props();
</script>

<div class="empty-note-pane" role="region" aria-label="Nenhuma nota selecionada">
	<div class="empty-content">
		<div class="empty-icon-box">
			<NotebookPen size={36} strokeWidth={1.5} aria-hidden="true" />
		</div>
		<h3 class="empty-title">Nenhuma nota selecionada</h3>
		<p class="empty-description">
			Selecione uma nota na barra lateral para visualizar e editar, ou crie uma nova para começar a escrever.
		</p>
		<Button type="button" onclick={onCreate} disabled={creating}>
			<Plus size={15} strokeWidth={1.8} aria-hidden="true" />
			Nova nota
		</Button>
	</div>
</div>

<style>
	.empty-note-pane {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		min-height: 400px;
		padding: 32px 24px;
		user-select: none;
		font-family: var(--font-sans);
	}

	.empty-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 360px;
		gap: 16px;
	}

	.empty-icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		border-radius: 12px;
		background: color-mix(in srgb, var(--muted) 70%, transparent);
		border: 1px solid var(--border);
		color: var(--muted-foreground);
	}

	.empty-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--foreground);
	}

	.empty-description {
		margin: -6px 0 6px;
		font-size: 0.875rem;
		line-height: 1.55;
		color: var(--muted-foreground);
	}
</style>
