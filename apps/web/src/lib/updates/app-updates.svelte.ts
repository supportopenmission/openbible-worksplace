import { detectStorageKind } from '$lib/storage/environment';

export type AppUpdateStatus =
	'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'restarting' | 'error';

export interface AppUpdateState {
	status: AppUpdateStatus;
	version: string | null;
	notes: string | null;
	progress: number;
	error: string;
}

type NativeUpdate = {
	version: string;
	body?: string;
	downloadAndInstall: (
		onEvent?: (event: {
			event: string;
			data: { contentLength?: number; chunkLength?: number };
		}) => void
	) => Promise<void>;
};

let state = $state<AppUpdateState>({
	status: 'idle',
	version: null,
	notes: null,
	progress: 0,
	error: ''
});
let pendingNativeUpdate: NativeUpdate | null = null;

export function getAppUpdateState(): AppUpdateState {
	return state;
}

export function openAppUpdateDialog(): void {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('openbible:update-open'));
	}
}

export async function checkForAppUpdate(): Promise<AppUpdateState> {
	if (state.status === 'checking' || state.status === 'downloading') return state;
	state.status = 'checking';
	state.error = '';
	state.progress = 0;

	if (detectStorageKind() !== 'native') {
		pendingNativeUpdate = null;
		state.status = 'up-to-date';
		state.version = null;
		state.notes = 'O PWA atualiza o app shell ao recarregar esta página.';
		return state;
	}

	try {
		const { check } = await import('@tauri-apps/plugin-updater');
		const update = await check({ timeout: 15_000 });
		pendingNativeUpdate = update as NativeUpdate | null;
		if (!update) {
			state.status = 'up-to-date';
			state.version = null;
			state.notes = 'Você já está usando a versão mais recente.';
			return state;
		}

		state.status = 'available';
		state.version = update.version;
		state.notes = update.body ?? 'Uma nova versão do OpenBible está disponível.';
		return state;
	} catch (error) {
		pendingNativeUpdate = null;
		state.status = 'error';
		state.error =
			error instanceof Error ? error.message : 'Não foi possível verificar atualizações.';
		return state;
	}
}

export async function installAppUpdate(): Promise<void> {
	if (detectStorageKind() !== 'native') {
		state.status = 'restarting';
		try {
			const registration = await navigator.serviceWorker?.getRegistration();
			await registration?.update();
		} finally {
			window.location.reload();
		}
		return;
	}

	if (!pendingNativeUpdate) {
		await checkForAppUpdate();
		if (!pendingNativeUpdate) return;
	}

	state.status = 'downloading';
	state.progress = 0;
	state.error = '';
	let contentLength = 0;
	let downloaded = 0;
	try {
		await pendingNativeUpdate.downloadAndInstall((event) => {
			if (event.event === 'Started') contentLength = event.data.contentLength ?? 0;
			if (event.event === 'Progress') downloaded += event.data.chunkLength ?? 0;
			state.progress = contentLength
				? Math.min(100, Math.round((downloaded / contentLength) * 100))
				: 0;
		});
		state.status = 'restarting';
		const { relaunch } = await import('@tauri-apps/plugin-process');
		await relaunch();
	} catch (error) {
		state.status = 'error';
		state.error =
			error instanceof Error ? error.message : 'Não foi possível instalar a atualização.';
	}
}
