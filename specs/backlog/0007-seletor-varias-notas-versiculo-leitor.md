# Backlog: Seletor de várias notas no versículo do leitor

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0007 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Leitor da Bíblia |
| Funcionalidade | Seletor de várias notas no versículo |
| Tipo | Funcionalidade |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-03 |
| Spec promovida | `specs/planned/0007-seletor-varias-notas-versiculo-leitor/spec.md` |
| Área em descoberta | Jornada multi-nota — decisões principais fechadas |
| Brief testável | Sim |

## Ideia original

Quando houver mais de uma nota ativa no mesmo versículo, o ícone do leitor deve permitir escolher qual abrir.

## Problema percebido

Com duas ou mais notas em Gn 5.2, o leitor abre só a primeira ref do índice (`noteRefForVerse` → `matches[0]`); a pessoa não vê nem escolhe as demais.

## Pessoa afetada ou beneficiada

Pessoa usuária individual que estuda no leitor `/bible` e cria várias notas sobre o mesmo versículo.

## Resultado ou valor esperado

Escolher qual nota abrir quando houver várias no mesmo versículo, sem sair de `/bible` e sem vínculo persistente com highlight (DEC-002).

## Contexto

Explicitamente fora de escopo da SPEC-0006 (clique do ícone especificado para nota única). O índice `note_verse_ref` já persiste múltiplas linhas por versículo (`note_path` distinto). `BibleNoteSplit`, `NoteCardList` e popover/sheet do leitor são precedentes reutilizáveis.

## Referências relacionadas

- `specs/planned/0006-lista-highlights-indicador-nota-leitor/spec.md` — entregou ícone + nota única; seletor multi-nota ficou fora.
- `specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md` — DEC-002, `BibleNoteSplit`.
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md` — `:::verse`, `note_verse_ref`.
- `apps/web/src/lib/features/bible/BibleReader.svelte` — `noteRefForVerse`, `openNoteFromVerse`.
- `apps/web/src/lib/features/notes/NoteCardList.svelte` — cards de `/notes` como referência visual.

## Comportamento esperado

**Decisões confirmadas (conversa 2026-09-03):**

- **1 nota no versículo:** clique no ícone abre direto a nota no split desktop / abas mobile (comportamento atual da SPEC-0006).
- **2+ notas no versículo:** clique no ícone abre primeiro um **seletor compacto** com os **títulos** das notas daquele versículo; clique num título abre **essa** nota no split/abas.
- **Desktop:** seletor compacto como **popover** ancorado ao ícone (padrão do `SelectionActionPopover`).
- **Mobile:** seletor compacto como **drawer** (Sheet shadcn-svelte, padrão dos outros fluxos do leitor).
- **Ver todas:** botão no seletor compacto abre o split com **grade de cards** (visual equivalente a `/notes`, filtrada pelas notas daquele versículo); clique num card abre o editor da nota escolhida. No mobile, **Ver todas** é o caminho principal para a lista completa (popover vira drawer; botão leva aos cards no painel da nota).
- **Badge:** contagem no ícone quando ≥2 notas; valores 2–9 numéricos; **10+ mostra `9+`**.
- **Ordenação:** `updatedAt` decrescente (mais recente primeiro) no popover, drawer e cards.
- **Título:** ler frontmatter YAML de cada `notes/<id>.md` referenciado (`title`, `updatedAt`); índice SQLite só traz `note_path`, não título.

**Implementação (inferência técnica, não schema novo):**

- Deduplicar por `note_path` quando a mesma nota tiver vários blocos `:::verse` no mesmo versículo.
- Carregar metadados sob demanda ao abrir seletor (leitura parcial do arquivo, padrão de `listNotes`).

## Regras de negócio

- Preservar DEC-002: ícone não é highlight; sem vínculo persistente nota ↔ destaque.
- Notas em `trash/` não entram no seletor; ícone some quando não há refs ativas.
- Intervalo `verseStart`–`verseEnd` continua valendo (nota em 5.2–5.5 aparece em 5.3, etc.).
- Permanece em `/bible`; não redirecionar para `/notes/[id]` ao abrir do leitor.

## Critérios de aceitação

- Given um versículo com **uma** nota ativa, When a pessoa clica no ícone, Then a nota abre direto no split/abas (sem seletor).
- Given um versículo com **duas ou mais** notas ativas, When a pessoa clica no ícone, Then o ícone mostra badge (2–9 ou `9+`) e abre o seletor compacto com títulos ordenados da mais recente para a mais antiga.
- Given o mesmo cenário no mobile, When a pessoa clica no ícone, Then um drawer (Sheet) lista os títulos com a mesma semântica.
- Given o seletor compacto aberto com 2+ notas, When a pessoa clica em **Ver todas**, Then o split mostra cards filtrados daquele versículo; When clica num card, Then abre o editor dessa nota.
- Given notas só na lixeira, When a pessoa lê o capítulo, Then não há ícone no versículo.

## Qualidades e operação

- Segurança: uso individual local; sem rede nova.
- Privacidade: notas permanecem no workspace.
- Desempenho: carregar títulos só ao abrir seletor ou capítulo; volume típico baixo por versículo.
- Acessibilidade: popover/drawer com `role="dialog"`, foco e Escape; lista de títulos navegável por teclado.

## Dependências

- SPEC-0006 (ícone e split existentes).
- SPEC-0004 / SPEC-0005 (`note_verse_ref`, `BibleNoteSplit`, DEC-002).
- `NoteCardList` ou variante filtrada por versículo.

## Situações de erro

- Título indisponível: fallback para ID ou “Sem título”.
- Nota apagada após indexação: omitir da lista; recarregar refs do capítulo.
- Workspace indisponível: seletor não abre; mensagem recuperável.

## Escopo

- Dentro: seletor multi-nota no ícone; popover desktop; drawer mobile; botão Ver todas → cards no split; 1 nota mantém atalho direto.
- Fora: vincular nota a highlight; editar notas em massa; filtros/busca além do versículo; mudar `bibles/*.sqlite`.

## Dúvidas, decisões e riscos

- **Decidido — Seletor compacto primeiro:** popover (desktop) / drawer (mobile) com títulos; item abre a nota. Fonte: conversa 2026-09-03.
- **Decidido — Ver todas:** abre split com cards estilo `/notes`. Fonte: conversa 2026-09-03.
- **Decidido — Badge no ícone:** quando houver 2+ notas, mostrar contagem; acima de 9 exibir `9+`. Fonte: conversa 2026-09-03.
- **Decidido — Ordenação:** mais recente primeiro (`updatedAt` decrescente). Fonte: conversa 2026-09-03.
- **Decidido — Título:** `note_verse_ref` **não** guarda título; ler de `notes/<id>.md` via frontmatter YAML (`title`, `updatedAt`), como `listNotes` / `/notes`. Fallback: H1 ou “Sem título”. Fonte: conversa 2026-09-03 + `.specsfy/DATABASE.md` + `notes-repository.ts`.
- **Risco:** `noteRefForVerse` e testes da SPEC-0006 assumem nota única — exigem extensão, não quebra de DEC-002.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover a `$specsfy-03-specify` quando a pessoa pedir implementação.
