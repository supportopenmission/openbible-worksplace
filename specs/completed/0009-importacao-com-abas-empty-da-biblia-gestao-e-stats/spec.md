# Especificação integrada: Importação com abas, empty da Bíblia, gestão e stats

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0009 |
| Slug | 0009-importacao-com-abas-empty-da-biblia-gestao-e-stats |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-09-03 |
| Effort rationale | Quatro superfícies (onboarding, Bíblia vazia, duas abas de config) + novo primitive Empty + fluxo de exclusão com confirmação + agregação de stats; risco em acessibilidade das Tabs e irreversibilidade da exclusão. |
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

A importação no onboarding mistura envio local e URL R2 sem escolha explícita do modo; a `/bible` sem versões mostra um painel genérico pouco orientado; não há onde ver, gerenciar ou excluir Bíblias instaladas; e não há visão de uso do workspace (arquivos, notas, sermões, Bíblias).

#### Resultado desejado

A pessoa escolhe o modo de importação por abas no onboarding, encontra um estado vazio orientado na Bíblia com botões de importação, gerencia e exclui versões em uma aba de `/config` e consulta estatísticas do workspace em outra aba.

#### Métricas de sucesso

- 100% das alternâncias entre abas de importação preservam o estado de cada modo e ambas instalam em `bibles/`.
- 100% das exclusões confirmadas removem o arquivo e atualizam lista, catálogo e status; 0 exclusões ocorrem sem confirmação.
- 100% das contagens de stats conferem com `storage.listFiles` e repositórios na mesma sessão.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhum research externo executado; decisões vêm da conversa, da Inbox, do backlog e das fontes locais.

#### Fontes e contexto consultados

- `specs/inbox/2026-09-03-173149-onboarding-com-abas-de-importacao-empty-da-biblia-gestao-e-stats-nas-configuracoes.md` — formulação original.
- `specs/backlog/0009-importacao-com-abas-empty-da-biblia-gestao-e-stats.md` — refinamento e decisões.
- `specs/completed/0008-importar-biblias-por-url-do-bucket-r2/spec.md` — RemoteBibleImport, progresso e validação OpenLP.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — etapa import local.
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` — catálogo e estado vazio do leitor.
- `apps/web/src/lib/features/onboarding/OnboardingModal.svelte` — etapa import atual.
- `apps/web/src/lib/features/bible/BibleReader.svelte` — estado `empty` atual.
- `apps/web/src/lib/features/config/ConfigPage.svelte` — Tabs `Armazenamento`/`Tela inicial`.
- `apps/web/src/lib/features/notes/NotesList.svelte` — padrão AlertDialog de exclusão com confirmação.
- `apps/web/src/lib/storage/local-storage.ts`, `opfs-storage.ts` — `deleteFile` existente.
- `apps/web/src/lib/features/bible/bible-reader.ts` — `loadBibleCatalog` e diagnósticos.
- `PROJECT.md`, `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`.

#### Documentação consultada

- Documentação local do Specsfy e templates da spec.
- Registry shadcn-svelte (componente `empty`) como referência de composição a instalar; nenhuma cópia externa normativa.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo; sem cópia em `research/`.

#### Dúvidas respondidas

- **Q1: qual Tabs?** → **A:** reutilizar o primitive Tabs shadcn-svelte já instalado (mesmo do `/config`).
- **Q2: Empty pronto ou próprio?** → **A:** instalar `empty` do registry shadcn-svelte via CLI; fallback vendorar seguindo `button/`.
- **Q3: lixeira para Bíblias?** → **A:** não nesta fatia; exclusão direta com confirmação e aviso irreversível.
- **Q4: o que conta no stats?** → **A:** Bíblias (instaladas + bytes), notas ativas e lixeira, sermões `.md` nas três pastas, bytes = `bibles/` + notas ativas.
- **Q5: excluir última versão?** → **A:** leitor volta ao vazio; `bibleImportStatus` volta a `pending`.
- **Q6: onde gerenciar?** → **A:** nova aba `Bíblias` no `/config` (desktop e seção mobile); importação continua em `Armazenamento`.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante.

### 3. Escopo e atores

#### Incluído

- Abas `Arquivos locais` e `Bucket R2` na etapa import do onboarding, com estado preservado por aba.
- Estado vazio da `/bible` com Empty shadcn + botões (arquivos via `/?import=bible`, alternar R2 embutido, abrir `/config`).
- Aba `Bíblias` no `/config`: lista instaladas (nome, arquivo, livros, tamanho), inválidas com diagnóstico, excluir com confirmação.
- Aba `Estatísticas` no `/config`: Bíblias, notas (ativas/lixeira), sermões, bytes estimados.
- Serviço `deleteBibleVersion` e serviço `collectWorkspaceStats`, ambos testados com storage em memória.

#### Fora de escopo

- Edição ou renomeação de versões; re-download automático; lixeira para Bíblias; exportação de stats; upload para o bucket.

#### Atores

- **Pessoa usuária individual**: escolhe o modo, importa, gerencia, exclui com confirmação e consulta stats.
- **Aplicação web**: alterna abas, valida, instala, exclui, agrega e mostra estados.

### 4. Princípios e restrições do projeto

- **PR-001**: manter SvelteKit/Svelte, shadcn-svelte e Vitest; não introduzir React ou outra UI.
- **PR-002**: somente `bibles/` pode ser removido pela gestão; Markdown e índice auxiliar nunca são tocados por ela.
- **PR-003**: exclusão exige confirmação com nome do arquivo; sem exclusão silenciosa ou em lote sem confirmar cada item.
- **PR-004**: stats 100% locais, sem rede; nenhum conteúdo sai do dispositivo.
- **PR-005**: interface segue o guideline vercel/design (Geist, superfícies contínuas, foco visível, teclado, `prefers-reduced-motion`).

### 5. Histórias de usuário

#### US-001 — Escolher como importar no onboarding (P1)

Como pessoa usuária individual, quero escolher entre arquivos locais e bucket R2 por abas, para usar o modo adequado sem refazer a etapa.

**Por que P1**: sem escolha explícita a pessoa não descobre o R2 ou perde o progresso local ao alternar.
**Teste independente**: alternar abas no modal com storage em memória, conferindo preservação de estado e instalação pelos dois modos.
**Requisitos**: FR-001

#### US-002 — Entender a Bíblia vazia e agir (P1)

Como pessoa usuária individual, quero um estado vazio claro com botões de importação, para instalar a primeira Bíblia sem adivinhar o caminho.

**Por que P1**: a primeira Bíblia desbloqueia o leitor; o vazio atual não orienta.
**Teste independente**: renderizar `/bible` sem versões e percorrer os botões até a importação R2 e os links.
**Requisitos**: FR-002

#### US-003 — Gerenciar e excluir Bíblias instaladas (P1)

Como pessoa usuária individual, quero ver as versões instaladas e excluir as que não uso, com confirmação, para liberar espaço com segurança.

**Por que P1**: sem gestão o acúmulo de SQLite grandes não tem solução dentro do produto.
**Teste independente**: listar catálogo mockado, excluir com e sem confirmação, conferindo arquivo, lista e status.
**Requisitos**: FR-003

#### US-004 — Ver estatísticas do workspace (P2)

Como pessoa usuária individual, quero ver quantidades de Bíblias, notas, sermões e bytes, para entender o uso do meu workspace.

**Por que P2**: orienta limpeza e dá confiança, mas não bloqueia leitura ou importação.
**Teste independente**: popular storage em memória e conferir contagens e bytes exibidos.
**Requisitos**: FR-004

### 6. Cenários BDD de aceite

#### AC-001 — Alternar modo de importação

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: Escolher modo de importação no onboarding

  Scenario: Alternar entre arquivos locais e bucket R2
    Given que a pessoa está na etapa de importação do onboarding
    When alterna para a aba Bucket R2 e volta para Arquivos locais
    Then cada aba mantém seu estado e ambas instalam em bibles/
```

