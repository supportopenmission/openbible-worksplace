<script lang="ts">
	import type { Component } from 'svelte';
	import { onMount } from 'svelte';
	import { Pencil, Sparkles } from '@lucide/svelte';
	import { getWorkspaceState } from '$lib/features/workspace/workspace-state.svelte';
	import {
		readEditorEngine,
		resolveEditorEngine,
		saveEditorEngine
	} from '$lib/storage/preferences';
	import type { NoteEditorEngine } from '$lib/storage/types';

	const workspace = getWorkspaceState();

	const options: Array<{
		value: NoteEditorEngine;
		label: string;
		hint: string;
		icon: Component;
	}> = [
		{
			value: 'edra',
			label: 'Novo (Edra)',
			hint: 'Motor padrão, com slash, callouts, mermaid e arrastar blocos',
			icon: Sparkles
		},
		{
			value: 'milkdown',
			label: 'Clássico (Milkdown)',
			hint: 'Motor anterior, mantido como alternativa',
			icon: Pencil
		}
	];

	let engine = $state<NoteEditorEngine>('edra');

	function syncEngine() {
		engine = workspace ? resolveEditorEngine(workspace.preferences) : readEditorEngine();
	}

	onMount(() => {
		window.addEventListener('openbible:editor-engine-changed', syncEngine);
		return () => window.removeEventListener('openbible:editor-engine-changed', syncEngine);
	});

	$effect(() => {
		// Acompanha a troca de workspace sem recarregar a página.
		syncEngine();
	});

	async function selectEngine(value: NoteEditorEngine) {
		if (value === engine) return;
		if (workspace) {
			await workspace.updatePreferences({ editorEngine: value });
			engine = value;
		} else {
			saveEditorEngine(value);
			engine = value;
		}
		window.dispatchEvent(
			new CustomEvent('openbible:editor-engine-changed', { detail: value })
		);
	}
</script>

<section class="editor-engine-panel" aria-labelledby="editor-engine-settings-title">
	<div class="editor-engine-heading">
		<h2 id="editor-engine-settings-title">Editor de notas</h2>
		<p>
			Escolha o motor do editor. A troca vale para as notas e para o painel de notas do
			leitor; o conteúdo salvo não muda de formato.
		</p>
	</div>

	<div class="editor-engine-settings" role="radiogroup" aria-label="Motor do editor de notas">
		{#each options as option (option.value)}
			{@const Icon = option.icon}
			<label class="editor-engine-row" class:selected={engine === option.value}>
				<span class="editor-engine-icon" aria-hidden="true">
					<Icon size={15} strokeWidth={1.8} />
				</span>
				<span class="editor-engine-text">
					<span class="editor-engine-label">{option.label}</span>
					<span class="editor-engine-hint">{option.hint}</span>
				</span>
				<input
					type="radio"
					name="openbible-editor-engine"
					value={option.value}
					checked={engine === option.value}
					onchange={() => void selectEngine(option.value)}
					aria-label={option.label}
				/>
			</label>
		{/each}
	</div>
</section>

<style>
	.editor-engine-panel {
		display: grid;
		gap: 20px;
	}

	.editor-engine-heading {
		display: grid;
		gap: 8px;
	}

	.editor-engine-heading h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 650;
		letter-spacing: -0.025em;
	}

	.editor-engine-heading p {
		max-width: 56ch;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.55;
	}

	.editor-engine-settings {
		display: grid;
		border-top: 1px solid var(--border);
	}

	.editor-engine-row {
		display: flex;
		min-height: 56px;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding: 10px 4px;
		cursor: pointer;
	}

	.editor-engine-icon {
		display: flex;
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		background: color-mix(in oklch, var(--foreground) 7%, transparent);
	}

	.editor-engine-text {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 2px;
	}

	.editor-engine-label {
		font-size: 0.9rem;
		font-weight: 550;
	}

	.editor-engine-row.selected .editor-engine-label {
		font-weight: 650;
	}

	.editor-engine-hint {
		color: var(--muted-foreground);
		font-size: 0.76rem;
	}

	.editor-engine-row input[type='radio'] {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		margin: 0;
		accent-color: var(--foreground);
		cursor: pointer;
	}
</style>
