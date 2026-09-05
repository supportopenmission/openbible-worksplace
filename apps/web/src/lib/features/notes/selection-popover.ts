/**
 * Pure selection/popover contract for the note format popover (SPEC-0015).
 *
 * Bold and italic are applied through the native Milkdown commands so the
 * editor renders them styled. Underline and highlight have no native
 * CommonMark mark, so they are persisted as text markers (`++` and `==`)
 * that stay readable outside the app and render in previews and exports.
 */
export type FormatPopoverAction = 'bold' | 'italic' | 'underline' | 'highlight';

export interface TextSelection {
	from: number;
	to: number;
	collapsed: boolean;
}

export interface FormatPopoverContext {
	mode: 'edit' | 'read';
	marks?: FormatPopoverAction[];
}

export interface FormatPopoverState {
	visible: boolean;
	actions: FormatPopoverAction[];
	pressed?: Record<FormatPopoverAction, boolean>;
}

/** Text markers persisted in Markdown for actions without a native mark. */
export const TEXT_MARK_WRAPS: Record<'underline' | 'highlight', [string, string]> = {
	underline: ['++', '++'],
	highlight: ['==', '==']
};

export function formatPopoverActions(): FormatPopoverAction[] {
	return ['bold', 'italic', 'underline', 'highlight'];
}

export function shouldShowFormatPopover(
	selection: TextSelection,
	context: FormatPopoverContext
): FormatPopoverState {
	if (context.mode !== 'edit' || selection.collapsed || selection.to <= selection.from) {
		return { visible: false, actions: [] };
	}
	const actions = formatPopoverActions();
	if (!context.marks) return { visible: true, actions };
	const marks = new Set(context.marks);
	return {
		visible: true,
		actions,
		pressed: {
			bold: marks.has('bold'),
			italic: marks.has('italic'),
			underline: marks.has('underline'),
			highlight: marks.has('highlight')
		}
	};
}
