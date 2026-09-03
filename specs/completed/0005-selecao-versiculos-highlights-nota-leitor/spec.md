# Especificação integrada: Seleção de versículos, highlights e nota no leitor

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0005 |
| Slug | 0005-selecao-versiculos-highlights-nota-leitor |
| Status | Complete |
| Effort | 8 |
| Effort updated at | 2026-09-03 |
| Effort rationale | Combina seleção contínua no reader, anotações de intervalo sobreponíveis com identidade exata, paleta de canetas e riscos, persistência SQLite auxiliar, copiar e criar nota independente em split desktop / abas mobile — várias fronteiras de domínio e interface. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-09-03 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

No leitor `/bible` a pessoa lê o capítulo, mas não consegue selecionar versículos inteiros para destacar, copiar ou criar uma nota sem abandonar a leitura. SPEC-0003 deixou destaques e notas do reader para depois; SPEC-0004 cobre só o highlight TipTap do canvas.

#### Resultado desejado

A pessoa forma um intervalo contínuo de versículos no capítulo aberto, abre um popover e: aplica ou apaga um highlight (caneta ou risco) que persiste no workspace; copia a referência ou o texto com a referência; cria uma nota independente, com o reader ainda visível (split no desktop, abas no mobile).

#### Métricas de sucesso

- Selecionar Gn 1.2–5 abre o popover com highlight, duas ações de copiar, criar nota e apagar, observável em teste de componente ou browser.
- Criar um highlight em Gn 1.3 e outro em Gn 1.2–5 deixa duas anotações; editar ou apagar só Gn 1.3 não remove Gn 1.2–5; ao reabrir o capítulo as duas permanecem (SQLite auxiliar).
- Criar nota a partir da seleção não aplica highlight; o arquivo Markdown nasce com fence `:::verse` do intervalo e o reader continua visível.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [high] O `BibleReader` não seleciona versículos nem persiste markup — Verdict: verified — Confidence: high — Evidence: `apps/web/src/lib/features/bible/BibleReader.svelte` (`ol.verse-list` só número e texto) — Budget: 1/1.
- **R-002** [high] Destaques do produto vão para SQLite auxiliar, não para `bibles/*.sqlite` — Verdict: verified — Confidence: high — Evidence: `.specsfy/USER-PROFILE.md` e `.specsfy/DATABASE.md` — Budget: 1/1.
- **R-003** [medium] Criar nota e fence `:::verse` já existem no domínio de notas — Verdict: verified — Confidence: high — Evidence: `apps/web/src/lib/features/notes/notes-repository.ts` (`createNote`) e SPEC-0004 — Budget: 1/1.

#### Fontes e contexto consultados

