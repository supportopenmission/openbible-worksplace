<script lang="ts">
	import '../app.css';
	import WorkspaceProvider from '$lib/features/workspace/WorkspaceProvider.svelte';
	import AppFrame from '$lib/features/workspace/AppFrame.svelte';
	import { getReminderConfig, scheduleDailyReminder } from '$lib/pwa/daily-reminder';
	import {
		configureOpenBibleServiceWorker,
		SERVICE_WORKER_UPDATE_EVENT
	} from '$lib/pwa/service-worker-registration';
	import { markPwaUpdateAvailable, openAppUpdateDialog } from '$lib/updates/app-updates.svelte';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let cancelReminder: (() => void) | null = null;

	function startDailyReminder() {
		cancelReminder?.();
		cancelReminder = null;
		const config = getReminderConfig();
		if (
			!config.enabled ||
			typeof Notification === 'undefined' ||
			Notification.permission !== 'granted'
		) {
			return;
		}
		cancelReminder = scheduleDailyReminder(config, () => {
			new Notification('Hora de estudar a Bíblia', {
				body: 'Reserve um momento para leitura e estudo.',
				tag: 'openbible-daily-reminder'
			});
		});
	}

	onMount(() => {
		startDailyReminder();
		window.addEventListener('openbible:reminder-changed', startDailyReminder);
		const handlePwaUpdate = () => {
			markPwaUpdateAvailable();
			openAppUpdateDialog();
		};
		window.addEventListener(SERVICE_WORKER_UPDATE_EVENT, handlePwaUpdate);

		if (!('serviceWorker' in navigator)) {
			return () => {
				window.removeEventListener('openbible:reminder-changed', startDailyReminder);
				window.removeEventListener(SERVICE_WORKER_UPDATE_EVENT, handlePwaUpdate);
				cancelReminder?.();
			};
		}

		void configureOpenBibleServiceWorker({
			development: dev,
			serviceWorker: navigator.serviceWorker,
			cacheStorage: 'caches' in globalThis ? globalThis.caches : undefined
		}).catch((error: unknown) => {
			console.warn('Não foi possível sincronizar o modo offline do OpenBible.', error);
		});

		return () => {
			window.removeEventListener('openbible:reminder-changed', startDailyReminder);
			window.removeEventListener(SERVICE_WORKER_UPDATE_EVENT, handlePwaUpdate);
			cancelReminder?.();
		};
	});
</script>

<WorkspaceProvider>
	<AppFrame>
		{@render children()}
	</AppFrame>
</WorkspaceProvider>
