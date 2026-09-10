/**
 * Adaptação OpenBible do `createEditor` do Edra (ver `../README.md`).
 *
 * Diferenças para `shadcn/editor.ts` do Edra 3.1.3:
 * - `highlight` e `placeholder` padrão filtrados do `getDefaultExtensions()`;
 * - `openBibleHighlight` (`==`/`=={cor}==`, roundtrip garantido) no lugar;
 * - `Placeholder` com texto em PT-BR;
 * - Callout NATIVO do Edra (`$callout` + emoji, com view rica);
 * - nós próprios `verseFence` e `videoFence` adicionados;
 * - resto da montagem idêntico ao original (Mermaid `:::mermaid`, mídia,
 *   tabelas, slash, TOC, IA opcional).
 *
 * `buildOpenBibleExtensions` centraliza a lista para o editor e para os
 * testes de roundtrip (que passam componentes vazios: o gerente Markdown
 * só lê os campos `parseMarkdown`/`renderMarkdown`/`markdownTokenizer`).
 */
import {
	AIHighlight,
	IFrameExtended,
	ImageExtended,
	Mermaid,
	SlashCommand,
	SvelteNodeViewRenderer,
	VideoExtended,
	useEditor
} from '../tiptap/index.ts';
import { all, createLowlight } from 'lowlight';
import { getDefaultExtensions } from '../extensions.ts';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Placeholder } from '@tiptap/extensions';
import CodeBlock from './components/CodeBlock.svelte';
import { Callout } from '../tiptap/extensions/Callout.ts';
import CalloutComp from './components/Callout.svelte';
import { MediaPlaceholder } from '../tiptap/extensions/MediaPlaceHolder.ts';import MediaPlaceholderComp from './components/MediaPlaceHolder.svelte';
import ImageExtendedComp from './components/ImageExtended.svelte';
import VideoExtendedComp from './components/VideoExtended.svelte';
import IFrameComp from './components/IFrame.svelte';
import MermaidComp from './components/Mermaid.svelte';
import SlashCommandComp from './components/SlashCommand.svelte';
import TableOfContents, { getHierarchicalIndexes } from '@tiptap/extension-table-of-contents';
import { setTocItems } from './toc-state.js';
import type { Content, Extensions } from '@tiptap/core';
import type { Component } from 'svelte';import {
	openBibleHighlight,
	videoFenceNode,
	verseFenceNode
} from '$lib/features/notes/edra-pure-extensions.ts';
import type { EdraEditorProps } from './editor.ts';

const lowlight = createLowlight(all);

export interface OpenBibleEditorViews {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	codeBlock: Component<any, any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	mediaPlaceholder: Component<any, any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	image: Component<any, any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	video: Component<any, any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	iframe: Component<any, any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	mermaid: Component<any, any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callout: Component<any, any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	slash: Component<any, any, any>;
}

export interface OpenBibleExtensionOptions {
	collaborative?: boolean;
	onFileUpload?: (file: File) => Promise<string>;
	callAI?: (
		prompt: string,
		onChunk: (chunk: string) => void,
		onError: (error: Error) => void
	) => Promise<void>;
}

export function buildOpenBibleExtensions(
	views: OpenBibleEditorViews,
	options: OpenBibleExtensionOptions = {}
): Extensions {
	return [
		...getDefaultExtensions({ undoRedo: !options.collaborative }).filter(
			(extension) => extension.name !== 'highlight' && extension.name !== 'placeholder'
		),
		openBibleHighlight,
		Placeholder.configure({
			emptyEditorClass: 'is-empty',
			placeholder: ({ node }) => {
				if (node.type.name === 'heading') return 'Título';
				if (node.type.name === 'paragraph') return OPENBIBLE_PLACEHOLDER;
				return '';
			}
		}),
		Callout(views.callout),
		verseFenceNode,
		videoFenceNode,
		CodeBlockLowlight.configure({
			lowlight
		}).extend({
			addNodeView() {
				return SvelteNodeViewRenderer(views.codeBlock);
			}
		}),
		MediaPlaceholder(views.mediaPlaceholder).configure({
			onUpload: options.onFileUpload
		}),
		ImageExtended(views.image),
		VideoExtended(views.video),
		IFrameExtended(views.iframe),
		Mermaid(views.mermaid),
		SlashCommand(views.slash),
		AIHighlight.configure({
			callAI: options.callAI || null
		}),
		TableOfContents.configure({
			getIndex: getHierarchicalIndexes,
			onUpdate: (indexes) => {
				setTocItems(indexes);
			}
		})
	];
}

export const OPENBIBLE_PLACEHOLDER = "Comece a escrever ou digite '/' para comandos…";

export interface OpenBibleEditorProps extends EdraEditorProps {
	content?: Content;
	contentType?: 'html' | 'json' | 'markdown';
	editable?: boolean;
}

export const createOpenBibleEditor = (props?: OpenBibleEditorProps) =>
	useEditor({
		content: props?.content,
		contentType: props?.contentType,
		editable: props?.editable,
		extensions: [
			...buildOpenBibleExtensions(
				{
					codeBlock: CodeBlock,
					mediaPlaceholder: MediaPlaceholderComp,
					image: ImageExtendedComp,
					video: VideoExtendedComp,
					iframe: IFrameComp,
					mermaid: MermaidComp,
					callout: CalloutComp,
					slash: SlashCommandComp
				},
				props
			),
			...(props?.extensions || [])
		],
		onUpdate: props?.onUpdate || (() => {})
	});
