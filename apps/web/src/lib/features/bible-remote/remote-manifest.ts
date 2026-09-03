export interface RemoteBibleFile {
	name: string;
	url: string;
	size?: number;
	sha256?: string;
}

export interface RemoteCatalog {
	baseUrl: string;
	entries: RemoteBibleFile[];
	diagnostics: string[];
}

export type ManifestFetch = typeof fetch;

export function normalizeBaseUrl(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) throw new Error('Informe a URL do bucket.');
	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		throw new Error('URL inválida. Use https://...');
	}
	if (parsed.protocol !== 'https:') throw new Error('Use uma URL https pública.');
	parsed.hash = '';
	parsed.search = '';
	let base = parsed.toString();
	if (!base.endsWith('/')) base += '/';
	return base;
}

export function isDirectSqliteUrl(input: string): boolean {
	try {
		const parsed = new URL(input.trim());
		return parsed.pathname.toLowerCase().endsWith('.sqlite');
	} catch {
		return false;
	}
}

function resolveEntry(baseUrl: string, raw: unknown): RemoteBibleFile | null {
	if (!raw || typeof raw !== 'object') return null;
	const record = raw as Record<string, unknown>;
	const nameRaw = typeof record.name === 'string' ? record.name.trim() : '';
	const urlRaw = typeof record.url === 'string' ? record.url.trim() : '';
	if (!nameRaw.toLowerCase().endsWith('.sqlite')) return null;
	if (!nameRaw || !urlRaw) return null;
	let absolute: string;
	try {
		absolute = new URL(urlRaw, baseUrl).toString();
	} catch {
		return null;
	}
	if (!absolute.startsWith('https://')) return null;
	const size =
		typeof record.size === 'number' && Number.isFinite(record.size) && record.size >= 0
			? Math.floor(record.size)
			: undefined;
	const sha256 = typeof record.sha256 === 'string' && record.sha256.trim() ? record.sha256.trim() : undefined;
	const fileName = nameRaw.split('/').pop() ?? nameRaw;
	return { name: fileName, url: absolute, ...(size !== undefined ? { size } : {}), ...(sha256 ? { sha256 } : {}) };
}

export async function loadRemoteCatalog(
	input: string,
	fetchImpl: ManifestFetch = fetch,
	installedNames: Set<string> | string[] = []
): Promise<{ catalog: RemoteCatalog; installed: Set<string> }> {
	const trimmed = input.trim();
	if (!trimmed) throw new Error('Informe a URL do bucket.');
	if (isDirectSqliteUrl(trimmed)) {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== 'https:') throw new Error('Use uma URL https pública.');
		const name = decodeURIComponent(parsed.pathname.split('/').pop() ?? 'biblia.sqlite');
		return {
			catalog: {
				baseUrl: trimmed,
				entries: [{ name, url: parsed.toString() }],
				diagnostics: []
			},
			installed: new Set(Array.isArray(installedNames) ? installedNames : [...installedNames])
		};
	}
	const baseUrl = normalizeBaseUrl(trimmed);
	const candidates = [`${baseUrl}manifest.json`, `${baseUrl}index.json`];
	let lastError: unknown = null;
	for (const candidate of candidates) {
		let response: Response;
		try {
			response = await fetchImpl(candidate, { headers: { Accept: 'application/json' } });
		} catch (error) {
			lastError = error;
			throw new Error(
				`Não foi possível ler ${candidate}. O navegador bloqueou a leitura (rede ou CORS). Abra essa URL em nova aba: se abrir, libere o CORS do bucket para este site (Access-Control-Allow-Origin); se der 404/NoSuchKey, publique o manifest.json na raiz.`
			);
		}
		if (candidate.endsWith('index.json') && response.status === 404 && lastError === null) {
			// manifest.json tentado antes falhou com 404; tenta index.json
		}
		if (response.status === 404) {
			lastError = new Error('404');
			if (candidate.endsWith('manifest.json')) continue;
			throw new Error(
				`Bucket sem manifest.json em ${baseUrl}. Publique manifest.json na raiz com { files: [{ name, url }] }.`
			);
		}
		if (!response.ok) {
			throw new Error(`Bucket respondeu HTTP ${response.status} em ${candidate}. Tente de novo.`);
		}
		let payload: unknown;
		try {
			payload = await response.json();
		} catch {
			throw new Error('Manifest inválido. Esperado JSON com { files: [...] }.');
		}
		const files = Array.isArray((payload as Record<string, unknown>)?.files)
			? ((payload as Record<string, unknown>).files as unknown[])
			: null;
		if (!files) throw new Error('Manifest inválido. Esperado JSON com { files: [...] }.');
		const entries: RemoteBibleFile[] = [];
		const diagnostics: string[] = [];
		for (const raw of files) {
			const entry = resolveEntry(baseUrl, raw);
			if (entry) entries.push(entry);
			else diagnostics.push('Item ignorado: esperado { name: *.sqlite, url }.');
		}
		if (entries.length === 0) throw new Error('Nenhum .sqlite encontrado no manifest.');
		return {
			catalog: { baseUrl, entries, diagnostics },
			installed: new Set(Array.isArray(installedNames) ? installedNames : [...installedNames])
		};
	}
	throw lastError instanceof Error ? lastError : new Error('Não foi possível carregar a lista.');
}
