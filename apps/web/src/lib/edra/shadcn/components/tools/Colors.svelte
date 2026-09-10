<!--
Adaptação OpenBible do Colors do Edra (ver `src/lib/edra/README.md`):
somente destaque, com a paleta nomeada do app (`=={cor}==`, com roundtrip
garantido nos dois motores). Cor de texto removida: o TipTap não a
serializa em Markdown, então sumiria ao salvar.
-->
<script lang="ts">
	import { NOTE_HIGHLIGHTS } from '$lib/features/notes/note-highlights.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Check from '@lucide/svelte/icons/check';
	import Tooltip from '../Tooltip.svelte';
	import { getEditor, useEditorState } from '../../../tiptap/index.js';

	let open = $state(false);
	const editor = getEditor();
	const editorState = useEditorState({
		editor,
		selector: ({ editor }) => ({
			currentHighlight: editor.getAttributes('highlight').color
		})
	});
</script>

<DropdownMenu.Root bind:open>
	<Tooltip tooltip="Destaque">
		<DropdownMenu.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'icon',
				class: cn('gap-0.5')
			})}
			style={`background-color: ${$editorState.currentHighlight ? `color-mix(in srgb, ${$editorState.currentHighlight} 35%, transparent)` : ''};`}
		>
			<span class="font-bold">A</span>
			<ChevronDown class="size-2! text-muted-foreground" />
		</DropdownMenu.Trigger>
	</Tooltip>
	<DropdownMenu.Content
		class="max-h-96 min-w-48 overflow-auto rounded-lg duration-300"
		portalProps={{ to: editor.view.dom.parentElement ?? undefined }}
	>
		<DropdownMenu.Group>
			<DropdownMenu.Label>Cores de destaque</DropdownMenu.Label>
			<DropdownMenu.Item
				title="Sem destaque"
				class="flex cursor-pointer items-center justify-between"
				onclick={() => {
					editor.chain().focus().unsetHighlight().run();
				}}
			>
				<div class="flex items-center gap-2">
					<span class="size-4 rounded-full border"></span>
					<span>Padrão</span>
				</div>
				{#if !$editorState.currentHighlight}
					<Check class="size-4 text-muted-foreground" />
				{/if}
			</DropdownMenu.Item>
			{#each NOTE_HIGHLIGHTS as option (option.color)}
				{@const isActive = $editorState.currentHighlight === option.color}
				<DropdownMenu.Item
					title={option.label}
					class="flex cursor-pointer items-center justify-between"
					onclick={() => {
						editor.chain().focus().setHighlight({ color: option.color }).run();
					}}
				>
					<div class="flex items-center gap-2">
						<span class="size-4 rounded-full border" data-highlight-dot={option.color}></span>
						<span>{option.label}</span>
					</div>
					{#if isActive}
						<Check class="size-4 text-muted-foreground" />
					{/if}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<style>
	[data-highlight-dot='yellow'] {
		background-color: color-mix(in srgb, #eab308 55%, transparent);
	}
	[data-highlight-dot='green'] {
		background-color: color-mix(in srgb, #22c55e 55%, transparent);
	}
	[data-highlight-dot='blue'] {
		background-color: color-mix(in srgb, #3b82f6 55%, transparent);
	}
	[data-highlight-dot='pink'] {
		background-color: color-mix(in srgb, #d6409f 55%, transparent);
	}
</style>