#### AC-002 — Abas por teclado com estado preservado

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: Operar abas de importação por teclado

  Scenario: Navegar entre abas sem perder seleção
    Given que há arquivos selecionados na aba local e URL preenchida na aba R2
    When navega pelas abas usando setas do teclado
    Then o foco segue o padrão tablist e nenhum valor é apagado
```

#### AC-003 — Empty orientado com botões

**Cobre**: US-002, FR-002, NFR-001

```gherkin
@US-002 @FR-002 @NFR-001 @AC-003
Feature: Apresentar Bíblia vazia com Empty

  Scenario: Ver ações de importação no vazio
    Given que nenhuma versão está instalada
    When abre /bible
    Then vê Empty com título, descrição e botões para arquivos, R2 e configurações
    And cada botão navega ou revela a ação correspondente
```

#### AC-004 — Instalar pelo vazio via R2

**Cobre**: US-002, FR-002, NFR-002

```gherkin
@US-002 @FR-002 @NFR-002 @AC-004
Feature: Importar a partir do estado vazio

  Scenario: Concluir instalação remota sem sair da rota
    Given que o vazio está visível e o bucket mockado responde
    When revela o R2, carrega a lista e instala uma versão
    Then o leitor sai do vazio e abre o texto sem navegação forçada
```

#### AC-005 — Listar instaladas e inválidas

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-005
Feature: Gerenciar Bíblias instaladas

  Scenario: Ver versões com informações e diagnósticos
    Given que há versões válidas e um arquivo inválido em bibles/
    When abre a aba Bíblias
    Then vê nome, arquivo, livros e tamanho das válidas e o motivo da inválida
```

#### AC-006 — Excluir com confirmação

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-006
Feature: Excluir versão com segurança

  Scenario: Confirmar e remover
    Given que há versões instaladas
    When pede excluir, confirma com o nome visível e conclui
    Then o arquivo sai de bibles/, a lista e o status atualizam e o resultado é anunciado
```

#### AC-007 — Cancelar exclusão ou remover a última

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-007
Feature: Preservar em caso de desistência ou esvaziamento

  Scenario: Cancelar mantém; última removida volta ao vazio
    Given que a confirmação está aberta ou resta uma única versão
    When cancela ou confirma a última exclusão
    Then o arquivo cancelado permanece e a última removida devolve pending e o vazio do leitor
```

#### AC-008 — Stats conferem com o storage

**Cobre**: US-004, FR-004, NFR-002

```gherkin
@US-004 @FR-004 @NFR-002 @AC-008
Feature: Exibir estatísticas do workspace

  Scenario: Contar Bíblias, notas, sermões e bytes
    Given que o workspace tem Bíblias, notas ativas, lixeira e sermões
    When abre a aba Estatísticas
    Then os números exibidos conferem com listFiles e repositórios da sessão
```

#### AC-009 — Stats zerados em workspace novo

**Cobre**: US-004, FR-004, NFR-001

```gherkin
@US-004 @FR-004 @NFR-001 @AC-009
Feature: Apresentar workspace novo sem números quebrados

  Scenario: Zeros legíveis com orientação
    Given que não há Bíblias, notas ou sermões
    When abre a aba Estatísticas
    Then vê zeros com rótulos e um caminho para importar ou criar o primeiro item
```

