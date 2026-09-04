import { describe, expect, it } from 'vitest';
import {
	extractContentFromNoteBody,
	extractTitleFromMarkdown,
	parseNoteFile,
	serializeNoteFile,
	syncTitleWithH1
} from './note-markdown';
import { roundtripMarkdown } from './milkdown-markdown-io';

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

	// SPECSFY: US-002 FR-002 NFR-002 AC-012
	it('strips literal markdown heading markers from the YAML title', () => {
		const parsed = parseNoteFile(TEMPLATE);
		const updated = syncTitleWithH1(parsed, '##  Minha nota  ');
		const serialized = serializeNoteFile(updated);
		expect(updated.meta.title).toBe('Minha nota');
		expect(serialized).toContain('title: "Minha nota"');
		expect(serialized).toContain('\n# Minha nota\n');
		expect(serialized).not.toContain('# ##');
	});

	// SPECSFY: US-002 FR-002 NFR-002 AC-003 AC-012
	it('loads a non-H1 first heading as one canonical H1 without changing later headings', () => {
		const source = TEMPLATE.replace('# Nova nota', '## Nova nota\n\n## Seção preservada');
		const parsed = parseNoteFile(source);
		const updated = syncTitleWithH1(parsed, 'Nova nota');
		expect(updated.body.match(/^# Nova nota$/gm)).toHaveLength(1);
		expect(updated.body).toContain('## Seção preservada');
	});

	// SPECSFY: US-001 US-002 FR-001 FR-002 NFR-002 AC-011 AC-012
	it('keeps title normalization idempotent across repeated saves', () => {
		const first = syncTitleWithH1(parseNoteFile(TEMPLATE), '# Título limpo');
		const second = syncTitleWithH1(parseNoteFile(serializeNoteFile(first)), first.meta.title);
		expect(second.meta.title).toBe('Título limpo');
		expect(second.body.match(/^# Título limpo$/gm)).toHaveLength(1);
	});
});

// SPECSFY: US-001 FR-002 FR-005 NFR-003 AC-018
describe('milkdown files over app', () => {
	it('keeps Milkdown-saved files readable outside the app', () => {
		const file = serializeNoteFile(syncTitleWithH1(parseNoteFile(TEMPLATE), 'Salmo 23'));
		const body = file.slice(file.indexOf('# Salmo 23'));
		expect(roundtripMarkdown(body)).toBe(body);
		expect(file).toContain('title: "Salmo 23"');
		expect(file).toContain('type: "note"');
	});

	it('parses and serializes description property in frontmatter', () => {
		const source = `---
title: "Nota com descrição"
description: "Resumo da mensagem"
createdAt: "2026-09-01T00:00:00.000Z"
updatedAt: "2026-09-01T00:00:00.000Z"
type: "note"
---

# Nota com descrição
`;
		const parsed = parseNoteFile(source);
		expect(parsed.meta.description).toBe('Resumo da mensagem');
		const serialized = serializeNoteFile(parsed);
		expect(serialized).toContain('description: "Resumo da mensagem"');
	});

	it('parses and serializes pinned property in frontmatter', () => {
		const source = `---
title: "Nota fixada"
pinned: "true"
createdAt: "2026-09-01T00:00:00.000Z"
updatedAt: "2026-09-01T00:00:00.000Z"
type: "note"
---

# Nota fixada
`;
		const parsed = parseNoteFile(source);
		expect(parsed.meta.pinned).toBe(true);
		const serialized = serializeNoteFile(parsed);
		expect(serialized).toContain('pinned: true');
	});

	it('extracts note body content by stripping leading H1', () => {
		expect(extractContentFromNoteBody('# Título\n\nConteúdo da nota')).toBe('Conteúdo da nota');
		expect(extractContentFromNoteBody('# Título\n')).toBe('');
		expect(extractContentFromNoteBody('Conteúdo sem H1')).toBe('Conteúdo sem H1');
		expect(extractContentFromNoteBody('')).toBe('');
	});

	it('extracts note title from markdown', () => {
		expect(extractTitleFromMarkdown('# Minha Nota\n\ntexto')).toBe('Minha Nota');
		expect(extractTitleFromMarkdown('texto sem título')).toBeNull();
		expect(extractTitleFromMarkdown('')).toBeNull();
	});
});
