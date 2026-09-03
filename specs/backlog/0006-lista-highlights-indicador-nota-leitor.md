# Backlog: Lista de highlights e indicador de nota no leitor

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0006 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Leitor da Bíblia |
| Funcionalidade | Lista de highlights e indicador de nota no reader |
| Tipo | Funcionalidade |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-03 |
| Spec promovida | specs/planned/0006-lista-highlights-indicador-nota-leitor/spec.md |
| Área em descoberta | Encerrada — brief testável |
| Brief testável | Sim |

## Ideia original

E sheet para mostrar todos os highlighs, e uma pagina que mostre eles tbm. E quando houver uma nota precisa ter um indicativo no texto bilico na pagina do leitor

## Problema percebido

Depois de destacar e criar notas no leitor /bible, a pessoa não consulta os highlights numa lista e não percebe no texto bíblico que um trecho já tem nota.

## Pessoa afetada ou beneficiada

Pessoa usuária individual, sem conta, que lê a Bíblia e elabora os próprios estudos e notas no workspace local.

## Resultado ou valor esperado

Ver os highlights num sheet e também numa página; e, no texto bíblico do leitor, um indicativo quando houver nota naquele trecho.

## Contexto

Acréscimo à SPEC-0005 completed (seleção, popover, reader_highlight no index.sqlite, copiar, criar nota independente; DEC-002: destacar não cria nota, nota não aplica highlight, sem vínculo persistente). Sheet shadcn-svelte já existe no BibleReader (busca e seletor). Notas File Over Apps com fence :::verse e índice note_verse_ref. Origem: specs/inbox/2026-09-03-013346-sheet-pagina-de-highlights-e-indicador-de-nota-no-leitor.md. Fora desta fatia, salvo citação explícita: bugs de seleção múltipla e underline/wavy em correção paralela. Painel Highlighting permanente ficou fora da 0005. Rota `/highlights` e item no menu lateral foram decididos nesta descoberta (ainda não existem no produto).

## Referências relacionadas

