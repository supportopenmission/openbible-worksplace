import { Extension, type Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';

export interface RectLike {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

export interface SizeLike {
	width: number;
	height: number;
}

export interface ViewportLike {
	width: number;
	height: number;
}

export interface FloatingSurfaceInput {
	anchor: RectLike;
	surface: SizeLike;
	viewport: ViewportLike;
	padding?: number;
	gap?: number;
}

export interface FloatingSurfacePosition {
	left: number;
	top: number;
	maxWidth: number;
	placement: 'above' | 'below';
}

export type BlockDropSide = 'before' | 'after';

interface TopLevelBlock {
	pos: number;
	size: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function computeFloatingSurfacePosition({
	anchor,
	surface,
	viewport,
	padding = 8,
	gap = 6
}: FloatingSurfaceInput): FloatingSurfacePosition {
	const maxWidth = Math.max(0, viewport.width - padding * 2);
	const renderedWidth = Math.min(surface.width, maxWidth);
	const centeredLeft = (anchor.left + anchor.right - renderedWidth) / 2;
	const left = clamp(centeredLeft, padding, viewport.width - padding - renderedWidth);
	const spaceAbove = anchor.top - gap - padding;
	const spaceBelow = viewport.height - anchor.bottom - gap - padding;
	const placement = spaceAbove >= surface.height || spaceAbove > spaceBelow ? 'above' : 'below';
	const desiredTop =
		placement === 'above' ? anchor.top - gap - surface.height : anchor.bottom + gap;
	const top = clamp(desiredTop, padding, viewport.height - padding - surface.height);

	return { left, top, maxWidth, placement };
}

function topLevelBlocks(editor: Editor): TopLevelBlock[] {
	const blocks: TopLevelBlock[] = [];
	editor.state.doc.forEach((node, pos) => {
		blocks.push({ pos, size: node.nodeSize });
	});
	return blocks;
}

export function moveTopLevelBlockTo(
	editor: Editor,
	fromPos: number,
	targetPos: number,
	side: BlockDropSide
): boolean {
	const blocks = topLevelBlocks(editor);
	const sourceIndex = blocks.findIndex((block) => block.pos === fromPos);
	const targetIndex = blocks.findIndex((block) => block.pos === targetPos);
	if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === 0) return false;

	let destinationIndex = targetIndex + (side === 'after' ? 1 : 0);
	if (sourceIndex < destinationIndex) destinationIndex -= 1;
	destinationIndex = Math.max(1, Math.min(destinationIndex, blocks.length - 1));
	if (destinationIndex === sourceIndex) return false;

	const source = blocks[sourceIndex];
	const sourceNode = editor.state.doc.nodeAt(source.pos);
	if (!sourceNode) return false;

	const remaining = blocks.filter((_, index) => index !== sourceIndex);
	const insertAt = remaining
		.slice(0, destinationIndex)
		.reduce((total, block) => total + block.size, 0);
	const transaction = editor.state.tr
		.delete(source.pos, source.pos + source.size)
		.insert(insertAt, sourceNode);

	transaction.setSelection(NodeSelection.create(transaction.doc, insertAt));
	editor.view.dispatch(transaction.scrollIntoView());
	return true;
}

export function moveTopLevelBlock(editor: Editor, blockPos: number, direction: -1 | 1): boolean {
	const blocks = topLevelBlocks(editor);
	const sourceIndex = blocks.findIndex((block) => block.pos === blockPos);
	if (sourceIndex <= 0) return false;
	const targetIndex = sourceIndex + direction;
	if (targetIndex <= 0 || targetIndex >= blocks.length) return false;
	return moveTopLevelBlockTo(
		editor,
		blockPos,
		blocks[targetIndex].pos,
		direction < 0 ? 'before' : 'after'
	);
}

export function createNoteKeyboardExtension(onKeyDown: (key: string) => boolean) {
	return Extension.create({
		name: 'noteKeyboardInteractions',
		priority: 1_000,
		addKeyboardShortcuts() {
			return {
				ArrowDown: () => onKeyDown('ArrowDown'),
				ArrowUp: () => onKeyDown('ArrowUp'),
				Enter: () => onKeyDown('Enter'),
				Escape: () => onKeyDown('Escape')
			};
		}
	});
}
