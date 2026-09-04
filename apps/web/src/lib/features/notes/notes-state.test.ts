import { describe, expect, it } from 'vitest';
import { getNoteSnippet } from './notes-state.svelte';

describe('getNoteSnippet', () => {
	it('returns "Nota vazia" for empty or undefined content', () => {
		expect(getNoteSnippet('')).toBe('Nota vazia');
		expect(getNoteSnippet(undefined)).toBe('Nota vazia');
		expect(getNoteSnippet('   \n\t  ')).toBe('Nota vazia');
	});

	it('strips HTML tags and preserves readable text with spaces', () => {
		const content = 'Como podemos fazer as coisas? Como podemos fazer as coisas? [ ] Tarefa 1 <br /> Como podemos fazer as coisas?';
		const snippet = getNoteSnippet(content, 'Nova nota 15:19');
		expect(snippet).toBe('Como podemos fazer as coisas? Como podemos fazer as coisas? Tarefa 1 Como podemos fazer as coisas?');
		expect(snippet).not.toContain('<br />');
		expect(snippet).not.toContain('[ ]');
	});

	it('strips task list checkboxes ([ ], [x], [X])', () => {
		const content = `
- [ ] Primeira tarefa
* [x] Segunda tarefa concluída
+ [X] Terceira tarefa concluída
[ ] Tarefa sem traço
`;
		const snippet = getNoteSnippet(content);
		expect(snippet).toBe('Primeira tarefa Segunda tarefa concluída Terceira tarefa concluída Tarefa sem traço');
		expect(snippet).not.toContain('[');
		expect(snippet).not.toContain(']');
	});

	it('extracts readable verse text from :::verse fences without leaking directive codes', () => {
		const content = `
# Estudo em Deuteronômio

:::verse{versionId="biblesACF.sqlite" version="ACF" bookId="5" book="Deuteronômio" chapter="1" verseStart="3" verseEnd="3"}
3 E sucedeu no ano quadragésimo, no mês undécimo, no primeiro dia do mês, que Moisés falou aos filhos de Israel...
:::

Minhas observações sobre este capítulo.
`;
		const snippet = getNoteSnippet(content, 'Estudo em Deuteronômio');
		expect(snippet).toContain('3 E sucedeu no ano quadragésimo');
		expect(snippet).toContain('Minhas observações sobre este capítulo.');
		expect(snippet).not.toContain(':::verse');
		expect(snippet).not.toContain('biblesACF.sqlite');
		expect(snippet).not.toContain(':::');
	});

	it('strips unclosed directive lines gracefully', () => {
		const content = `
:::verse{versionId="test"}
Texto de teste
:::
`;
		const snippet = getNoteSnippet(content);
		expect(snippet).toBe('Texto de teste');
		expect(snippet).not.toContain(':::');
	});

	it('decodes HTML entities and removes HTML tags like <p>, <div>, <br>', () => {
		const content = '<p>Olá&nbsp;Mundo! &amp; Bem-vindo &lt;OpenBible&gt; &quot;App&quot;</p><br/><br>';
		const snippet = getNoteSnippet(content);
		expect(snippet).toBe('Olá Mundo! & Bem-vindo <OpenBible> "App"');
	});

	it('strips markdown images, links, blockquotes, code blocks, and inline formatting', () => {
		const content = `
# Título da Nota

![imagem ilustrativa](https://example.com/img.png)
> Esta é uma citação importante sobre [Salmos](https://example.com).

\`\`\`ts
const x = 10;
\`\`\`

Aqui está um texto com **negrito**, *itálico*, e \`código inline\`.
`;
		const snippet = getNoteSnippet(content, 'Título da Nota');
		expect(snippet).toBe('Esta é uma citação importante sobre Salmos. const x = 10; Aqui está um texto com negrito, itálico, e código inline.');
		expect(snippet).not.toContain('#');
		expect(snippet).not.toContain('http');
		expect(snippet).not.toContain('```');
		expect(snippet).not.toContain('*');
		expect(snippet).not.toContain('`');
	});

	it('strips frontmatter metadata correctly', () => {
		const content = `---
title: "Título Frontmatter"
createdAt: "2026-09-01T00:00:00.000Z"
type: "note"
---

# Título Frontmatter

Este é o corpo da nota.
`;
		const snippet = getNoteSnippet(content, 'Título Frontmatter');
		expect(snippet).toBe('Este é o corpo da nota.');
		expect(snippet).not.toContain('createdAt');
	});

	it('uses description property from YAML frontmatter when present', () => {
		const content = `---
title: "Estudo em Romanos"
description: "Resumo teológico sobre justificação pela fé e graça."
createdAt: "2026-09-01T00:00:00.000Z"
type: "note"
---

# Estudo em Romanos

Texto longo do corpo da nota que não deve aparecer na prévia quando houver description.
`;
		const snippet = getNoteSnippet(content, 'Estudo em Romanos');
		expect(snippet).toBe('Resumo teológico sobre justificação pela fé e graça.');
	});

	it('prefers explicit description argument if passed', () => {
		const content = 'Conteúdo do corpo da nota.';
		const snippet = getNoteSnippet(content, 'Nota', 'Descrição explícita');
		expect(snippet).toBe('Descrição explícita');
	});
});

