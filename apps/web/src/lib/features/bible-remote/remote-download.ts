export type RemoteDownloadErrorKind = 'network-failed' | 'http-error' | 'cors-blocked' | 'aborted';

export class RemoteDownloadError extends Error {
	kind: RemoteDownloadErrorKind;
	status?: number;
	constructor(kind: RemoteDownloadErrorKind, message: string, status?: number) {
		super(message);
		this.kind = kind;
		this.status = status;
	}
}

export interface FileProgress {
	loaded: number;
	total?: number;
}

export function isCorsLikeFailure(error: unknown): boolean {
	if (error instanceof TypeError) return true;
	const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
	return message.includes('cors') || message.includes('failed to fetch') || message.includes('networkerror');
}

export async function downloadWithProgress(
	url: string,
	onProgress: (progress: FileProgress) => void,
	options: { fetchImpl?: typeof fetch; signal?: AbortSignal } = {}
): Promise<Uint8Array> {
	const fetchImpl = options.fetchImpl ?? fetch;
	let response: Response;
	try {
		response = await fetchImpl(url);
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new RemoteDownloadError('aborted', 'Download cancelado.');
		}
		throw new RemoteDownloadError(
			isCorsLikeFailure(error) ? 'cors-blocked' : 'network-failed',
			`Não foi possível baixar ${url}. O navegador bloqueou (rede ou CORS). Se o arquivo abre em nova aba, libere o CORS do bucket para este site.`
		);
	}
	if (!response.ok) {
		throw new RemoteDownloadError('http-error', `Bucket respondeu HTTP ${response.status} em ${url}.`, response.status);
	}
	const totalHeader = response.headers?.get?.('content-length');
	const total = totalHeader && Number.isFinite(Number(totalHeader)) ? Number(totalHeader) : undefined;
	if (!response.body) {
		const buffer = new Uint8Array(await response.arrayBuffer());
		onProgress({ loaded: buffer.length, total: total ?? buffer.length });
		return buffer;
	}
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let loaded = 0;
	for (;;) {
		if (options.signal?.aborted) {
			try {
				await reader.cancel();
			} catch {
				// ignora
			}
			throw new RemoteDownloadError('aborted', 'Download cancelado.');
		}
		const { done, value } = await reader.read();
		if (done) break;
		if (value) {
			chunks.push(value);
			loaded += value.length;
			onProgress({ loaded, ...(total !== undefined ? { total } : {}) });
		}
	}
	const bytes = new Uint8Array(loaded);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.length;
	}
	onProgress({ loaded, total: total ?? loaded });
	return bytes;
}
