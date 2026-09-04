# Backlog: Motor de notas com Milkdown, fence de versículo e mobile

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0013 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Notas |
| Funcionalidade | Editor Milkdown com fence de versículo, slash e toolbar mobile |
| Tipo | Melhoria |
| Prioridade | Alta |
| Milestones | |
| Criado em | 2026-09-04 |
| Spec promovida | `specs/draft/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/spec.md` |

## Ideia original

bom vamos trabalhar uma feature complexa agora, precisamos mudar o motor das notas, iremos usar agora https://milkdown.dev/docs/guide/getting-started, pois se encaixa melhor no modelo Files over app. A ideia é que usaremos o markdown files nele, o bloco de versiculo será usado um fense no markdown. Teremos o /slash commands no desktop, no mobile ao digitar / abre um drawer com os commands, add um toolbar no mobile com os principais atalhos de formatacao, ficando em cima da barra de navegacao. Propriedades ficam em yaml no arquivo markdown. e A ideia é manter esse padrao de tela full canva sem bordas envolta do editor.

## Problema percebido

Motor atual (Tipex/TipTap) não se encaixa bem no modelo Files over app com Markdown como fonte primária legível fora do app.

## Pessoa afetada ou beneficiada

Pessoa usuária individual, sem conta, que cria e consulta as próprias notas bíblicas no workspace local (pasta local ou OPFS).

## Resultado ou valor esperado

Notas editadas no Milkdown com Markdown legível como fonte, fence de versículo preservado, slash commands no desktop, drawer + toolbar no mobile, propriedades em YAML e canvas full sem bordas.

## Contexto

Evolução do módulo `/notes` e `/notes/[id]` já entregue com Tipex (SPEC-0004 Complete). Troca só do motor do editor, mantendo rotas, listagem, lixeira `trash/`, índice SQLite auxiliar `note_verse_ref`, H1 sincronizado com `title` e canvas full-bleed sem moldura. Mobile usa barra inferior de navegação existente; toolbar do editor fica acima dela.

## Referências relacionadas

- `specs/inbox/2026-09-04-032931-motor-de-notas-com-milkdown-markdown-e-bloco-de-versiculo.md` — origem desta ideia.
- `specs/backlog/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo.md` — backlog relacionado: entrega original com Tipex; não é duplicata, é base da migração.
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/` — spec relacionada: comportamento vigente (fence `:::verse`, slash `/`, Dialog/Sheet, canvas full-bleed, H1↔YAML, índice auxiliar).
- `specs/completed/0005-selecao-versiculos-highlights-nota-leitor/`, `0006-lista-highlights-indicador-nota-leitor/`, `0007-seletor-varias-notas-versiculo-leitor/` — specs relacionadas: interações do leitor que consomem notas e índice.
- `PROJECT.md`, `.specsfy/USER-PROFILE.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md` — uso individual sem conta, Markdown+YAML fonte primária, SQLite só auxiliar, SvelteKit/Svelte 5, shadcn-svelte.
- `INTERFACE.md`, `DESIGNSYSTEM.MD` — canvas full-bleed, Dialog desktop / Sheet mobile, Geist, superfícies contínuas, guideline Vercel sem importar marca.
- `https://milkdown.dev/docs/guide/getting-started` — solução mencionada pelo usuário; integração técnica a validar na spec.

## Comportamento esperado

**Declaração do usuário:**
- Trocar o motor das notas para Milkdown.
- Markdown files como fonte; bloco de versículo como fence.
- Slash commands no desktop; no mobile digitar `/` abre drawer com commands.
- Toolbar mobile com principais atalhos de formatação acima da barra de navegação.
- Propriedades em YAML no arquivo Markdown.
- Tela full canvas sem bordas em volta do editor.

**Decisão da descoberta — Q1 Fence:**
- Manter `:::verse` atual com mesmos atributos e snapshot no corpo. Sem migração de sintaxe.
- Fonte: Conversa atual, resposta à Pergunta 1. Confirmado em 2026-09-04.

**Decisão da descoberta — Q2 Slash desktop:**
- Slash oferece versículo, títulos, listas, checklist, citação, código e divisória.
- Fonte: Conversa atual, resposta à Pergunta 2. Confirmado em 2026-09-04.

**Decisão da descoberta — Q3 Drawer mobile:**
- Bottom sheet 90dvh com a mesma lista do desktop e busca, ao digitar `/`.
- Fonte: Conversa atual, resposta à Pergunta 3. Confirmado em 2026-09-04.

**Decisão da descoberta — Q4 Toolbar mobile:**
- Atalhos: negrito, itálico, título, lista, checklist, citação e versículo, fixos acima da barra de navegação.
- Fonte: Conversa atual, resposta à Pergunta 4. Confirmado em 2026-09-04.

