export interface ReminderConfig {
	enabled: boolean;
	time: string;
}

const STORAGE_KEY = 'openbible.reminder';
const DEFAULT_TIME = '09:00';
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const memoryStore = new Map<string, string>();

function storageGet(key: string): string | null {
	try {
		if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
	} catch {
		// Navegação privada pode negar acesso; cai para a memória da sessão.
	}
	return memoryStore.get(key) ?? null;
}

function storageSet(key: string, value: string): void {
	try {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(key, value);
			return;
		}
	} catch {
		// Navegação privada pode negar escrita; cai para a memória da sessão.
	}
	memoryStore.set(key, value);
}

function isValidTime(time: string): boolean {
	return TIME_PATTERN.test(time);
}

function readStored(): Partial<ReminderConfig> | null {
	try {
		const raw = storageGet(STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as Partial<ReminderConfig>;
	} catch {
		return null;
	}
}

export function getReminderConfig(): ReminderConfig {
	const stored = readStored();
	const time = typeof stored?.time === 'string' && isValidTime(stored.time) ? stored.time : DEFAULT_TIME;
	return { enabled: stored?.enabled === true, time };
}

export function saveReminderConfig(config: ReminderConfig): void {
	if (!isValidTime(config.time)) {
		throw new Error(`Horário inválido: ${config.time}. Use o formato HH:MM.`);
	}
	storageSet(STORAGE_KEY, JSON.stringify({ enabled: config.enabled, time: config.time }));
}

export function nextReminderInMs(now: Date, time: string): number {
	if (!isValidTime(time)) {
		throw new Error(`Horário inválido: ${time}. Use o formato HH:MM.`);
	}
	const [hours, minutes] = time.split(':').map(Number);
	const next = new Date(now);
	next.setHours(hours, minutes, 0, 0);
	if (next.getTime() <= now.getTime()) {
		next.setDate(next.getDate() + 1);
	}
	return next.getTime() - now.getTime();
}

export function scheduleDailyReminder(config: ReminderConfig, notify: () => void): () => void {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let cancelled = false;

	function arm() {
		if (cancelled || !config.enabled) return;
		const delay = nextReminderInMs(new Date(), config.time);
		timer = setTimeout(() => {
			if (cancelled || !config.enabled) return;
			notify();
			arm();
		}, delay);
	}

	arm();

	return () => {
		cancelled = true;
		if (timer) clearTimeout(timer);
	};
}

export async function requestReminderPermission(): Promise<NotificationPermission> {
	if (typeof Notification === 'undefined') return 'denied';
	if (Notification.permission === 'granted' || Notification.permission === 'denied') {
		return Notification.permission;
	}
	return Notification.requestPermission();
}
