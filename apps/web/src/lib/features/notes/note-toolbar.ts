/**
 * Toolbar visibility contract (SPEC-0015): visible while editing by default
 * and hidden in view mode, unless pinned always-visible by preference.
 */
export interface ToolbarVisibilityInput {
	mode: 'edit' | 'view';
	alwaysVisible: boolean;
	viewport?: 'mobile' | 'desktop';
}

export interface ToolbarVisibility {
	visible: boolean;
	overlapsContent: boolean;
}

export function resolveToolbarVisibility(input: ToolbarVisibilityInput): ToolbarVisibility {
	return {
		visible: input.mode === 'edit' || input.alwaysVisible,
		overlapsContent: false
	};
}