describe('notesState pinned and management operations', () => {
	it('sorts pinned notes first regardless of updatedAt timestamp', async () => {
		const { notesState } = await import('./notes-state.svelte');
		notesState.notes = [
			{
				id: 'nota-normal-nova',
				title: 'Nota Recente Não Fixada',
				body: '# Nota Recente Não Fixada',
				content: '# Nota Recente Não Fixada',
				path: 'notes/nota-normal-nova.md',
				createdAt: '2026-09-04T12:00:00.000Z',
				updatedAt: '2026-09-04T12:00:00.000Z',
				meta: {
					id: 'nota-normal-nova',
					title: 'Nota Recente Não Fixada',
					createdAt: '2026-09-04T12:00:00.000Z',
					updatedAt: '2026-09-04T12:00:00.000Z',
					type: 'note',
					path: 'notes/nota-normal-nova.md'
				}
			},
			{
				id: 'nota-fixada-antiga',
				title: 'Nota Antiga Fixada',
				pinned: true,
				body: '# Nota Antiga Fixada',
				content: '# Nota Antiga Fixada',
				path: 'notes/nota-fixada-antiga.md',
				createdAt: '2026-09-01T00:00:00.000Z',
				updatedAt: '2026-09-01T00:00:00.000Z',
				meta: {
					id: 'nota-fixada-antiga',
					title: 'Nota Antiga Fixada',
					pinned: true,
					createdAt: '2026-09-01T00:00:00.000Z',
					updatedAt: '2026-09-01T00:00:00.000Z',
					type: 'note',
					path: 'notes/nota-fixada-antiga.md'
				}
			}
		];
		notesState.searchQuery = '';

		const filtered = notesState.filteredNotes;
		expect(filtered[0].id).toBe('nota-fixada-antiga');
		expect(filtered[1].id).toBe('nota-normal-nova');
	});

	function createMockNote(fields: Partial<import('./note-types').Note> & { id: string; title: string }) {
		const now = '2026-09-01T00:00:00.000Z';
		const id = fields.id;
		const title = fields.title;
		const path = fields.path ?? `notes/${id}.md`;
		const createdAt = fields.createdAt ?? now;
		const updatedAt = fields.updatedAt ?? now;
		const body = fields.body ?? '';
		const content = fields.content ?? body;
		const pinned = fields.pinned;
		return {
			id,
			title,
			path,
			createdAt,
			updatedAt,
			body,
			content,
			pinned,
			meta: {
				id,
				title,
				path,
				createdAt,
				updatedAt,
				pinned,
				type: 'note' as const
			},
			...fields
		};
	}

	it('sorts notes by title (asc/desc) while keeping pinned at top', async () => {
		const { notesState } = await import('./notes-state.svelte');
		notesState.notes = [
			createMockNote({
				id: 'nota-z',
				title: 'Zebra',
				createdAt: '2026-09-01T00:00:00.000Z',
				updatedAt: '2026-09-01T00:00:00.000Z'
			}),
			createMockNote({
				id: 'nota-a',
				title: 'Abelha',
				createdAt: '2026-09-02T00:00:00.000Z',
				updatedAt: '2026-09-02T00:00:00.000Z'
			}),
			createMockNote({
				id: 'nota-pinned-m',
				title: 'Macaco Fixado',
				pinned: true,
				createdAt: '2026-09-03T00:00:00.000Z',
				updatedAt: '2026-09-03T00:00:00.000Z'
			})
		];
		notesState.searchQuery = '';

		notesState.setSort('title', 'asc');
		let filtered = notesState.filteredNotes;
		expect(filtered[0].id).toBe('nota-pinned-m'); // Pinned stays on top
		expect(filtered[1].id).toBe('nota-a');
		expect(filtered[2].id).toBe('nota-z');

		notesState.setSort('title', 'desc');
		filtered = notesState.filteredNotes;
		expect(filtered[0].id).toBe('nota-pinned-m');
		expect(filtered[1].id).toBe('nota-z');
		expect(filtered[2].id).toBe('nota-a');
	});

	it('supports multi-selection and bulk operations', async () => {
		const { notesState } = await import('./notes-state.svelte');
		notesState.notes = [
			createMockNote({ id: 'n1', title: 'Nota 1' }),
			createMockNote({ id: 'n2', title: 'Nota 2' }),
			createMockNote({ id: 'n3', title: 'Nota 3' })
		];
		notesState.searchQuery = '';

		expect(notesState.selectionMode).toBe(false);
		notesState.toggleSelectionMode();
		expect(notesState.selectionMode).toBe(true);

		notesState.toggleSelectNote('n1');
		expect(notesState.selectedNoteIds).toEqual(['n1']);

		notesState.toggleSelectNote('n3');
		expect(notesState.selectedNoteIds).toEqual(['n1', 'n3']);

		notesState.toggleSelectNote('n1');
		expect(notesState.selectedNoteIds).toEqual(['n3']);

		notesState.selectAllNotes();
		expect(notesState.selectedNoteIds).toHaveLength(3);

		notesState.clearSelection();
		expect(notesState.selectedNoteIds).toHaveLength(0);

		notesState.toggleSelectionMode();
		expect(notesState.selectionMode).toBe(false);
	});
});
