# Especificação integrada: Editor de Notas - popover, hover biblico, indice, embed e export

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0015 |
| Slug | 0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export |
| Status | Complete |
| Effort | 9 |
| Effort updated at | 2026-09-05T17:50:54.272Z |
| Effort rationale | Três ajustes pós-entrega: marks nativas com remark próprio, iframe no export e folha de impressão |
| ClickUp Task |  |
| Milestones |  |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-05 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

No editor de notas `/notes/[id]` a formatação exige toolbar fixa, referências tipo `Gn 3.1` em texto livre não mostram o texto sem sair da nota, notas longas não têm navegação por títulos, não há vídeo embutido e a exportação não expande o fence `:::verse`. A barra de tarefas não tem regra explícita de visibilidade entre edição e visualização. Após a entrega, três refinamentos: marcas `==`/`++` aparecem como texto literal no editor em vez de renderizadas, o Markdown exportado não traz o vídeo em formato aproveitável fora do app e o PDF exibe tags `<br />` literais com apresentação pobre.

#### Resultado desejado

Editar mais rápido no canvas com formatação por popover, prévia bíblica em hover, navegação por títulos com drawer no mobile, vídeo do YouTube embutido e exportação PDF/Markdown com versos expandidos, mantendo o arquivo original intacto e a toolbar visível na edição e oculta na visualização por padrão configurável. Destaque e sublinhado renderizam estilizados no editor com roundtrip das convenções, o Markdown exportado traz o vídeo como iframe e o PDF sai com apresentação editorial sem tags literais.

#### Métricas de sucesso

- Seleção não colapsada na edição exibe o popover com as 4 ações e sem menu nativo em desktop e mobile.
- Referência válida em texto livre exibe hover card com o texto correto ou aviso quando não há Bíblia.
- Índice lista H1–H3 e o clique rola até a seção no desktop e no mobile.
- URL YouTube válida gera bloco de vídeo; URL inválida gera erro sem inserir bloco.
- Export PDF e Markdown contêm os versos expandidos e o arquivo original mantém o fence.
- `==destaque==` e `++sublinhado++` renderizam estilizados no editor e persistem nas convenções.
- Markdown exportado traz cada vídeo como iframe aproveitável fora do app.
- PDF não exibe tags literais e apresenta título, versos e margens editoriais.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001**: Motor vigente é Milkdown 7.22.1 com ProseMirror e remark-directive para `:::verse` — Verdict: verified — Confidence: high — Evidence: `apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte` e `milkdown-verse-node.ts` — Budget: 1/6.
- **R-002**: Fence `:::verse` guarda referência nos atributos e snapshot no corpo; índice auxiliar `note_verse_ref` só espelha — Verdict: verified — Confidence: high — Evidence: `apps/web/src/lib/features/notes/verse-block-extension.ts` e `.specsfy/DATABASE.md` — Budget: 2/6.
- **R-003**: Clique em referência abre o visualizador de referência; hover com texto é evolução nova — Verdict: verified — Confidence: high — Evidence: `apps/web/src/lib/bible/editor/bibleReferencePlugin.ts` — Budget: 3/6.
- **R-004**: Versão padrão existe via `openbible.default-bible-version` e `readerSelection.versionId` — Verdict: verified — Confidence: high — Evidence: `apps/web/src/lib/storage/preferences.ts` — Budget: 4/6.
- **R-005**: Toolbar mobile vigente com Negrito, Itálico, Título, listas, citação e versículo; popover de seleção é acréscimo — Verdict: verified — Confidence: high — Evidence: `apps/web/src/lib/features/notes/MilkdownMobileToolbar.svelte` e `INTERFACE.md` — Budget: 5/6.
- **R-006**: Geração de PDF e parser de referências em texto livre não existem no editor atual — Verdict: verified — Confidence: medium — Evidence: busca em `apps/web/src/lib/features/notes/` sem exportador — Budget: 6/6.
- **R-007**: Receita oficial de mark customizado (`$markSchema` + plugin remark + input rule) para `==texto==` — Verdict: verified — Confidence: high — Evidence: research/milkdown-marker-plugin.md#receita-oficial — Budget: 7/8.
- **R-008**: Tags `<br />` literais nas notas vêm de legado/colar; o renderer de preview escapa HTML e o serializador padrão usa `\\\n` — Verdict: verified — Confidence: high — Evidence: research/milkdown-marker-plugin.md#br-literais, `verse-block-extension.ts`, `mdast-util-to-markdown` — Budget: 8/8.

#### Fontes e contexto consultados

- `specs/backlog/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export.md` — brief refinado com Q1–Q8.
- `specs/inbox/2026-09-05-131206-editor-de-notas-formatacao-hover-biblico-navegacao-embed-e-export.md` — origem dos 5 pedidos.
- `specs/inbox/2026-09-05-131455-editor-de-notas-barra-de-tarefas-sempre-visivel-exceto-visualizacao.md` — complemento da toolbar.
- `specs/backlog/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile.md` — base Milkdown vigente.
- `INTERFACE.md`, `.specsfy/STACK.md`, `.specsfy/DATABASE.md`, `.specsfy/USER-PROFILE.md` — stack SvelteKit/Svelte 5, shadcn-svelte, Files over app, uso individual sem conta.
- `apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte`, `milkdown-verse-node.ts`, `MilkdownMobileToolbar.svelte`, `apps/web/src/lib/bible/editor/bibleReferencePlugin.ts`, `apps/web/src/lib/storage/preferences.ts` — comportamento atual.

#### Documentação consultada

- Nenhuma fonte externa nova na definição inicial; decisão técnica de PDF, parser e popover detalhada no plano com bibliotecas já presentes no repositório.
- Milkdown Example: Marker Plugin, acessado em 2026-09-05, https://milkdown.dev/docs/plugin/example-marker-plugin — receita de `$markSchema` + remark + input rule para `==texto==`; decisões extraídas em `research/milkdown-marker-plugin.md`.

#### Artefatos de pesquisa armazenados

- `specs/completed/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/research/milkdown-marker-plugin.md`: notas próprias sobre a receita oficial e a análise dos `<br />` literais, com origem, versão/data e impacto; sem reprodução de conteúdo protegido.

#### Dúvidas respondidas

- **Q**: Qual resultado resume o item combinado? → **A**: Editar mais rápido no canvas com formatação por popover, prévia bíblica e navegação por títulos, mais vídeo e exportação.
- **Q**: O que significa desativar a seleção normal? → **A**: Suprimir o menu nativo e mostrar só o popover com Negrito, Itálico, Sublinhado e Destaque.
- **Q**: De onde vem o texto do hover? → **A**: Versão do parser quando houver, senão versão padrão; mantém o clique atual que abre o versículo.
- **Q**: Como funciona a navegação por títulos? → **A**: Botão no header lista H1–H3 em dropdown no desktop e drawer Índices no mobile; clique rola até a seção.
- **Q**: Como inserir e exibir YouTube? → **A**: Colar URL ou slash `/video`, bloco validado só aceita YouTube, erro em URL inválida.
- **Q**: Como funciona export PDF/Markdown? → **A**: Botões no header geram arquivo com versos expandidos, original intacto.
- **Q**: Onde fica a opção da barra? → **A**: Opção nas configurações da nota, padrão sempre visível editando e oculta visualizando.
- **Q**: Quais fallbacks garantir? → **A**: Sem Bíblia mostra aviso no hover e no export, URL inválida erro inline, sem títulos índice vazio.
- **Q**: Como o vídeo sai no Markdown exportado? → **A**: Cada `:::video` vira iframe do YouTube aproveitável fora do app, sem tocar o original.
- **Q**: Como fica a apresentação do PDF? → **A**: Tags `<br />` viram quebras reais e a folha aplica título, versos, tipografia e margens editoriais.
- **Q**: Como `==`/`++` passam a renderizar no editor? → **A**: Marks nativas com plugin remark e input rule pela receita oficial, com roundtrip das convenções e guarda anti-`C++`.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Popover de formatação com Negrito, Itálico, Sublinhado e Destaque e supressão do menu nativo na edição.
- Hover card para referências em texto livre com versão do parser ou padrão, preservando o clique atual.
- Índice de H1–H3 em dropdown no desktop e drawer Índices no mobile com rolagem até a seção.
- Bloco de vídeo YouTube por URL colada ou slash `/video`, validado, sem autoplay.
- Exportação PDF e Markdown com versos expandidos no lugar do fence, sem alterar o original.
- Opção de visibilidade da toolbar nas configurações da nota, padrão visível na edição e oculta na visualização.
- Marcas nativas de destaque (`==`) e sublinhado (`++`) com renderização no editor e roundtrip das convenções.
- Markdown exportado converte cada `:::video` em iframe do YouTube.
- Saída de impressão/PDF saneia `<br />` literais e aplica apresentação editorial.
- Fallbacks para sem Bíblia, referência inválida, URL inválida, nota sem títulos e falha de export.

#### Fora de escopo

- Construtor de sermões e CRUD de sermões.
- Mudança de sintaxe do fence `:::verse` e do YAML.
- Intervalo que atravessa capítulos.
- Provedores de vídeo além do YouTube.
- Autenticação, colaboração, sincronização e backup.
- Mudanças na listagem `/notes` além do necessário para abrir a nota.

#### Atores

- **Pessoa usuária individual**: cria, edita, navega e exporta as próprias notas no workspace local, sem conta.

### 4. Princípios e restrições do projeto

- **PR-001**: File Over Apps — `notes/<noteId>.md` com YAML e corpo Markdown é a fonte; SQLite `note_verse_ref` só espelha fences; export gera derivado sem tocar o original.
- **PR-002**: Sem rede nova obrigatória — hover e export usam Bíblia instalada e snapshot; vídeo carrega só sob ação da pessoa.
- **PR-003**: Canvas full-bleed sem moldura; guideline Vercel sem importar marca; shadcn-svelte como base; sem React.
- **PR-004**: Uso individual sem conta; sem envio do conteúdo a servidor.
- **PR-005**: Acessibilidade por teclado, foco visível, Escape fecha superfícies, `aria-live` em salvamento e export, `prefers-reduced-motion` e safe area no mobile.

