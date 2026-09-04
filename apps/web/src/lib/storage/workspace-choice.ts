export interface NativeWorkspaceChoice {
	kind: 'native';
	path: string;
}

export function chooseNativeWorkspace(path: string): NativeWorkspaceChoice {
	if (!path || !path.startsWith('/')) throw new Error('Escolha uma pasta absoluta.');
	return { kind: 'native', path };
}
