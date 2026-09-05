import { $nodeSchema } from '@milkdown/kit/utils';
import { Fragment } from '@milkdown/prose/model';
import { TextSelection, type EditorState } from '@milkdown/prose/state';
import { youtubeEmbedUrl } from './youtube-embed';

export interface VideoFenceAttrs {
	videoId: string;
	url: string;
}

export function renderVideoFence(attrs: VideoFenceAttrs): string {
	return `:::video{url="${attrs.url}" videoId="${attrs.videoId}"}\n:::\n`;
}

export function videoAttrsToFence(videoId: string, url: string): string {
	return renderVideoFence({ videoId, url });
}

/** Append a video block after the active block, keeping it intact. */
export function buildVideoInsertTransaction(
	state: EditorState,
	attrs: { videoId: string; url: string }
) {
	const videoType = state.schema.nodes.video;
	const paragraphType = state.schema.nodes.paragraph;
	if (!videoType || !paragraphType) return null;
	const videoNode = videoType.create({ ...attrs, loaded: false });
	const paragraphNode = paragraphType.create();
	const selection = state.selection;
	const blockStart = 'node' in selection ? selection.from : selection.$from.before(1);
	const currentBlock = state.doc.nodeAt(blockStart);
	if (!currentBlock) return null;
	const insertion = Fragment.fromArray([videoNode, paragraphNode]);
	const replaceEmptyParagraph =
		currentBlock.type === paragraphType && currentBlock.content.size === 0;
	const insertAt = blockStart + currentBlock.nodeSize;
	const tr = replaceEmptyParagraph
		? state.tr.replaceWith(blockStart, insertAt, insertion)
		: state.tr.insert(insertAt, insertion);
	const paragraphCursor = (replaceEmptyParagraph ? blockStart : insertAt) + videoNode.nodeSize + 1;
	return tr.setSelection(TextSelection.create(tr.doc, paragraphCursor)).scrollIntoView();
}

export const videoNodeSchema = $nodeSchema('video', () => ({
	group: 'block',
	atom: true,
	selectable: true,
	attrs: {
		videoId: { default: '' },
		url: { default: '' },
		loaded: { default: false }
	},
	parseDOM: [
		{
			tag: 'figure[data-type="video"]',
			getAttrs: (dom: HTMLElement) => ({
				videoId: dom.getAttribute('data-video-id') ?? '',
				url: dom.getAttribute('data-url') ?? '',
				loaded: dom.getAttribute('data-loaded') === 'true'
			})
		}
	],
	toDOM: (node) => {
		const videoId = node.attrs.videoId as string;
		const url = node.attrs.url as string;
		const loaded = node.attrs.loaded === true;
		if (loaded && videoId) {
			return [
				'figure',
				{ 'data-type': 'video', 'data-video-id': videoId, 'data-url': url, class: 'video-embed' },
				[
					'iframe',
					{
						src: youtubeEmbedUrl(videoId),
						title: 'Vídeo do YouTube',
						allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
						allowfullscreen: 'true',
						frameborder: '0',
						class: 'video-player'
					}
				]
			];
		}
		return [
			'figure',
			{ 'data-type': 'video', 'data-video-id': videoId, 'data-url': url, class: 'video-embed' },
			[
				'div',
				{
					class: 'video-facade',
					role: 'button',
					tabindex: '0',
					'data-video-id': videoId,
					'aria-label': 'Reproduzir vídeo do YouTube'
				},
				['span', { class: 'video-play', 'aria-hidden': 'true' }, '▶'],
				['span', { class: 'video-domain' }, 'YouTube']
			]
		];
	},
	parseMarkdown: {
		match: (node) => node.type === 'containerDirective' && node.name === 'video',
		runner: (state, node, type) => {
			const directive = node as typeof node & { attributes?: Record<string, string | null> };
			state.addNode(type, {
				videoId: directive.attributes?.videoId ?? '',
				url: directive.attributes?.url ?? '',
				loaded: false
			});
		}
	},
	toMarkdown: {
		match: (node) => node.type.name === 'video',
		runner: (state, node) => {
			state.addNode('containerDirective', [], undefined, {
				name: 'video',
				attributes: {
					url: node.attrs.url as string,
					videoId: node.attrs.videoId as string
				}
			});
		}
	}
}));
