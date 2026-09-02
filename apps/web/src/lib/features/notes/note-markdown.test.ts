import { describe, expect, it } from 'vitest';
import { parseNoteFile, serializeNoteFile, syncTitleWithH1 } from './note-markdown';

const TEMPLATE = `---
title: ""
createdAt: "2026-09-01T00:00:00.000Z"
updatedAt: "2026-09-01T00:00:00.000Z"
type: "note"
---

# Nova nota
`;

// SPECSFY: US-002 FR-002 NFR-001 NFR-002 AC-003
describe('note-markdown H1 and YAML sync', () => {
	it('syncs H1 text into YAML title on save and back on load', () => {
		const parsed = parseNoteFile(TEMPLATE);
		expect(parsed.meta.title).toBe('');
		const updated = syncTitleWithH1(parsed, 'Minha nota');
		const serialized = serializeNoteFile(updated);
		expect(serialized).toContain('title: "Minha nota"');
		expect(serialized).toContain('# Minha nota');
	});
});
