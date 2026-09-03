import { describe, expect, it } from 'vitest';

interface ReminderModule {
	getReminderConfig: () => { enabled: boolean; time: string };
	saveReminderConfig: (config: { enabled: boolean; time: string }) => void;
	nextReminderInMs: (now: Date, time: string) => number;
	scheduleDailyReminder: (
		config: { enabled: boolean; time: string },
		notify: () => void
	) => () => void;
}

async function loadModule(): Promise<ReminderModule> {
	try {
		return (await import('./daily-reminder.js')) as ReminderModule;
	} catch {
		expect.unreachable('SPECSFY RED: módulo daily-reminder ausente');
	}
}

describe('lembrete diário local', () => {
	// SPECSFY: US-003 FR-003 FR-006 NFR-002 AC-007
	it('agenda o próximo disparo para o horário configurado', async () => {
		const mod = await loadModule();
		expect(typeof mod.scheduleDailyReminder).toBe('function');
		const now = new Date(2026, 8, 3, 8, 0, 0);
		const delay = mod.nextReminderInMs(now, '09:00');
		expect(delay).toBe(60 * 60 * 1000);
	});

	// SPECSFY: US-003 FR-006 NFR-003 AC-008
	it('persiste horário editável e rejeita horário inválido', async () => {
		const mod = await loadModule();
		expect(mod.getReminderConfig()).toEqual({ enabled: false, time: '09:00' });
		mod.saveReminderConfig({ enabled: true, time: '07:30' });
		expect(mod.getReminderConfig()).toEqual({ enabled: true, time: '07:30' });
		expect(() => mod.saveReminderConfig({ enabled: true, time: '25:99' })).toThrow();
	});
});