#### AC-010 — Abas do config por teclado e viewport

**Cobre**: US-001, US-002, US-004, FR-001, FR-002, FR-004, NFR-001

```gherkin
@US-001 @US-002 @US-004 @FR-001 @FR-002 @FR-004 @NFR-001 @AC-010
Feature: Navegar configuração com abas e seções

  Scenario: Desktop com tabs e mobile com seções
    Given que /config tem Armazenamento, Bíblias, Estatísticas e Tela inicial
    When usa setas nas tabs em 1440px ou rola as seções em 320px
    Then painéis e landmarks estão associados e não há overflow horizontal
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve exibir abas `Arquivos locais` e `Bucket R2` na etapa import do onboarding com o primitive Tabs, preservar seleção local e URL ao alternar e instalar pelos dois modos em `bibles/`.
- **FR-002**: O sistema deve exibir o vazio da `/bible` com o componente Empty (ícone, título, descrição) e botões que levam a `/?import=bible`, revelam o importador R2 embutido e abrem `/config`; instalar pelo R2 deve sair do vazio sem navegação forçada.
- **FR-003**: O sistema deve listar na aba `Bíblias` as versões instaladas (nome, arquivo, livros, tamanho) e inválidas (motivo), excluir via `deleteFile` somente após confirmação com nome visível, atualizar catálogo e `bibleImportStatus` (`pending` quando vazio) e anunciar o resultado.
- **FR-004**: O sistema deve exibir na aba `Estatísticas` as contagens de Bíblias instaladas, notas ativas, notas na lixeira, sermões `.md` e bytes estimados (`bibles/` + notas ativas), calculados no cliente a cada abertura.

#### Não funcionais

- **NFR-001**: Tabs, Empty, confirmação e stats devem ser operáveis por teclado com foco visível, nomes acessíveis, `tablist`/`tabpanel` associados, `role=alert`/`aria-live` em erros e resultados, layout sem overflow em 320px e 1440px e `prefers-reduced-motion` respeitado. **Verificação**: testes browser Vitest + inspeção visual 320px/1440px.
- **NFR-002**: Exclusão só com confirmação e aviso irreversível; nenhuma operação faz rede para servidor próprio; stats sem dependência de rede; falhas de escrita/leitura geram erro recuperável sem perder dados. **Verificação**: testes unitários com storage em memória + observação de rede no browser.

#### Erros e casos-limite

- `deleteFile` ausente no storage → ação desabilitada com explicação, sem quebrar a lista.
- Falha ao excluir → erro recuperável, arquivo mantido e listado.
- Exclusão concorrente da versão em leitura → leitor recarrega catálogo e cai no vazio com orientação.
- Stats com storage indisponível → zeros/orientação em vez de exceção.
- Empty com storage indisponível → botões de navegação funcionam; R2 mostra erro recuperável.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- SvelteKit 2.70.2, Svelte 5.56.9, TypeScript 7.0.2, Vitest 4.1.10, Playwright, Tailwind 4.3.3, shadcn-svelte Nova (`Tabs`, `Button`, `Dialog`/`AlertDialog` via NotesList). `RemoteBibleImport`, `importBibleFiles`, `loadBibleCatalog`, `deleteFile` nos adaptadores, `listNotes`, `trash/` e `sermons/*` no workspace. Sem `empty/` em `components/ui`.

#### Arquitetura e módulos

- `apps/web/src/lib/components/ui/empty/` (novo via CLI shadcn-svelte): `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`.
- `apps/web/src/lib/features/onboarding/OnboardingModal.svelte`: etapa import com `Tabs` (`local`/`remote`); dropzone vai para o painel local; `RemoteBibleImport` vai para o painel remoto.
- `apps/web/src/lib/features/bible/BibleReader.svelte`: estado `empty` usa `Empty` + botões + `RemoteBibleImport` com toggle.
- `apps/web/src/lib/features/bible/bible-library.ts` (novo): `listLibraryEntries(storage)` (catálogo + tamanhos) e `deleteBibleVersion(storage, fileName)` (deleteFile + status `pending` quando vazio + erro tipado quando `deleteFile` ausente).
- `apps/web/src/lib/features/bible/BibleLibraryManager.svelte` (novo): lista, diagnósticos, confirmação via `AlertDialog`, revalidação.
- `apps/web/src/lib/features/workspace/workspace-stats.ts` (novo): `collectWorkspaceStats(storage)` com contagens e bytes.
- `apps/web/src/lib/features/workspace/WorkspaceStats.svelte` (novo): apresentação dos stats.
- `apps/web/src/lib/features/config/ConfigPage.svelte`: abas `storage`, `bibles`, `stats`, `home`; seções mobile equivalentes.

#### Migrations

- Não aplicável. Sem schema novo; `bibles/` e `.openbible/config.json` preservados.

#### Models

- `LibraryEntry { fileName, name, books, size, status: installed|invalid, diagnostic? }`; invariante: `fileName` termina em `.sqlite`.
- `WorkspaceStats { bibles: { count, bytes }, notes: { active, trash }, sermons: { count }, bytesTotal }`; invariante: contagens ≥ 0, bytes ≥ 0.
- `bibleImportStatus` segue `pending` (0 versões), `complete`/`partial` conforme última importação.

#### Controllers e casos de uso

- `deleteBibleVersion(storage, fileName)`: verifica existência, chama `deleteFile`, atualiza config; erro `delete-unsupported` quando ausente.
- `collectWorkspaceStats(storage)`: `listFiles('bibles')` + tamanhos, `listNotes`/listFiles `notes` e `trash`, `listFiles` dos três `sermons/*`.
- Sem controller HTTP; sem autenticação.

#### Views e experiência

- Onboarding: Tabs linha com dois gatilhos; painel local com dropzone; painel remoto com `RemoteBibleImport`.
- Bíblia vazia: `Empty` centralizado com ícone Livro, título, descrição e `EmptyContent` com 3 botões; R2 embutido expansível.
- Bíblias: lista com nome mono, meta, botão Excluir (destrutivo) + `AlertDialog` com nome e aviso; resultado em `aria-live`.
- Estatísticas: grade de indicadores (valor + rótulo + unidade) + nota de estimativa.

#### Queries e repositórios

- Leitura via `storage.listFiles`/`readFile`; catálogo via `loadBibleCatalog`; notas via `listNotes` quando disponível ou `listFiles('notes')`.

#### Jobs e processamento assíncrono

- Exclusão e stats assíncronos no cliente com cancelamento seguro por desmonte; sem retry automático.

#### Estrutura de arquivos

```text
apps/web/src/lib/components/ui/empty/
apps/web/src/lib/features/bible/bible-library.ts
apps/web/src/lib/features/bible/bible-library.test.ts
apps/web/src/lib/features/bible/BibleLibraryManager.svelte
apps/web/src/lib/features/workspace/workspace-stats.ts
apps/web/src/lib/features/workspace/workspace-stats.test.ts
apps/web/src/lib/features/workspace/WorkspaceStats.svelte
apps/web/src/routes/bible-empty.svelte.spec.ts
specs/draft/0009-importacao-com-abas-empty-da-biblia-gestao-e-stats/
  spec.md
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| LibraryEntry | `bibles/<fileName>` | `name`, `books`, `size`, `status`, `diagnostic?`; excluir remove o arquivo | N por WorkspaceConfig |
| WorkspaceStats | workspace | contagens e bytes; somente leitura, recalculado a cada abertura | 1 por workspace |
| ImportTab | `local \| remote` | seleção da aba; preserva estado interno de cada painel | pertence à etapa import |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| ImportTab | local | alternar | remote | seleção local preservada |
| LibraryEntry | installed | excluir confirmado | removido | arquivo some de `bibles/` |
| WorkspaceConfig | complete/partial | última exclusão | pending | leitor volta ao vazio |
| WorkspaceStats | — | abrir aba | calculado | números conferem com storage |

#### Migração e retenção

- Sem migração. Exclusões são permanentes; stats não persistem.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. Escolha do modo, vazio orientado, gestão com confirmação e leitura de stats.

#### Stack e convenções de interface

- SvelteKit/Svelte, Tailwind, shadcn-svelte (`Tabs`, `Button`, `AlertDialog`, novo `Empty`), Lucide, Vitest Browser. Telas afetadas: `OnboardingModal`, `BibleReader` vazio, `ConfigPage`. Preservar import local e `RemoteBibleImport`; registrar `Empty` e novos blocos em `INTERFACE.md`.

#### Telas e responsabilidades

- **Onboarding import**: escolher modo por abas; entrada é seleção/URL, saída é `bibles/` + status.
- **Bíblia vazia**: orientar primeira importação; entrada é ausência de versões, saída é instalação ou navegação.
- **Bíblias (`/config`)**: listar, diagnosticar e excluir versões.
- **Estatísticas (`/config`)**: ler contagens e bytes.

#### Fluxo de informação e navegação

- Onboarding: `intro → storage → installing → import (abas) → complete`; R2 e local independentes.
- Bíblia vazia → botões → `/?import=bible`, R2 embutido ou `/config` → retorno à leitura.
- Config: Tabs desktop (`Armazenamento`, `Bíblias`, `Estatísticas`, `Tela inicial`); seções empilhadas no mobile.

#### Menus e navegação principal

- Menu principal (Sidebar desktop + barra mobile, inalterado): Bíblia → `/bible`, Notas → `/notes`, Destaques → `/highlights`, Sermões → `/sermons`, Estudos → `/study`, Configuração → `/config`; todos com `aria-current`, tooltips no desktop recolhido e rótulos na barra mobile.
- Onboarding não tem menu: modal automático em `/` com fluxo `intro → storage → installing → import (abas) → complete`; conclusão/adiamento retorna à própria `/`.
- Navegação secundária nova: Tabs do `/config` (`Armazenamento`, `Bíblias`, `Estatísticas`, `Tela inicial`) com painéis associados no desktop e seções empilhadas rotuladas no mobile; Bíblia vazia com botões para `/?import=bible`, R2 embutido e `/config`.
- Nenhum item de menu é criado ou removido; a navegação direta às abas do config é suficiente porque elas vivem dentro da rota `/config` já ligada no menu.

#### Formulários e ações

- Abas com `role=tablist`, setas no teclado, painéis com `tabindex=0`.
- Excluir: botão destrutivo → `AlertDialog` com nome do arquivo + aviso → confirmar/cancelar.
- Stats: sem formulário; apenas leitura com nota de estimativa.

#### Composição e disposição

- Onboarding mantém modal 560px; abas linha no topo do painel import.
- Empty centralizado com mídia, título, descrição e ações em coluna no mobile.
- Bíblias: lista em largura total com meta em mono e ação alinhada à direita.
- Stats: grade de indicadores 2 colunas (1 no mobile).

#### Blocos React e componentes selecionados

| Tela | Bloco Svelte | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Onboarding | `ImportTabs` | Abas local/remoto | dentro de `OnboardingModal.svelte` | `Tabs` shadcn-svelte | shadcn-svelte local | Interno |
| Bíblia vazia | `BibleEmpty` | Empty + botões + R2 | dentro de `BibleReader.svelte` | `Empty` shadcn-svelte + `RemoteBibleImport` | registry + próprio | Novo bloco documentado |
| Config | `BibleLibraryManager` | Lista, diagnóstico, excluir | `apps/web/src/lib/features/bible/BibleLibraryManager.svelte` | `AlertDialog`, `Button` | shadcn-svelte + próprio | Novo |
| Config | `WorkspaceStats` | Indicadores | `apps/web/src/lib/features/workspace/WorkspaceStats.svelte` | Próprio | Próprio | Novo |
| UI | `Empty` | Estado vazio padrão | `apps/web/src/lib/components/ui/empty/` | registry shadcn-svelte | shadcn-svelte | Novo primitive |

- React não se aplica; tabela registra blocos Svelte reais.

#### Estados e acessibilidade

- Tabs com setas e `aria-selected`; Empty com heading hierárquico; AlertDialog com foco preso e retorno; resultados em `aria-live`; 320px/1440px sem overflow; `prefers-reduced-motion`.

#### Contrato CRUD

- Não há CRUD de registros nesta entrega (gestão de arquivos SQLite, não de entidades com ciclo criar-consultar-editar-apagar); por isso não há `PageHeader` novo, `DataGrid`, coluna `ID`, linha-link para detalhe nem ações de editar.
- A identidade visível de cada versão é o nome do arquivo em Geist Mono (papel análogo à coluna `ID`).
- A ação de apagar existe por linha, é destrutiva, respeita confirmação com consequência explícita e não propaga navegação — mesmo rigor do apagar de `NotesList`.
- Componentes novos e reaproveitados (`Empty`, `BibleLibraryManager`, `WorkspaceStats`, Tabs) serão registrados em `INTERFACE.md` com arquivos, consumidores, estados e regra de extensão.

#### Revisão visual durante o desenvolvimento

- Browser 320px/1440px claro/escuro: abas, Empty, lista com confirmação, stats; bordas, espaçamentos, margens, padding, tipografia, foco e overflow.

#### APIs expostas

- Sem endpoint. Contratos internos: `listLibraryEntries`, `deleteBibleVersion`, `collectWorkspaceStats`, eventos dos componentes.

#### APIs externas utilizadas

- Bucket R2 público via `RemoteBibleImport` existente; sem novidade.

#### Documentação das APIs consultadas

- Nenhuma documentação externa copiada; registry shadcn-svelte como fonte do `Empty`.

#### Eventos e outros contratos

- `LibraryEntry[]` e `WorkspaceStats` como tipos TypeScript; `bibleImportStatus` reutilizado.

### 11. Estratégia TDD

- **Unidade**: `bible-library.ts` (lista, exclusão, status, erros) e `workspace-stats.ts` (contagens, bytes, zeros).
- **Integração/contrato**: storage em memória + sql.js; fetch mockado herdado.
- **BDD/aceite**: AC-001 a AC-010 orientam casos distintos, sem `.feature`.
- **Runner TDD**: Vitest, `npm --prefix apps/web run test:tdd`.
- **E2E**: Vitest Browser Mode para abas, Empty, confirmação e tabs do config.
- **Verificação manual**: somente confirmação visual de dialogs nativos e viewport real.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 | `onboarding.svelte.spec.ts`, marcador `SPECSFY: US-001 FR-001 NFR-001 AC-001` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-001, FR-001, NFR-001, AC-002 | AC-002 | `onboarding.svelte.spec.ts`, marcador `SPECSFY: US-001 FR-001 NFR-001 AC-002` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-002, FR-002, NFR-001, AC-003 | AC-003 | `bible-empty.svelte.spec.ts`, marcador `SPECSFY: US-002 FR-002 NFR-001 AC-003` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-002, FR-002, NFR-002, AC-004 | AC-004 | `bible-empty.svelte.spec.ts`, marcador `SPECSFY: US-002 FR-002 NFR-002 AC-004` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-003, FR-003, NFR-002, AC-005 | AC-005 | `bible-library.test.ts`, marcador `SPECSFY: US-003 FR-003 NFR-002 AC-005` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-003, FR-003, NFR-002, AC-006 | AC-006 | `bible-library.test.ts`, marcador `SPECSFY: US-003 FR-003 NFR-002 AC-006` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-003, FR-003, NFR-002, AC-007 | AC-007 | `bible-library.test.ts`, marcador `SPECSFY: US-003 FR-003 NFR-002 AC-007` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-004, FR-004, NFR-002, AC-008 | AC-008 | `workspace-stats.test.ts`, marcador `SPECSFY: US-004 FR-004 NFR-002 AC-008` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-004, FR-004, NFR-001, AC-009 | AC-009 | `workspace-stats.test.ts`, marcador `SPECSFY: US-004 FR-004 NFR-001 AC-009` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |
| US-001, US-002, US-004, FR-001, FR-002, FR-004, NFR-001, AC-010 | AC-010 | `config.svelte.spec.ts`, marcador `SPECSFY: US-001 US-002 US-004 FR-001 FR-002 FR-004 NFR-001 AC-010` | RED: modulo/aba ausente | GREEN: suite passou | Refactor/regressao T015: 183 testes passaram |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Browser | `apps/web/src/routes/onboarding.svelte.spec.ts` | Passed: 183 testes, build OK |
| FR-001 | AC-002 | Browser | `onboarding.svelte.spec.ts` | Passed: 183 testes, build OK |
| FR-001 | AC-010 | Browser | `apps/web/src/routes/config.svelte.spec.ts` | Passed: 183 testes, build OK |
| FR-002 | AC-003 | Browser | `apps/web/src/routes/bible-empty.svelte.spec.ts` | Passed: 183 testes, build OK |
| FR-002 | AC-004 | Browser | `bible-empty.svelte.spec.ts` | Passed: 183 testes, build OK |
| FR-002 | AC-010 | Browser | `config.svelte.spec.ts` | Passed: 183 testes, build OK |
| FR-003 | AC-005 | Unidade | `apps/web/src/lib/features/bible/bible-library.test.ts` | Passed: 183 testes, build OK |
| FR-003 | AC-006 | Unidade | `bible-library.test.ts` | Passed: 183 testes, build OK |
| FR-003 | AC-007 | Unidade | `bible-library.test.ts` | Passed: 183 testes, build OK |
| FR-004 | AC-008 | Unidade | `apps/web/src/lib/features/workspace/workspace-stats.test.ts` | Passed: 183 testes, build OK |
| FR-004 | AC-009 | Unidade | `workspace-stats.test.ts` | Passed: 183 testes, build OK |
| FR-004 | AC-010 | Browser | `config.svelte.spec.ts` | Passed: 183 testes, build OK |
| NFR-001 | AC-002 | Browser/inspeção | 320px/1440px | Passed: 183 testes, build OK |
| NFR-001 | AC-009 | Unidade/browser | `workspace-stats.test.ts` | Passed: 183 testes, build OK |
| NFR-001 | AC-010 | Browser/inspeção | `config.svelte.spec.ts`; 320px/1440px | Passed: 183 testes, build OK |
| NFR-002 | AC-006 | Unidade | `bible-library.test.ts` | Passed: 183 testes, build OK |
| NFR-002 | AC-007 | Unidade | `bible-library.test.ts` | Passed: 183 testes, build OK |
| NFR-002 | AC-008 | Unidade | `workspace-stats.test.ts` | Passed: 183 testes, build OK |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0009-importacao-com-abas-empty-da-biblia-gestao-e-stats/spec.md --allow-draft`
- **Achados**: Nenhum BLOCKER; 4 US, 4 FR, 2 NFR, 10 AC com cobertura minima 3 AC por ID; interface Sim completa. Validado em 2026-09-03.
- Findings especializados, quando aplicáveis, seguem `FIND-PROD|ARCH|SEC-NNN`, severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

#### Gate do Ato II — Plano

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0009-importacao-com-abas-empty-da-biblia-gestao-e-stats/spec.md --allow-draft`
- **Achados**: 15 tarefas, 10 TDD, 20/20 IDs cobertos, CODE com 3+ predecessores. Aprovado em 2026-09-03.

#### Gate do Ato III — Entrega

- **Resultado**: Passed
- **Comando**: `npm --prefix apps/web run test:tdd`, `npm --prefix apps/web run build`, `check_traceability` no escopo bible-remote+bíblia
- **Achados**: 183/183 testes (42 arquivos), build Cloudflare OK, rastreabilidade 20/20 no escopo. Revisão visual 320px/1440px aplicada.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Provar alternância de modo no onboarding em `apps/web/src/routes/onboarding.svelte.spec.ts` — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler AC-001 e confirmar abas local/remoto e preservação de estado.
  - [x] **EXECUTE**: Escrever caso browser com marcador próprio `SPECSFY: US-001 FR-001 NFR-001 AC-001`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência das abas.
  - [x] **VISUAL**: Não aplicável; materializa teste antes da tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Selecionar tabs por nome acessível.

- [x] T002 [TEST] [TDD] [US-001] Provar teclado e persistência das abas em `apps/web/src/routes/onboarding.svelte.spec.ts` — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler AC-002 e confirmar tablist, setas e valores preservados.
  - [x] **EXECUTE**: Escrever caso browser com marcador próprio `SPECSFY: US-001 FR-001 NFR-001 AC-002`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do tablist.
  - [x] **VISUAL**: Não aplicável; materializa teste antes da tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Cobrir foco e painel associado.

- [x] T003 [TEST] [TDD] [US-002] Provar Empty com botões na Bíblia vazia em `apps/web/src/routes/bible-empty.svelte.spec.ts` — Refs: US-002, FR-002, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Ler AC-003 e confirmar Empty, botões e destinos.
  - [x] **EXECUTE**: Escrever caso browser com marcador próprio `SPECSFY: US-002 FR-002 NFR-001 AC-003`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do Empty.
  - [x] **VISUAL**: Não aplicável; materializa teste antes da tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Consultar ações por nome visível.

- [x] T004 [TEST] [TDD] [US-002] Provar instalação R2 a partir do vazio em `apps/web/src/routes/bible-empty.svelte.spec.ts` — Refs: US-002, FR-002, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler AC-004 e confirmar saída do vazio sem navegação forçada.
  - [x] **EXECUTE**: Escrever caso browser com marcador próprio `SPECSFY: US-002 FR-002 NFR-002 AC-004`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do fluxo no vazio.
  - [x] **VISUAL**: Não aplicável; materializa teste antes da tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Mockar fetch e storage em memória.

- [x] T005 [TEST] [TDD] [US-003] Provar listagem da biblioteca em `apps/web/src/lib/features/bible/bible-library.test.ts` — Refs: US-003, FR-003, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler AC-005 e confirmar nome, livros, tamanho e diagnósticos.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-003 FR-003 NFR-002 AC-005`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do serviço.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Reusar fixtures OpenLP existentes.

- [x] T006 [TEST] [TDD] [US-003] Provar exclusão confirmada em `apps/web/src/lib/features/bible/bible-library.test.ts` — Refs: US-003, FR-003, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler AC-006 e confirmar remoção, lista e status atualizados.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-003 FR-003 NFR-002 AC-006`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência da exclusão.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Cobrir pending ao esvaziar.

- [x] T007 [TEST] [TDD] [US-003] Provar cancelamento e erros de exclusão em `apps/web/src/lib/features/bible/bible-library.test.ts` — Refs: US-003, FR-003, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler AC-007 e confirmar preservação e erros tipados.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-003 FR-003 NFR-002 AC-007`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do tratamento.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Cobrir deleteFile ausente e falha de escrita.

- [x] T008 [TEST] [TDD] [US-004] Provar contagens do stats em `apps/web/src/lib/features/workspace/workspace-stats.test.ts` — Refs: US-004, FR-004, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler AC-008 e confirmar Bíblias, notas, sermões e bytes.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-004 FR-004 NFR-002 AC-008`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do serviço.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Manter fixtures pequenas e determinísticas.

- [x] T009 [TEST] [TDD] [US-004] Provar stats zerados em `apps/web/src/lib/features/workspace/workspace-stats.test.ts` — Refs: US-004, FR-004, NFR-001, AC-009 — Depends: none
  - [x] **PREP**: Ler AC-009 e confirmar zeros legíveis.
  - [x] **EXECUTE**: Escrever caso Vitest com marcador próprio `SPECSFY: US-004 FR-004 NFR-001 AC-009`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência do serviço.
  - [x] **VISUAL**: Não aplicável; prova serviço.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Evitar divisão ou formatação quebrada com zero.

- [x] T010 [TEST] [TDD] [US-001] [US-002] [US-004] Provar abas do config em `apps/web/src/routes/config.svelte.spec.ts` — Refs: US-001, US-002, US-004, FR-001, FR-002, FR-004, NFR-001, AC-010 — Depends: none
  - [x] **PREP**: Ler AC-010 e confirmar quatro abas desktop e seções mobile.
  - [x] **EXECUTE**: Escrever caso browser com marcador próprio `SPECSFY: US-001 US-002 US-004 FR-001 FR-002 FR-004 NFR-001 AC-010`, sem `.feature`.
  - [x] **VERIFY**: Observar RED por ausência das novas abas.
  - [x] **VISUAL**: Não aplicável; materializa teste antes da tela.
  - [x] **EVIDENCE**: Registrar arquivo, comando e causa do RED.
  - [x] **IMPROVE**: Reusar padrão tablist existente.

#### Fase 2 — US-001 Escolher como importar (P1)

**Objetivo**: abas local/R2 funcionais com estado preservado no onboarding.
**Teste independente**: `npm --prefix apps/web run test:tdd -- src/routes/onboarding.svelte.spec.ts` passa.

- [x] T011 [CODE] [US-001] Implementar abas de importação em `apps/web/src/lib/features/onboarding/OnboardingModal.svelte` — Refs: US-001, FR-001, NFR-001, AC-001, AC-002, AC-010 — Depends: T001, T002, T010
  - [x] **PREP**: Confirmar RED de T001/T002/T010 e o primitive Tabs.
  - [x] **EXECUTE**: Mover dropzone ao painel local e RemoteBibleImport ao painel remoto com tablist acessível.
  - [x] **VERIFY**: Executar testes focais e tipos.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia das abas em 320px e 1440px.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos nas seções 11–13.
  - [x] **IMPROVE**: Preservar seleção e URL ao alternar.
<!-- specsfy:evidence {"task":"T011","refs":["US-001","FR-001","NFR-001","AC-001","AC-002","AC-010"],"files":["apps/web/src/lib/features/onboarding/OnboardingModal.svelte","apps/web/src/routes/onboarding.svelte.spec.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/routes/onboarding.svelte.spec.ts","exit":0},{"run":"npm --prefix apps/web run build","exit":0}]} -->

#### Fase 3 — US-002 Bíblia vazia orientada (P1)

**Objetivo**: Empty shadcn com botões e instalação R2 sem sair da rota.
**Teste independente**: `npm --prefix apps/web run test:tdd -- src/routes/bible-empty.svelte.spec.ts` passa.

- [x] T012 [CODE] [US-002] Instalar primitive Empty e converter o vazio em `apps/web/src/lib/components/ui/empty/` e `apps/web/src/lib/features/bible/BibleReader.svelte` — Refs: US-002, FR-002, NFR-001, NFR-002, AC-003, AC-004, AC-010 — Depends: T003, T004, T010
  - [x] **PREP**: Confirmar RED de T003/T004/T010 e o registry do Empty.
  - [x] **EXECUTE**: Adicionar `empty/` via CLI (fallback vendor), compor Empty com botões e R2 expansível, registrar em `INTERFACE.md`.
  - [x] **VERIFY**: Executar testes focais e tipos.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do Empty em 320px e 1440px claro/escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos nas seções 11–13.
  - [x] **IMPROVE**: Manter saída do vazio sem navegação forçada.
<!-- specsfy:evidence {"task":"T012","refs":["US-002","FR-002","NFR-001","NFR-002","AC-003","AC-004","AC-010"],"files":["apps/web/src/lib/components/ui/empty/","apps/web/src/lib/features/bible/BibleReader.svelte","apps/web/src/routes/bible-empty.svelte.spec.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/routes/bible-empty.svelte.spec.ts src/routes/bible-reader.svelte.spec.ts","exit":0},{"run":"npm --prefix apps/web run build","exit":0}]} -->

#### Fase 4 — US-003 Gestão com exclusão (P1)

**Objetivo**: listar, diagnosticar e excluir versões com confirmação.
**Teste independente**: `npm --prefix apps/web run test:tdd -- src/lib/features/bible/bible-library.test.ts` passa.

- [x] T013 [CODE] [US-003] Implementar serviço de biblioteca em `apps/web/src/lib/features/bible/bible-library.ts` — Refs: US-003, FR-003, NFR-002, AC-005, AC-006, AC-007 — Depends: T005, T006, T007
  - [x] **PREP**: Confirmar RED de T005/T006/T007, `deleteFile` e `loadBibleCatalog`.
  - [x] **EXECUTE**: Implementar listagem com tamanhos/diagnósticos e exclusão com status e erros tipados.
  - [x] **VERIFY**: Executar testes focais e tipos.
  - [x] **VISUAL**: Não aplicável; sem interface.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos nas seções 11–13.
  - [x] **IMPROVE**: Fechar instâncias sql.js e nunca tocar Markdown.
<!-- specsfy:evidence {"task":"T013","refs":["US-003","FR-003","NFR-002","AC-005","AC-006","AC-007"],"files":["apps/web/src/lib/features/bible/bible-library.ts","apps/web/src/lib/features/bible/bible-library.test.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/lib/features/bible/bible-library.test.ts","exit":0}]} -->

#### Fase 5 — US-004 Stats + abas do config (P2)

**Objetivo**: Bíblias gerenciáveis e estatísticas visíveis no `/config`.
**Teste independente**: `npm --prefix apps/web run test:tdd -- src/lib/features/workspace/workspace-stats.test.ts src/routes/config.svelte.spec.ts` passa.

- [x] T014 [CODE] [US-003] [US-004] Construir `BibleLibraryManager.svelte`, stats e abas do config em `apps/web/src/lib/features/bible/BibleLibraryManager.svelte`, `apps/web/src/lib/features/workspace/workspace-stats.ts`, `apps/web/src/lib/features/workspace/WorkspaceStats.svelte` e `apps/web/src/lib/features/config/ConfigPage.svelte` — Refs: US-003, US-004, FR-003, FR-004, NFR-001, NFR-002, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010 — Depends: T005, T006, T007, T008, T009, T010
  - [x] **PREP**: Confirmar RED de T005–T010, AlertDialog de `NotesList` e Tabs do config.
  - [x] **EXECUTE**: Implementar manager com confirmação, serviço e tela de stats e as abas/seções; registrar blocos em `INTERFACE.md`.
  - [x] **VERIFY**: Executar testes focais e tipos.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia da lista, confirmação e stats em 320px e 1440px claro/escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos nas seções 11–13.
  - [x] **IMPROVE**: Anunciar exclusão e erros em região viva.
<!-- specsfy:evidence {"task":"T014","refs":["US-003","US-004","FR-003","FR-004","NFR-001","NFR-002","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010"],"files":["apps/web/src/lib/features/bible/BibleLibraryManager.svelte","apps/web/src/lib/features/workspace/workspace-stats.ts","apps/web/src/lib/features/workspace/WorkspaceStats.svelte","apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/routes/config.svelte.spec.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd","exit":0},{"run":"npm --prefix apps/web run build","exit":0}]} -->

#### Fase final — Qualidade

- [x] T015 [TEST] Executar regressão e rastreabilidade da SPEC-0009 em `apps/web/src/lib/features/bible/` — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010 — Depends: T011, T012, T013, T014
  - [x] **PREP**: Identificar suites, tipos, build e validadores.
  - [x] **EXECUTE**: Executar `npm --prefix apps/web run test:tdd`, `check-types`, `build`, `check_traceability` e `monitor_context --check`.
  - [x] **VERIFY**: Confirmar ausência de gaps e gates verdes.
  - [x] **VISUAL**: Repassar conferência visual final de bordas, espaçamentos, margens, padding e tipografia ou justificar.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais.
  - [x] **IMPROVE**: Registrar retrospectiva.
<!-- specsfy:evidence {"task":"T015","refs":["US-001","US-002","US-003","US-004","FR-001","FR-002","FR-003","FR-004","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010"],"files":["apps/web/src/lib/features/bible/","apps/web/src/lib/features/workspace/"],"commands":[{"run":"npm --prefix apps/web run test:tdd","exit":0},{"run":"npm --prefix apps/web run build","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001–T010 (RED) → T011 → T012 → T013 → T014 → T015.
- Tarefas paralelas: T001–T010 em qualquer ordem (arquivos distintos); T011–T014 em sequência por dependência de tela.
- Estratégia de MVP: US-001 + US-002 primeiro (importação), US-003 depois (gestão), US-004 por último (stats).

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Primitive `empty` do registry shadcn-svelte; `Tabs`, `AlertDialog`, `Button` locais; `deleteFile`, `loadBibleCatalog`, `RemoteBibleImport` existentes.

#### Riscos

- CLI shadcn sem rede → vendorar `empty/` seguindo `button/` como modelo.
- Exclusão irreversível → confirmação com nome + aviso; sem lote.
- Stats lendo bytes demais → somar tamanhos via `readFile` apenas de `bibles/` e notas (pequenas).
- Quatro abas quebram testes existentes do config → manter `Armazenamento`/`Tela inicial` e somar abas.

#### Suposições

- `deleteFile` existe nos dois adaptadores; `trash/` guarda lixeira de notas; sermões são `.md` em `sermons/*`.

### 17. Decisões

- **DEC-001**: Tabs shadcn-svelte para modo de importação e abas do config — consistência com o padrão existente.
- **DEC-002**: Empty do registry (CLI, fallback vendor) — segue o pedido e o design system.
- **DEC-003**: Sem lixeira para Bíblias; exclusão direta com confirmação — escopo mínimo seguro.
- **DEC-004**: Stats recalculados a cada abertura, sem persistência — evita schema e sincronização.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
