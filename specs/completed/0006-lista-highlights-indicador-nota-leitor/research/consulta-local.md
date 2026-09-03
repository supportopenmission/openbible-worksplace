# Consulta local — SPEC-0006

Proveniência: repositório OpenBible em 2026-09-03. Sem fonte externa.

## Listagem de highlights

`apps/web/src/lib/features/bible/reader-highlights-repository.ts` expõe `listChapterHighlights` com filtro `version_id`, `book_id` e `chapter`. Não há listagem de todos os `reader_highlight` do workspace.

## Navegacao

`apps/web/src/lib/features/navigation/AppSidebar.svelte` declara `links` com Bíblia, Notas, Sermões, Estudos e Configurações. Não há destino `/highlights` nem rótulo Destaques. `INTERFACE.md` confirma as rotas atuais sem `/highlights`.

## Indice de notas

`apps/web/src/lib/features/notes/note-verse-index.ts` e `.specsfy/DATABASE.md` descrevem `note_verse_ref` como espelho de `:::verse`. Refs são removidas ao mover a nota para `trash/`. O `BibleReader` não consulta esse índice para marcar o texto.

## Split da nota

`apps/web/src/lib/features/bible/BibleNoteSplit.svelte` recebe `note` e mostra split no desktop e abas Bíblia/Nota no mobile, sem trocar a rota `/bible`.
