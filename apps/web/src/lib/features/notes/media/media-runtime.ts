import type { MediaService } from './media-service';
import { isMediaReference, mediaIdFromReference } from './media-service';

const MEDIA_SELECTOR = 'img[src], video[src], audio[src], source[src]';

function mediaReferenceFor(element: Element): string | null {
	const source = element.getAttribute('src') ?? element.getAttribute('data-openbible-media-reference');
	return source && isMediaReference(source) ? source : null;
}

function markUnavailable(element: Element, reference: string): void {
	element.setAttribute('data-openbible-media-reference', reference);
	element.setAttribute('data-media-state', 'missing');
	element.removeAttribute('src');
	if (element instanceof HTMLElement) element.hidden = true;
	if (!element.getAttribute('aria-label')) {
		element.setAttribute('aria-label', 'Mídia indisponível. Reimporte o arquivo nas configurações.');
	}
	const parent = element.parentElement;
	if (parent && !parent.querySelector(`[data-openbible-media-placeholder="${reference}"]`)) {
		const placeholder = document.createElement('div');
		placeholder.dataset.openbibleMediaPlaceholder = reference;
		placeholder.className = 'openbible-media-placeholder';
		placeholder.setAttribute('role', 'status');
		placeholder.textContent = 'Mídia indisponível. Reimporte o arquivo em Uso e armazenamento.';
		element.insertAdjacentElement('afterend', placeholder);
	}
}

/**
 * Converte referências `media:<id>` em Object URLs somente na camada de
 * renderização. O documento do Edra continua guardando a referência estável,
 * então recarregar o PWA ou abrir a nota no Tauri não deixa um blob expirado.
 */
export function mountMediaRuntime(root: HTMLElement, service: MediaService): () => void {
	let disposed = false;
	const resolving = new WeakSet<Element>();

	const resolveElement = async (element: Element) => {
		if (disposed || resolving.has(element)) return;
		const reference = mediaReferenceFor(element);
		if (!reference) return;
		resolving.add(element);
		try {
			const source = await service.resolve(reference);
			if (disposed || mediaReferenceFor(element) !== reference) return;
			if (element instanceof HTMLElement) element.hidden = false;
			element.parentElement
				?.querySelector(`[data-openbible-media-placeholder="${reference}"]`)
				?.remove();
			element.setAttribute('data-openbible-media-reference', reference);
			element.setAttribute('data-openbible-media-id', mediaIdFromReference(reference) ?? '');
			element.setAttribute('data-media-state', 'available');
			element.setAttribute('src', source);
		} catch {
			if (!disposed) markUnavailable(element, reference);
		} finally {
			resolving.delete(element);
		}
	};

	const scan = (target: ParentNode) => {
		if (target instanceof Element && target.matches(MEDIA_SELECTOR)) {
			void resolveElement(target);
		}
		for (const element of target.querySelectorAll(MEDIA_SELECTOR)) {
			void resolveElement(element);
		}
	};

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				for (const node of mutation.addedNodes) {
					if (node instanceof Element) scan(node);
				}
			} else if (mutation.type === 'attributes' && mutation.target instanceof Element) {
				void resolveElement(mutation.target);
			}
		}
	});
	const refreshUpdatedMedia = (event: Event) => {
		const mediaId = (event as CustomEvent<{ mediaId?: unknown }>).detail?.mediaId;
		if (typeof mediaId !== 'string' || !mediaId) return;
		for (const element of root.querySelectorAll(`[data-openbible-media-id="${mediaId}"]`)) {
			element.setAttribute('src', `media:${mediaId}`);
			void resolveElement(element);
		}
	};

	scan(root);
	observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
	window.addEventListener('openbible:media-updated', refreshUpdatedMedia);

	return () => {
		disposed = true;
		observer.disconnect();
		window.removeEventListener('openbible:media-updated', refreshUpdatedMedia);
		service.dispose();
	};
}