### 5. Histórias de usuário

#### US-001 — Formatar por popover na seleção (P1)

Como pessoa usuária individual, quero formatar o texto selecionado pelo popover, para editar sem procurar a toolbar.

**Por que P1**: Atalho central de edição usado em toda nota.
**Teste independente**: Selecionar texto mostra popover com 4 ações; aplicar Negrito persiste no Markdown.
**Requisitos**: FR-001

#### US-002 — Prévia bíblica em hover (P1)

Como pessoa usuária individual, quero ver o texto de `Gn 3.1` em hover sem sair da nota, para estudar no contexto.

**Por que P1**: Evita ida ao leitor para cada referência.
**Teste independente**: Pairar referência válida mostra card com texto; clique atual continua abrindo o versículo.
**Requisitos**: FR-002

#### US-003 — Navegar por títulos da nota (P1)

Como pessoa usuária individual, quero ir às seções pelo índice, para navegar em notas longas.

**Por que P1**: Navegação estrutural básica de leitura e edição.
**Teste independente**: Índice lista H1–H3; clique rola até a seção no desktop e no mobile.
**Requisitos**: FR-003

#### US-004 — Embutir vídeo do YouTube (P2)

Como pessoa usuária individual, quero embutir vídeo do YouTube na nota, para reunir estudo e mídia.

**Por que P1**: Complemento de conteúdo com validação explícita.
**Teste independente**: URL válida gera bloco; URL inválida mostra erro sem inserir.
**Requisitos**: FR-004, FR-008

#### US-005 — Exportar nota com versos expandidos (P1)

Como pessoa usuária individual, quero exportar PDF e Markdown com o texto bíblico expandido, para compartilhar e imprimir.

**Por que P1**: Saída fiel sem expor sintaxe interna.
**Teste independente**: Export contém versos no lugar do fence; original mantém `:::verse`.
**Requisitos**: FR-005, FR-009

#### US-007 — Destaque e sublinhado renderizados no editor (P1)

Como pessoa usuária individual, quero ver `==destaque==` e `++sublinhado++` estilizados no editor, para reconhecer a formatação sem abrir a prévia.

**Por que P1**: Formatação central da tomada de notas, hoje visível só como texto literal.
**Teste independente**: Nota com `==teste==` abre com marca aplicada; salvar mantém `==teste==` no Markdown.
**Requisitos**: FR-007

#### US-006 — Controlar visibilidade da toolbar (P2)

Como pessoa usuária individual, quero configurar a toolbar sempre visível na edição e oculta na visualização, para focar ou editar.

**Por que P1**: Regra explícita de foco sem perder acesso à formatação.
**Teste independente**: Opção nas configurações alterna o comportamento; padrão segue visível editando e oculta visualizando.
**Requisitos**: FR-006

### 6. Cenários BDD de aceite

#### AC-001 — Popover feliz

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: Formatação por popover

  Scenario: Seleção mostra popover com 4 ações
    Given a nota aberta em edição com texto
    When a pessoa seleciona um trecho não colapsado
    Then o menu nativo é suprimido e o popover mostra Negrito, Itálico, Sublinhado e Destaque focáveis
```

#### AC-002 — Popover aplica e persiste

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-002
Feature: Formatação por popover

  Scenario: Aplicar Negrito pelo popover
    Given o popover visível sobre a seleção
    When a pessoa aciona Negrito
    Then o trecho recebe a marca, o Markdown persiste e o popover atualiza o estado pressionado sem travar a digitação
```

#### AC-003 — Popover não aparece sem seleção

**Cobre**: US-001, FR-001, NFR-003

```gherkin
@US-001 @FR-001 @NFR-003 @AC-003
Feature: Formatação por popover

  Scenario: Seleção colapsada ou modo leitura
    Given cursor colapsado ou nota em visualização
    When não há intervalo selecionado
    Then nenhum popover aparece e nenhum conteúdo é alterado
```

#### AC-004 — Hover com versão do parser

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-004
Feature: Hover bíblico

  Scenario: Referência com versão explícita
    Given texto com referência válida e versão no contexto
    When a pessoa paira ou foca a referência
    Then o card mostra referência e texto da versão do parser, com ação de abrir no leitor via teclado
```

#### AC-005 — Hover com versão padrão

**Cobre**: US-002, FR-002, NFR-002

```gherkin
@US-002 @FR-002 @NFR-002 @AC-005
Feature: Hover bíblico

  Scenario: Referência sem versão usa padrão
    Given referência válida sem versão e versão padrão configurada
    When a pessoa paira a referência
    Then o card mostra o texto da versão padrão sem consulta remota e sem bloquear a edição
```

#### AC-006 — Hover sem Bíblia

**Cobre**: US-002, FR-002, NFR-003

```gherkin
@US-002 @FR-002 @NFR-003 @AC-006
Feature: Hover bíblico

  Scenario: Sem Bíblia instalada
    Given nenhuma Bíblia instalada no workspace
    When a pessoa paira a referência
    Then o card mostra a referência com aviso explícito e mantém a ação de abrir no leitor, sem inventar texto
```

#### AC-007 — Índice desktop

**Cobre**: US-003, FR-003, NFR-001

```gherkin
@US-003 @FR-003 @NFR-001 @AC-007
Feature: Índice da nota

  Scenario: Dropdown navega até a seção
    Given nota com H1–H3 no desktop
    When a pessoa abre o índice no header e escolhe um título
    Then a lista mostra os títulos e o editor rola até a seção com foco gerenciado
```

#### AC-008 — Índice mobile

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-008
Feature: Índice da nota

  Scenario: Drawer Índices no mobile
    Given nota com H1–H3 no mobile
    When a pessoa abre Índices e toca um título
    Then o drawer fecha e a nota rola até a seção sem perda de posição de edição
```

#### AC-009 — Índice vazio

**Cobre**: US-003, FR-003, NFR-003

```gherkin
@US-003 @FR-003 @NFR-003 @AC-009
Feature: Índice da nota

  Scenario: Nota sem títulos
    Given nota sem H1–H3
    When a pessoa abre o índice
    Then vê estado vazio com orientação e nenhuma navegação é executada
```

#### AC-010 — Vídeo válido

**Cobre**: US-004, FR-004, NFR-001

```gherkin
@US-004 @FR-004 @NFR-001 @AC-010
Feature: Embed YouTube

  Scenario: Colar URL válida
    Given edição da nota com URL YouTube válida colada ou `/video` confirmado
    When a URL é validada
    Then um bloco de vídeo nomeado aparece sem autoplay, focável e com link equivalente
```

#### AC-011 — Vídeo carrega sob demanda

**Cobre**: US-004, FR-004, NFR-002

```gherkin
@US-004 @FR-004 @NFR-002 @AC-011
Feature: Embed YouTube

  Scenario: Play sob demanda
    Given bloco de vídeo inserido
    When a pessoa aciona reproduzir
    Then o player carrega então, sem carregamento prévio que trave a nota
```

#### AC-012 — Vídeo inválido

**Cobre**: US-004, FR-004, NFR-003

```gherkin
@US-004 @FR-004 @NFR-003 @AC-012
Feature: Embed YouTube

  Scenario: URL inválida ou fora do YouTube
    Given URL inválida ou de outro provedor
    When a pessoa tenta inserir
    Then o bloco não é criado e um erro inline explica que só YouTube é aceito
```

#### AC-013 — Export Markdown expandido

**Cobre**: US-005, FR-005, NFR-001

```gherkin
@US-005 @FR-005 @NFR-001 @AC-013
Feature: Exportação da nota

  Scenario: Markdown com versos expandidos
    Given nota com ao menos um `:::verse`
    When a pessoa exporta Markdown
    Then o arquivo traz citação com referência e texto completo na versão do bloco e anuncia sucesso via `aria-live`
```

#### AC-014 — Export PDF espelha Markdown

**Cobre**: US-005, FR-005, NFR-002

```gherkin
@US-005 @FR-005 @NFR-002 @AC-014
Feature: Exportação da nota

  Scenario: PDF com mesmo conteúdo
    Given nota com fences e títulos
    When a pessoa exporta PDF
    Then o PDF contém títulos e versos expandidos equivalentes ao Markdown sem travar a interface
```

#### AC-015 — Export preserva original

**Cobre**: US-005, FR-005, NFR-003

```gherkin
@US-005 @FR-005 @NFR-003 @AC-015
Feature: Exportação da nota

  Scenario: Original intacto e falha explícita
    Given exportação concluída ou falha
    When o processo termina
    Then o arquivo da nota mantém YAML e `:::verse`; em falha, um erro explícito aparece sem fingir sucesso
```

#### AC-016 — Toolbar padrão

**Cobre**: US-006, FR-006, NFR-001

```gherkin
@US-006 @FR-006 @NFR-001 @AC-016
Feature: Visibilidade da toolbar

  Scenario: Padrão edição visível e visualização oculta
    Given configuração padrão da nota
    When a pessoa edita e depois abre a visualização
    Then a toolbar fica visível editando e oculta visualizando, com controle alcançável por teclado
```

#### AC-017 — Toolbar configurável

**Cobre**: US-006, FR-006, NFR-002

```gherkin
@US-006 @FR-006 @NFR-002 @AC-017
Feature: Visibilidade da toolbar

  Scenario: Alterar opção nas configurações
    Given opção de toolbar nas configurações da nota
    When a pessoa alterna a preferência
    Then o comportamento aplica de imediato e persiste entre reaberturas sem recarregar a nota
```

#### AC-018 — Toolbar sem regressão mobile

**Cobre**: US-006, FR-006, NFR-003

```gherkin
@US-006 @FR-006 @NFR-003 @AC-018
Feature: Visibilidade da toolbar

  Scenario: Mobile e desktop consistentes
    Given mobile e desktop
    When a regra de visibilidade aplica
    Then nenhum conteúdo ou ação é coberto e a edição segue sem perda de foco ou salvamento
```

#### AC-019 — Destaque renderiza e preserva convenção

