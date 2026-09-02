# Pesquisa: índice SQLite auxiliar para referências de versículo

**Fontes:** `.specsfy/DATABASE.md`, backlog BACKLOG-0004, SPEC-0003  
**Acesso:** 2026-09-01

## Princípio File Over Apps

- Arquivo `notes/<noteId>.md` é fonte; fence `:::verse` contém referência + snapshot.
- `.openbible/index.sqlite` permanece auxiliar; **não** substitui Markdown.

## Tabela proposta: `note_verse_ref`

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| id | INTEGER PK | autoincrement |
| note_path | TEXT NOT NULL | caminho relativo no workspace, ex. `notes/abc123.md` |
| block_index | INTEGER NOT NULL | ordem do bloco na nota (0-based) |
| version_id | TEXT NOT NULL | nome do arquivo em `bibles/` |
| book_id | INTEGER NOT NULL | id OpenLP |
| book_name | TEXT NOT NULL | nome legível |
| chapter | INTEGER NOT NULL | capítulo |
| verse_start | INTEGER NOT NULL | versículo inicial |
| verse_end | INTEGER NOT NULL | versículo final |

- Índices: `(note_path)`, `(version_id, book_id, chapter)`.
- Reindexação: ao salvar nota, apagar refs da `note_path` e reinserir parseando fences do Markdown.
- Consulta inversa (futuro): "notas que citam João 3:16" via `WHERE version_id AND book_id AND chapter AND verse_start <= 16 AND verse_end >= 16`.

## Migração

- Primeira escrita na feature cria schema se ausente; não altera SQLite em `bibles/`.
