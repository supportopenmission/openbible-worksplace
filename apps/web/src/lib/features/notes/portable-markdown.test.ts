import { describe, expect, it } from 'vitest';
import { parseNoteFile, serializeNoteFile } from './portable-markdown';

const SOURCE = `---
id: "note-1"
type: "note"
schemaVersion: 1
customField: "keep-me"
title: "Estudo"
createdAt: "2026-09-05T00:00:00Z"
updatedAt: "2026-09-05T00:00:00Z"
---

# Estudo

Texto autoral.
`;

// SPECSFY: US-001 FR-001 NFR-001 NFR-002 AC-001
describe('portable frontmatter contract', () => {
	it('preserves stable identity, schema version and unknown scalar keys', () => {
		const serialized = serializeNoteFile(parseNoteFile(SOURCE, 'notes/note-1.md'));

		expect(serialized).toContain('id: "note-1"');
		expect(serialized).toContain('schemaVersion: 1');
		expect(serialized).toContain('customField: "keep-me"');
	});
});

// SPECSFY: US-001 FR-001 NFR-002 NFR-004 AC-002
describe('portable Markdown profile', () => {
	it('keeps a readable GFM body while emitting the canonical scalar header', () => {
		const source = SOURCE.replace(
			'Texto autoral.',
			'[referência](https://example.test)\n\n> citação comum'
		);
		const serialized = serializeNoteFile(parseNoteFile(source, 'notes/note-1.md'));

		expect(serialized).toContain('[referência](https://example.test)');
		expect(serialized).toContain('> citação comum');
		expect(serialized).toContain('schemaVersion: 1');
	});
});

// SPECSFY: US-001 FR-001 FR-003 NFR-001 NFR-004 AC-003
describe('tolerant frontmatter diagnostics', () => {
	it('rejects a non-scalar YAML value before a destructive save', () => {
		const invalid = SOURCE.replace('customField: "keep-me"', 'customField:\n  - keep-me');

		expect(() => parseNoteFile(invalid, 'notes/note-1.md')).toThrow(/scalar|frontmatter/i);
	});
});

// SPECSFY: US-003 US-004 FR-004 FR-005 NFR-002 NFR-003 AC-014
describe('portable identity', () => {
	it('keeps ids independent from a moved physical path', () => {
		const note = parseNoteFile(SOURCE, 'notes/moved/note-1.md');
		const serialized = serializeNoteFile(note);

		expect(note.meta.id).toBe('note-1');
		expect(serialized).toContain('id: "note-1"');
		expect(serialized).not.toContain('notes/moved/note-1.md');
	});
});
