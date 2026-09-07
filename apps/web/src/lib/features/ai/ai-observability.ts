const MAX_EVENTS = 200;
const events: Array<{ id: string; state: string; durationMs?: number; errorCode?: string }> = [];

export function recordAgentEvent(event: { id: string; state: string; durationMs?: number; errorCode?: string }): void {
	events.push({ id: event.id, state: event.state, durationMs: event.durationMs, errorCode: event.errorCode });
	while (events.length > MAX_EVENTS) events.shift();
}

export function diagnosticsSnapshot(): { events: Array<{ id: string; state: string; durationMs?: number; errorCode?: string }>; maxEvents: number; maxAgeDays: number } {
	return { events: [...events], maxEvents: MAX_EVENTS, maxAgeDays: 7 };
}