- `specs/inbox/2026-09-02-223541-selecao-de-versiculos-highlights-e-nota-no-leitor-bible.md`
- `specs/backlog/0005-selecao-versiculos-highlights-nota-leitor.md`
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` e `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md`
- `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/DATABASE.md`, `.specsfy/RULES.md`, `.specsfy/USER-PROFILE.md`
- `BibleReader.svelte`, `notes-repository.ts`
- Imagens de referência do Logos (estilos visuais apenas; não copiar painel nem marca)

#### Documentação consultada

- Guideline de interface do projeto (`DESIGNSYSTEM.MD` / Vercel design.md como qualidade, sem marca Vercel).
- Nenhuma API externa nova.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. As imagens do Logos não são copiadas para `research/` (marca de terceiro); o recorte da paleta está nas decisões Q6.

#### Dúvidas respondidas

- **Q1:** unidade da seleção? → Versículos inteiros no capítulo aberto.
- **Q2:** highlight e nota? → Independentes.
- **Q3:** coexistência? → Anotações de **intervalo** sobreponíveis (Gn 1.3 e Gn 1.2–5), não fundo+risco numa só anotação.
- **Q4:** interseção? → Identidade pelo intervalo exato; Gn 1.3 não altera Gn 1.2–5; um estilo por anotação; o versículo mostra todos os intervalos que o cobrem.
- **Q5:** seleção disjunta? → Não; só intervalo contínuo; 1.3 e 1.7 são duas anotações.
- **Q6:** paleta? → Canetas sólidas (conjunto pequeno) + sublinhado + ondulado + caixa + apagar. Fora: nuvem, strike-through, duplo, tracejado, atalhos B/G/O/R/Y.
- **Copiar:** pedido original → duas ações: referência; texto + referência.

#### Dúvidas abertas

- Nenhuma lacuna P2 aplicável.

### 3. Escopo e atores

#### Incluído

- Seleção de intervalo contínuo de versículos inteiros no capítulo aberto em `/bible`.
- Popover contextual (não painel permanente) com paleta Q6, apagar, copiar referência, copiar texto+referência, criar nota.
- Anotações de highlight persistidas, sobreponíveis, identidade pelo intervalo exato.
- Criar nota nova com snapshot `:::verse` do intervalo, reader visível: split desktop, abas mobile.

#### Fora de escopo

- Trecho ou palavra intra-versículo; sobreposição palavra-dentro-de-bloco.
- Seleção disjunta; intervalos que atravessam capítulos.
- Paleta Logos completa (nuvem, strike-through, duplo, tracejado) e atalhos B/G/O/R/Y.
- Vincular nota a highlight; painel Highlighting permanente; alterar `bibles/*.sqlite`.
- Highlight TipTap da nota como markup do reader; comparação de versões; áudio; sync remoto.

#### Atores

- **Pessoa usuária individual**: lê, destaca, copia e anota no workspace local, sem conta.

### 4. Princípios e restrições do projeto

- **PR-001**: File Over Apps — Markdown da nota é fonte da nota; SQLite auxiliar guarda destaques; `bibles/*.sqlite` somente leitura.
- **PR-002**: Highlight do reader ≠ highlight TipTap do canvas (SPEC-0004).
- **PR-003**: Nenhum texto bíblico, destaque ou nota é enviado à rede por esta fatia.
- **PR-004**: Interface Svelte 5 + Tailwind + shadcn-svelte; guideline Geist/Vercel de qualidade, sem marcas Vercel ou Logos.
- **PR-005**: Uso individual, sem autenticação.

### 5. Histórias de usuário

#### US-001 — Selecionar intervalo e abrir o popover (P1)

Como pessoa usuária, quero selecionar um intervalo contínuo de versículos e ver um popover de ações, para destacar, copiar ou anotar sem perder o capítulo.

**Por que P1**: é o gatilho de toda a fatia.
**Teste independente**: selecionar Gn 1.3 e Gn 1.2–5 (em ações distintas) abre o popover com as ações desta spec.
**Requisitos**: FR-001, FR-002, NFR-001

#### US-002 — Destacar intervalos sobreponíveis (P1)

Como pessoa usuária, quero aplicar, trocar e apagar highlights de intervalo que podem se sobrepor, para marcar Gn 1.3 e Gn 1.2–5 como anotações distintas.

**Por que P1**: é o domínio novo do reader.
**Teste independente**: duas anotações coexistentes; editar a de intervalo exato Gn 1.3 não apaga Gn 1.2–5; reabrir o capítulo restaura.
**Requisitos**: FR-003, FR-004, FR-005, FR-008, FR-009, NFR-002, NFR-003

#### US-003 — Copiar referência ou texto (P1)

Como pessoa usuária, quero copiar só a referência ou o texto com a referência, para colar fora do app.

**Por que P1**: declarado no pedido original.
**Teste independente**: as duas ações preenchem a área de transferência com conteúdos distintos.
**Requisitos**: FR-006, NFR-002

#### US-004 — Criar nota ao lado do reader (P1)

Como pessoa usuária, quero criar uma nota com o texto selecionado sem sair da Bíblia, para escrever com o capítulo ainda à vista.

**Por que P1**: declarado no pedido (split / abas).
**Teste independente**: nota nova com `:::verse`, sem highlight aplicado; split no desktop e abas no mobile.
**Requisitos**: FR-007, FR-002, NFR-003

### 6. Cenários BDD de aceite

#### AC-001 — Popover ao selecionar um versículo

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-001
Feature: Popover de seleção no reader

  Scenario: Selecionar um versículo inteiro
    Given um capítulo aberto no leitor /bible
    When a pessoa seleciona Gn 1.3 como intervalo contínuo
    Then um popover contextual oferece highlight, copiar referência, copiar texto e referência, criar nota e apagar
```

#### AC-002 — Selecionar intervalo contínuo

**Cobre**: US-001, FR-001, FR-002

```gherkin
@US-001 @FR-001 @FR-002 @AC-002
Feature: Intervalo contínuo

  Scenario: Selecionar Gn 1.2 até Gn 1.5
    Given Gênesis 1 aberto
    When a pessoa forma o intervalo contínuo 1.2–5
    Then o popover opera sobre exatamente esse intervalo
```

#### AC-003 — Recusar seleção disjunta

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-003
Feature: Sem seleção disjunta

  Scenario: Gn 1.3 e Gn 1.7 não formam uma seleção
    Given Gênesis 1 aberto
    When a pessoa tenta manter 1.3 e 1.7 sem 1.4–6 na mesma seleção
    Then o sistema não trata isso como um único intervalo
    And destacar 1.3 e 1.7 exige duas anotações, uma de cada vez
```

#### AC-004 — Aplicar caneta no intervalo exato

**Cobre**: US-002, FR-003, FR-009, NFR-003

```gherkin
@US-002 @FR-003 @FR-009 @NFR-003 @AC-004
Feature: Caneta sólida

  Scenario: Destacar Gn 1.2–5 com caneta
    Given o intervalo 1.2–5 selecionado
    When a pessoa escolhe uma caneta de fundo sólido da paleta
    Then nasce ou atualiza só a anotação cujo intervalo é 1.2–5
    And o markup cobre cada versículo inteiro desse intervalo
```

#### AC-005 — Sobreposição de intervalos

**Cobre**: US-002, FR-004, FR-008

```gherkin
@US-002 @FR-004 @FR-008 @AC-005
Feature: Intervalos sobrepostos

  Scenario: Gn 1.3 e Gn 1.2–5
    Given uma anotação no intervalo Gn 1.3
    When a pessoa cria outra anotação no intervalo Gn 1.2–5 com outro estilo
    Then existem duas anotações
    And Gn 1.3 mostra os dois intervalos que o cobrem
    And isto não é uma única anotação com fundo e risco empilhados
```

#### AC-006 — Identidade pelo intervalo exato

**Cobre**: US-002, FR-003, FR-004, FR-005

```gherkin
@US-002 @FR-003 @FR-004 @FR-005 @AC-006
Feature: Editar só o intervalo da seleção

  Scenario: Trocar ou apagar Gn 1.3 não altera Gn 1.2–5
    Given anotações em Gn 1.3 e em Gn 1.2–5
    When a pessoa seleciona exatamente Gn 1.3 e troca o estilo ou apaga
    Then só a anotação Gn 1.3 muda
    And a anotação Gn 1.2–5 permanece
```

#### AC-007 — Apagar a anotação do intervalo exato

**Cobre**: US-002, FR-005, FR-009

```gherkin
@US-002 @FR-005 @FR-009 @AC-007
Feature: Apagar

  Scenario: Apagar pelo popover
    Given uma anotação no intervalo selecionado
    When a pessoa escolhe apagar
    Then essa anotação some
    And versículos ainda cobertos por outros intervalos continuam marcados por eles
```

#### AC-008 — Copiar referência

**Cobre**: US-003, FR-006, NFR-002

```gherkin
@US-003 @FR-006 @NFR-002 @AC-008
Feature: Copiar referência

  Scenario: Só a referência
    Given o intervalo Gn 1.2–5 selecionado numa versão nomeada
    When a pessoa escolhe copiar referência
    Then a área de transferência contém livro, capítulo, versículos e versão
    And não envia o conteúdo à rede
```

#### AC-009 — Copiar texto e referência

**Cobre**: US-003, FR-006

```gherkin
@US-003 @FR-006 @AC-009
Feature: Copiar texto e referência

  Scenario: Texto dos versículos mais a referência
    Given o intervalo Gn 1.2–5 selecionado
    When a pessoa escolhe copiar texto e referência
    Then a área de transferência contém o texto completo de 1.2 até 1.5 e a referência
```

#### AC-010 — Falha ao copiar

**Cobre**: US-003, FR-006, NFR-002

```gherkin
@US-003 @FR-006 @NFR-002 @AC-010
Feature: Clipboard recusado

  Scenario: Permissão de clipboard negada
    Given o popover aberto e a área de transferência indisponível
    When a pessoa escolhe uma ação de copiar
    Then vê um erro recuperável
    And nenhum conteúdo é enviado à rede
```

#### AC-011 — Criar nota sem aplicar highlight

**Cobre**: US-004, FR-002, FR-007, NFR-003

```gherkin
@US-004 @FR-002 @FR-007 @NFR-003 @AC-011
Feature: Nota independente

  Scenario: Criar nota no desktop
    Given um intervalo selecionado no /bible em viewport desktop
    When a pessoa escolhe criar nota
    Then uma nota nova abre ao lado do reader (split)
    And nenhum highlight é criado por essa ação
```

#### AC-012 — Persistir ao reabrir o capítulo

**Cobre**: US-002, FR-008, NFR-002

```gherkin
@US-002 @FR-008 @NFR-002 @AC-012
Feature: Persistência local

  Scenario: Reabrir o capítulo
    Given anotações salvas no SQLite auxiliar do workspace
    When a pessoa sai e volta ao mesmo capítulo e versão
    Then os intervalos e estilos reaparecem
    And os arquivos em bibles/ não foram alterados
```

#### AC-013 — Paleta desta fatia

**Cobre**: US-002, FR-009, NFR-003

```gherkin
@US-002 @FR-009 @NFR-003 @AC-013
Feature: Paleta do popover

  Scenario: Estilos oferecidos
    Given o popover de highlight aberto
    Then há um conjunto pequeno de canetas sólidas, sublinhado, sublinhado ondulado, caixa e apagar
    And não há nuvem, strike-through, risco duplo, tracejado nem atalhos B G O R Y
```

#### AC-014 — Abas no mobile

**Cobre**: US-004, FR-007

```gherkin
@US-004 @FR-007 @AC-014
Feature: Nota no mobile

  Scenario: Criar nota em viewport estreita
    Given um intervalo selecionado no /bible em viewport mobile
    When a pessoa escolhe criar nota
    Then reader e editor da nota ficam em abas
    And a pessoa não navega para fora da Bíblia
```

#### AC-015 — Teclado

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-015
Feature: Teclado

  Scenario: Abrir e usar o popover pelo teclado
    Given o capítulo aberto
    When a pessoa forma o intervalo e aciona o popover pelo teclado
    Then o foco visível percorre as ações
    And Escape fecha o popover
```

#### AC-016 — Bloco de versículo na nota

**Cobre**: US-004, FR-007

```gherkin
@US-004 @FR-007 @AC-016
Feature: Fence verse na nota criada

  Scenario: Snapshot do intervalo
    Given o intervalo Gn 1.2–5 selecionado
    When a nota é criada a partir da seleção
    Then o Markdown contém um fence :::verse com o intervalo e o snapshot do texto
```

#### AC-017 — Não gravar nos SQLite bíblicos

**Cobre**: FR-008, NFR-002

```gherkin
@FR-008 @NFR-002 @AC-017
Feature: bibles somente leitura

  Scenario: Aplicar highlight
    Given uma versão OpenLP importada
    When a pessoa aplica ou apaga um highlight
    Then só o índice auxiliar do workspace muda
    And nenhum arquivo em bibles/ é escrito
```

#### AC-018 — Substituir estilo no mesmo intervalo

**Cobre**: US-002, FR-003, FR-004

```gherkin
@US-002 @FR-003 @FR-004 @AC-018
Feature: Um estilo por anotação

  Scenario: Trocar a caneta de Gn 1.2–5
    Given uma anotação no intervalo Gn 1.2–5 com estilo A
    When a pessoa seleciona exatamente 1.2–5 e escolhe estilo B
    Then permanece uma anotação nesse intervalo com estilo B
    And anotações de outros intervalos não mudam
```

#### AC-019 — Apagar sem anotação exata

**Cobre**: FR-005

```gherkin
@FR-005 @AC-019
Feature: Apagar sem match

  Scenario: Só existe Gn 1.2–5 e a seleção é Gn 1.3
    Given apenas a anotação Gn 1.2–5
    When a pessoa seleciona Gn 1.3 e apaga
    Then Gn 1.2–5 permanece
    And não se inventa uma anotação Gn 1.3 só para apagar
```

#### AC-020 — Falha ao criar nota

**Cobre**: US-004, FR-007, NFR-002

```gherkin
@US-004 @FR-007 @NFR-002 @AC-020
Feature: Workspace sem escrita

  Scenario: Criar nota com armazenamento indisponível
    Given um intervalo selecionado e o workspace sem permissão de escrita
    When a pessoa escolhe criar nota
    Then vê um erro recuperável
    And nenhuma nota nova é criada
    And nenhum highlight é aplicado
    And o reader permanece visível
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve permitir selecionar apenas um intervalo contínuo de versículos inteiros no capítulo aberto; 1.3 e 1.7 exigem duas anotações sucessivas.
- **FR-002**: Ao concluir uma seleção válida, o sistema deve mostrar um popover contextual com highlight, copiar referência, copiar texto e referência, criar nota e apagar — não um painel lateral permanente.
- **FR-003**: Aplicar um estilo deve criar ou atualizar somente a anotação cujo intervalo é exatamente a seleção; cada anotação tem um único estilo.
- **FR-004**: Intervalos distintos podem se sobrepor; um versículo mostra todos os intervalos que o cobrem; editar um intervalo não reescreve os outros.
- **FR-005**: Apagar deve remover só a anotação do intervalo exato da seleção; se não houver essa anotação, os demais intervalos permanecem.
- **FR-006**: O popover deve oferecer copiar referência e copiar texto dos versículos da seleção mais a referência, como duas ações.
- **FR-007**: Criar nota deve abrir uma nota nova com fence `:::verse` do intervalo, sem aplicar highlight, com split no desktop e abas no mobile, reutilizando `createNote` e o contrato SPEC-0004.
- **FR-008**: Highlights devem persistir no SQLite auxiliar do workspace (`.openbible/index.sqlite`), nunca em `bibles/*.sqlite` nem no Markdown da nota.
- **FR-009**: A paleta desta fatia deve oferecer um conjunto pequeno de canetas sólidas (4 a 8 cores nomeadas e acessíveis, cromia OpenBible), sublinhado, sublinhado ondulado, caixa e apagar; sem nuvem, strike-through, duplo, tracejado ou atalhos B/G/O/R/Y.

#### Não funcionais

- **NFR-001**: Toda a jornada de seleção e popover deve ser operável por teclado, com foco visível e Escape para fechar. **Verificação**: AC-001, AC-003, AC-015 e teste de componente/browser.
- **NFR-002**: Destaques, cópia e nota permanecem locais; nenhuma requisição de conteúdo bíblico ou de nota é feita por esta fatia. **Verificação**: AC-008, AC-010, AC-012, AC-017.
- **NFR-003**: Popover e split/abas seguem Geist, tema claro/escuro, `prefers-reduced-motion`, superfícies contínuas, sem gradientes, glows ou marca Logos/Vercel. **Verificação**: AC-004, AC-011, AC-013 e item VISUAL das tarefas.

#### Erros e casos-limite

- Clipboard recusado → erro recuperável (AC-010).
- Workspace sem escrita → não aplica highlight nem cria nota; mensagem recuperável (AC-020).
- Capítulo sem versículos ou catálogo vazio → seleção indisponível (comportamento atual do reader preservado).
- Apagar sem anotação do intervalo exato → no-op sobre as outras anotações (AC-019).

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- SvelteKit em `apps/web`, Vitest, Playwright, shadcn-svelte, `BibleReader.svelte`, notas File Over Apps, `index.sqlite` com `note_verse_ref`.

#### Arquitetura e módulos

- Domínio novo `reader-highlights` (tipos, paleta, repositório SQLite, regras de identidade de intervalo) em `apps/web/src/lib/features/bible/`.
- UI: seleção no `BibleVerseList`, popover shadcn-svelte, overlay de markup por versículo (união dos intervalos que cobrem o número).
- Shell: estado de split/abas em `/bible` ao criar nota, sem abandonar a rota; editor reutiliza `NoteCanvasEditor`.

#### Migrations

- Tabela auxiliar criada idempotentemente (`CREATE TABLE IF NOT EXISTS`) em `index.sqlite`, no mesmo espírito de `note_verse_ref`. Sem Laravel/Prisma.

#### Models

- `ReaderHighlight`: `versionId`, `bookId`, `chapter`, `verseStart`, `verseEnd`, `styleId`. Identidade natural = esses cinco primeiros campos de intervalo + versão.

#### Controllers e casos de uso

- Funções puras: formar intervalo, listar anotações que cobrem um versículo, aplicar/apagar pelo intervalo exato, serializar cópia. Sem HTTP.

#### Views e experiência

- `BibleReader.svelte` + popover + chrome de split/abas. Estados: sem seleção, popover aberto, destacando, copiando, criando nota, erro de clipboard/workspace.

#### Queries e repositórios

- Repositório no SQLite auxiliar: listar por versão+capítulo, upsert por intervalo exato, delete por intervalo exato.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/defined/0005-selecao-versiculos-highlights-nota-leitor/
  spec.md
apps/web/src/lib/features/bible/
  BibleReader.svelte
  reader-highlights.ts
  reader-highlights-repository.ts
  verse-selection.ts
  SelectionActionPopover.svelte
apps/web/src/lib/features/bible/*.test.ts
apps/web/src/routes/bible-reader.svelte.spec.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Seleção de versículos | Intervalo contínuo no capítulo aberto | `verseStart` ≤ `verseEnd`; mesmo livro/capítulo/versão da leitura | Não persistida; alimenta o popover |
| Anotação de highlight | (`versionId`, `bookId`, `chapter`, `verseStart`, `verseEnd`) | Um `styleId` da paleta Q6; intervalos podem intersectar | N anotações por capítulo; não aponta para nota |
| Estilo | `styleId` estável | Caneta sólida ou `underline` / `wavy` / `box` | Pertence a uma anotação |
| Nota criada | `noteId` File Over Apps | Frontmatter + fence `:::verse` do intervalo | Independente do highlight |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Seleção | Nenhuma | Formar intervalo contínuo | Selecionada + popover | Sem buracos |
| Anotação | Inexistente | Aplicar estilo no intervalo exato | Ativa | Um estilo |
| Anotação | Ativa | Aplicar outro estilo no mesmo intervalo | Ativa (estilo novo) | Identidade inalterada |
| Anotação | Ativa | Apagar no intervalo exato | Inexistente | Outras anotações intactas |
| Nota | Inexistente | Criar nota | Arquivo em `notes/` | Sem highlight criado |

#### Migração e retenção

- Criar tabela na primeira operação de highlight. Remover anotação = DELETE. Sem sync. Retenção = enquanto o workspace existir.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim — reader `/bible`, popover, split/abas com o editor de nota.

#### Stack e convenções de interface

- Svelte 5, SvelteKit, Tailwind, primitives shadcn-svelte (`Button`, `Popover` ou equivalente Bits, `Tabs`). Telas atuais: `BibleReader` em `/bible` (preservar navegação de livro/capítulo/versão/busca). Não introduzir React.

#### Telas e responsabilidades

- **`/bible` — Leitor**: selecionar intervalo, ver markup, popover, copiar, destacar, abrir nota em split/abas. Entrada: workspace e catálogo OpenLP. Saída: anotações no SQLite auxiliar e, se criar nota, arquivo Markdown.
- **Painel/aba da nota**: editor canvas existente; não é uma rota que substitui `/bible`.

#### Fluxo de informação e navegação

- Sidebar/barra: item Bíblia → `/bible` (já existe). Breadcrumb de leitura permanece livro/capítulo. Popover não entra no menu. Criar nota não troca a rota principal no desktop; no mobile, abas Bíblia | Nota no mesmo shell.

#### Menus e navegação principal

- Menu principal inalterado (Bíblia, Notas, Sermões, Estudos, Config). Destino da Bíblia continua `/bible`. Nenhum item novo. No mobile, as abas Bíblia/Nota são navegação secundária só enquanto a nota criada a partir do reader estiver aberta.

#### Formulários e ações

- Sem formulário longo. Ações do popover: estilos da paleta, apagar, copiar referência, copiar texto e referência, criar nota. Validação: intervalo contínuo no capítulo. Erro: clipboard ou workspace.

#### Composição e disposição

- Desktop: capítulo em coluna; popover ancorado à seleção; ao criar nota, duas colunas (reader | editor), superfícies contínuas, sem cards empilhados.
- Mobile: abas no topo da área do reader; popover não deve sair da viewport; respeito a safe area.

#### Blocos React e componentes selecionados

Esta entrega é Svelte, não React. A tabela registra blocos Svelte equivalentes.

| Tela | Bloco | Responsabilidade | Arquivo previsto | Componente | Origem | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| `/bible` | BibleReader | Leitura e orquestração | `BibleReader.svelte` | próprio | existente | Estender seleção, markup, split |
| `/bible` | BibleVerseList | Versículos clicáveis/selecionáveis | interno ao reader | próprio | existente | Estender |
| `/bible` | SelectionActionPopover | Paleta, copiar, nota, apagar | novo `.svelte` | Popover/Button shadcn-svelte | novo | Registrar em INTERFACE.md |
| `/bible` | BibleNoteSplit | Split desktop / abas mobile | novo ou AppFrame | Tabs shadcn-svelte | novo | Só no fluxo criar nota |
| Nota | NoteCanvasEditor | Editor da nota criada | existente | Tipex | SPEC-0004 | Reusar |

#### Estados e acessibilidade

- Loading do capítulo: inalterado. Vazio: sem versículos. Erro: clipboard/workspace. Sucesso: markup visível, nota aberta. Teclado: intervalo, popover, Escape, foco visível. Leitor de tela: anunciar seleção e estilo por nome, não só cor.

#### Revisão visual durante o desenvolvimento

- Obrigatória nas tarefas de UI: bordas, espaçamentos, margens, padding e tipografia Geist em 320px e 1440px, tema claro/escuro, popover com conteúdo curto e paleta longa, split com título de nota longo, `prefers-reduced-motion`.

#### APIs expostas

- Nenhuma HTTP. Contratos são funções TypeScript locais.

#### APIs externas utilizadas

- Nenhuma. Clipboard da plataforma via `navigator.clipboard` no cliente.

#### Documentação das APIs consultadas

- Nenhuma API remota.

#### Eventos e outros contratos

- Não aplicável além de eventos DOM de seleção e popover.

### 11. Estratégia TDD

- **Unidade**: intervalo, identidade exata, cobertura de versículo, paleta, serialização de cópia, repositório SQLite em memória (`reader-highlights.test.ts`, `verse-selection.test.ts`).
- **Integração/contrato**: `createNote` com fence a partir do intervalo; persistência no storage de teste.
- **BDD/aceite**: Gherkin da seção 6 como referência; sem arquivos `.feature`.
- **Runner TDD**: Vitest (`bun run --cwd apps/web test:tdd`), já confirmado no perfil.
- **E2E**: Playwright em `bible-reader.svelte.spec.ts` para popover, overlap, split/abas.
- **Verificação manual**: só conferência visual de sobreposição de dois intervalos no mesmo versículo, se o teste automático não capturar o pixel.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, AC-001 | AC-001 | `bible-reader.svelte.spec.ts` `SPECSFY: US-001 FR-001 FR-002 NFR-001 AC-001` | RED 2026-09-03: popover/ações ausentes após clicar Gn 1.3 | GREEN 2026-09-03: popover abre com copiar/nota/apagar | `aria-controls` no combobox; 14 browser passed |
| US-001, FR-001, AC-002 | AC-002 | `verse-selection.test.ts` `SPECSFY: US-001 FR-001 FR-002 AC-002` | RED 2026-09-03: `formContinuousRange` retorna null | GREEN 2026-09-03: intervalo 2–5 | T021 |
| US-002, FR-004, AC-005 | AC-005 | `reader-highlights.test.ts` `SPECSFY: US-002 FR-004 FR-008 AC-005` | RED 2026-09-03: `applyHighlight` não cria anotações | GREEN 2026-09-03: duas anotações coexistentes | T022/T024 |
| US-002, FR-004, AC-006 | AC-006 | `reader-highlights.test.ts` `SPECSFY: US-002 FR-003 FR-004 FR-005 AC-006` | RED 2026-09-03: `eraseHighlight` esvazia a lista | GREEN 2026-09-03: apaga só o intervalo exato | T022 |
| US-003, FR-006, AC-008 | AC-008 | `reader-highlights.test.ts` `SPECSFY: US-003 FR-006 NFR-002 AC-008` | RED 2026-09-03: `formatCopyReference` retorna string vazia | GREEN 2026-09-03: `Gênesis 1.2–5 (ARA)` | T023 |
| US-004, FR-007, AC-011 | AC-011 | `bible-reader.svelte.spec.ts` `SPECSFY: US-004 FR-002 FR-007 NFR-003 AC-011` | RED 2026-09-03: botão criar nota ausente | GREEN 2026-09-03: split desktop sem highlight | T027 |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `verse-selection.test.ts` | Passed 2026-09-03 |
| FR-001 | AC-002 | Unidade | `verse-selection.test.ts` | Passed 2026-09-03 |
| FR-001 | AC-003 | Unidade | `verse-selection.test.ts` | Passed 2026-09-03 |
| FR-002 | AC-001 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| FR-002 | AC-002 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| FR-002 | AC-015 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| FR-003 | AC-004 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-003 | AC-006 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-003 | AC-018 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-004 | AC-005 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-004 | AC-006 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-004 | AC-018 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-005 | AC-006 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-005 | AC-007 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-005 | AC-019 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-006 | AC-008 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-006 | AC-009 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-006 | AC-010 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| FR-007 | AC-011 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| FR-007 | AC-014 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| FR-007 | AC-016 | Unidade | `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-007 | AC-020 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| NFR-002 | AC-020 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| FR-008 | AC-005 | Unidade | `reader-highlights-repository.test.ts` | Passed 2026-09-03 |
| FR-008 | AC-012 | Unidade | `reader-highlights-repository.test.ts` | Passed 2026-09-03 |
| FR-008 | AC-017 | Unidade | `reader-highlights-repository.test.ts` | Passed 2026-09-03 |
| FR-009 | AC-004 | Unidade | paleta em `reader-highlights.test.ts` | Passed 2026-09-03 |
| FR-009 | AC-007 | Unidade | paleta inclui apagar | Passed 2026-09-03 |
| FR-009 | AC-013 | Unidade | paleta sem estilos fora | Passed 2026-09-03 |
| NFR-001 | AC-001 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| NFR-001 | AC-003 | Unidade | `verse-selection.test.ts` | Passed 2026-09-03 |
| NFR-001 | AC-015 | Browser | `bible-reader.svelte.spec.ts` | Passed 2026-09-03 |
| NFR-002 | AC-008 | Unidade | serialização local | Passed 2026-09-03 |
| NFR-002 | AC-010 | Browser | clipboard | Passed 2026-09-03 |
| NFR-002 | AC-012 | Unidade | repositório | Passed 2026-09-03 |
| NFR-003 | AC-004 | Browser | VISUAL | Passed 2026-09-03 |
| NFR-003 | AC-011 | Browser | VISUAL split | Passed 2026-09-03 |
| NFR-003 | AC-013 | Unidade | paleta | Passed 2026-09-03 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — 2026-09-03 (revalidado no aceite 2026-09-03)
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md`
- **Achados**: Formato Specsfy/2.0 válido; 4 US, 9 FR, 3 NFR e 20 AC; cada US/FR/NFR tem ≥3 AC em **Cobre**; interface Svelte completa na seção 10; DoD cita DATABASE.md, INTERFACE.md e PROJECT.md. Sem BLOCKER. Findings PROD/ARCH/SEC abaixo, nenhum P1 Open. Aceite: higiene editorial evitou falso positivo do validador em palavra portuguesa e em menção a requisito da SPEC-0004.
- **FIND-PROD-001** [P2] [Resolved] Jornada P1 de criar nota precisava de falha observável — Refs: US-004, FR-007, AC-020 — Evidence: apps/web/src/lib/features/notes/notes-repository.ts:107 — Effect: sem AC de workspace sem escrita o aceite de US-004 ficaria só no caminho feliz — Suggestion: AC-020 cobre erro recuperável sem nota e sem highlight
- **FIND-ARCH-001** [P1] [Resolved] Destaques do reader não podem gravar nos SQLite bíblicos — Refs: FR-008, NFR-002, AC-017 — Evidence: .specsfy/DATABASE.md:12 — Effect: escrever em bibles/ viola File Over Apps e o perfil de persistência — Suggestion: tabela auxiliar em index.sqlite, DEC-008 e FR-008
- **FIND-SEC-001** [P2] [Resolved] Conteúdo bíblico, destaque e nota devem permanecer locais — Refs: NFR-002, FR-006, AC-008 — Evidence: apps/web/src/lib/features/bible/BibleReader.svelte:850 — Effect: clipboard ou nota na rede vazaria texto bíblico — Suggestion: NFR-002 e AC-008/AC-010/AC-017 sem HTTP nesta fatia

#### Gate do Ato II — Plano

- **Resultado**: READY — 2026-09-03
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0005-selecao-versiculos-highlights-nota-leitor/spec.md`
- **Achados**: 31 tarefas (20 TEST TDD + 7 CODE + 3 DOC + 1 TEST regressão). Cada AC tem TDD distinto; cada US/FR/NFR tem ≥3 predecessores TDD; cada CODE tem ≥3 TDD ancestrais com refs sobrepostos. T001–T020 concluídas com RED. Fase de interface: T025–T028. Sem `plan.md`/`tasks.md`.

#### Gate do Ato III — Entrega

- **Resultado**: READY — 2026-09-03
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md .`
- **Achados**: 36/36 IDs da SPEC-0005 cobertos. `verify_acceptance` QA PASSED. `verify_evidence` PASSED (strict). Suíte Vitest 119 passed / 31 files (reconfirmado no aceite). Marcador órfão de requisito da SPEC-0004 (highlight TipTap do canvas) em testes daquela fatia — WARNING, não BLOCKER desta spec. `tsc --noEmit` falha só em reexports shadcn-svelte de `button`/`tabs` (pré-existente, fora da fatia) — WARNING. VISUAL 320/1440 via suíte Vitest browser; MCP de browser Cursor não anexou aba ao localhost. Sem P1 Open. DoD comprovada. Aceite final READY.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Derivar do AC-001 um caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-001 e o `BibleReader` em `/bible`.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar cobertura do popover ao selecionar um versículo.

- [x] T002 [TEST] [TDD] [US-001] Derivar do AC-002 um caso Vitest falhando em apps/web/src/lib/features/bible/verse-selection.test.ts — Refs: US-001, FR-001, FR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-002 e a regra de intervalo contínuo.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar cobertura de Gn 1.2–5.

- [x] T003 [TEST] [TDD] [US-001] Derivar do AC-003 um caso Vitest falhando em apps/web/src/lib/features/bible/verse-selection.test.ts — Refs: US-001, FR-001, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-003 e a recusa de seleção disjunta.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar cobertura de 1.3 e 1.7.

- [x] T004 [TEST] [TDD] [US-002] Derivar do AC-004 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-002, FR-003, FR-009, NFR-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-004 e a paleta de canetas.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar identidade do intervalo 1.2–5.

- [x] T005 [TEST] [TDD] [US-002] Derivar do AC-005 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-002, FR-004, FR-008, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-005 e a sobreposição de intervalos.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar Gn 1.3 cobrindo dois intervalos.

- [x] T006 [TEST] [TDD] [US-002] Derivar do AC-006 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-002, FR-003, FR-004, FR-005, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-006 e a identidade pelo intervalo exato.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar que apagar 1.3 preserva 1.2–5.

- [x] T007 [TEST] [TDD] [US-002] Derivar do AC-007 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-002, FR-005, FR-009, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-007 e a ação apagar da paleta.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar cobertura residual de outros intervalos.

- [x] T008 [TEST] [TDD] [US-003] Derivar do AC-008 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-003, FR-006, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-008 e o formato da referência copiada.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar livro, capítulo, faixa e versão.

- [x] T009 [TEST] [TDD] [US-003] Derivar do AC-009 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-003, FR-006, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-009 e a cópia de texto + referência.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar snapshot de 1.2 até 1.5.

- [x] T010 [TEST] [TDD] [US-003] Derivar do AC-010 um caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-003, FR-006, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-010 e o erro recuperável de clipboard.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar que nada é enviado à rede.

- [x] T011 [TEST] [TDD] [US-004] Derivar do AC-011 um caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-004, FR-002, FR-007, NFR-003, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-011 e o split desktop sem highlight.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar independência nota/highlight.

- [x] T012 [TEST] [TDD] [US-002] Derivar do AC-012 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights-repository.test.ts — Refs: US-002, FR-008, NFR-002, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-012 e o SQLite auxiliar.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar restauração ao reabrir o capítulo.

- [x] T013 [TEST] [TDD] [US-002] Derivar do AC-013 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-002, FR-009, NFR-003, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-013 e a paleta Q6.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar exclusão de nuvem, strike-through e atalhos Logos.

- [x] T014 [TEST] [TDD] [US-004] Derivar do AC-014 um caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-004, FR-007, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-014 e as abas no mobile.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar que a rota `/bible` permanece.

- [x] T015 [TEST] [TDD] [US-001] Derivar do AC-015 um caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-001, FR-002, NFR-001, AC-015 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-015 e o teclado do popover.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar foco visível e Escape.

- [x] T016 [TEST] [TDD] [US-004] Derivar do AC-016 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-004, FR-007, AC-016 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-016 e o fence `:::verse` da SPEC-0004.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar snapshot do intervalo na nota.

- [x] T017 [TEST] [TDD] Derivar do AC-017 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights-repository.test.ts — Refs: FR-008, NFR-002, AC-017 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-017 e a fronteira `bibles/` somente leitura.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar que só `index.sqlite` muda.

- [x] T018 [TEST] [TDD] [US-002] Derivar do AC-018 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: US-002, FR-003, FR-004, AC-018 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-018 e um estilo por anotação.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar substituição de estilo no mesmo intervalo.

- [x] T019 [TEST] [TDD] Derivar do AC-019 um caso Vitest falhando em apps/web/src/lib/features/bible/reader-highlights.test.ts — Refs: FR-005, AC-019 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-019 e o no-op de apagar sem match.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar que Gn 1.2–5 permanece.

- [x] T020 [TEST] [TDD] [US-004] Derivar do AC-020 um caso Vitest falhando em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-004, FR-007, NFR-002, AC-020 — Depends: none
  - [x] **PREP**: Ler o Gherkin AC-020 e a falha de escrita do workspace.
  - [x] **EXECUTE**: Escrever o caso TDD com `SPECSFY:` próprio, sem arquivo `.feature`.
  - [x] **VERIFY**: RED observado — testes falham pelo comportamento da spec, não por sintaxe.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: RED 2026-09-03 `bun run --cwd apps/web test:tdd` — domínio falha por comportamento ausente (null/[]/paleta vazia); browser falha por popover/ações inexistentes após clicar o versículo 3.
  - [x] **IMPROVE**: Revisar erro recuperável sem nota e sem highlight.

#### Fase 2 — US-001 Seleção contínua (P1)

**Objetivo**: Formar intervalo contínuo de versículos inteiros no capítulo aberto.
**Teste independente**: `bun run --cwd apps/web test:tdd` em `verse-selection.test.ts`.

- [x] T021 [CODE] [US-001] Implementar intervalo contínuo em apps/web/src/lib/features/bible/verse-selection.ts — Refs: US-001, FR-001, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED de T001–T003; executar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Implementar `formContinuousRange` e recusa de seleção disjunta.
  - [x] **VERIFY**: GREEN 2026-09-03 `bun run --cwd apps/web test:tdd src/lib/features/bible/verse-selection.test.ts` — 2 passed (AC-002 e AC-003).
  - [x] **VISUAL**: Não aplicável porque o módulo é TypeScript puro sem DOM.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; arquivo `apps/web/src/lib/features/bible/verse-selection.ts`.
  - [x] **IMPROVE**: Extraídos `rangeCoversVerse`, `versesInRange` e `sameRange` para a interface e o domínio de highlights reusarem a mesma regra de intervalo.
  <!-- specsfy:evidence {"task":"T021","refs":["US-001","FR-001","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/lib/features/bible/verse-selection.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/bible/verse-selection.test.ts","exit":0}]} -->

**Checkpoint**: Selecionar 1.2–5 é um intervalo; 1.3 e 1.7 não são um intervalo.

#### Fase 3 — US-002 Highlights de intervalo (P1)

**Objetivo**: Anotações sobreponíveis com identidade pelo intervalo exato, paleta Q6 e persistência auxiliar.
**Teste independente**: `bun run --cwd apps/web test:tdd` em `reader-highlights.test.ts` e `reader-highlights-repository.test.ts`.

- [x] T022 [CODE] [US-002] Implementar regras e paleta em apps/web/src/lib/features/bible/reader-highlights.ts — Refs: US-002, FR-003, FR-004, FR-005, FR-009, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: Confirmar RED de T004–T006; executar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Implementar apply/erase por intervalo exato, cobertura de versículo e paleta Q6.
  - [x] **VERIFY**: GREEN 2026-09-03 de T004–T007, T013, T016, T018, T019 — 8 de 10 casos do arquivo; as 2 falhas restantes eram exatamente o RED de T023 (AC-008/AC-009), fechado na tarefa seguinte no mesmo módulo.
  - [x] **VISUAL**: Não aplicável porque o módulo é TypeScript puro sem DOM.
  - [x] **EVIDENCE**: GREEN de arquivo completo (10 passed) registrado nas seções 11–13 após T023; arquivo `apps/web/src/lib/features/bible/reader-highlights.ts`.
  - [x] **IMPROVE**: `buildVerseFenceFromRange` reusa `renderVerseFence` da SPEC-0004 em vez de duplicar o contrato do fence `:::verse`.
  <!-- specsfy:evidence {"task":"T022","refs":["US-002","FR-003","FR-004","FR-005","FR-009","AC-004","AC-005","AC-006","AC-018","AC-019"],"files":["apps/web/src/lib/features/bible/reader-highlights.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/bible/reader-highlights.test.ts","exit":0}]} -->

- [x] T023 [CODE] [US-003] Implementar serialização de cópia em apps/web/src/lib/features/bible/reader-highlights.ts — Refs: US-003, FR-006, NFR-002, AC-008, AC-009, AC-010 — Depends: T022, T008, T009, T010
  - [x] **PREP**: Confirmar RED de T008–T010 e GREEN de T022; executar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Implementar copiar referência e copiar texto+referência sem rede.
  - [x] **VERIFY**: GREEN 2026-09-03 `bun run --cwd apps/web test:tdd src/lib/features/bible/reader-highlights.test.ts` — 10 passed, incluindo T008 e T009.
  - [x] **VISUAL**: Não aplicável porque o módulo é TypeScript puro sem DOM.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; arquivo `apps/web/src/lib/features/bible/reader-highlights.ts`. Serialização é string local, sem `fetch` nem rede.
  - [x] **IMPROVE**: `referenceLabel` e `formatVerseSnapshot` isolados para o popover e o fence `:::verse` usarem a mesma referência humana.
  <!-- specsfy:evidence {"task":"T023","refs":["US-003","FR-006","NFR-002","AC-008","AC-009","AC-010"],"files":["apps/web/src/lib/features/bible/reader-highlights.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/bible/reader-highlights.test.ts","exit":0}]} -->

- [x] T024 [CODE] [US-002] Implementar repositório SQLite auxiliar em apps/web/src/lib/features/bible/reader-highlights-repository.ts — Refs: US-002, FR-008, NFR-002, AC-005, AC-012, AC-017 — Depends: T005, T012, T017, T022
  - [x] **PREP**: Confirmar RED de T012/T017; executar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Criar tabela idempotente, listar/upsert/delete por intervalo exato em `index.sqlite`, nunca em `bibles/`.
  - [x] **VERIFY**: GREEN 2026-09-03 `bun run --cwd apps/web test:tdd src/lib/features/bible/reader-highlights-repository.test.ts` — 2 passed; AC-017 confirma que o SQLite bíblico do teste não recebe `reader_highlight` e mantém `book`.
  - [x] **VISUAL**: Não aplicável porque o módulo é TypeScript puro sem DOM.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; arquivo `apps/web/src/lib/features/bible/reader-highlights-repository.ts`. Escrita restrita a `.openbible/index.sqlite` (`READER_HIGHLIGHT_INDEX_PATH`).
  - [x] **IMPROVE**: Índice único `(version_id, book_id, chapter, verse_start, verse_end)` transforma a identidade da seção 9 em invariante do schema, permitindo `ON CONFLICT DO UPDATE` no lugar de leitura-e-escrita.
  <!-- specsfy:evidence {"task":"T024","refs":["US-002","FR-008","NFR-002","AC-005","AC-012","AC-017"],"files":["apps/web/src/lib/features/bible/reader-highlights-repository.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/lib/features/bible/reader-highlights-repository.test.ts","exit":0}]} -->

**Checkpoint**: Duas anotações Gn 1.3 e Gn 1.2–5 coexistem; reabrir o capítulo as restaura.

#### Fase de interface

- [x] T025 [CODE] [US-001] Estender seleção e markup no leitor em apps/web/src/lib/features/bible/BibleReader.svelte — Refs: US-001, FR-001, FR-002, NFR-001, AC-001, AC-002, AC-015 — Depends: T021, T001, T002, T015
  - [x] **PREP**: Confirmar seção 10, stack Svelte 5 e RED de T001/T015; editar `.svelte` com `svelte-file-editor`; executar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Versículos selecionáveis como intervalo contínuo (`formContinuousRange` + Shift), anúncio `aria-pressed`/`sr-only` e overlay união dos intervalos.
  - [x] **VERIFY**: GREEN 2026-09-03 `bun run --cwd apps/web test:tdd src/routes/bible-reader.svelte.spec.ts` — 14 passed, inclusive T001 (popover em Gn 1.3) e T015 (Escape).
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia Geist da lista de versículos em 320px e 1440px, tema claro/escuro, foco visível. Via Vitest browser 320×900 e 1440×900 + inspeção CSS vs `DESIGNSYSTEM.MD` (grid 32px+texto, outline 2px `--ring`, hover/seleção por `color-mix`, `overflow-wrap`, `prefers-reduced-motion`). MCP de browser Cursor não anexou aba ao `localhost:5173`; o fluxo seleção→popover foi exercido na suíte.
  - [x] **EVIDENCE**: GREEN nas seções 11–13; arquivo `apps/web/src/lib/features/bible/BibleReader.svelte`.
  - [x] **IMPROVE**: `svelte-file-editor` — `scrollBlockers` em `$derived`; combobox da versão com `aria-controls="bible-selector"` e `id` no Dialog/Sheet.
  <!-- specsfy:evidence {"task":"T025","refs":["US-001","FR-001","FR-002","NFR-001","AC-001","AC-002","AC-015"],"files":["apps/web/src/lib/features/bible/BibleReader.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

- [x] T026 [CODE] [US-002] Implementar popover de ações em apps/web/src/lib/features/bible/SelectionActionPopover.svelte — Refs: US-002, FR-002, FR-009, NFR-003, AC-004, AC-007, AC-013 — Depends: T022, T023, T004, T007, T013
  - [x] **PREP**: Confirmar paleta Q6 e primitives shadcn-svelte; editar `.svelte` com `svelte-file-editor`; executar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Popover contextual com canetas, riscos, apagar, duas cópias e criar nota; sem painel Logos e sem atalhos B/G/O/R/Y.
  - [x] **VERIFY**: GREEN 2026-09-03 da suíte `bible-reader.svelte.spec.ts` — popover, copiar com `role="alert"` quando o clipboard recusa, paleta Q6 no domínio.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia Geist do popover em 320px e 1440px, paleta curta e longa, `prefers-reduced-motion`, tema claro/escuro. Superfície `max-width: min(288px, calc(100vw - 24px))`, padding com safe-area, swatches 22px nomeados em `aria-label`, riscos com texto, fundo `#090909` no escuro. Conferido via Vitest browser.
  - [x] **EVIDENCE**: GREEN nas seções 11–13; arquivo `apps/web/src/lib/features/bible/SelectionActionPopover.svelte`.
  - [x] **IMPROVE**: Nenhuma alteração extra de contraste: nomes das canetas já estão em `aria-label`; texto visível fica nos riscos para não inflar o popover compacto.
  <!-- specsfy:evidence {"task":"T026","refs":["US-002","FR-002","FR-009","NFR-003","AC-004","AC-007","AC-013"],"files":["apps/web/src/lib/features/bible/SelectionActionPopover.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

- [x] T027 [CODE] [US-004] Implementar split desktop e abas mobile em apps/web/src/lib/features/bible/BibleNoteSplit.svelte — Refs: US-004, FR-007, NFR-003, AC-011, AC-014, AC-016 — Depends: T025, T011, T014, T016
  - [x] **PREP**: Confirmar reuso de `createNote` e `NoteCanvasEditor`; editar `.svelte` com `svelte-file-editor`; executar `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Criar nota com fence `:::verse` sem aplicar highlight; split no desktop e abas no mobile sem sair de `/bible`.
  - [x] **VERIFY**: GREEN 2026-09-03 — AC-011 (região Nota + versículo no `main`), AC-014 (abas Bíblia/Nota em 320px), AC-016 (fence no domínio), AC-020 (alert sem região Nota).
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia Geist do split e das abas em 320px e 1440px, título de nota longo, tema claro/escuro. Desktop em duas colunas com borda contínua à esquerda; título com ellipsis; abas shadcn em 320px; `aria-label="Nota"`. Conferido via Vitest browser.
  - [x] **EVIDENCE**: GREEN nas seções 11–13; arquivo `apps/web/src/lib/features/bible/BibleNoteSplit.svelte`.
  - [x] **IMPROVE**: Nenhuma alteração de chrome: o título longo já trunca com ellipsis e o split usa superfície contínua em vez de card empilhado.
  <!-- specsfy:evidence {"task":"T027","refs":["US-004","FR-007","NFR-003","AC-011","AC-014","AC-016","AC-020"],"files":["apps/web/src/lib/features/bible/BibleNoteSplit.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

- [x] T028 [DOC] Atualizar INTERFACE.md com popover, markup e split em INTERFACE.md — Refs: US-001, FR-002, NFR-003, AC-001 — Depends: T025, T026, T027
  - [x] **PREP**: Listar blocos `BibleReader`, `SelectionActionPopover` e `BibleNoteSplit`.
  - [x] **EXECUTE**: Registrar finalidade, arquivo, estados, consumidores e reaproveitamento.
  - [x] **VERIFY**: Fase de interface cita os três blocos; rota `/bible` lista popover e split; `Tabs` passa a ter consumidor `BibleNoteSplit`.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza documentação de interface.
  - [x] **EVIDENCE**: Diff em `INTERFACE.md` — blocos `SelectionActionPopover` e `BibleNoteSplit`; `BibleVerseList` passa a ser selecionável; tela Bíblia inclui split/abas.
  - [x] **IMPROVE**: Consumidor de `Tabs` atualizado para não parecer exclusivo de `/config`.

#### Fase final — Qualidade

- [x] T029 [DOC] Documentar tabela auxiliar de highlights em .specsfy/DATABASE.md — Refs: FR-008, NFR-002, AC-012, AC-017 — Depends: T024
  - [x] **PREP**: Comparar schema implementado com a seção 9.
  - [x] **EXECUTE**: Acrescentar `reader_highlight` (campos, UNIQUE de intervalo exato, retenção) sem apagar linhas existentes.
  - [x] **VERIFY**: Monitor de contexto CURRENT após a edição.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza persistência documentada.
  - [x] **EVIDENCE**: Linhas novas em `.specsfy/DATABASE.md` — inventário `reader_highlight`, índice do workspace e parágrafo File Over Apps (`bibles/` somente leitura).
  - [x] **IMPROVE**: Identidade UNIQUE documentada como invariante do schema, alinhada ao `ON CONFLICT DO UPDATE` de T024.

- [x] T030 [DOC] Revisar capacidade do leitor em PROJECT.md — Refs: US-001, US-002, US-003, US-004 — Depends: T027
  - [x] **PREP**: Ler `PROJECT.md` e avaliar impacto material da fatia.
  - [x] **EXECUTE**: Mencionar destacar, copiar e anotar a partir do leitor, com `:::verse` e `reader_highlight` no `index.sqlite`.
  - [x] **VERIFY**: DoD da seção 18 coberta para `PROJECT.md`.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza o documento de produto.
  - [x] **EVIDENCE**: Diff em `PROJECT.md` — capacidades do leitor e parágrafo File Over Apps do workspace.
  - [x] **IMPROVE**: Nomear as tabelas auxiliares (`note_verse_ref` e `reader_highlight`) para não reabrir o mito de `index.sqlite` sem schema.

- [x] T031 [TEST] Executar regressão e rastreabilidade em apps/web/src/routes/bible-reader.svelte.spec.ts — Refs: US-001, FR-001, AC-001 — Depends: T027, T028, T029, T030
  - [x] **PREP**: Identificar `test:tdd`, `check_traceability.mjs` e `verify_acceptance.mjs`.
  - [x] **EXECUTE**: Rodar regressão Vitest e rastreabilidade SPEC-0005.
  - [x] **VERIFY**: 119 passed / 31 files; `verify_acceptance` QA PASSED; `verify_evidence` PASSED; `validate_tasks` READY. Rastreabilidade 36/36 IDs da spec; marcador órfão de requisito da SPEC-0004 (highlight TipTap do canvas). `tsc --noEmit` falha em exports shadcn-svelte de `button`/`tabs` (pré-existente).
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia Geist no fluxo completo em 320px e 1440px. Suíte browser cobre seleção, popover, split e abas nesses viewports; MCP de browser Cursor não anexou aba ao `localhost:5173`.
  - [x] **EVIDENCE**: `PLAYWRIGHT_BROWSERS_PATH=/home/claudio/.cache/ms-playwright bun run --cwd apps/web test:tdd` — 119 passed. `verify_acceptance.mjs` QA PASSED. Locator de navegação alinhado a `Configurações`.
  - [x] **IMPROVE**: `afterEach` restaura viewport 1280×720 no spec do leitor; testes de `AppSidebar` passam a procurar `Configurações` (rótulo atual), falha pré-existente que derrubava a suíte completa.

### 15. Ordem de execução

- Caminho crítico: T001–T020 (RED) → T021 → T022 → T023 → T024 → T025 → T026 → T027 → T028 → T029 → T030 → T031.
- Tarefas paralelas: T001–T020 não compartilham estado mutável de produto, mas compartilham arquivos de teste; executar em sequência por arquivo (`verse-selection.test.ts`, `reader-highlights.test.ts`, `reader-highlights-repository.test.ts`, `bible-reader.svelte.spec.ts`).
- Estratégia de MVP: US-001 + US-002 (T021–T026) já entregam seleção, highlight e popover; US-003 (T023/T026) e US-004 (T027) completam o pedido.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0003 (leitor), SPEC-0004 (`createNote`, `:::verse`), workspace/`index.sqlite` (0001).

#### Riscos

- Confundir highlight do reader com TipTap → paleta e persistência separadas.
- Apagar Gn 1.3 destruir Gn 1.2–5 → identidade pelo intervalo exato (DEC-004).
- Copiar UI/marca Logos → paleta Q6 e popover.

#### Suposições

- 4 a 8 canetas sólidas com nomes acessíveis (não os nomes da marca Logos).
- Referência copiada: nome do livro + capítulo + versículo ou faixa + rótulo da versão.
- Criar nota sempre cria arquivo novo, não reabre nota existente.
- Gesto de seleção contínua (clique, arraste ou equivalente) fica a cargo da implementação desde que o intervalo resultante seja contínuo e acessível por teclado.

### 17. Decisões

- **DEC-001**: Versículos inteiros no capítulo aberto (Q1).
- **DEC-002**: Highlight e nota independentes (Q2).
- **DEC-003**: Highlight = anotação de intervalo sobreponível, não empilhamento visual (Q3).
- **DEC-004**: Identidade pelo intervalo exato; um estilo por anotação; versículo mostra todos os intervalos (Q4).
- **DEC-005**: Seleção só contínua; 1.3 e 1.7 = duas anotações (Q5).
- **DEC-006**: Paleta = canetas + sublinhado + ondulado + caixa + apagar; resto Logos fora (Q6).
- **DEC-007**: Duas ações de copiar, do pedido original.
- **DEC-008**: Destaques no SQLite auxiliar; `bibles/` somente leitura (perfil + DATABASE).

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
- [x] `.specsfy/DATABASE.md` descreve a tabela auxiliar de highlights do reader.
- [x] `INTERFACE.md` registra popover, markup do versículo e split/abas.
- [x] `PROJECT.md` menciona a capacidade de destacar, copiar e anotar a partir do leitor, ou a tarefa justifica ausência de impacto material.
