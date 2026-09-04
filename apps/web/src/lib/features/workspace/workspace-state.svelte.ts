import { getContext, setContext } from 'svelte';
import { applyTheme } from '$lib/theme/theme';
import { chooseWorkspaceStorage } from '$lib/storage/storage-registry';
import { requestPersistentStorage } from '$lib/storage/persistent-storage';
import {
	DEFAULT_PREFERENCES,
	loadWorkspacePreferences,
	patchWorkspacePreferences,
	writeCachedPreferences
} from '$lib/storage/preferences';
import { bootstrapWorkspace } from '$lib/storage/session';
import type {
	WorkspaceConfig,
	WorkspacePermission,
	WorkspacePreferences,
	WorkspaceSnapshot,
	WorkspaceStatus,
	WorkspaceStorage
} from '$lib/storage/types';
import { loadWorkspaceConfig, prepareWorkspace } from '$lib/storage/workspace';

export type WorkspaceUiStatus = 'loading' | WorkspaceStatus;

const WORKSPACE_KEY = Symbol.for('openbible-workspace');

export class WorkspaceState {
	status = $state<WorkspaceUiStatus>('loading');
	storage = $state<WorkspaceStorage | null>(null);
	config = $state<WorkspaceConfig | null>(null);
	preferences = $state<WorkspacePreferences>(DEFAULT_PREFERENCES);
	persisted = $state<boolean | null>(null);
	permission = $state<WorkspacePermission | null>(null);
	error = $state('');
	private bootFlight: Promise<void> | null = null;

	get showShell() {
		return this.status === 'ready';
	}

	apply(snapshot: WorkspaceSnapshot) {
		this.status = snapshot.status;
		this.storage = snapshot.storage;
		this.config = snapshot.config;
		this.preferences = snapshot.preferences;
		this.persisted = snapshot.persisted;
		this.permission = snapshot.permission;
		this.error = snapshot.error;
		applyTheme(snapshot.preferences.theme);
	}

	async boot(options: { requestPermission?: boolean; requestPersist?: boolean } = {}) {
		if (this.bootFlight) return this.bootFlight;
		if (this.status === 'ready' && !options.requestPermission) return;
		this.bootFlight = this.runBoot(options);
		try {
			await this.bootFlight;
		} finally {
			this.bootFlight = null;
		}
	}

	private async runBoot(options: { requestPermission?: boolean; requestPersist?: boolean }) {
		this.error = '';
		const snapshot = await bootstrapWorkspace({
			requestPermission: options.requestPermission,
			requestPersist: options.requestPersist ?? true
		});
		this.apply(snapshot);
	}

	async grantPermission() {
		await this.boot({ requestPermission: true, requestPersist: true });
		if (this.status === 'permission-needed') {
			this.error = 'A permissão continua necessária para abrir a pasta escolhida.';
		}
	}

	async persistOrigin() {
		this.persisted = await requestPersistentStorage();
	}

	async reconnectFolder() {
		const storage = await chooseWorkspaceStorage();
		await prepareWorkspace(storage);
		await this.markConfigured(storage);
	}

	async markConfigured(storage: WorkspaceStorage) {
		this.storage = storage;
		this.config = await loadWorkspaceConfig(storage);
		this.preferences = await loadWorkspacePreferences(storage);
		this.status = this.config ? 'ready' : 'unconfigured';
		this.permission = 'granted';
		this.error = '';
		applyTheme(this.preferences.theme);
		this.persisted = await requestPersistentStorage();
	}

	async updatePreferences(
		patch: Partial<Omit<WorkspacePreferences, 'version'>>
	): Promise<WorkspacePreferences> {
		const next =
			this.storage && this.status === 'ready'
				? await patchWorkspacePreferences(this.storage, patch)
				: { ...this.preferences, ...patch, version: 1 as const };

		if (!(this.storage && this.status === 'ready')) writeCachedPreferences(next);

		this.preferences = next;
		if (patch.theme) {
			applyTheme(next.theme);
			window.dispatchEvent(new CustomEvent('openbible:theme-changed', { detail: next.theme }));
		}
		if ('initialRoute' in patch) {
			window.dispatchEvent(
				new CustomEvent('openbible:home-route-changed', { detail: next.initialRoute })
			);
		}
		return next;
	}
}

export function setWorkspaceState(state: WorkspaceState): WorkspaceState {
	return setContext(WORKSPACE_KEY, state);
}

export function getWorkspaceState(): WorkspaceState | null {
	return getContext(WORKSPACE_KEY) ?? null;
}