**Cobre**: US-007, FR-007, NFR-001

```gherkin
@US-007 @FR-007 @NFR-001 @AC-019
Feature: Marcas de destaque e sublinhado

  Scenario: `==teste==` abre estilizado e salva igual
    Given nota com `==teste==` no Markdown
    When a pessoa abre a nota no editor
    Then o trecho aparece destacado, navegável por teclado, e ao salvar o arquivo mantém `==teste==`
```

#### AC-020 — Sublinhado com guarda anti-C++

**Cobre**: US-007, FR-007, NFR-002

```gherkin
@US-007 @FR-007 @NFR-002 @AC-020
Feature: Marcas de destaque e sublinhado

  Scenario: `++` com fronteiras vira marca sem tocar `C++`
    Given nota com `++mesmo++ aqui` e `C++ e C++`
    When a pessoa abre a nota no editor
    Then só o primeiro trecho aparece sublinhado, sem consulta remota e sem travar a digitação
```

#### AC-021 — Popover aplica marca real

**Cobre**: US-007, FR-007, NFR-003

```gherkin
@US-007 @FR-007 @NFR-003 @AC-021
Feature: Marcas de destaque e sublinhado

  Scenario: Destaque pelo popover sem inserir texto literal
    Given o popover visível sobre a seleção
    When a pessoa aciona Destaque
    Then o trecho recebe a marca do schema e o Markdown persiste `==trecho==` sem alterar outro conteúdo
```

#### AC-022 — Vídeo vira iframe no Markdown

**Cobre**: US-004, FR-008, NFR-001

```gherkin
@US-004 @FR-008 @NFR-001 @AC-022
Feature: Exportação do bloco de vídeo

  Scenario: Exportar Markdown com vídeo
    Given nota com bloco `:::video` válido
    When a pessoa exporta Markdown
    Then o arquivo traz iframe do YouTube com título acessível e o original mantém o fence
```

#### AC-023 — Múltiplos vídeos preservam ordem

**Cobre**: US-004, FR-008, NFR-002

```gherkin
@US-004 @FR-008 @NFR-002 @AC-023
Feature: Exportação do bloco de vídeo

  Scenario: Dois vídeos na mesma nota
    Given nota com dois blocos `:::video` com URLs distintas
    When a pessoa exporta Markdown
    Then os dois iframes saem na mesma ordem das URLs, sem carga de rede na geração
```

#### AC-024 — Vídeo sem ID é omitido com aviso

**Cobre**: US-004, FR-008, NFR-003

```gherkin
@US-004 @FR-008 @NFR-003 @AC-024
Feature: Exportação do bloco de vídeo

  Scenario: Bloco sem videoId
    Given nota com `:::video` sem `videoId`
    When a pessoa exporta Markdown
    Then o bloco é omitido do arquivo com aviso explícito e nada é enviado à rede
```

#### AC-025 — `<br />` vira quebra real no PDF

**Cobre**: US-005, FR-009, NFR-001

```gherkin
@US-005 @FR-009 @NFR-001 @AC-025
Feature: Apresentação da exportação

  Scenario: Nota com tags `<br />` literais
    Given nota contendo `<br />` no corpo
    When a pessoa exporta PDF
    Then nenhuma tag aparece como texto e as quebras se refletem com leitura por tecnologia assistiva preservada
```

#### AC-026 — Folha de estilo editorial no PDF

**Cobre**: US-005, FR-009, NFR-002

```gherkin
@US-005 @FR-009 @NFR-002 @AC-026
Feature: Apresentação da exportação

  Scenario: Documento para impressão
    Given nota com título, versos expandidos e formatação
    When a pessoa exporta PDF
    Then a página traz título, versos em callout, tipografia e margens editoriais sem travar a interface
```

#### AC-027 — Markdown também saneia `<br />`

**Cobre**: US-005, FR-009, NFR-003