**Decisão da descoberta — Q5 YAML:**
- Manter `title`, `createdAt`, `updatedAt` e `type` como hoje; sem lista de versículos no YAML.
- Fonte: Conversa atual, resposta à Pergunta 5. Confirmado em 2026-09-04.

**Decisão da descoberta — Q6 Notas existentes:**
- Abrir direto sem migração; mesmo fence e mesmo índice auxiliar `note_verse_ref`.
- Fonte: Conversa atual, resposta à Pergunta 6. Confirmado em 2026-09-04.

**Decisão da descoberta — Q7 Stack Milkdown:**
- Adotar `@milkdown/kit` com plugins CommonMark, slash e nó custom de versículo.
- Fonte: Conversa atual, resposta à Pergunta 7. Confirmado em 2026-09-04.

**Decisão da descoberta — Q8 Seletor:**
- Reaproveitar `VerseSelector` atual (Dialog desktop / Sheet mobile) com preview callout; confirmação gera o mesmo `:::verse`.
- Fonte: Conversa atual, resposta à Pergunta 8. Confirmado em 2026-09-04.

## Regras de negócio

- File Over Apps: arquivo `notes/<noteId>.md` com YAML + corpo Markdown é a fonte; SQLite `note_verse_ref` só espelha fences para relações/busca.
- Fence `:::verse` mantém atributos de referência (`version`, `book`, `chapter`, `verseStart`, `verseEnd` ou equivalente vigente) e snapshot no corpo; preview lê o arquivo, lookup SQLite só ao inserir/alterar.
- Cada bloco guarda a própria `version`; `readerSelection` só preenche valor inicial do seletor.
- Um bloco aceita um versículo (`verseStart === verseEnd`) ou intervalo no mesmo capítulo; atravessar capítulos segue fora.
- YAML guarda só metadados (`title`, `createdAt`, `updatedAt`, `type`); H1 do canvas sincroniza bidirecionalmente com `title`.
- Editor ocupa toda a área útil sem moldura, card ou borda; toolbar mobile fica acima da barra de navegação sem cobrir conteúdo ou ação.
- Slash desktop é menu filtrável por `/`; mobile abre bottom sheet 90dvh com mesma lista e busca; toolbar oferece formatação sem exigir `/`.
- Stack SvelteKit/Svelte 5 preservada; Milkdown entra como dependência do editor, sem React, sem marca Vercel.

## Respostas confirmadas na descoberta

| Área | Pergunta | Resposta normalizada | Fonte | Confirmado em |
| --- | --- | --- | --- | --- |
| Dados / serialização | Pergunta 1. Qual sintaxe o fence de versículo deve usar no Markdown com Milkdown? | Manter `:::verse` atual com mesmos atributos e snapshot | Conversa atual, resposta à Pergunta 1 | 2026-09-04 |
| Interface / slash | Pergunta 2. Quais comandos o slash `/` deve oferecer no desktop? | Versículo, títulos, listas, checklist, citação, código e divisória | Conversa atual, resposta à Pergunta 2 | 2026-09-04 |
| Interface / mobile | Pergunta 3. Como o drawer de comandos deve abrir no mobile ao digitar `/`? | Bottom sheet 90dvh com mesma lista do desktop e busca | Conversa atual, resposta à Pergunta 3 | 2026-09-04 |
| Interface / mobile | Pergunta 4. Quais atalhos a toolbar mobile deve ter acima da barra de navegação? | Negrito, itálico, título, lista, checklist, citação e versículo | Conversa atual, resposta à Pergunta 4 | 2026-09-04 |
| Dados / YAML | Pergunta 5. Quais campos o YAML frontmatter deve guardar? | Manter title, createdAt, updatedAt e type como hoje | Conversa atual, resposta à Pergunta 5 | 2026-09-04 |
| Dados / migração | Pergunta 6. Como tratar as notas existentes em Tipex ao abrir no Milkdown? | Abrir direto sem migração, mesmo fence e índice auxiliar | Conversa atual, resposta à Pergunta 6 | 2026-09-04 |
| Técnica | Pergunta 7. Qual integração Milkdown devemos adotar no SvelteKit? | @milkdown/kit com plugins commonmark, slash e custom verse | Conversa atual, resposta à Pergunta 7 | 2026-09-04 |
| Interface / inserção | Pergunta 8. Como inserir o bloco de versículo no Milkdown? | Reaproveitar VerseSelector atual Dialog/Sheet com preview callout | Conversa atual, resposta à Pergunta 8 | 2026-09-04 |

## Critérios de aceitação

