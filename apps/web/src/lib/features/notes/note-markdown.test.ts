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

	// SPECSFY: US-002 FR-002 FR-007 NFR-002 AC-012
	it('strips literal markdown heading markers from the YAML title', () => {
		const parsed = parseNoteFile(TEMPLATE);
		const updated = syncTitleWithH1(parsed, '##  Minha nota  ');
		const serialized = serializeNoteFile(updated);
		expect(updated.meta.title).toBe('Minha nota');
		expect(serialized).toContain('title: "Minha nota"');
		expect(serialized).toContain('\n# Minha nota\n');
		expect(serialized).not.toContain('# ##');
	});

	// SPECSFY: US-002 FR-002 FR-007 NFR-002 AC-003 AC-012
	it('loads a non-H1 first heading as one canonical H1 without changing later headings', () => {
		const source = TEMPLATE.replace('# Nova nota', '## Nova nota\n\n## Seção preservada');
		const parsed = parseNoteFile(source);
		const updated = syncTitleWithH1(parsed, 'Nova nota');
		expect(updated.body.match(/^# Nova nota$/gm)).toHaveLength(1);
		expect(updated.body).toContain('## Seção preservada');
	});

	// SPECSFY: US-001 US-002 FR-001 FR-002 FR-007 NFR-002 AC-011 AC-012
	it('keeps title normalization idempotent across repeated saves', () => {
		const first = syncTitleWithH1(parseNoteFile(TEMPLATE), '# Título limpo');
		const second = syncTitleWithH1(parseNoteFile(serializeNoteFile(first)), first.meta.title);
		expect(second.meta.title).toBe('Título limpo');
		expect(second.body.match(/^# Título limpo$/gm)).toHaveLength(1);
	});
});
