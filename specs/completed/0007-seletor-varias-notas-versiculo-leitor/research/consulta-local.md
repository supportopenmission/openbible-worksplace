# Consulta local — SPEC-0007

Proveniência: repositório OpenBible em 2026-09-03. Sem fonte externa.

## Nota única no versículo

`apps/web/src/lib/features/bible/BibleReader.svelte` expõe `noteRefForVerse`, que filtra `chapterNoteRefs` e retorna `matches[0]`. `openNoteFromVerse` abre direto no `BibleNoteSplit` via `readNote`.

## Índice note_verse_ref

`apps/web/src/lib/features/notes/note-verse-index.ts` persiste múltiplas linhas por versículo com `note_path` distinto. Refs somem ao mover nota para `trash/`. Intervalo `verse_start`–`verse_end` cobre cada número do intervalo.

## Títulos de nota

`apps/web/src/lib/features/notes/notes-repository.ts` — `listNotes` lê `notes/<id>.md`, parseia YAML frontmatter (`title`, `updatedAt`) via `note-markdown.ts`. `note_verse_ref` não guarda título.

## Precedentes de UI

- `SelectionActionPopover.svelte` — popover `fixed` ancorado ao versículo (desktop).
- `Sheet` shadcn-svelte — drawer mobile em busca e destaques do leitor.
- `NoteCardList.svelte` — grade de cards em `/notes` com título e `updatedAt`.
- `BibleNoteSplit.svelte` — split desktop / abas mobile sem sair de `/bible`.

## SPEC-0006 fora de escopo

`specs/planned/0006-lista-highlights-indicador-nota-leitor/spec.md` declara seletor multi-nota fora de escopo; ícone com ≥1 nota; clique para nota única.
