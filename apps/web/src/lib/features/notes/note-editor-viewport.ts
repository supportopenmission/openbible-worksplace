/** Altura da barra de navegação mobile (px), alinhada ao shell. */
export const NOTE_MOBILE_NAV_HEIGHT_PX = 64;

/** Altura estimada da toolbar de formatação (px). */
export const NOTE_TOOLBAR_HEIGHT_PX = 56;

/**
 * Mede o inset do teclado virtual a partir de `visualViewport`.
 * Retorna 0 quando o teclado está fechado ou `visualViewport` não existe.
 */
export function measureKeyboardInset(
	windowLike: Pick<Window, 'innerHeight' | 'visualViewport'> = window
): number {
	if (typeof windowLike === 'undefined' || !windowLike.visualViewport) return 0;
	const viewport = windowLike.visualViewport;
	return Math.max(0, windowLike.innerHeight - viewport.height - viewport.offsetTop);
}

/** Atributos do contenteditable para reduzir AutoFill/QuickType no iOS. */
export const IOS_EDITOR_INPUT_ATTRIBUTES: Record<string, string> = {
	autocomplete: 'off',
	autocorrect: 'off',
	autocapitalize: 'sentences',
	spellcheck: 'true',
	'data-1p-ignore': 'true',
	'data-lpignore': 'true'
};

export function applyIosEditorInputAttributes(element: HTMLElement): void {
	for (const [key, value] of Object.entries(IOS_EDITOR_INPUT_ATTRIBUTES)) {
		element.setAttribute(key, value);
	}
}

export function setNoteKeyboardInset(element: HTMLElement, insetPx: number): void {
	element.style.setProperty('--note-keyboard-inset', `${insetPx}px`);
}

export function createKeyboardInsetTracker(onInset: (insetPx: number) => void): () => void {
	if (typeof window === 'undefined') return () => undefined;

	const update = () => onInset(measureKeyboardInset());
	update();

	const viewport = window.visualViewport;
	viewport?.addEventListener('resize', update);
	viewport?.addEventListener('scroll', update);
	window.addEventListener('resize', update);

	return () => {
		viewport?.removeEventListener('resize', update);
		viewport?.removeEventListener('scroll', update);
		window.removeEventListener('resize', update);
	};
}
