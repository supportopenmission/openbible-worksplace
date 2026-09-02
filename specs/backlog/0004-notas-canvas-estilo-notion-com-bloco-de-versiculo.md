# Backlog: Notas canvas estilo Notion com bloco de versículo

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0004 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Notas |
| Funcionalidade | Editor canvas de notas com bloco de versículo |
| Tipo | Funcionalidade |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-02 |
| Spec promovida | `specs/draft/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md` |

## Ideia original

funcionalidade de notas like notion app. A ideia é ser um app full canva ou seja nao é para ter um borda e dentro o editor, podemos usar o https://tipex.pages.dev/. Verificar como salvar em markdown, a ideia é que tenhamos um bloco chamado versiculo ou texto biblico, na qual vai abrir um modal/drawer para selecionar o versiculo e a versao deve mostrar a preview do versiculo (criar algo bem bonito) talvez um callout. Ver como podemos criar as relacoes com os textos biblicos.

## Problema percebido

A pessoa não consegue escrever notas em um canvas contínuo, sem moldura, com bloco de versículo ou texto bíblico, preview editorial e relações com os textos.

## Pessoa afetada ou beneficiada

Pessoa usuária individual, sem conta, que elabora as próprias notas no workspace local.

## Resultado ou valor esperado

Listar, criar, editar e apagar notas com lixeira, e escrever cada nota em canvas full-bleed persistido em Markdown, com bloco de versículo escolhido em modal ou drawer e preview do texto com a versão.

## Contexto

Esta fatia é o módulo de notas (listagem, CRUD, lixeira e editor canvas), não o construtor de sermões. Rotas: `/notes` e `/notes/[id]`, com item Notas na Sidebar e na barra mobile; `/sermons` permanece o construtor. Para notas, a lixeira e o CRUD de arquivos entram aqui. A inbox irmã de persistência permanece válida para sermões e não deve ser apagada. O leitor SPEC-0003 já consulta versículos OpenLP. Templates `note.md` e pastas `notes/` e `trash/` já existem no onboarding.

## Referências relacionadas