- `specs/inbox/2026-09-03-013346-sheet-pagina-de-highlights-e-indicador-de-nota-no-leitor.md` — origem; não é duplicata.
- `specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md` — spec relacionada: entrega seleção, popover, `reader_highlight`, copiar e criar nota independente; fora de escopo inclui “painel Highlighting permanente” e “vincular nota a highlight” (DEC-002).
- `specs/backlog/0005-selecao-versiculos-highlights-nota-leitor.md` — backlog promovido da 0005; precedente, não atualizar como se fosse o mesmo problema.
- `specs/inbox/2026-09-02-223541-selecao-de-versiculos-highlights-e-nota-no-leitor-bible.md` — inbox da 0005; complementar.
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md` — spec relacionada: fence `:::verse`, índice `note_verse_ref`, highlight TipTap do canvas (domínio distinto).
- `INTERFACE.md` — `Sheet` já usado em `BibleReader` (busca/seletor) e `VerseSelector`; rotas atuais `/`, `/bible`, `/sermons`, `/study`, `/config`, `/notes`; sem `/highlights`.
- `.specsfy/DATABASE.md` — `reader_highlight` (destaques do reader, sem ponte para nota) e `note_verse_ref` (espelho de `:::verse`; refs removidas ao ir para `trash/`).
- `PROJECT.md` e `.specsfy/USER-PROFILE.md` — uso individual, File Over Apps, SQLite auxiliar para índices e destaques.

## Pesquisa de duplicatas

Não é duplicata. Nenhuma inbox, backlog ou spec cobre lista consultável de highlights (sheet + página) nem indicativo de nota no texto do reader. A 0005 entregou criar/aplicar destaque e criar nota, e excluiu explicitamente o painel permanente e o vínculo persistente nota–highlight.

## Vocabulário (MCR-10, análise silenciosa)

| Termo | Sentido neste item | Risco |
| --- | --- | --- |
| Highlight do reader | Anotação em `reader_highlight` (intervalo + `style_id`) | Homônimo do highlight TipTap da nota |
| Todos os highlights | Todos os destaques do workspace, em qualquer versão, livro ou capítulo; sheet e página mostram o mesmo conjunto | Decisão da Pergunta 1 (2026-09-03) |
| Sheet | Lista workspace-wide aberta pelos controles do leitor em `/bible` | Primitive shadcn-svelte já usada no `BibleReader` |
| Página | Rota nova `/highlights` no menu lateral, junto de Bíblia e Notas | Decisão da jornada (2026-09-03); a rota ainda não existe no produto |
| Indicativo de nota | Ícone discreto ao lado do número do versículo; o clique abre a nota em split/abas | Decisão do indicativo (2026-09-03); não é highlight; não reabre DEC-002 |
| Trecho com nota | Nota ativa cujo fence `:::verse` está no índice `note_verse_ref` (lixeira não conta) | Evidência do produto SPEC-0004 / DATABASE.md; não é decisão nova da pessoa |

## Comportamento esperado

**Declaração do usuário:**

- Um sheet para mostrar todos os highlights.
- Uma página que também mostre os highlights.
- Quando houver uma nota, um indicativo no texto bíblico na página do leitor.

**Decisões confirmadas:**

- Escopo da lista (Pergunta 1, conversa atual, 2026-09-03): todos os destaques do workspace, em qualquer versão, livro ou capítulo. As duas superfícies (sheet e página) mostram o mesmo conjunto. Resposta original: `3`. Perfil: intermediário.
- Jornada (Pergunta 1 desta rodada, conversa atual, 2026-09-03): sheet abre pelos controles do leitor em `/bible`; a página é uma rota nova `/highlights` no menu lateral, junto de Bíblia e Notas. Resposta original: `1`. Perfil: intermediário.
- Indicativo (Pergunta 1 desta rodada, conversa atual, 2026-09-03): ícone discreto ao lado do número do versículo; o clique abre a nota em split no desktop e em abas no mobile (mesmo padrão de criar nota da SPEC-0005). Não reabre DEC-002: destaque e nota continuam sem vínculo persistente. Resposta original: `1`. Perfil: intermediário.

**Inferência (não decisão):**

- O pedido continua a SPEC-0005; sheet e página listam `reader_highlight` do workspace.
- O indicativo consulta o índice já existente `note_verse_ref` (espelho de `:::verse`); notas em `trash/` não geram ícone.

## Regras de negócio

- Preservar DEC-002 da 0005: destacar não cria nota; criar nota não aplica highlight; sem vínculo persistente. O ícone não é um estilo de highlight.
- A lista (sheet e página) cobre todos os destaques do workspace, em qualquer versão, livro ou capítulo; as duas superfícies mostram o mesmo conjunto.
- O sheet abre pelos controles do leitor em `/bible`; a página é a rota `/highlights` no menu lateral, junto de Bíblia e Notas.
- Ícone discreto ao lado do número do versículo quando existir nota ativa que referencia aquele versículo; o clique abre a nota em split (desktop) / abas (mobile).

## Critérios de aceitação

- Given o workspace tem destaques em versões, livros ou capítulos diferentes, When a pessoa abre o sheet pelos controles de `/bible`, Then ela vê todos esses destaques.
- Given o mesmo conjunto, When a pessoa abre `/highlights` pelo menu, Then ela vê o mesmo conjunto que o sheet.
- Given o workspace não tem destaques, When a pessoa abre o sheet ou `/highlights`, Then a lista aparece vazia (sem recorte silencioso).
- Given um versículo do capítulo aberto é referenciado por uma nota ativa, When a pessoa lê o capítulo, Then um ícone discreto aparece ao lado do número desse versículo.
- Given o ícone visível de uma única nota, When a pessoa clica no ícone, Then a nota abre em split no desktop e em abas no mobile, sem sair de `/bible`.
- Given um versículo só tem highlight (sem nota ativa), When a pessoa lê o capítulo, Then não há ícone de nota; o markup do highlight permanece.
- Given um versículo tem highlight e nota, When a pessoa lê o capítulo, Then o markup do highlight e o ícone de nota podem coexistir, sem gravar vínculo persistente.

## Qualidades e operação

- Segurança: uso individual, sem conta (perfil confirmado).
- Privacidade: destaques e notas permanecem no workspace local; sem rede nova declarada.
- Desempenho e volume: a lista não recorta o conjunto persistido; limite numérico de tempo não foi declarado.
- Acessibilidade: sheet com papel de diálogo; página com título visível; ícone com nome acessível; teclado e Escape no sheet; `prefers-reduced-motion`.
- Auditoria e observabilidade: sem telemetria nova.

## Dependências

- SPEC-0005 completed (`reader_highlight`, popover, criar nota, `BibleNoteSplit`).
- SPEC-0004 (`:::verse`, `note_verse_ref`; refs removidas na lixeira).
- Primitive `Sheet` já existente. Sem schema novo: só consulta `reader_highlight` (lista workspace-wide) e `note_verse_ref` (ícone).

## Situações de erro

- Lista vazia: sheet e página mostram estado vazio observável.
- Nota na lixeira: sem ícone (índice já remove a ref).
- Capítulo sem nota: sem ícone.
- Workspace ou índice indisponível: lista vazia ou erro recuperável; sem escrita em `bibles/*.sqlite`.

## Escopo

- Dentro: sheet pelos controles de `/bible` e página `/highlights` no menu listam o mesmo conjunto — todos os destaques do workspace; ícone discreto ao lado do número do versículo; clique abre a nota em split/abas; DEC-002 preservado.
- Fora (desta conversa, salvo citação explícita): bugs de seleção de vários versículos e underline/wavy só na última linha (correção paralela).
- Fora até reabertura: vincular nota a highlight; alterar `bibles/*.sqlite`; painel Logos permanente; navegar da linha da lista para o capítulo; seletor quando várias notas referenciam o mesmo versículo; filtros ou busca na lista.

## Dúvidas, decisões e riscos

- **Decidido — Escopo da lista:** todos os destaques do workspace, em qualquer versão, livro ou capítulo; sheet e página mostram o mesmo conjunto. Fonte: conversa atual, resposta `3` à Pergunta 1, 2026-09-03. Perfil: intermediário.
- **Decidido — Jornada:** sheet abre pelos controles do leitor em `/bible`; a página é uma rota nova `/highlights` no menu lateral, junto de Bíblia e Notas. Fonte: conversa atual, resposta `1` à Pergunta 1 desta rodada, 2026-09-03. Perfil: intermediário.
- **Decidido — Indicativo:** ícone discreto ao lado do número do versículo; o clique abre a nota em split no desktop e em abas no mobile (mesmo padrão de criar nota da SPEC-0005). Não reabre DEC-002. Fonte: conversa atual, resposta `1` à Pergunta 1 desta rodada, 2026-09-03. Perfil: intermediário.
- **Nenhuma lacuna aplicável** para o brief das três jornadas declaradas.
- **Risco:** misturar bugs de seleção/underline nesta fatia; tratar o ícone como highlight.

## Dados (descoberta)

Transição automática `$specsfy-02-backlog` → `$specsfy-data-discovery`: as jornadas só consultam informações já confirmadas em `.specsfy/DATABASE.md`. Sem schema novo. Retomada: `reader_highlight` alimenta a lista workspace-wide; `note_verse_ref` alimenta o ícone; lixeira já remove refs. Nenhuma pergunta de dado pendente.

## Brief pronto para especificar

1. **Problema e objetivo.** A pessoa não consulta os destaques numa lista e não percebe no texto que o trecho já tem nota. Objetivo: ver todos os destaques do workspace num sheet e na página `/highlights`, e ver/abrir a nota pelo ícone no leitor.
2. **Atores.** Pessoa usuária individual, sem conta, workspace local.
3. **Escopo e fora de escopo.** Dentro: sheet, `/highlights` no menu, ícone + clique em split/abas, mesmo conjunto workspace-wide, DEC-002. Fora: bugs de seleção/underline; vínculo persistente; `bibles/*.sqlite`; painel Logos; pular da lista ao capítulo; seletor de várias notas; filtros.
4. **Jornadas e regras.** Controles de `/bible` abrem o sheet; menu abre `/highlights`; ícone ao lado do número; clique abre a nota no `BibleNoteSplit` existente. Destacar ⟂ criar nota.
5. **Critérios de aceite.** Os Given/When/Then da seção Critérios de aceitação.
6. **Restrições.** SvelteKit/Svelte 5, shadcn-svelte local, File Over Apps, Vitest (`test:tdd`). Sem React, shadcn/ui ou ReUI. Sem tabela nova.
7. **Suposições.** Rótulo do item/gatilho: “Destaques”. Cada linha mostra referência e estilo já persistidos. O mesmo array de links do `AppSidebar` alimenta menu lateral e barra mobile. Ícone consulta `note_verse_ref` de notas ativas.
8. **Decisões abertas.** Nenhuma lacuna aplicável.
9. **Vocabulário.** Highlight do reader ≠ highlight TipTap. Indicativo ≠ highlight. “Todos” = workspace inteiro.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Spec em `specs/planned/0006-lista-highlights-indicador-nota-leitor/spec.md` com Plan Gate Passed. O implementador executa T018–T027.