- Dado o editor Milkdown, quando a pessoa digita `/` no desktop, então vê o menu com versículo, títulos, listas, checklist, citação, código e divisória.
- Dado o mobile, quando a pessoa digita `/`, então abre bottom sheet 90dvh com a mesma lista e busca.
- Dado o mobile, quando o editor tem foco, então a toolbar com negrito, itálico, título, lista, checklist, citação e versículo fica visível acima da barra de navegação sem cobrir o texto.
- Dado que a pessoa confirma o seletor, quando o bloco é inserido, então o arquivo recebe `:::verse` com referência e snapshot, e o índice auxiliar é atualizado.
- Dado uma nota legada com `:::verse`, quando aberta no Milkdown, então o bloco renderiza o snapshot sem migração e sem perda.
- Dado que a pessoa salva, quando o arquivo é lido fora do app, então YAML tem `title`, `createdAt`, `updatedAt`, `type` e o corpo tem Markdown legível com `:::verse`.
- Dado o canvas, quando renderizado em desktop e mobile, então não há moldura, card ou borda em volta do editor.
- Dado que a pessoa edita o H1 e salva, então `title` no YAML reflete o H1 na listagem e na reabertura.

## Qualidades e operação

- Segurança: uso local sem conta; sem envio do conteúdo a servidor.
- Privacidade: texto e referências ficam no workspace da pessoa.
- Desempenho e volume: preview usa snapshot do arquivo; consultas OpenLP só no seletor/alteração; editor carrega notas existentes sem conversão.
- Auditoria e observabilidade: não aplicável no MVP.
- Interface: canvas full-bleed; slash desktop, drawer mobile 90dvh, toolbar acima da navegação; teclado, zoom travado no PWA, claro/escuro, `prefers-reduced-motion`, foco visível.
- Acessibilidade: menu/drawer/toolbar operáveis por teclado e toque, nomes acessíveis, Escape fecha, `aria-live` em salvamento/erro.

## Dependências

- SPEC-0004 Complete: motor Tipex vigente, `VerseSelector`, `VerseBlockView`, índice `note_verse_ref`, H1↔YAML.
- SPEC-0003 Complete: catálogo e leitura OpenLP em `bibles/*.sqlite` para o seletor.
- SPEC-0001 Implementing: pastas `notes/`, `trash/`, template `note.md`.
- Nova dependência: `@milkdown/kit` e plugins; remover Tipex/TipTap do editor após paridade (decisão de remoção na spec).
- PWA: drawer 90dvh e toolbar devem respeitar `safe-area-inset-bottom` e zoom travado vigentes.

## Situações de erro

- Workspace não pronto: manter fluxo de onboarding/permissão existente.
- Sem Bíblia importada ou versão ausente: seletor mostra estado explícito; bloco salvo continua com snapshot.
- Intervalo inválido (fim < início, capítulos diferentes): seletor recusa e explica.
- Falha ao salvar/indexar: estado explícito sem fingir sucesso e sem apagar original.
- Milkdown falha ao parsear fence legado: mostrar corpo como texto preservado, sem perda, com erro recuperável.

## Escopo

- Dentro: trocar motor de `/notes/[id]` para Milkdown; fence `:::verse` preservado; slash desktop; drawer + toolbar mobile; YAML vigente; canvas full sem bordas; reaproveitar `VerseSelector`; paridade de autosave, H1↔YAML e índice auxiliar; remover Tipex do editor.
- Fora: construtor de sermões; CRUD/lixeira de sermões; intervalo que atravessa capítulos; autenticação; colaboração; sincronização; mudanças na listagem `/notes` além do necessário.

## Dúvidas, decisões e riscos

- **Decidido — Fence (Q1):** manter `:::verse`; sem migração de sintaxe. 2026-09-04.
- **Decidido — Slash (Q2):** lista com versículo, títulos, listas, checklist, citação, código, divisória. 2026-09-04.
- **Decidido — Drawer (Q3):** bottom sheet 90dvh mesma lista + busca. 2026-09-04.
- **Decidido — Toolbar (Q4):** negrito, itálico, título, lista, checklist, citação, versículo acima da navegação. 2026-09-04.
- **Decidido — YAML (Q5):** manter 4 campos atuais. 2026-09-04.
- **Decidido — Compat (Q6):** abertura direta sem migração. 2026-09-04.
- **Decidido — Stack (Q7):** `@milkdown/kit` + CommonMark + slash + verse custom. 2026-09-04.
- **Decidido — Seletor (Q8):** reaproveitar `VerseSelector` Dialog/Sheet. 2026-09-04.
- **Risco:** Milkdown com Svelte 5, parsing do `:::verse` custom e paridade de autosave/índice exigem prova na spec; remoção do Tipex só após paridade.
- **Nenhuma lacuna aplicável aberta.** Limite de 8 perguntas da área respeitado.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Pronto para `$specsfy-03-specify`.