- `specs/inbox/2026-09-01-211857-notas-canvas-estilo-notion-com-bloco-de-versiculo.md` — origem desta ideia; não é duplicata de outra spec.
- `specs/inbox/2026-09-01-181529-sermoes-e-notas-em-markdown-com-yaml-e-lixeira.md` — relacionada: persistência File Over Apps de sermões/notas. Para notas, CRUD e lixeira passam a esta fatia; sermões continuam fora. Não apagar.
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` — spec relacionada: catálogo e consultas de versão/livro/capítulo/versículo em `bibles/*.sqlite`.
- `specs/completed/0002-tela-inicial-navegacao/spec.md` — spec relacionada: Sidebar com Bíblia, Sermões, Estudos e Configuração; esta fatia acrescenta Notas (`/notes`) sem remover os itens existentes. `/sermons` permanece o construtor.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — spec relacionada: pastas `notes/`, `templates/note.md` (`title`, `createdAt`, `updatedAt`, `type`) e `trash/`.
- `PROJECT.md`, `.specsfy/USER-PROFILE.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md` — uso individual, Markdown+YAML fonte primária, SQLite auxiliar, shadcn-svelte, guideline Vercel.
- `INTERFACE.md` — `Dialog` e `Sheet` já usados no leitor; `ProductPage` em `/sermons` e `/study`.
- `https://tipex.pages.dev/` — solução mencionada pelo usuário; pesquisa técnica a validar na spec.

## Comportamento esperado

**Declaração do usuário:**
- App de notas estilo Notion em canvas contínuo, sem borda/caixa envolvendo o editor.
- Usar Tipex (`https://tipex.pages.dev/`).
- Salvar em Markdown.
- Bloco chamado versículo ou texto bíblico; ao acionar, abre modal/drawer para selecionar o versículo e a versão.
- A versão deve mostrar a preview do versículo, com apresentação bonita, talvez callout.
- Criar relações com os textos bíblicos.

**Confirmado em fontes do projeto (não reperguntar):**
- Pessoa individual, sem conta.
- Markdown com YAML frontmatter é fonte primária da nota; SQLite só índice/auxiliar.
- shadcn-svelte, SvelteKit/Svelte 5, guideline `https://vercel.com/design.md`.
- Leitor SPEC-0003 completed fornece consultas OpenLP.

**Decisão da descoberta — Q1 Escopo (não reperguntar):**
- Superfície completa nesta fatia: listagem, criar, editar, apagar com lixeira e o editor canvas com bloco de versículo.
- Fonte: Conversa atual, resposta à Pergunta 1. Confirmado em 2026-09-01.

**Decisão da descoberta — Q2 Rota (não reperguntar):**
- Nova rota `/notes` para a listagem e `/notes/[id]` para o editor, com item Notas na Sidebar e na barra mobile, sem reusar `/sermons`.
- Fonte: Conversa atual, resposta à Pergunta 2. Confirmado em 2026-09-01.

**Decisão da descoberta — Q3 Persistência do bloco (não reperguntar):**
- Referência e snapshot do texto no Markdown, no momento em que a pessoa escolhe o versículo; a preview lê o arquivo e só consulta a Bíblia de novo se a pessoa alterar o bloco.
- Fonte: Conversa atual, resposta à Pergunta 3. Confirmado em 2026-09-01.

**Decisão da descoberta — Q4 Serialização (não reperguntar):**
- Bloco fenced custom (por exemplo `:::verse`) com referência nos atributos e o texto snapshot no corpo do fence, mapeado para o nó Tipex.
- YAML frontmatter permanece só para metadados da nota (`title`, `createdAt`, `updatedAt`, `type`), não para a lista de versículos.
- Fonte: Conversa atual, resposta à Pergunta 4. Confirmado em 2026-09-01.

**Decisão da descoberta — Q5 Relação (não reperguntar):**
- Um intervalo no mesmo capítulo (por exemplo João 3:16–18), com snapshot de todos os versículos do intervalo.
- Um único versículo continua válido (início = fim). Não atravessa capítulos nesta fatia.
- Fonte: Conversa atual, resposta à Pergunta 5. Confirmado em 2026-09-01.

**Decisão da descoberta — Q6 Seletor (não reperguntar):**
- Mesmo padrão do leitor: Dialog no desktop e Sheet (drawer) no mobile.
- O seletor inclui versão, livro, capítulo, versículo inicial e versículo final, com preview em callout antes de confirmar.
- Fonte: Conversa atual, resposta à Pergunta 6. Confirmado em 2026-09-01.

**Decisão da descoberta — Q7 Versão (não reperguntar):**
- Cada bloco escolhe a própria versão; o atributo `version` do fence `:::verse` é independente por bloco.
- O seletor abre com `readerSelection` (última leitura no leitor) só como valor inicial; a pessoa pode alterar a versão antes de confirmar.
- Fonte: Conversa atual, resposta à Pergunta 7. Confirmado em 2026-09-01.

**Decisão da descoberta — Q8 Inserção (não reperguntar):**
- Slash-command (`/`, `/versiculo`, `/verse`) e botão visível e focável abrem o mesmo seletor (Dialog no desktop, Sheet no mobile).
- O botão existe no canvas full-bleed sem reintroduzir moldura ou card em volta do editor.
- Os dois caminhos confirmam o mesmo bloco `:::verse`; não há fluxos duplicados.
- Fonte: Conversa atual, resposta à Pergunta 8. Confirmado em 2026-09-01.

**Decisão da descoberta — Q9 Título (não reperguntar):**
- O primeiro bloco editável do canvas é um H1 (padrão Notion); sync bidirecional com `title` no YAML ao abrir e ao salvar.
- File Over Apps: frontmatter `title` para listagem/metadados; H1 no corpo legível fora do app.
- Nota nova segue o template `note.md`: `title: ""` e H1 `# Nova nota` até a pessoa editar; listagem usa o H1 ou `title` sincronizado, sem inventar placeholder no YAML.
- Fonte: Conversa atual, resposta à Pergunta 9. Confirmado em 2026-09-01.

## Regras de negócio

- File Over Apps: o arquivo Markdown da nota é a fonte; o bloco de versículo é um fence custom (`:::verse`, sintaxe exata na spec) com atributos `book`, `chapter`, `version`, `verseStart` e `verseEnd` (ou equivalente) e o texto snapshot no corpo.
- Cada bloco guarda a própria versão no atributo `version`; blocos na mesma nota podem usar versões diferentes.
- Ao abrir o seletor para inserir ou alterar um bloco, `readerSelection` preenche só o valor inicial da versão (e demais campos compatíveis); a escolha confirmada fica no bloco, sem atualizar `readerSelection`.
- Inserção do bloco de versículo: slash-command (`/`, `/versiculo`, `/verse`) no cursor e botão visível e focável no canvas full-bleed; ambos abrem o mesmo seletor e confirmam o mesmo bloco `:::verse`.
- O botão de inserção não reintroduz moldura, card ou borda em volta do editor; permanece integrado ao canvas contínuo (guideline Vercel / DESIGNSYSTEM).
- Título: primeiro bloco do canvas é H1; sync bidirecional H1 ↔ `title` no YAML ao abrir e salvar; nota nova usa template (`title: ""`, H1 `# Nova nota`).
- Um bloco aceita um versículo ou um intervalo no mesmo capítulo; `verseStart === verseEnd` representa um único versículo. Intervalo que atravessa capítulos fica fora desta fatia.
- O YAML do frontmatter guarda só metadados da nota (`title`, `createdAt`, `updatedAt`, `type`); não lista versículos.
- Roundtrip do editor via `@tiptap/markdown` (`parseMarkdown` / `renderMarkdown` / `markdownTokenizer`) no nó customizado.
- A preview do callout lê o snapshot no arquivo; o SQLite bíblico só é consultado de novo quando a pessoa altera o bloco.
- O índice SQLite auxiliar pode indexar as referências para relações e busca, sem substituir o Markdown.
- Esta fatia não implementa o construtor de sermões.
- Notas nesta fatia cobrem listagem, criação, edição e exclusão com lixeira (`trash/` já criada no onboarding); exclusão não apaga o arquivo em silêncio.
- Sermões e o CRUD/lixeira de sermões permanecem na inbox irmã de persistência.

## Respostas confirmadas na descoberta

| Área | Pergunta | Resposta normalizada | Fonte | Confirmado em |
| --- | --- | --- | --- | --- |
| Escopo | Pergunta 1. O que entra na primeira fatia desta funcionalidade de notas? | Superfície completa nesta fatia: listagem, criar, editar, apagar com lixeira e o editor canvas com bloco de versículo. | Conversa atual, resposta à Pergunta 1 | 2026-09-01 |
| Interface / rota | Pergunta 2. Onde a pessoa encontra a listagem e o editor de notas? | Nova rota `/notes` para a listagem e `/notes/[id]` para o editor, com item Notas na Sidebar e na barra mobile, sem reusar `/sermons`. | Conversa atual, resposta à Pergunta 2 | 2026-09-01 |
| Dados / File Over Apps | Pergunta 3. O que o arquivo da nota guarda no bloco de versículo? | Referência e snapshot do texto no Markdown, no momento em que a pessoa escolhe o versículo; a preview lê o arquivo e só consulta a Bíblia de novo se a pessoa alterar o bloco. | Conversa atual, resposta à Pergunta 3 | 2026-09-01 |
| Dados / serialização | Pergunta 4. Como o bloco de versículo deve aparecer no Markdown da nota? | Bloco fenced custom (por exemplo `:::verse`) com referência nos atributos e o texto snapshot no corpo do fence, mapeado para o nó Tipex. | Conversa atual, resposta à Pergunta 4 | 2026-09-01 |
| Dados / relação | Pergunta 5. O que um bloco `:::verse` pode referenciar nesta fatia? | Um intervalo no mesmo capítulo (por exemplo João 3:16–18), com snapshot de todos os versículos do intervalo. | Conversa atual, resposta à Pergunta 5 | 2026-09-01 |
| Interface / seletor | Pergunta 6. Como o seletor de versículo deve abrir? | Mesmo padrão do leitor: Dialog no desktop e Sheet (drawer) no mobile. | Conversa atual, resposta à Pergunta 6 | 2026-09-01 |
| Dados / versão | Pergunta 7. A versão do bloco de versículo é herdada do leitor ou escolhida por bloco? | Cada bloco escolhe a própria versão; o seletor abre com `readerSelection` só como valor inicial. | Conversa atual, resposta à Pergunta 7 | 2026-09-01 |
| Interface / inserção | Pergunta 8. Como a pessoa insere um bloco de versículo no canvas? | Slash-command (`/`, `/versiculo`, `/verse`) e botão visível e focável; ambos abrem o mesmo seletor (Dialog desktop / Sheet mobile). | Conversa atual, resposta à Pergunta 8 | 2026-09-01 |
| Interface / título | Pergunta 9. Como o título da nota deve aparecer e ser persistido? | H1 no canvas sincronizado com `title` no YAML; primeiro bloco editável é H1; sync bidirecional ao abrir e salvar. | Conversa atual, resposta à Pergunta 9 | 2026-09-01 |

## Critérios de aceitação

- Dado um workspace pronto, quando a pessoa abre `/notes`, então vê a listagem ou o estado vazio com ação de criar, e o item Notas está na Sidebar e na barra mobile.
- Dado que a pessoa cria uma nota, quando confirma, então abre `/notes/[id]` no canvas e o arquivo Markdown+YAML é criado no workspace.
- Dado que a pessoa edita e salva, então o arquivo Markdown+YAML no workspace é a fonte persistida.
- Dado que a pessoa apaga uma nota, quando confirma, então o arquivo vai para `trash/` e some da listagem ativa.
- Dado o editor canvas, quando a pessoa digita `/`, `/versiculo` ou `/verse` no cursor, então aparece o menu de blocos e, ao escolher versículo, abre o seletor (Dialog no desktop, Sheet no mobile).
- Dado o editor canvas, quando a pessoa aciona o botão visível e focável de inserir versículo, então abre o mesmo seletor, sem fluxo alternativo.
- Dado que a pessoa confirma o seletor por slash-command ou por botão, quando o bloco é inserido, então o resultado é o mesmo fence `:::verse` com referência e snapshot.
- Dado o canvas full-bleed, quando a pessoa usa o botão de inserção, então não aparece moldura, card ou borda envolvendo o editor.
- Dado um bloco já escolhido, quando a nota é reaberta, então a preview mostra o snapshot do arquivo sem consultar a Bíblia; a consulta SQLite ocorre só se a pessoa alterar o bloco.
- Dado que a Bíblia da versão foi removida, quando a pessoa só lê a nota, então o snapshot continua visível; o lookup falha apenas ao tentar alterar o bloco.
- Dado um bloco salvo, quando o Markdown é lido fora do app, então o fence `:::verse` mostra atributos de referência (incluindo início e fim) e o snapshot de todos os versículos do intervalo.
- Dado um intervalo inválido (fim antes do início ou capítulos diferentes), quando a pessoa tenta confirmar, então o seletor impede gravar e explica o limite.
- Dado que a pessoa abre o seletor para inserir ou alterar um bloco, quando `readerSelection` existe, então a versão (e campos compatíveis) aparecem pré-preenchidos, mas a pessoa pode escolher outra versão antes de confirmar.
- Dado uma nota com dois ou mais blocos `:::verse`, quando cada bloco foi confirmado com versões diferentes, então cada um mantém o próprio atributo `version` e snapshot, sem herdar a versão de outro bloco.
- Dado uma nota nova criada a partir do template, quando abre no editor, então o canvas mostra H1 `# Nova nota` e `title` no YAML permanece vazio até o primeiro save sincronizar.
- Dado que a pessoa edita o H1 e salva, quando reabre a nota ou consulta a listagem, então `title` no YAML reflete o texto do H1.
- Dado que `title` no YAML difere do H1 ao abrir (arquivo legado), quando a nota carrega, então o H1 é atualizado para coincidir com `title` antes da edição.

## Qualidades e operação

- Segurança: uso local sem conta; sem envio do conteúdo da nota a servidor.
- Privacidade: texto da nota e referências ficam no workspace da pessoa.
- Desempenho e volume: preview usa o snapshot do arquivo; consultas do leitor (SPEC-0003) só no seletor ou ao alterar o bloco.
- Auditoria e observabilidade: não aplicável no MVP (uso individual local).
- Interface: canvas full-bleed; slash-command e botão focável para inserir versículo; preview com estados vazio/carregando/erro/versão ausente; teclado, zoom, claro/escuro, `prefers-reduced-motion`.

## Dependências

- SPEC-0001 (Implementing): workspace, pastas `notes/`, template `note.md`, pasta `trash/`.
- SPEC-0003 (completed): catálogo e leitura de versículos OpenLP.
- SPEC-0002 (completed): shell e Sidebar atuais; esta fatia acrescenta o item Notas e as rotas `/notes` e `/notes/[id]` sem remover Bíblia, Sermões, Estudos ou Configuração.
- Inbox de persistência (`2026-09-01-181529-…`): permanece para sermões; não bloqueia o CRUD de notas desta fatia.

## Situações de erro

- Workspace não pronto: preservar o fluxo já existente de onboarding/permissão.
- Nenhuma Bíblia importada, versão ausente ou consulta falha: estados explícitos no seletor ao inserir ou alterar o bloco, sem inventar texto bíblico; a preview de um bloco já salvo continua mostrando o snapshot.
- Intervalo com fim anterior ao início ou tentativa de atravessar capítulos: o seletor recusa e pede correção.
- Falha ao criar, salvar ou mover para `trash/`: estado explícito, sem fingir sucesso e sem apagar o arquivo original em silêncio.

## Escopo

- Dentro: rotas `/notes` e `/notes/[id]`; item Notas na Sidebar e barra mobile; listagem; criar; editar no canvas Tipex full-bleed; H1 sincronizado com YAML; apagar com lixeira; slash-command e botão acessível; bloco `:::verse`; índice SQLite auxiliar.
- Fora: construtor de sermões; CRUD/lixeira de sermões; intervalo que atravessa capítulos; autenticação; colaboração; identidade visual da Vercel.

## Dúvidas, decisões e riscos

- **Decidido — Escopo (Q1):** superfície completa — listagem, criar, editar, apagar com lixeira e editor canvas com bloco de versículo. Fonte: Conversa atual, resposta à Pergunta 1. 2026-09-01.
- **Decidido — Rota (Q2):** `/notes` (listagem) e `/notes/[id]` (editor), item Notas na Sidebar e na barra mobile, sem reusar `/sermons`. Fonte: Conversa atual, resposta à Pergunta 2. 2026-09-01.
- **Decidido — Snapshot (Q3):** o bloco guarda referência e texto snapshot no Markdown; preview lê o arquivo; lookup só ao alterar o bloco. Fonte: Conversa atual, resposta à Pergunta 3. 2026-09-01.
- **Decidido — Serialização (Q4):** fence custom `:::verse` com atributos de referência e snapshot no corpo; YAML só metadados da nota; roundtrip Tipex via `@tiptap/markdown`. Fonte: Conversa atual, resposta à Pergunta 4. 2026-09-01.
- **Decidido — Relação (Q5):** um versículo ou intervalo no mesmo capítulo; snapshot de todos os versículos; sem atravessar capítulos. Fonte: Conversa atual, resposta à Pergunta 5. 2026-09-01.
- **Decidido — Seletor (Q6):** Dialog no desktop e Sheet no mobile, no padrão da SPEC-0003; preview em callout antes de confirmar. Fonte: Conversa atual, resposta à Pergunta 6. 2026-09-01.
- **Decidido — Versão (Q7):** cada bloco escolhe a própria versão; `readerSelection` preenche só o valor inicial do seletor. Fonte: Conversa atual, resposta à Pergunta 7. 2026-09-01.
- **Decidido — Inserção (Q8):** slash-command e botão visível/focável abrem o mesmo seletor; canvas full-bleed sem moldura; um único fluxo de confirmação para `:::verse`. Fonte: Conversa atual, resposta à Pergunta 8. 2026-09-01.
- **Decidido — Título (Q9):** H1 no canvas sincronizado com `title` no YAML; template `note.md` com `title: ""` e `# Nova nota`. Fonte: Conversa atual, resposta à Pergunta 9. 2026-09-01.
- **Risco:** Tipex não serializa Markdown nativamente; roundtrip e nó customizado exigem pesquisa na spec (R-001/R-002).
- **Não é duplicata** da inbox de sermões/notas/lixeira: aquela captura segue válida para sermões; o CRUD/lixeira de notas foi absorvido por esta fatia.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promovido para `$specsfy-03-specify` — `specs/draft/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md`.
