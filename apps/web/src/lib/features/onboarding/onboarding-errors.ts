function errorName(error: unknown): string | undefined {
	if (typeof DOMException !== 'undefined' && error instanceof DOMException) return error.name;
	if (typeof error === 'object' && error !== null && 'name' in error) {
		const name = (error as { name?: unknown }).name;
		return typeof name === 'string' ? name : undefined;
	}
	return undefined;
}

export function getDirectoryPickerError(error: unknown): string {
	if (errorName(error) === 'AbortError') {
		return 'A seleção da pasta não foi concluída. Se você clicou em “Selecionar”, o ambiente integrado pode não oferecer acesso a pastas. Abra o OpenBible no Chrome ou tente novamente.';
	}

	if (error instanceof Error) return error.message;
	return 'Não foi possível configurar esta pasta.';
}