```gherkin
@US-005 @FR-009 @NFR-003 @AC-027
Feature: Apresentação da exportação

  Scenario: Exportar Markdown com tags literais
    Given nota contendo `<br />` no corpo
    When a pessoa exporta Markdown
    Then o arquivo traz quebras reais no lugar das tags e o original permanece intacto
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve suprimir o menu nativo na seleção em edição e exibir popover com Negrito, Itálico, Sublinhado e Destaque, aplicando a marca ao Markdown.
- **FR-002**: O sistema deve detectar referências em texto livre, exibir hover card com o texto na versão do parser ou na padrão e preservar o clique que abre o versículo.
- **FR-003**: O sistema deve listar H1–H3 em dropdown no desktop e drawer Índices no mobile e rolar até a seção ao escolher.
- **FR-004**: O sistema deve aceitar URL YouTube por colagem ou `/video`, validar o provedor, inserir bloco sem autoplay e recusar inválidas com erro inline.
- **FR-005**: O sistema deve exportar PDF e Markdown com cada `:::verse` expandido para referência mais texto completo, sem alterar o arquivo original.
- **FR-006**: O sistema deve oferecer nas configurações da nota a opção de toolbar sempre visível, com padrão visível na edição e oculta na visualização.
- **FR-007**: O sistema deve renderizar `==destaque==` (com cor `=={cor}…==`) e `++sublinhado++` como marcas nativas no editor, com roundtrip das convenções e guarda para não converter `C++`.
- **FR-008**: O sistema deve converter cada bloco `:::video` válido em iframe do YouTube no Markdown exportado, omitindo com aviso o bloco sem `videoId`, sem alterar o original.
- **FR-009**: O sistema deve sanear tags `<br />` literais para quebras reais nas saídas e aplicar folha de estilo editorial (título, versos, tipografia, margens) na impressão/PDF.

#### Não funcionais

- **NFR-001**: Acessibilidade por teclado completa nas superfícies novas com foco visível, Escape e nomes acessíveis. **Verificação**: navegação por teclado e inspeção de `role`, foco e `aria-live` em desktop e mobile.
- **NFR-002**: Desempenho local sem bloqueio da digitação em hover, índice, vídeo sob demanda e export da nota atual. **Verificação**: medição manual de interação e teste Vitest de parser e expansão sem rede.
- **NFR-003**: Segurança e privacidade com validação de URL restrita ao YouTube, sem autoplay e sem envio do conteúdo. **Verificação**: teste de URL inválida, inspeção de carregamento sob demanda e revisão de que hover e export usam fonte local.

#### Erros e casos-limite

- Sem Bíblia instalada → hover e export mostram aviso sem inventar texto.
- Referência ambígua ou fora do padrão → sem card e sem quebra da edição.
- URL inválida ou fora do YouTube → erro inline e bloco não inserido.
- Nota sem H1–H3 → índice vazio com orientação.
- Falha de export → erro explícito sem alterar o original.
- Bloco `:::video` sem `videoId` → omitido do Markdown exportado com aviso, sem falhar o restante.
- Workspace não pronto → mantém onboarding e permissão vigentes.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- SvelteKit 2.70.2, Svelte 5.56.9, TypeScript, Vite, Vitest, Playwright, Tailwind 4.3.3, shadcn-svelte local, Milkdown 7.22.1 com remark-directive, Tipex legado em transição, Tauri desktop e adapter Cloudflare.

#### Arquitetura e módulos

- Estender `MilkdownNoteEditor.svelte` com plugin ProseMirror de popover, parser de referências com hover card, índice derivado do documento, nó de vídeo e serviço de export com expansão de fences.
- Marks `highlight` e `underline` via `$markSchema` com plugin remark (`==`/`=={cor}==` e `++` com guardas) e input rule pela receita oficial; popover aplica as marks do schema.
- Export Markdown converte `:::video` em iframe e saneia `<br />`; impressão aplica folha editorial com título, versos, tipografia e margens.
- Reaproveitar `VerseSelector`, `VerseBlockView`, `BibleReferenceViewer`, `Dialog`/`Sheet`, catálogo OpenLP e `note_verse_ref`; sem nova tabela auxiliar.
- Persistência inalterada: Markdown+YAML fonte; vídeo guarda URL validada no corpo; preferência de toolbar em metadado da nota ou preferência local a confirmar no plano.

#### Migrations

- Não aplicável: sem mudança de schema SQLite; índice `note_verse_ref` segue reindexado após save.

#### Models

- Nota Markdown vigente com H1↔`title`; bloco de vídeo com URL YouTube validada; preferência de toolbar com default visível em edição.

#### Controllers e casos de uso

- Ações do editor para popover, hover, índice, inserção de vídeo e export; leitura bíblica via repositório OpenLP local com fallback de versão padrão.

#### Views e experiência

- Popover, hover card, dropdown e drawer Índices, bloco de vídeo e botões de export no header de `/notes/[id]`; estados vazio, aviso e erro conforme AC; manter canvas full-bleed.
- Destaque e sublinhado renderizam como marcas nativas no canvas; impressão/PDF aplica folha editorial com título, versos, tipografia e margens, sem tags literais.

#### Queries e repositórios

- Consultas parametrizadas a `bibles/*.sqlite` para hover e export; índice de títulos em memória a partir do documento aberto.

#### Jobs e processamento assíncrono

- Não aplicável: export síncrono da nota atual com feedback; sem fila.

#### Estrutura de arquivos

```text
specs/draft/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/
  spec.md
  research/
src/
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Nota | `notes/<noteId>.md` | YAML com `title`, `createdAt`, `updatedAt`, `type`; corpo com H1–H3, `:::verse` e bloco de vídeo YouTube | Contém N fences e N vídeos |
| Preferência de toolbar | Escopo da nota | Booleano com default visível em edição e oculta em visualização | 1 por nota |
| Versão bíblica efetiva | `versionId` | Versão do parser quando houver, senão `defaultBibleVersionId` ou `readerSelection.versionId` | Resolve texto em `bibles/*.sqlite` |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Popover | Oculto | Seleção não colapsada em edição | Visível | Só em edição; Escape oculta |
| Hover card | Oculto | Pairar ou focar referência válida | Visível | Sem Bíblia mostra aviso |
| Índice | Fechado | Abrir dropdown ou drawer | Aberto com H1–H3 ou vazio | Clique rola até a seção |
| Vídeo | Ausente | URL válida confirmada | Bloco inserido sem autoplay | Só YouTube validado |
| Export | Não iniciado | Exportar PDF ou Markdown | Arquivo gerado ou erro explícito | Original intacto |

#### Migração e retenção

- Não aplicável: sem migração de notas; vídeo e preferência usam formato Markdown e metadado compatíveis com leitura fora do app.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim, evolução do editor `/notes/[id]` em desktop e mobile.

#### Stack e convenções de interface

- SvelteKit e Svelte 5 com componentes Svelte; shadcn-svelte local com `Dialog`, `Sheet`, `Drawer`, `Select`, `Button`; Milkdown e ProseMirror no canvas; Tailwind e Geist; testes Vitest e Playwright. Telas atuais afetadas: `/notes/[id]` via `MilkdownNoteEditor`, split `BibleNoteSplit` e `MilkdownMobileToolbar`. Preservar canvas full-bleed, slash desktop, drawer 90dvh e toolbar acima da navegação; alterar com popover, hover, índice, vídeo, exports e opção de toolbar.

#### Telas e responsabilidades

- `/notes/[id]`: pessoa usuária individual edita a nota, formata por popover, consulta hover, navega pelo índice, insere vídeo, configura toolbar e exporta PDF/Markdown.

#### Fluxo de informação e navegação

- A pessoa abre a nota pela lista, shell ou leitor; seleciona texto e formata pelo popover; paira referências para o card; abre o índice no header e navega; cola URL ou usa `/video`; exporta pelo header; ajusta a toolbar nas configurações. Breadcrumb: Início > Notas > Nota. Retorno preserva posição e salvamento com `aria-live`.

#### Menus e navegação principal

- menus vigentes preservados: menu Sidebar desktop com itens Início (`/`), Bíblia (`/bible`), Notas (`/notes`), Destaques (`/highlights`), Sermões (`/sermons`), Estudos (`/study`) e Configuração (`/config`), com destinos e rotas inalterados; barra mobile com itens e destinos equivalentes. Menus secundários desta fatia na tela `/notes/[id]`: item Índice no header com destino à seção atual via dropdown no desktop e drawer Índices no mobile; itens Exportar PDF e Exportar Markdown com destino a download local; item de configuração da toolbar com destino ao comportamento de visibilidade. A pessoa navega entre telas pelos menus globais e dentro da nota pelo índice; sem permissão além do workspace local; responsivo com drawer e safe area no mobile.

#### Formulários e ações

- Campo URL no `/video` com validação YouTube, erro inline e confirmação; opção booleana de toolbar com aplicação imediata; índice como lista de botões sem formulário. Ação principal de export gera download; padrão de abertura: popover ancorado, hover card, dropdown desktop, drawer mobile e Dialog vigente preservado.

#### Composição e disposição

- Header da nota com título, índice, exports e configurações; canvas contínuo com popover ancorado à seleção e toolbar conforme preferência; hover card próximo à referência sem cobrir a linha; bloco de vídeo em largura do conteúdo; drawer Índices inferior em 90dvh no mobile. Densidade vigente sem moldura.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| — | — | Projeto Svelte sem React nesta entrega | — | — | — | — |

- Componentes Svelte: estender `MilkdownNoteEditor`, `MilkdownMobileToolbar`, `VerseSelector`, `VerseBlockView`, `BibleReferenceViewer` com novos `SelectionFormatPopover`, `ReferenceHoverCard`, `NoteIndexMenu`, `YouTubeBlockView` e `NoteExportActions` sobre primitives shadcn-svelte locais; registrar uso em `INTERFACE.md`.

#### Estados e acessibilidade

- Loading na resolução do hover e na geração do export; vazio no índice sem títulos; aviso sem Bíblia; erro inline de URL e erro de export com retry; sucesso de export com `aria-live`. Teclado completo, foco visível, Escape fecha popover, card, dropdown e drawer, alvos de 40 px no mobile e `prefers-reduced-motion` sem transições. Breadcrumb com links válidos e página atual marcada.

#### Contrato CRUD

- Sem CRUD novo nesta fatia; o `PageHeader` único segue reutilizado em lista e detalhe de notas, e o contrato existente de `DataGrid` em largura total com coluna `ID` visível, linha como link e ações independentes de editar e apagar permanece inalterado.

#### Revisão visual durante o desenvolvimento

- Revisão visual ocorre durante a implementação nos viewports desktop e mobile, nos temas claro e escuro, com conteúdo curto e longo, conferindo bordas, espaçamentos, margens, padding, tipografia, alinhamento, overflow, foco e safe area; registro na tarefa com abordagem, estados e ajustes.

#### APIs expostas

- Nenhuma API remota nova; ações internas do editor e downloads locais de export.

#### APIs externas utilizadas

- Nenhuma API externa obrigatória; embed YouTube carrega mídia de terceiros somente sob ação da pessoa, sem chave e sem envio do conteúdo.

#### Documentação das APIs consultadas

- Nenhuma documentação externa nova nesta definição.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: parser de referências, validação YouTube, derivação de H1–H3 e expansão de `:::verse` para Markdown.
- **Integração/contrato**: hover e export contra Bíblia OpenLP local com versão do parser e padrão; índice contra documento Milkdown.
- **BDD/aceite**: Gherkin da seção 6 como referência para desenhar os testes TDD.
- **Runner TDD**: Vitest com decisão confirmada em `.specsfy/USER-PROFILE.md`; materializar em `test:tdd` quando aplicável à fatia.
- **E2E**: Playwright nas jornadas popover, hover, índice, vídeo e export em desktop e mobile, ou justificativa quando cobertas por integração.
- **Verificação manual**: Somente o inevitável em posicionamento de popover, rolagem do índice e paginação do PDF, com motivo registrado.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | Caso Vitest do popover com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `selection-popover` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 selection-popover + preview `++` (25 passed com regressão) | Pending |
| US-001, FR-001, NFR-002, AC-002 | AC-002 na seção 6 | Caso Vitest de aplicação de marca com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `selection-popover` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 selection-popover + preview `++` (25 passed com regressão) | Pending |
| US-001, FR-001, NFR-003, AC-003 | AC-003 na seção 6 | Caso Vitest de seleção colapsada com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `selection-popover` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 selection-popover + preview `++` (25 passed com regressão) | Pending |
| US-002, FR-002, NFR-001, AC-004 | AC-004 na seção 6 | Caso Vitest de hover com versão do parser com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `reference-hover` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 reference-hover + regressão parser/decorações (17 passed) | Pending |
| US-002, FR-002, NFR-002, AC-005 | AC-005 na seção 6 | Caso Vitest de versão padrão com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `reference-hover` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 reference-hover + regressão parser/decorações (17 passed) | Pending |
| US-002, FR-002, NFR-003, AC-006 | AC-006 na seção 6 | Caso Vitest sem Bíblia com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `reference-hover` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 reference-hover + regressão parser/decorações (17 passed) | Pending |
| US-003, FR-003, NFR-001, AC-007 | AC-007 na seção 6 | Caso Vitest de índice desktop com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-index` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-index + regressão editor (5 passed) + tipos limpos | Pending |
| US-003, FR-003, NFR-002, AC-008 | AC-008 na seção 6 | Caso Vitest de drawer mobile com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-index` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-index + regressão editor (5 passed) + tipos limpos | Pending |
| US-003, FR-003, NFR-003, AC-009 | AC-009 na seção 6 | Caso Vitest de índice vazio com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-index` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-index + regressão editor (5 passed) + tipos limpos | Pending |
| US-004, FR-004, NFR-001, AC-010 | AC-010 na seção 6 | Caso Vitest de URL válida com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `youtube-embed` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 youtube-embed + regressão slash/editor (12 passed) + tipos limpos | Pending |
| US-004, FR-004, NFR-002, AC-011 | AC-011 na seção 6 | Caso Vitest de carga sob demanda com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `youtube-embed` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 youtube-embed + regressão slash/editor (12 passed) + tipos limpos | Pending |
| US-004, FR-004, NFR-003, AC-012 | AC-012 na seção 6 | Caso Vitest de URL inválida com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `youtube-embed` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 youtube-embed + regressão slash/editor (12 passed) + tipos limpos | Pending |
| US-005, FR-005, NFR-001, AC-013 | AC-013 na seção 6 | Caso Vitest de Markdown expandido com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-export` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-export + inspeção do documento derivado (3 passed) + tipos limpos | Pending |
| US-005, FR-005, NFR-002, AC-014 | AC-014 na seção 6 | Caso Vitest de PDF equivalente com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-export` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-export + inspeção do documento derivado (3 passed) + tipos limpos | Pending |
| US-005, FR-005, NFR-003, AC-015 | AC-015 na seção 6 | Caso Vitest de original intacto com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-export` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-export + inspeção do documento derivado (3 passed) + tipos limpos | Pending |
| US-006, FR-006, NFR-001, AC-016 | AC-016 na seção 6 | Caso Vitest de padrão de toolbar com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-toolbar` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-toolbar + regressão toolbar/editor (17 passed) + tipos limpos | Pending |
| US-006, FR-006, NFR-002, AC-017 | AC-017 na seção 6 | Caso Vitest de preferência persistida com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-toolbar` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-toolbar + regressão toolbar/editor (17 passed) + tipos limpos | Pending |
| US-006, FR-006, NFR-003, AC-018 | AC-018 na seção 6 | Caso Vitest de consistência mobile com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `note-toolbar` ausente (vitest: Cannot find module) | GREEN 2026-09-05: 3/3 note-toolbar + regressão toolbar/editor (17 passed) + tipos limpos | Pending |
| US-007, FR-007, NFR-001, AC-019 | AC-019 na seção 6 | Caso Vitest de mark `==` com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `milkdown-mark-node` ausente | GREEN 2026-09-05: 3/3 mark-node + regressão das notas (110 passed; só REDs T034/T038) + tipos limpos | Pending |
| US-007, FR-007, NFR-002, AC-020 | AC-020 na seção 6 | Caso Vitest de mark `++` com guarda com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `milkdown-mark-node` ausente | GREEN 2026-09-05: 3/3 mark-node + regressão das notas (110 passed; só REDs T034/T038) + tipos limpos | Pending |
| US-007, FR-007, NFR-003, AC-021 | AC-021 na seção 6 | Caso Vitest de popover com mark real com marcador próprio `SPECSFY:` | RED 2026-09-05: módulo `milkdown-mark-node` ausente | GREEN 2026-09-05: 3/3 mark-node + regressão das notas (110 passed; só REDs T034/T038) + tipos limpos | Pending |
| US-004, FR-008, NFR-001, AC-022 | AC-022 na seção 6 | Caso Vitest de iframe no export com marcador próprio `SPECSFY:` | RED 2026-09-05: iframe de vídeo ausente no export | GREEN 2026-09-05: 3/3 vídeo-iframe + inspeção do derivado (focal vídeo) + tipos limpos | Pending |
| US-004, FR-008, NFR-002, AC-023 | AC-023 na seção 6 | Caso Vitest de múltiplos vídeos com marcador próprio `SPECSFY:` | RED 2026-09-05: iframe de vídeo ausente no export | GREEN 2026-09-05: 3/3 vídeo-iframe + inspeção do derivado (focal vídeo) + tipos limpos | Pending |
| US-004, FR-008, NFR-003, AC-024 | AC-024 na seção 6 | Caso Vitest de vídeo sem ID com marcador próprio `SPECSFY:` | RED 2026-09-05: `expandVideoFences` ausente | GREEN 2026-09-05: 3/3 vídeo-iframe + inspeção do derivado (focal vídeo) + tipos limpos | Pending |
| US-005, FR-009, NFR-001, AC-025 | AC-025 na seção 6 | Caso Vitest de `<br />` no PDF com marcador próprio `SPECSFY:` | RED 2026-09-05: saneamento de `<br />` ausente | GREEN 2026-09-05: 9/9 note-export + inspeção do impresso (dedup H1, sem tags) + tipos limpos | Pending |
| US-005, FR-009, NFR-002, AC-026 | AC-026 na seção 6 | Caso Vitest de folha editorial com marcador próprio `SPECSFY:` | RED 2026-09-05: `buildPrintDocument` ausente | GREEN 2026-09-05: 9/9 note-export + inspeção do impresso (dedup H1, sem tags) + tipos limpos | Pending |
| US-005, FR-009, NFR-003, AC-027 | AC-027 na seção 6 | Caso Vitest de `<br />` no Markdown com marcador próprio `SPECSFY:` | RED 2026-09-05: saneamento de `<br />` ausente | GREEN 2026-09-05: 9/9 note-export + inspeção do impresso (dedup H1, sem tags) + tipos limpos | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `apps/web/src/lib/features/notes/selection-popover.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-001 | AC-002 | Unidade | `apps/web/src/lib/features/notes/selection-popover.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-001 | AC-003 | Unidade | `apps/web/src/lib/features/notes/selection-popover.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-002 | AC-004 | Integração | `apps/web/src/lib/features/notes/reference-hover.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-002 | AC-005 | Integração | `apps/web/src/lib/features/notes/reference-hover.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-002 | AC-006 | Integração | `apps/web/src/lib/features/notes/reference-hover.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-003 | AC-007 | Unidade | `apps/web/src/lib/features/notes/note-index.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-003 | AC-008 | Unidade | `apps/web/src/lib/features/notes/note-index.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-003 | AC-009 | Unidade | `apps/web/src/lib/features/notes/note-index.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-004 | AC-010 | Unidade | `apps/web/src/lib/features/notes/youtube-embed.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-004 | AC-011 | Integração | `apps/web/src/lib/features/notes/youtube-embed.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-004 | AC-012 | Unidade | `apps/web/src/lib/features/notes/youtube-embed.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-005 | AC-013 | Unidade | `apps/web/src/lib/features/notes/note-export.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-005 | AC-014 | Integração | `apps/web/src/lib/features/notes/note-export.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-005 | AC-015 | Unidade | `apps/web/src/lib/features/notes/note-export.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-006 | AC-016 | Unidade | `apps/web/src/lib/features/notes/note-toolbar.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-006 | AC-017 | Unidade | `apps/web/src/lib/features/notes/note-toolbar.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-006 | AC-018 | Integração | `apps/web/src/lib/features/notes/note-toolbar.test.ts` | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-001 | AC-001 | Unidade | Inspeção de teclado e ARIA no popover | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-001 | AC-004 | Integração | Inspeção de foco no hover | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-001 | AC-007 | Unidade | Inspeção de foco no índice | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-002 | AC-002 | Unidade | Medição de interação sem bloqueio | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-002 | AC-005 | Integração | Teste local sem rede | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-002 | AC-014 | Integração | Medição de export da nota atual | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-003 | AC-003 | Unidade | Revisão de não alteração em leitura | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-003 | AC-006 | Integração | Revisão de aviso sem inventar texto | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| NFR-003 | AC-012 | Unidade | Teste de URL restrita ao YouTube | Passed 2026-09-05: suíte Vitest 96 arquivos/380 testes verdes |
| FR-007 | AC-019 | Unidade | `apps/web/src/lib/features/notes/milkdown-mark-node.test.ts` | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| FR-007 | AC-020 | Unidade | `apps/web/src/lib/features/notes/milkdown-mark-node.test.ts` | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| FR-007 | AC-021 | Integração | `apps/web/src/lib/features/notes/milkdown-mark-node.test.ts` | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| FR-008 | AC-022 | Unidade | `apps/web/src/lib/features/notes/note-export.test.ts` | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| FR-008 | AC-023 | Unidade | `apps/web/src/lib/features/notes/note-export.test.ts` | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| FR-008 | AC-024 | Unidade | `apps/web/src/lib/features/notes/note-export.test.ts` | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| FR-009 | AC-025 | Unidade | `apps/web/src/lib/features/notes/note-export.test.ts` | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| FR-009 | AC-026 | Integração | Inspeção do documento impresso | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| FR-009 | AC-027 | Unidade | `apps/web/src/lib/features/notes/note-export.test.ts` | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-001 | AC-019 | Unidade | Inspeção de teclado e ARIA nas marks | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-001 | AC-022 | Unidade | Inspeção de título do iframe | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-001 | AC-025 | Unidade | Inspeção de leitura do impresso | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-002 | AC-020 | Unidade | Medição de remark sem bloqueio | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-002 | AC-023 | Unidade | Geração sem rede | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-002 | AC-026 | Integração | Medição de impressão da nota atual | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-003 | AC-021 | Unidade | Revisão de marca sem alterar texto | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-003 | AC-024 | Unidade | Revisão de omissão sem rede | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |
| NFR-003 | AC-027 | Unidade | Revisão de original intacto | Passed 2026-09-05: suíte Vitest 97 arquivos/389 testes verdes |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed — revalidação em 2026-09-05: estrutura VALID, cobertura 7 US/9 FR/3 NFR ↔ 27 ACs, lentes sem P1 Open.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/spec.md`
- **Achados**: Revalidação pós-mudança sem bloqueadores; achados FIND anteriores preservados abaixo.
- Findings especializados, quando aplicáveis, seguem `FIND-PROD|ARCH|SEC-NNN`,
  severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

- **FIND-PROD-001** [P2] [Accepted] Biblioteca de PDF adiada para o plano sem travar a definição — Refs: FR-005 — Evidence: apps/web/package.json:1 — Effect: escolha de dependência fica para o plano — Suggestion: definir lib local sem rede em `$specsfy-05-tasks`
- **FIND-ARCH-001** [P2] [Accepted] Armazenamento da preferência de toolbar a confirmar no plano — Refs: FR-006 — Evidence: apps/web/src/lib/storage/preferences.ts:1 — Effect: metadado da nota ou preferência local — Suggestion: decidir caminho de arquivo em `$specsfy-05-tasks`
- **FIND-SEC-001** [P3] [Accepted] Embed YouTube restrito com carga sob demanda — Refs: FR-004 — Evidence: apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte:1 — Effect: superfície externa limitada — Suggestion: manter validação e sem autoplay na implementação
- **FIND-SEC-002** [P3] [Accepted] iframe carrega no preview externo sem fachada — Refs: FR-008 — Evidence: apps/web/src/lib/features/notes/note-export.ts:1 — Effect: Markdown exportado abre o player ao visualizar fora do app — Suggestion: aceito por pedido explícito (DEC-008) e coerente com o embed; sem autoplay

#### Gate do Ato II — Plano

- **Resultado**: Passed — 2026-09-05
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/spec.md` → READY (total=40, tdd=27, code=9, 46/46 IDs cobertos); interface OK; 9 predecessores TDD novos concluídos com RED.
- **Achados**: Nenhum bloqueador.

#### Gate do Ato III — Entrega

- **Resultado**: Passed — 2026-09-05
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/spec.md .` → 46/46 (um órfão de outra spec); `verify_acceptance.mjs` → QA PASSED; suíte 97 arquivos/389 testes verdes; `validate_tasks.mjs` → READY 40/40.
- **Achados**: Nenhum bloqueador; `check` com 25 erros pré-existentes fora da fatia e 0 nos arquivos entregues.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Cada tarefa possui exatamente este checklist, atualizado durante a execução:

```markdown
  - [ ] **PREP**: Confirmar escopo, IDs, dependências e baseline.
  - [ ] **EXECUTE**: Produzir a entrega no caminho declarado.
  - [ ] **VERIFY**: Executar a verificação focal adequada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema; se não houver interface, registrar `Não aplicável` e o motivo.
  - [ ] **EVIDENCE**: Registrar comando, resultado e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
```

Decisões de plano: PDF via impressão do navegador (`window.print` com CSS de impressão, sem nova dependência); Markdown via download de Blob; vídeo com fachada clique-para-carregar (`youtube-nocookie`) sem autoplay; parser de referências em texto livre com padrão restrito a livro+capítulo+verso. Sem mudança de schema, manifest ou dependência — sem tarefas `[DOC]` para `STACK.md` ou `DATABASE.md`.

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar do AC-001 caso Vitest de exibição do popover em apps/web/src/lib/features/notes/selection-popover.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-001 e confirmar seleção não colapsada, 4 ações e supressão do menu nativo.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/selection-popover.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T002 [P] [TEST] [TDD] [US-001] Derivar do AC-002 caso Vitest de aplicação de marca em apps/web/src/lib/features/notes/selection-popover.test.ts — Refs: US-001, FR-001, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-002 e confirmar aplicação de Negrito com persistência sem travar a digitação.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/selection-popover.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T003 [P] [TEST] [TDD] [US-001] Derivar do AC-003 caso Vitest de seleção colapsada em apps/web/src/lib/features/notes/selection-popover.test.ts — Refs: US-001, FR-001, NFR-003, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-003 e confirmar ausência de popover com cursor colapsado ou em visualização.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/selection-popover.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T004 [P] [TEST] [TDD] [US-002] Derivar do AC-004 caso Vitest de hover com versão do parser em apps/web/src/lib/features/notes/reference-hover.test.ts — Refs: US-002, FR-002, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-004 e confirmar card com texto da versão do parser e ação de abrir no leitor.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/reference-hover.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T005 [P] [TEST] [TDD] [US-002] Derivar do AC-005 caso Vitest de hover com versão padrão em apps/web/src/lib/features/notes/reference-hover.test.ts — Refs: US-002, FR-002, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-005 e confirmar fallback para `defaultBibleVersionId` ou `readerSelection` sem rede.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/reference-hover.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T006 [P] [TEST] [TDD] [US-002] Derivar do AC-006 caso Vitest de hover sem Bíblia em apps/web/src/lib/features/notes/reference-hover.test.ts — Refs: US-002, FR-002, NFR-003, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-006 e confirmar aviso explícito sem inventar texto bíblico.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/reference-hover.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T007 [P] [TEST] [TDD] [US-003] Derivar do AC-007 caso Vitest de índice desktop em apps/web/src/lib/features/notes/note-index.test.ts — Refs: US-003, FR-003, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-007 e confirmar listagem H1–H3 com rolagem e foco gerenciado.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-index.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T008 [P] [TEST] [TDD] [US-003] Derivar do AC-008 caso Vitest de drawer mobile em apps/web/src/lib/features/notes/note-index.test.ts — Refs: US-003, FR-003, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-008 e confirmar fechamento do drawer com rolagem sem perda de posição.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-index.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T009 [P] [TEST] [TDD] [US-003] Derivar do AC-009 caso Vitest de índice vazio em apps/web/src/lib/features/notes/note-index.test.ts — Refs: US-003, FR-003, NFR-003, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-009 e confirmar estado vazio com orientação e sem navegação.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-index.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T010 [P] [TEST] [TDD] [US-004] Derivar do AC-010 caso Vitest de URL válida em apps/web/src/lib/features/notes/youtube-embed.test.ts — Refs: US-004, FR-004, NFR-001, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-010 e confirmar bloco nomeado sem autoplay com link equivalente.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/youtube-embed.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T011 [P] [TEST] [TDD] [US-004] Derivar do AC-011 caso Vitest de carga sob demanda em apps/web/src/lib/features/notes/youtube-embed.test.ts — Refs: US-004, FR-004, NFR-002, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-011 e confirmar que o player só carrega ao reproduzir.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/youtube-embed.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T012 [P] [TEST] [TDD] [US-004] Derivar do AC-012 caso Vitest de URL inválida em apps/web/src/lib/features/notes/youtube-embed.test.ts — Refs: US-004, FR-004, NFR-003, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-012 e confirmar recusa com erro inline para fora do YouTube.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/youtube-embed.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T013 [P] [TEST] [TDD] [US-005] Derivar do AC-013 caso Vitest de Markdown expandido em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-005, FR-005, NFR-001, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-013 e confirmar citação com referência e texto na versão do bloco.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T014 [P] [TEST] [TDD] [US-005] Derivar do AC-014 caso Vitest de PDF equivalente em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-005, FR-005, NFR-002, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-014 e confirmar conteúdo equivalente ao Markdown sem travar a interface.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T015 [P] [TEST] [TDD] [US-005] Derivar do AC-015 caso Vitest de original intacto em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-005, FR-005, NFR-003, AC-015 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-015 e confirmar YAML e `:::verse` preservados com erro explícito em falha.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T016 [P] [TEST] [TDD] [US-006] Derivar do AC-016 caso Vitest de padrão da toolbar em apps/web/src/lib/features/notes/note-toolbar.test.ts — Refs: US-006, FR-006, NFR-001, AC-016 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-016 e confirmar visível editando e oculta visualizando por teclado.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-toolbar.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T017 [P] [TEST] [TDD] [US-006] Derivar do AC-017 caso Vitest de preferência persistida em apps/web/src/lib/features/notes/note-toolbar.test.ts — Refs: US-006, FR-006, NFR-002, AC-017 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-017 e confirmar aplicação imediata com persistência entre reaberturas.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-toolbar.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T018 [P] [TEST] [TDD] [US-006] Derivar do AC-018 caso Vitest de consistência mobile em apps/web/src/lib/features/notes/note-toolbar.test.ts — Refs: US-006, FR-006, NFR-003, AC-018 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-018 e confirmar nenhum conteúdo coberto e foco preservado nos dois viewports.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-toolbar.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

#### Fase 2 — US-001 Formatar por popover na seleção (P1)

**Objetivo**: Popover com 4 ações sobre a seleção em edição.
**Teste independente**: Selecionar texto mostra o popover; Negrito persiste no Markdown.

- [x] T019 [CODE] [US-001] Implementar popover de formatação em apps/web/src/lib/features/notes/SelectionFormatPopover.svelte integrado a MilkdownNoteEditor.svelte — Refs: US-001, FR-001, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED de T001–T003 e baseline de `MilkdownNoteEditor.svelte`; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `selection-popover.ts`, `SelectionFormatPopover.svelte`, integração no editor e suporte `++` no renderizador de preview.
  - [x] **VERIFY**: Executar focal `selection-popover.test.ts`, `verse-block-extension.test.ts`, `MilkdownNoteEditor.test.ts` e `MilkdownMobileToolbar.test.ts` até GREEN (25 passed).
  - [x] **VISUAL**: Render SSR do popover com role=toolbar, 4 botões nomeados, bordas, espaçamentos, margens, padding e tipografia por tokens, sem gradiente/glow/sombra; corrigido tabindex=-1 do aviso a11y.
  - [x] **EVIDENCE**: Registrar GREEN e mini-RED `++` (falha comportamental antes do suporte) nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: Guardas de fronteira no `++` para não tocar `C++`; nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T019","refs":["US-001","FR-001","NFR-001","NFR-002","NFR-003","AC-001","AC-002","AC-003"],"files":["apps/web/src/lib/features/notes/SelectionFormatPopover.svelte","apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/selection-popover.test.ts","exit":0}]} -->

**Checkpoint**: Seleção em edição exibe o popover e aplica as 4 marcas.

#### Fase 3 — US-002 Prévia bíblica em hover (P1)

**Objetivo**: Hover card com o texto da referência sem sair da nota.
**Teste independente**: `Gn 3.1` mostra o card; clique atual continua abrindo o versículo.

- [x] T020 [CODE] [US-002] Implementar parser e hover card em apps/web/src/lib/features/notes/ReferenceHoverCard.svelte com apps/web/src/lib/bible/reference-parser.ts — Refs: US-002, FR-002, NFR-001, NFR-002, NFR-003, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: Confirmar RED de T004–T006 e baseline do `bibleReferencePlugin`; `docs/ --check` íntegro antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `reference-parser.ts`, `reference-hover.ts`, `ReferenceHoverCard.svelte` e hover no editor com clique preservado.
  - [x] **VERIFY**: Executar focal `reference-hover.test.ts` e regressão do editor, parser e decorações até GREEN (17 passed).
  - [x] **VISUAL**: Render SSR do card pronto e sem Bíblia com role=dialog, bordas, espaçamentos, margens, padding e tipografia por tokens, sem gradiente/glow/sombra.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: Reaproveitar parser, repositório e viewer existentes em vez de nova fonte; nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T020","refs":["US-002","FR-002","NFR-001","NFR-002","NFR-003","AC-004","AC-005","AC-006"],"files":["apps/web/src/lib/features/notes/ReferenceHoverCard.svelte","apps/web/src/lib/bible/reference-parser.ts"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/reference-hover.test.ts","exit":0}]} -->

**Checkpoint**: Referência válida exibe o card; sem Bíblia exibe aviso.

#### Fase 4 — US-003 Navegar por títulos da nota (P1)

**Objetivo**: Índice H1–H3 com dropdown e drawer.
**Teste independente**: Clique no título rola até a seção no desktop e no mobile.

- [x] T021 [CODE] [US-003] Implementar índice em apps/web/src/lib/features/notes/NoteIndexMenu.svelte no header de /notes/[id] — Refs: US-003, FR-003, NFR-001, NFR-002, NFR-003, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: Confirmar RED de T007–T009 e baseline do header de `/notes/[id]`; `docs/ --check` íntegro antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `note-index.ts`, `NoteIndexMenu.svelte` e fiação header↔editor com âncoras estáveis.
  - [x] **VERIFY**: Executar focal `note-index.test.ts` e regressão do editor até GREEN (5 passed); `check` sem erros nos arquivos da fatia.
  - [x] **VISUAL**: Revisão estática dos primitivos DropdownMenu/Sheet com bordas, espaçamentos, margens, padding e tipografia por tokens e níveis por recuo; SSR não cobre portais (limitação registrada).
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: Enumeração pelo DOM vivo com `data-note-anchor` em vez de dupla fonte; nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T021","refs":["US-003","FR-003","NFR-001","NFR-002","NFR-003","AC-007","AC-008","AC-009"],"files":["apps/web/src/lib/features/notes/NoteIndexMenu.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/note-index.test.ts","exit":0}]} -->

**Checkpoint**: Índice lista títulos e navega nos dois viewports.

#### Fase 5 — US-004 Embutir vídeo do YouTube (P2)

**Objetivo**: Bloco de vídeo validado sem autoplay.
**Teste independente**: URL válida gera bloco; inválida mostra erro.

- [x] T022 [CODE] [US-004] Implementar bloco de vídeo em apps/web/src/lib/features/notes/YouTubeBlockView.svelte com nó Milkdown e item /video — Refs: US-004, FR-004, NFR-001, NFR-002, NFR-003, AC-010, AC-011, AC-012 — Depends: T010, T011, T012
  - [x] **PREP**: Confirmar RED de T010–T012 e baseline do slash; `docs/ --check` íntegro antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `youtube-embed.ts`, `milkdown-video-node.ts`, `YouTubeBlockView.svelte`, item `/video`, diálogo de URL, colagem conversora e fachada clique-para-carregar.
  - [x] **VERIFY**: Executar focal `youtube-embed.test.ts` e regressão slash/editor até GREEN (12 passed); `check` sem erros nos arquivos da fatia.
  - [x] **VISUAL**: Render SSR da fachada e do iframe nocookie com bordas, espaçamentos, margens, padding e tipografia por tokens, sem gradiente/glow/sombra.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: Player só via youtube-nocookie após play; `video` liberado no fallback de diretivas; nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T022","refs":["US-004","FR-004","NFR-001","NFR-002","NFR-003","AC-010","AC-011","AC-012"],"files":["apps/web/src/lib/features/notes/YouTubeBlockView.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/youtube-embed.test.ts","exit":0}]} -->

**Checkpoint**: Vídeo válido embute sob demanda; inválido é recusado.

#### Fase 6 — US-005 Exportar nota com versos expandidos (P1)

**Objetivo**: Export PDF e Markdown com texto bíblico expandido.
**Teste independente**: Export contém versos; original mantém o fence.

- [x] T023 [CODE] [US-005] Implementar exportação em apps/web/src/lib/features/notes/note-export.ts com ações no header — Refs: US-005, FR-005, NFR-001, NFR-002, NFR-003, AC-013, AC-014, AC-015 — Depends: T013, T014, T015
  - [x] **PREP**: Confirmar RED de T013–T015 e baseline do header; `docs/ --check` íntegro antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `note-export.ts` (sync+async), botões Markdown/PDF no header e impressão via janela dedicada.
  - [x] **VERIFY**: Executar focal `note-export.test.ts` até GREEN (3 passed); `check` sem erros nos arquivos da fatia.
  - [x] **VISUAL**: Inspecionar documento derivado e botões do header com bordas, espaçamentos, margens, padding e tipografia por tokens; removida linha `>` solta que quebrava o HTML impresso.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: Suporte a `:::verse {` com espaço; escape do título na janela de impressão; nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T023","refs":["US-005","FR-005","NFR-001","NFR-002","NFR-003","AC-013","AC-014","AC-015"],"files":["apps/web/src/lib/features/notes/note-export.ts"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/note-export.test.ts","exit":0}]} -->

**Checkpoint**: Arquivos exportados trazem versos expandidos e original intacto.

#### Fase 7 — US-006 Controlar visibilidade da toolbar (P2)

**Objetivo**: Opção de toolbar com padrão visível editando e oculta visualizando.
**Teste independente**: Alternar a opção aplica e persiste o comportamento.

- [x] T024 [CODE] [US-006] Implementar opção de toolbar em apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte com preferência da nota — Refs: US-006, FR-006, NFR-001, NFR-002, NFR-003, AC-016, AC-017, AC-018 — Depends: T016, T017, T018
  - [x] **PREP**: Confirmar RED de T016–T018 e baseline da toolbar; `docs/ --check` íntegro antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `note-toolbar.ts`, preferência persistida e checkbox no menu da nota com fiação no editor.
  - [x] **VERIFY**: Executar focal `note-toolbar.test.ts` e regressão da toolbar/editor até GREEN (17 passed); `check` sem erros nos arquivos da fatia.
  - [x] **VISUAL**: Render SSR do toggle e da barra com bordas, espaçamentos, margens, padding e tipografia por tokens; checkbox segue padrão existente.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: Regra visível = toggle aberto ou fixada com contrato; nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T024","refs":["US-006","FR-006","NFR-001","NFR-002","NFR-003","AC-016","AC-017","AC-018"],"files":["apps/web/src/lib/features/notes/MilkdownNoteEditor.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/note-toolbar.test.ts","exit":0}]} -->

**Checkpoint**: Toolbar segue a opção configurada nos dois modos.

#### Fase de interface

- [x] T025 [DOC] [US-003] Atualizar INTERFACE.md com os blocos novos em INTERFACE.md — Refs: US-001, US-002, US-003, US-004, US-005, US-006, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001 — Depends: T019, T020, T021, T022, T023, T024
  - [x] **PREP**: Confirmar blocos criados, arquivos, APIs públicas e consumidores nas seis fatias.
  - [x] **EXECUTE**: Registrar `SelectionFormatPopover`, `ReferenceHoverCard`, `NoteIndexMenu` e `YouTubeBlockView` com finalidade, arquivo, estados, consumidores e reuso.
  - [x] **VERIFY**: Conferir via grep que os 4 blocos e os 6 módulos de lógica estão mapeados sem duplicar primitivas.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza documentação em INTERFACE.md.
  - [x] **EVIDENCE**: Registrar diff de `INTERFACE.md` e IDs cobertos na seção 10.
  - [x] **IMPROVE**: Linhas seguem o formato tabular vigente; nenhuma outra melhoria necessária.

#### Fase final — Qualidade

- [x] T026 [TEST] Executar regressão e rastreabilidade dos seis arquivos de teste em apps/web/src/lib/features/notes/ — Refs: US-001, US-002, US-003, US-004, US-005, US-006, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018 — Depends: T019, T020, T021, T022, T023, T024, T025
  - [x] **PREP**: Identificar suítes Vitest, checks estáticos e gates da spec.
  - [x] **EXECUTE**: Executar suíte completa `bun run test:tdd`, `bun run check`, rastreabilidade e validadores de tarefas.
  - [x] **VERIFY**: Confirmar 96 arquivos e 380 testes verdes, 33/33 IDs cobertos e `check` sem erros novos (25 pré-existentes + 0 da fatia).
  - [x] **VISUAL**: Repassar bordas, espaçamentos, margens, padding e tipografia nas telas afetadas via renders SSR e revisão estática; sem regressão visual.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais; `PROJECT.md` sem impacto material (evolução dentro de notas simples).
  - [x] **IMPROVE**: Pré-existentes de `check` documentados como baseline; nenhuma outra melhoria necessária.

#### Fase 8 — US-007 Marcas nativas no editor (P1) — ajuste pós-entrega

**Objetivo**: `==`/`++` renderizados como marcas com roundtrip.
**Teste independente**: Nota legada abre estilizada e salva as convenções.

- [x] T027 [TEST] [TDD] [US-007] Derivar do AC-019 caso Vitest de mark `==` em apps/web/src/lib/features/notes/milkdown-mark-node.test.ts — Refs: US-007, FR-007, NFR-001, AC-019 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-019 e confirmar roundtrip `==teste==` com teclado e ARIA.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/milkdown-mark-node.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T028 [TEST] [TDD] [US-007] Derivar do AC-020 caso Vitest de guarda `++` em apps/web/src/lib/features/notes/milkdown-mark-node.test.ts — Refs: US-007, FR-007, NFR-002, AC-020 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-020 e confirmar guarda anti-`C++` sem rede e sem travar a digitação.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/milkdown-mark-node.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T029 [TEST] [TDD] [US-007] Derivar do AC-021 caso Vitest de marca real no popover em apps/web/src/lib/features/notes/milkdown-mark-node.test.ts — Refs: US-007, FR-007, NFR-003, AC-021 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-021 e confirmar mapeamento ação→mark sem alterar outro conteúdo.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/milkdown-mark-node.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T030 [CODE] [US-007] Implementar marks `highlight`/`underline` em apps/web/src/lib/features/notes/milkdown-mark-node.ts com fiação no popover — Refs: US-007, FR-007, NFR-001, NFR-002, NFR-003, AC-019, AC-020, AC-021 — Depends: T027, T028, T029
  - [x] **PREP**: Confirmar RED de T027–T029 e baseline do editor; verificar `docs/ --check` antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `milkdown-mark-node.ts` (helpers, schemas, remark, input rules) e fiar popover via `toggleMark` com CSS das marcas.
  - [x] **VERIFY**: Executar focal `milkdown-mark-node.test.ts` e regressão das notas até GREEN (110 passed; só os 6 REDs de T034/T038 falham); `check` sem erros nos arquivos da fatia.
  - [x] **VISUAL**: Revisão estática das regras `mark`/`u` com bordas, espaçamentos, margens, padding e tipografia por tokens e cores herdadas; SSR não cobre o canvas ProseMirror.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: `plugin-highlight` descartado com prova (só cobre code blocks); nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T030","refs":["US-007","FR-007","NFR-001","NFR-002","NFR-003","AC-019","AC-020","AC-021"],"files":["apps/web/src/lib/features/notes/milkdown-mark-node.ts"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/milkdown-mark-node.test.ts","exit":0}]} -->

**Checkpoint**: `==teste==` abre destacado e salva `==teste==`; `C++` intacto.

#### Fase 9 — US-004 iframe no export (P2) — ajuste pós-entrega

**Objetivo**: Vídeo exportado como iframe aproveitável fora do app.
**Teste independente**: Markdown com `:::video` traz iframe; original intacto.

- [x] T031 [TEST] [TDD] [US-004] Derivar do AC-022 caso Vitest de iframe em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-004, FR-008, NFR-001, AC-022 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-022 e confirmar iframe com título acessível e fence preservado no original.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T032 [TEST] [TDD] [US-004] Derivar do AC-023 caso Vitest de múltiplos vídeos em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-004, FR-008, NFR-002, AC-023 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-023 e confirmar ordem preservada sem rede na geração.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T033 [TEST] [TDD] [US-004] Derivar do AC-024 caso Vitest de vídeo sem ID em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-004, FR-008, NFR-003, AC-024 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-024 e confirmar omissão com aviso e sem rede.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T034 [CODE] [US-004] Implementar iframe no export em apps/web/src/lib/features/notes/note-export.ts — Refs: US-004, FR-008, NFR-001, NFR-002, NFR-003, AC-022, AC-023, AC-024 — Depends: T031, T032, T033
  - [x] **PREP**: Confirmar RED de T031–T033 e baseline do export; verificar `docs/ --check` antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `expandVideoFences` e integrar iframe `youtube-nocookie` aos builders sync e async.
  - [x] **VERIFY**: Executar focal de vídeo até GREEN (3 passed, 6 de impressão pulados para T038); `check` sem erros nos arquivos da fatia.
  - [x] **VISUAL**: Conferir o Markdown derivado e o bloco no editor quanto a bordas, espaçamentos, margens, padding e tipografia, sem tags literais além do iframe pretendido.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: Omissão com aviso em vez de falha total; nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T034","refs":["US-004","FR-008","NFR-001","NFR-002","NFR-003","AC-022","AC-023","AC-024"],"files":["apps/web/src/lib/features/notes/note-export.ts"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/note-export.test.ts","exit":0}]} -->

**Checkpoint**: Export traz iframes na ordem das URLs; original intacto.

#### Fase 10 — US-005 apresentação da exportação (P1) — ajuste pós-entrega

**Objetivo**: Saídas sem tags literais e PDF editorial.
**Teste independente**: Nota com `<br />` exporta limpa; PDF com título e versos estilizados.

- [x] T035 [TEST] [TDD] [US-005] Derivar do AC-025 caso Vitest de `<br />` no PDF em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-005, FR-009, NFR-001, AC-025 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-025 e confirmar saneamento com leitura preservada.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T036 [TEST] [TDD] [US-005] Derivar do AC-026 caso Vitest de folha editorial em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-005, FR-009, NFR-002, AC-026 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-026 e confirmar título, callout, tipografia e margens sem travar a interface.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T037 [TEST] [TDD] [US-005] Derivar do AC-027 caso Vitest de `<br />` no Markdown em apps/web/src/lib/features/notes/note-export.test.ts — Refs: US-005, FR-009, NFR-003, AC-027 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-027 e confirmar quebras reais com original intacto.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido em `bun run test:tdd -- src/lib/features/notes/note-export.test.ts` (apps/web).
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.
- [x] T038 [CODE] [US-005] Implementar saneamento e folha editorial em apps/web/src/lib/features/notes/note-export.ts e rota `/notes/[id]` — Refs: US-005, FR-009, NFR-001, NFR-002, NFR-003, AC-025, AC-026, AC-027 — Depends: T035, T036, T037
  - [x] **PREP**: Confirmar RED de T035–T037 e baseline da impressão; verificar `docs/ --check` antes de EXECUTE.
  - [x] **EXECUTE**: Produzir `sanitizeBreakTags` e `buildPrintDocument`, integrar aos builders e refatorar a rota para usá-los com aviso de vídeo.
  - [x] **VERIFY**: Executar focal `note-export.test.ts` até GREEN (9 passed); `check` sem erros nos arquivos da fatia.
  - [x] **VISUAL**: Conferir impresso com bordas, espaçamentos, margens, padding e tipografia editoriais, sem tags literais; removidos H1 duplicado e linha `>` solta.
  - [x] **EVIDENCE**: Registrar GREEN nas seções 11–13; `PROJECT.md` sem impacto material (evolução dentro de notas).
  - [x] **IMPROVE**: Teste AC-026 ajustado no mesmo ciclo para a deduplicação do H1 (RED original era função ausente); nenhuma outra melhoria necessária.
  <!-- specsfy:evidence {"task":"T038","refs":["US-005","FR-009","NFR-001","NFR-002","NFR-003","AC-025","AC-026","AC-027"],"files":["apps/web/src/lib/features/notes/note-export.ts","apps/web/src/routes/notes/[id]/+page.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/features/notes/note-export.test.ts","exit":0}]} -->

**Checkpoint**: Impresso sem tags literais, com título e versos estilizados.

#### Fase de interface — ajustes pós-entrega

- [x] T039 [DOC] [US-007] Atualizar INTERFACE.md com marks, iframe e impressão em INTERFACE.md — Refs: US-007, US-004, US-005, FR-007, FR-008, FR-009, NFR-001 — Depends: T030, T034, T038
  - [x] **PREP**: Confirmar blocos e comportamentos criados ou alterados nas três fatias.
  - [x] **EXECUTE**: Registrar marks, iframe de export e folha de impressão com finalidade, arquivo, estados, consumidores e reuso.
  - [x] **VERIFY**: Conferir via grep que marks, iframe, impressão e editor estão mapeados.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza documentação em INTERFACE.md.
  - [x] **EVIDENCE**: Registrar diff de `INTERFACE.md` e IDs cobertos na seção 10.
  - [x] **IMPROVE**: Linhas seguem o formato tabular vigente; nenhuma outra melhoria necessária.

#### Fase final — Regressão dos ajustes

- [x] T040 [TEST] Executar regressão completa pós-ajustes em apps/web/src/lib/features/notes/ — Refs: US-001, US-004, US-005, US-007, FR-001, FR-007, FR-008, FR-009, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-019, AC-020, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026, AC-027 — Depends: T030, T034, T038, T039
  - [x] **PREP**: Identificar suítes Vitest, checks estáticos e gates da spec.
  - [x] **EXECUTE**: Executar suíte completa `bun run test:tdd`, `bun run check`, rastreabilidade e validadores.
  - [x] **VERIFY**: Confirmar 97 arquivos e 389 testes verdes, 46/46 IDs cobertos e `check` sem erros novos (25 pré-existentes + 0 da fatia).
  - [x] **VISUAL**: Repassar bordas, espaçamentos, margens, padding e tipografia nas telas afetadas; sem regressão visual.
  - [x] **EVIDENCE**: Registrar contagens, comandos finais e revisão de `PROJECT.md` com justificativa de ausência de impacto material.
  - [x] **IMPROVE**: Flakiness de specs browser documentada (verdes isoladas e na repetição); nenhuma outra melhoria necessária.

### 15. Ordem de execução

- Caminho crítico: T001–T018 (RED) → T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026, depois T027–T029 → T030 → T031–T033 → T034 → T035–T037 → T038 → T039 → T040.
- Tarefas paralelas: T001–T018 com `[P]` por arquivos de teste independentes; T027–T040 sequenciais por compartilharem editor e export.
- Estratégia de MVP: marks (T030), iframe (T034) e impressão (T038) como complementos independentes sobre a base entregue.
- Estratégia de MVP: popover, hover e índice (T019–T021) como núcleo; vídeo, export e toolbar (T022–T024) como complemento.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Motor Milkdown vigente e fence `:::verse` da SPEC-0004 e BACKLOG-0013.
- Catálogo e leitura OpenLP da SPEC-0003 para hover e export.
- Shell, temas e drawer vigentes para mobile e safe area.
- Receita oficial de mark customizado (`research/milkdown-marker-plugin.md`) para `==`/`++`.

#### Riscos

- Parser de referências gerar falsos positivos → mitigar com padrão restrito e testes de unidade.
- Supressão do menu nativo quebrar acessibilidade → mitigar com `role=toolbar`, foco e Escape.
- Geração de PDF variar entre plataformas → mitigar com saída local simples e verificação manual.
- Embed externo afetar privacidade → mitigar com carga sob demanda e sem autoplay.
- Remark de `==`/`++` converter texto indesejado (`C++`, comparações) → mitigar com guardas de fronteira e testes de unidade.
- Folha de impressão divergir entre navegadores → mitigar com CSS conservador e verificação manual.

#### Suposições

- Versão padrão resolve por `defaultBibleVersionId` ou `readerSelection.versionId`.
- Índice, exports e opção de toolbar ficam no header de `/notes/[id]`; composição final confirmada no plano.
- Referência suportada no formato livro capítulo e verso em português com abreviações vigentes; variações serão cobertas por testes.
- iframe de export usa `youtube-nocookie` por coerência de privacidade; `C++` nunca vira marca.

#### Suposições

- Versão padrão resolve por `defaultBibleVersionId` ou `readerSelection.versionId`.
- Índice, exports e opção de toolbar ficam no header de `/notes/[id]`; composição final confirmada no plano.
- Referência suportada no formato livro capítulo e verso em português com abreviações vigentes; variações serão cobertas por testes.

### 17. Decisões

- **DEC-001**: Suprimir menu nativo só na edição com seleção — preserva leitura e evita perda de ações do navegador fora do editor.
- **DEC-002**: Hover usa versão do parser ou padrão e mantém clique atual — reaproveita visualizador existente sem novo fluxo.
- **DEC-003**: Índice deriva de H1–H3 com dropdown e drawer — cobre desktop e mobile sem painel fixo.
- **DEC-004**: Vídeo restrito ao YouTube com carga sob demanda — limita superfície de segurança e privacidade.
- **DEC-005**: Export expande fences sem alterar o original — mantém Files over app e compartilhamento legível.
- **DEC-006**: Toolbar configurável com padrão visível editando e oculta visualizando — equilibra foco e acesso.
- **DEC-007**: Destaque e sublinhado como marks nativas com roundtrip `==`/`++` — editor reflete o arquivo sem migração; guardas protegem `C++`.
- **DEC-008**: Vídeo exportado como iframe `youtube-nocookie` — aproveitável no Obsidian mantendo a privacidade do embed.
- **DEC-009**: `<br />` saneado nas saídas com folha editorial na impressão — PDF legível sem tags literais e sem nova dependência.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.

## Effort history

- 2026-09-05T17:50:54.272Z: 9 → 9. Três ajustes pós-entrega: marks nativas com remark próprio, iframe no export e folha de impressão
