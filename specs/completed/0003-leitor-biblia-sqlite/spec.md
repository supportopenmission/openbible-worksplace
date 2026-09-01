# Especificação integrada: Leitor da Bíblia com SQLite importado

| Campo                  | Valor                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formato                | Specsfy/2.0                                                                                                                                                  |
| ID                     | SPEC-0003                                                                                                                                                    |
| Slug                   | 0003-leitor-biblia-sqlite                                                                                                                                    |
| Status                 | Complete                                                                                                                                                     |
| Effort                 | 8                                                                                                                                                            |
| Effort updated at      | 2026-09-01                                                                                                                                                   |
| Effort rationale       | A fatia combina descoberta de arquivos locais, execução SQLite WASM, compatibilidade de schema OpenLP, consultas de leitura e uma tela responsiva com busca. |
| ClickUp Task           |                                                                                                                                                              |
| Milestones             |                                                                                                                                                              |
| Definition Gate        | Passed                                                                                                                                                       |
| Plan Gate              | Passed                                                                                                                                                       |
| Delivery Gate          | Passed                                                                                                                                                       |
| Evidence Contract      | 1                                                                                                                                                            |
| Interface para pessoas | Sim                                                                                                                                                          |
| Atualizada em          | 2026-09-01                                                                                                                                                   |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A rota `/bible` está reservada, mas não consulta os arquivos SQLite que o onboarding já importa para `bibles/`. A pessoa não consegue abrir uma versão, escolher um livro ou ler seus capítulos no workspace local.

#### Resultado desejado

A pessoa abre o leitor, escolhe uma versão OpenLP importada, navega por livro e capítulo, lê os versículos ordenados, pesquisa texto e retoma a última posição sem enviar o conteúdo para um servidor.

#### Métricas de sucesso

- Cada arquivo OpenLP compatível presente em `bibles/` aparece como versão no leitor, sem impedir o uso quando outro arquivo for incompatível.
- Um capítulo selecionado renderiza 100% dos versículos retornados pela consulta, em ordem numérica, com número e texto identificáveis.
- A reabertura do leitor restaura a última seleção válida em uma operação local e não produz requisições de conteúdo para a rede.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Compatibilidade mínima do SQLite OpenLP — Verdict: verified — Confidence: high — Evidence: research/openbible-openlp.md#estrutura-openlp e `bibles_ACF.sqlite` — Budget: 1/1.
- **R-002** [high] Hierarquia visual e controles do leitor de referência — Verdict: verified — Confidence: high — Evidence: research/openbible-openlp.md#referencia-visual-do-openbible — Budget: 1/1.

#### Fontes e contexto consultados

- `specs/inbox/2026-09-01-013835-leitor-da-biblia-com-sqlite-importado.md` — formulação original.
- `specs/backlog/0003-leitor-biblia-sqlite.md` — escopo refinado.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — contrato de importação e adaptadores.
- `specs/completed/0002-tela-inicial-navegacao/spec.md` — rota, shell, tema e navegação já entregues.
- `PROJECT.md`, `DESIGNSYSTEM.MD`, `INTERFACE.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md` e `.specsfy/DATABASE.md` — contexto persistente.

#### Documentação consultada

- OpenLP, “Reworking the Bibles”, acesso em 2026-09-01 — tabelas e relações do formato SQLite.
- OpenLP 3.0 Reference Manual, seção Bibles, acesso em 2026-09-01 — formato e uso das Bíblias.
- OpenBible publicado, acesso em 2026-09-01 — composição de leitura, navegação e controles observados.
- `sql.js` 1.14.2, pacote npm instalado nesta feature — execução SQLite no browser via WASM.

#### Artefatos de pesquisa armazenados

- `specs/draft/0003-leitor-biblia-sqlite/research/openbible-openlp.md` — observações e contratos externos, sem cópia de código de terceiros.

#### Dúvidas respondidas

- **Q1: qual é a fonte da leitura?** → **A:** os arquivos `.sqlite` já importados na pasta `bibles/` do workspace configurado; o `.openbible/index.sqlite` continua auxiliar e não é a fonte dos versículos.
- **Q2: qual formato mínimo é aceito?** → **A:** tabelas `book` e `verse` do OpenLP, com `book.id/name`, `verse.book_id/chapter/verse/text` e `book.abbreviation` opcional; `metadata.name` é usado quando disponível para nomear a versão; arquivos incompatíveis são isolados como erro.
- **Q3: qual é a primeira superfície funcional?** → **A:** leitor em `/bible` com versão, livro, capítulo, leitura, anterior/próximo, busca textual e retomada local da posição.
- **Q4: quais recursos da referência não entram agora?** → **A:** destaques, notas, comparação de versões, áudio, planos e sincronização ficam para etapas posteriores.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante para a fatia mínima. A compatibilidade de schemas diferentes do OpenLP permanece explicitamente fora do escopo.

### 3. Escopo e atores

#### Incluído

- Listagem de arquivos `.sqlite` em `bibles/` pelo adaptador de workspace.
- Abertura local com `sql.js` e seu asset WASM servido pela aplicação.
- Detecção e leitura do schema OpenLP `book`/`verse`, incluindo a variação sem `book.abbreviation`.
- Seletor de versão, livro e capítulo; versículos com número e texto.
- Navegação de capítulo anterior/próximo e limites desabilitados.
- Busca textual na versão selecionada, limitada a 50 resultados.
- Persistência local da seleção de versão, livro e capítulo.
- Estados de carregamento, vazio, erro parcial, erro total, sucesso e acessibilidade em desktop/mobile.

#### Fora de escopo

- Importar, baixar, apagar ou editar arquivos SQLite.
- Alterar `.openbible/index.sqlite`, schema funcional do workspace ou arquivos Markdown.
- Destaques, notas, comparação lado a lado, áudio, planos de leitura, sincronização, conta e telemetria.
- Suporte a schemas não compatíveis com as tabelas e campos mínimos OpenLP.

#### Atores

- **Pessoa usuária individual**: consulta e pesquisa as Bíblias que importou para seu workspace.
- **Aplicação web**: abre bytes locais no browser, executa consultas somente leitura e comunica estados recuperáveis.

### 4. Princípios e restrições do projeto

- **PR-001**: manter SvelteKit/Svelte, TypeScript e Vitest; não introduzir React, shadcn/ui para React ou ReUI.
- **PR-002**: tratar os SQLite em `bibles/` como fonte de leitura somente leitura e preservar `.openbible/index.sqlite` como auxiliar.
- **PR-003**: nenhuma consulta ou conteúdo bíblico usa `fetch`, endpoint ou servidor; os bytes ficam no armazenamento selecionado.
- **PR-004**: validar tabelas e colunas antes de consultar, usar parâmetros nos valores e nunca interpolar texto de busca em SQL.
- **PR-005**: preservar o shell, tema, safe area, foco visível e vocabulário em português do projeto.

### 5. Histórias de usuário

#### US-001 — Encontrar uma Bíblia e abrir um capítulo (P1)

Como pessoa usuária individual, quero ver as versões importadas e escolher livro e capítulo, para chegar rapidamente ao texto que estou estudando.

**Por que P1**: sem abrir uma Bíblia importada o módulo continua sem valor funcional.
**Teste independente**: fornecer um storage fake com um SQLite OpenLP e verificar catálogo, primeira seleção, versículos e navegação de capítulos.
**Requisitos**: FR-001, FR-002, NFR-001, NFR-002.

#### US-002 — Ler e localizar um trecho (P1)

Como pessoa usuária individual, quero ler o capítulo atual, avançar ou voltar e pesquisar palavras, para consultar a Bíblia sem depender de conexão.

**Por que P1**: leitura contínua e localização de texto são as ações recorrentes do leitor.
**Teste independente**: selecionar um capítulo, pesquisar um termo, recarregar a composição e verificar a posição persistida.
**Requisitos**: FR-002, FR-003, NFR-001, NFR-002.

### 6. Cenários BDD de aceite

#### AC-001 — Descobrir versões e abrir a primeira leitura

**Cobre**: US-001, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-001
Feature: Ler uma Bíblia SQLite importada

  Scenario: Abrir a primeira versão OpenLP disponível
    Given que o workspace contém um SQLite OpenLP em bibles/
    When a pessoa abre /bible
    Then a aplicação lista a versão e seus livros
    And seleciona o primeiro livro e capítulo disponíveis
    And exibe os versículos ordenados com número e texto
```

#### AC-002 — Trocar livro e capítulo

**Cobre**: US-001, US-002, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-002
Feature: Navegar pelo texto bíblico

  Scenario: Selecionar um capítulo específico
    Given que uma versão OpenLP foi carregada
    When a pessoa escolhe outro livro e capítulo
    Then a aplicação consulta somente o capítulo escolhido
    And atualiza o título e o texto sem recarregar a página
```

#### AC-003 — Respeitar limites e retomar a seleção

**Cobre**: US-001, US-002, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-003
Feature: Retomar a leitura bíblica

  Scenario: Avançar e reabrir o último capítulo
    Given que a pessoa está em um capítulo com próximo capítulo disponível
    When avança e depois abre o leitor novamente
    Then o próximo capítulo é exibido e a seleção é salva localmente
    And no primeiro ou último capítulo o controle correspondente fica desabilitado
```

#### AC-004 — Pesquisar dentro da versão

**Cobre**: US-002, FR-003, NFR-001, NFR-002

```gherkin
@US-002 @FR-003 @NFR-001 @NFR-002 @AC-004
Feature: Pesquisar texto bíblico

  Scenario: Encontrar um termo nos versículos
    Given que uma versão OpenLP está selecionada
    When a pessoa informa um termo e confirma a busca
    Then a aplicação mostra até 50 resultados com livro, capítulo, versículo e trecho
    And a busca não envia o texto para a rede
```

#### AC-005 — Isolar SQLite incompatível

**Cobre**: US-001, US-002, FR-001, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-001 @NFR-001 @NFR-002 @AC-005
Feature: Tratar fontes bíblicas incompatíveis

  Scenario: Manter o leitor utilizável com um arquivo incompatível
    Given que bibles/ contém um SQLite sem as tabelas OpenLP e uma versão válida
    When a pessoa abre /bible
    Then a versão válida continua disponível
    And a aplicação informa que o outro arquivo não pôde ser lido
```

#### AC-006 — Exibir vazio e erro recuperáveis

**Cobre**: US-001, US-002, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-006
Feature: Recuperar falhas do leitor

  Scenario: Abrir sem Bíblia compatível
    Given que o workspace não possui uma versão OpenLP utilizável
    When a pessoa abre /bible
    Then vê uma orientação para importar um SQLite compatível
    And recebe uma ação para voltar ao início sem ver controles quebrados
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve listar e abrir os `.sqlite` de `bibles/`, reconhecer o schema OpenLP por `book` e `verse`, aceitar `book.abbreviation` opcional, nomear a versão pelo metadado disponível ou pelo arquivo e isolar arquivos incompatíveis com erro visível.
- **FR-002**: O sistema deve permitir selecionar versão, livro e capítulo, consultar os versículos relacionados por `book.id = verse.book_id`, ordenar por `chapter`/`verse` e navegar entre capítulos disponíveis.
- **FR-003**: O sistema deve pesquisar texto na versão selecionada com resultado limitado a 50 itens e persistir a última versão, livro e capítulo válidos no armazenamento local do navegador.

#### Não funcionais

- **NFR-001**: A tela deve ser operável por teclado e tecnologia assistiva, com labels, foco visível, estados anunciados, controles desabilitados nos limites e sem overflow horizontal entre 320px e 1440px. **Verificação**: testes browser e inspeção visual nos dois viewports.
- **NFR-002**: A leitura deve permanecer local e somente leitura, sem requisições de conteúdo bíblico, usando consultas parametrizadas; o estado vazio/erro não pode bloquear a navegação de retorno. **Verificação**: testes de unidade/integração com storage fake, observação de rede no browser e build.

#### Erros e casos-limite

- Workspace ausente/inacessível → mostrar estado de configuração pendente e link para `/`.
- Pasta `bibles/` vazia → explicar como importar uma Bíblia e não renderizar seletores vazios.
- SQLite válido com schema ausente ou colunas incompatíveis → excluir somente essa versão do catálogo e listar o nome/causa.
- Erro ao abrir uma versão ou consultar um capítulo → manter as outras versões e oferecer nova tentativa.
- Busca vazia ou sem resultados → comunicar o estado sem esconder o leitor.
- Seleção local inválida → descartar somente a parte inválida e usar a primeira opção disponível.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `apps/web` usa SvelteKit 2.70.2, Svelte 5.56.9, TypeScript 7.0.2, Tailwind CSS 4.3.3 e Vitest 4.1.10.
- `WorkspaceStorage` já abstrai OPFS e File System Access API, mas precisa expor a listagem direta de arquivos para leitura.
- `/bible` usa `ProductPage` como placeholder e será substituída por uma composição do leitor, preservando o shell global, tema e navegação.

#### Arquitetura e módulos

- `apps/web/src/lib/storage/types.ts`, `local-storage.ts` e `opfs-storage.ts`: adicionar `listFiles(path)` para listar somente os arquivos diretos da pasta.
- `apps/web/src/lib/features/bible/bible-reader.ts`: inicializar `sql.js`, validar schema, montar catálogo, consultar capítulo e pesquisar com parâmetros.
- `apps/web/src/lib/features/bible/reader-preference.ts`: validar e persistir a seleção local da leitura.
- `apps/web/src/lib/features/bible/BibleReader.svelte`: compor estados, controles e leitura; a rota apenas resolve storage e passa a composição.
- `apps/web/src/routes/bible/+page.svelte`: criar o storage configurado no cliente e renderizar o leitor.
- `apps/web/static/sql-wasm.wasm`: asset local da runtime SQLite WASM.

#### Migrations

- Não aplicável. Não há alteração do schema do `.openbible/index.sqlite`; a mudança apenas lê bancos bíblicos importados.

#### Models

- `BibleVersion`: `id` derivado do nome do arquivo, `fileName`, `name`, `books` e diagnóstico opcional de abertura; somente leitura durante a sessão.
- `BibleBook`: `id`, `name`, `abbreviation` derivada quando disponível, `testamentId` opcional e `chapters` disponíveis.
- `BibleChapter`: `bookId`, `chapter`, `verses`.
- `BibleVerse`: `number` e `text`.
- Invariantes: somente schema validado entra no catálogo; consulta de texto é parametrizada; nenhum model escreve no SQLite importado.

#### Controllers e casos de uso

- `loadBibleCatalog(storage)`: lista `bibles/`, lê bytes, abre cada SQLite, valida schema e retorna versões válidas mais diagnósticos.
- `readBibleChapter(version, bookId, chapter)`: retorna versículos do capítulo ordenados.
- `searchBible(version, term)`: pesquisa texto parametrizado e limita a 50 resultados.
- `reader-preference.ts`: `readReaderPreference`, `saveReaderPreference` e validação da seleção contra catálogo.

#### Views e experiência

- O leitor usa um `ButtonGroup` compacto no topo com anterior, livro, capítulo, versão, busca por ícone e próximo, inspirado na referência sem reproduzir sua marca.
- O corpo mantém coluna centralizada, título do livro/capítulo, versículo numerado e texto com largura confortável.
- A busca abre `Dialog` no desktop e `Sheet` inferior no mobile; loading mostra estrutura do leitor; vazio orienta a importar; erro lista arquivos problemáticos e ação de retry/voltar; capítulo sem resultado informa ausência de conteúdo.

#### Queries e repositórios

- `sqlite_master` e `PRAGMA table_info` validam tabelas/colunas sem interpolar dados externos.
- `SELECT ... FROM book` lista livros; `SELECT DISTINCT chapter FROM verse WHERE book_id = ?` lista capítulos.
- `SELECT verse, text FROM verse WHERE book_id = ? AND chapter = ? ORDER BY verse` carrega o capítulo.
- `SELECT ... FROM verse WHERE text LIKE ? LIMIT 50` pesquisa com parâmetro `%termo%` e inclui o nome do livro em memória.

#### Jobs e processamento assíncrono

- Não aplicável como job. A inicialização WASM e leitura de arquivos são assíncronas no cliente; não há retry automático nem operação remota.

#### Estrutura de arquivos

```text
specs/draft/0003-leitor-biblia-sqlite/
  spec.md
  research/openbible-openlp.md
apps/web/src/
  lib/features/bible/
    bible-reader.ts
    bible-reader.test.ts
    reader-preference.ts
    reader-preference.test.ts
    BibleReader.svelte
  lib/storage/
    types.ts
    local-storage.ts
    opfs-storage.ts
  routes/bible/
    +page.svelte
    bible-reader.svelte.spec.ts
apps/web/static/sql-wasm.wasm
```

### 9. Modelo de dados

#### Entidades

| Entidade         | Identidade                         | Atributos e regras                                                          | Relações                                                                  |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| BibleVersion     | nome do arquivo em `bibles/`       | bytes SQLite compatíveis, nome exibido, catálogo de livros; somente leitura | contém muitos BibleBook                                                   |
| BibleBook        | `book.id` dentro da versão         | nome, abreviação e capítulos disponíveis                                    | uma BibleVersion tem muitos BibleBook; um BibleBook tem muitos BibleVerse |
| BibleVerse       | `verse.id` dentro da versão        | `book_id`, capítulo, número e texto; ordenado por capítulo/número           | pertence a um BibleBook                                                   |
| ReaderPreference | chave `openbible.reader-selection` | versão, livro e capítulo válidos; valor inválido é descartado               | aponta para BibleVersion/BibleBook/BibleChapter sem copiar conteúdo       |

#### Estados e transições

| Entidade         | Estado atual | Evento                            | Próximo estado       | Invariantes                                     |
| ---------------- | ------------ | --------------------------------- | -------------------- | ----------------------------------------------- |
| BibleVersion     | desconhecida | arquivo listado e schema validado | disponível           | tabelas e colunas mínimas existem               |
| BibleVersion     | desconhecida | abertura ou schema falha          | indisponível         | erro não remove outras versões                  |
| ReaderPreference | ausente      | seleção válida                    | definida             | só referências presentes no catálogo são salvas |
| ReaderPreference | definida     | arquivo/livro/capítulo não existe | ausente ou corrigida | o leitor abre a primeira seleção válida         |

#### Migração e retenção

- Não há migração nem retenção de conteúdo novo. A preferência local persiste até ser substituída ou o armazenamento do navegador ser limpo; os SQLite permanecem sob ownership do workspace e não são modificados.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A entrega transforma `/bible` na superfície de leitura recorrente do produto.

#### Stack e convenções de interface

- SvelteKit/Svelte com componentes `.svelte`, tokens de `apps/web/src/app.css`, Geist Sans/Mono, Lucide já instalado e Vitest Browser Mode com Playwright.
- Preservar `AppSidebar`, `ThemeToggle`, `NetworkStatus`, safe area, breadcrumb e o idioma pt-BR; substituir somente o `ProductPage` usado pela rota `/bible`.

#### Telas e responsabilidades

- **`/bible` — Leitor da Bíblia**: consultar versão, livro, capítulo, texto e busca; entrada é o workspace configurado e saída é leitura ou retorno para `/`.
- Não há nova tela de importação; a importação continua no onboarding da spec 0001.

#### Fluxo de informação e navegação

- A pessoa chega pelo Sidebar, pela preferência inicial ou por `/`; a rota cria o storage local, carrega catálogo e restaura a seleção válida.
- Breadcrumb: `OpenBible / Bíblia`, com `OpenBible` como link e `Bíblia` como item atual.
- Selecionar versão atualiza livro/capítulo; selecionar livro atualiza capítulos; selecionar capítulo carrega versículos; anterior/próximo mantém o livro quando possível e atravessa livros somente via sequência explícita de capítulos disponíveis.
- O ícone de busca abre um `Dialog` no desktop ou um `Sheet` inferior no mobile; enviar a busca fecha o painel e abre a área de resultados na própria tela; ativar um resultado troca a leitura para seu livro/capítulo.

#### Menus e navegação principal

- O menu principal existente mantém `Bíblia → /bible`, `Sermões`, `Estudos` e `Configuração`; nenhum item novo é necessário.
- No mobile, a barra inferior existente permanece e o leitor reserva espaço inferior para não ocultar versículos.
- Controles do leitor são locais à página e acessíveis por teclado; não substituem a navegação principal.

#### Formulários e ações

- Grupo `ButtonGroup` com selects nomeados `Versão`, `Livro`, `Capítulo`, setas anterior/próximo e botão de busca somente com ícone.
- Campo `Buscar no texto` com ação `Buscar` dentro de `Dialog` no desktop ou `Sheet` no mobile; vazio não dispara consulta e sem resultados apresenta mensagem.
- Botões `Capítulo anterior` e `Próximo capítulo` têm `aria-label`, estado disabled nos limites e mantêm foco após troca.
- Ação `Tentar novamente` repete a leitura do catálogo; ação `Voltar ao início` leva a `/` quando não há fonte utilizável.

#### Composição e disposição

- Breadcrumb e `ButtonGroup` compacto no topo; corpo com largura máxima confortável, título do capítulo e lista vertical de versículos.
- Em desktop, grupo centralizado com respiro lateral; em mobile, grupo ocupa a largura disponível e o texto ocupa a largura disponível sem overflow.
- Superfícies começam transparentes, com bordas semânticas e estados de foco/seleção; não adicionar cards decorativos, gradientes ou sombras.

#### Blocos React e componentes selecionados

| Tela     | Bloco React           | Responsabilidade                              | Arquivo previsto                                         | Componente ou composição                                                  | Origem                        | Reuso ou extensão                                                            |
| -------- | --------------------- | --------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `/bible` | `BibleReader` Svelte  | Orquestrar catálogo, seleção, busca e estados | `apps/web/src/lib/features/bible/BibleReader.svelte`     | Composição própria com `select`, `input`, `button` e `aria-live` nativos  | Próprio                       | Novo consumidor único; dividir somente quando houver segunda tela de leitura |
| `/bible` | `BibleVerseList`      | Renderizar capítulo e versículos              | dentro de `BibleReader.svelte` inicialmente              | Lista semântica de versículos                                             | Próprio                       | Interno até outro módulo exibir o mesmo contrato                             |
| `/bible` | `BibleReaderControls` | Seletor e navegação de capítulo               | dentro de `BibleReader.svelte` inicialmente              | `ButtonGroup`, `Button`, `Input`, `Dialog` e `Sheet` shadcn-svelte locais | Próprio                       | Extrair quando busca/comparação compartilhar controles                       |
| Shell    | `AppSidebar`          | Navegação e rota ativa                        | `apps/web/src/lib/features/navigation/AppSidebar.svelte` | Sidebar local existente                                                   | shadcn-svelte local + próprio | Reaproveitar sem duplicar links                                              |

- A coluna “Bloco React” é mantida por compatibilidade do template; os blocos reais são Svelte.
- Não há adoção de ReUI; a base local shadcn-svelte não possui primitive adicional necessário para esta composição.

#### Estados e acessibilidade

- Loading: skeleton textual/estrutural e status “Carregando Bíblias importadas”.
- Vazio: “Nenhuma Bíblia compatível encontrada” com explicação e retorno ao início.
- Erro parcial: lista de arquivos incompatíveis e versões utilizáveis.
- Erro total: mensagem de recuperação, ação de tentar novamente e retorno para `/`.
- Sucesso: título do livro, capítulo, versículos, contagem e navegação sem depender somente de cor.
- Teclado: ordem natural anterior → livro → capítulo → versão → busca → próximo; foco visível e botão disabled nos limites.
- Leitor de tela: labels associados, `aria-live` para status/busca, `aria-current` no breadcrumb e nomes completos nos controles.

#### Contrato CRUD

- Não aplicável. O leitor consulta fontes bíblicas imutáveis nesta fatia; não cria, edita ou apaga registros. Portanto não há `PageHeader`, `DataGrid`, coluna `ID`, ação de editar ou ação de apagar.

#### Revisão visual durante o desenvolvimento

- Usar Vitest Browser Mode/Playwright e inspeção do DOM nos viewports 320px e 1440px, em claro/escuro, loading, vazio, erro parcial, capítulo longo, busca e limites de navegação.
- Conferir bordas, espaçamentos, margens, padding, tipografia Geist, quebra de controles, foco, safe area e ausência de overflow horizontal.

#### APIs expostas

- Rotas GET existentes: `/bible` e `/`; sem autenticação e sem payload remoto.
- Contratos locais: `loadBibleCatalog(storage)`, `readBibleChapter(version, bookId, chapter)`, `searchBible(version, term)` e funções de preferência do leitor.

#### APIs externas utilizadas

- Nenhuma API de serviço. `sql.js` 1.14.2 executa SQLite no browser; o WASM é servido como asset local. Não há autenticação, timeout remoto ou retry de rede.

#### Documentação das APIs consultadas

- OpenLP “Reworking the Bibles”, 2007, consultado em 2026-09-01 — schema das tabelas.
- OpenLP 3.0 Reference Manual, atualizado em 2026, consultado em 2026-09-01 — formato das Bíblias.
- OpenBible publicado, consultado em 2026-09-01 — controles e área de leitura observados.

#### Eventos e outros contratos

- `WorkspaceStorage.listFiles('bibles')` retorna nomes de arquivos diretos ordenados.
- Catálogo de leitura: `{ versions: BibleVersion[], diagnostics: { fileName: string, message: string }[] }`.
- Seleção: `openbible.reader-selection` com `{ versionId: string, bookId: number, chapter: number }`.
- Busca: `{ bookId: number, bookName: string, chapter: number, verse: number, text: string }[]`, máximo de 50 resultados.

### 11. Estratégia TDD

- **Unidade**: parser/schema OpenLP, consultas de capítulo e busca, validação da preferência e navegação de limites.
- **Integração/contrato**: storage fake com arquivos em `bibles/`, adapters `listFiles` e abertura de bytes via `sql.js`.
- **BDD/aceite**: AC-001 a AC-006 orientam casos TDD, sem criar ou executar `.feature`.
- **Runner TDD**: Vitest existente, materializado em `apps/web/package.json#test:tdd`.
- **E2E**: Vitest Browser Mode com Playwright para catálogo, seleção, busca, estados vazios, teclado e retomada.
- **Verificação manual**: apenas inspeção visual dos viewports, temas e comportamento de um SQLite grande; o runner não substitui julgamento de leitura e tipografia.

#### Evidência RED-GREEN-REFACTOR

| IDs                                                              | BDD de referência | Teste TDD informado pelo BDD                                                              | RED observado                                                                                                                              | GREEN observado | Refactor/regressão |
| ---------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------ |
| US-001, FR-001, FR-002, NFR-001, NFR-002, AC-001                 | AC-001 na seção 6 | `apps/web/src/lib/features/bible/bible-reader.test.ts`, caso com marcador `SPECSFY:`      | `npm --prefix apps/web run test:tdd -- src/lib/features/bible/bible-reader.test.ts`; RED: módulo `./bible-reader` ausente                  | Pending         | Pending            |
| US-001, US-002, FR-001, FR-002, NFR-001, NFR-002, AC-002         | AC-002 na seção 6 | `apps/web/src/lib/features/bible/bible-reader.test.ts`, caso com marcador `SPECSFY:`      | `npm --prefix apps/web run test:tdd -- src/lib/features/bible/bible-reader.test.ts`; RED: módulo `./bible-reader` ausente                  | Pending         | Pending            |
| US-001, US-002, FR-002, FR-003, NFR-001, NFR-002, AC-003         | AC-003 na seção 6 | `apps/web/src/lib/features/bible/reader-preference.test.ts`, caso com marcador `SPECSFY:` | `npm --prefix apps/web run test:tdd -- src/lib/features/bible/reader-preference.test.ts`; RED: módulo `./reader-preference` ausente        | Pending         | Pending            |
| US-002, FR-003, NFR-001, NFR-002, AC-004                         | AC-004 na seção 6 | `apps/web/src/lib/features/bible/bible-reader.test.ts`, caso com marcador `SPECSFY:`      | `npm --prefix apps/web run test:tdd -- src/lib/features/bible/bible-reader.test.ts`; RED: módulo `./bible-reader` ausente                  | Pending         | Pending            |
| US-001, US-002, FR-001, NFR-001, NFR-002, AC-005                 | AC-005 na seção 6 | `apps/web/src/lib/features/bible/bible-reader.test.ts`, caso com marcador `SPECSFY:`      | `npm --prefix apps/web run test:tdd -- src/lib/features/bible/bible-reader.test.ts`; RED: módulo `./bible-reader` ausente                  | Pending         | Pending            |
| US-001, US-002, FR-001, FR-002, FR-003, NFR-001, NFR-002, AC-006 | AC-006 na seção 6 | `apps/web/src/routes/bible-reader.svelte.spec.ts`, caso com marcador `SPECSFY:`           | `npm --prefix apps/web run test:tdd -- src/routes/bible-reader.svelte.spec.ts`; RED: os dois casos encontraram o placeholder `ProductPage` | Pending         | Pending            |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD                                    | Nível                 | Arquivo/comando esperado                                                                                       | Evidência                                                                                                         |
| --------- | ---------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| FR-001    | AC-001, AC-005, AC-006                         | Unidade/integração    | `apps/web/src/lib/features/bible/bible-reader.test.ts`; `bun run --cwd apps/web test:tdd`                      | Passed: catálogo OpenLP, variação sem `abbreviation`, schema incompatível, diagnóstico parcial e regressão 50/50. |
| FR-002    | AC-001, AC-002, AC-003, AC-006                 | Unidade/browser       | `apps/web/src/lib/features/bible/bible-reader.test.ts`; `apps/web/src/routes/bible-reader.svelte.spec.ts`      | Passed: capítulos ordenados, navegação, limites e estados browser na regressão 50/50.                             |
| FR-003    | AC-003, AC-004, AC-006                         | Unidade/browser       | `apps/web/src/lib/features/bible/reader-preference.test.ts`; `apps/web/src/routes/bible-reader.svelte.spec.ts` | Passed: preferência válida, busca limitada/parametrizada e retomada na regressão 50/50.                           |
| NFR-001   | AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 | Browser/inspeção      | `bun run --cwd apps/web test:tdd`; viewports 320px/1440px                                                      | Passed: Chromium validou labels, foco, estados, limites e ausência de overflow nos dois viewports.                |
| NFR-002   | AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 | Unidade/browser/build | `bun run --cwd apps/web test:tdd`; `bun run --cwd apps/web build`                                              | Passed: 50/50, build Cloudflare e consultas locais parametrizadas sem endpoint de conteúdo.                       |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — 2026-09-01.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0003-leitor-biblia-sqlite/spec.md --allow-draft`, `node .agents/skills/specsfy-03-specify/scripts/load_research.mjs specs/draft/0003-leitor-biblia-sqlite/spec.md` e revisão PROD/ARCH/SEC conforme as lentes do Specsfy.
- **Achados**: Nenhum BLOCKER ou WARNING; 2 US, 3 FR, 2 NFR e 6 AC; cada US/FR/NFR cobre pelo menos 3 AC; R-001 e R-002 verificados com evidência local.

#### Gate do Ato II — Plano

- **Resultado**: Passed — 2026-09-01.
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/draft/0003-leitor-biblia-sqlite/spec.md --allow-draft` e `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/draft/0003-leitor-biblia-sqlite/spec.md .`.
- **Achados**: `validate_tasks` válido com 6 predecessores TDD concluídos; cobertura dos 13 IDs atuais confirmada. Os marcadores órfãos pertencem a specs anteriores e não são requisitos desta fatia.

#### Gate do Ato III — Entrega

- **Resultado**: Passed — 2026-09-01.
- **Comando**: `bun run --cwd apps/web test:tdd`, `bun run --cwd apps/web check-types`, `bun run --cwd apps/web lint`, `bun run --cwd apps/web build`, `bunx prettier --check` direcionado, `node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --check`, `node .agents/skills/specsfy-06-tdd-bdd/scripts/verify_acceptance.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md .`, `node .agents/skills/specsfy-07-implement/scripts/verify_evidence.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md .`, `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md /tmp/opencode/reader-trace-tests --full-chain` e `node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project /home/claudio/Projects/openbible-worksplace --check`.
- **Achados**: 50/50 testes em 14 arquivos, aceite QA aprovado para AC-001 a AC-006, evidência estrita aprovada, rastreabilidade da fatia 13/13, documentação e monitor atuais. Lint sem erros, com warnings `prefer-const` nos primitives locais e componentes existentes; a varredura da raiz mantém somente marcadores históricos de `0002` fora desta spec.

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Derivar o teste do AC-001 para catálogo, schema e primeira leitura em `apps/web/src/lib/features/bible/bible-reader.test.ts` — Refs: US-001, FR-001, FR-002, NFR-001, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler AC-001, confirmar o schema OpenLP mínimo e preparar bytes SQLite determinísticos.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-001 FR-001 FR-002 NFR-001 NFR-002 AC-001`, sem `.feature`.
  - [x] **VERIFY**: Observar RED pela ausência do leitor SQLite.
  - [x] **VISUAL**: Não aplicável; o caso prova parser e catálogo sem renderizar interface.
  - [x] **EVIDENCE**: Registrar comando e causa do RED na seção 11.
  - [x] **IMPROVE**: Manter o fixture mínimo e reutilizável.

- [x] T002 [TEST] [TDD] [US-001] Derivar o teste do AC-002 para seleção de livro/capítulo em `apps/web/src/lib/features/bible/bible-reader.test.ts` — Refs: US-001, US-002, FR-001, FR-002, NFR-001, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler AC-002 e confirmar consulta somente do capítulo selecionado.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-001 US-002 FR-001 FR-002 NFR-001 NFR-002 AC-002`.
  - [x] **VERIFY**: Observar RED pela ausência das consultas de capítulo.
  - [x] **VISUAL**: Não aplicável; o caso não renderiza interface.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Fixar ordem numérica diferente da ordem de inserção.

- [x] T003 [TEST] [TDD] [US-001] Derivar o teste do AC-003 para preferência e limites em `apps/web/src/lib/features/bible/reader-preference.test.ts` — Refs: US-001, US-002, FR-002, FR-003, NFR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler AC-003 e confirmar seleção válida, persistência e limites.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-001 US-002 FR-002 FR-003 NFR-001 NFR-002 AC-003`.
  - [x] **VERIFY**: Observar RED pela ausência da preferência do leitor.
  - [x] **VISUAL**: Não aplicável; o caso prova armazenamento local.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Rejeitar referências inválidas em vez de corrigir silenciosamente qualquer número.

- [x] T004 [TEST] [TDD] [US-002] Derivar o teste do AC-004 para busca parametrizada e limite em `apps/web/src/lib/features/bible/bible-reader.test.ts` — Refs: US-002, FR-003, NFR-001, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler AC-004 e confirmar referência, trecho e máximo de 50 resultados.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-002 FR-003 NFR-001 NFR-002 AC-004`.
  - [x] **VERIFY**: Observar RED pela ausência da busca.
  - [x] **VISUAL**: Não aplicável; o caso prova consulta local.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Usar termo com caracteres SQL para provar parametrização.

- [x] T005 [TEST] [TDD] [US-001] Derivar o teste do AC-005 para diagnóstico isolado em `apps/web/src/lib/features/bible/bible-reader.test.ts` — Refs: US-001, US-002, FR-001, NFR-001, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler AC-005 e preparar um SQLite sem tabelas OpenLP junto de um válido.
  - [x] **EXECUTE**: Escrever o caso Vitest com marcador próprio `SPECSFY: US-001 US-002 FR-001 NFR-001 NFR-002 AC-005`.
  - [x] **VERIFY**: Observar RED porque a descoberta ainda não existe.
  - [x] **VISUAL**: Não aplicável; o caso prova diagnóstico de fonte.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Assegurar que um erro não interrompe a iteração das fontes.

- [x] T006 [TEST] [TDD] [US-001] Derivar o teste browser do AC-006 para vazio, erro e retorno em `apps/web/src/routes/bible-reader.svelte.spec.ts` — Refs: US-001, US-002, FR-001, FR-002, FR-003, NFR-001, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler AC-006 e confirmar textos acessíveis, ação de retorno e ausência de controles quebrados.
  - [x] **EXECUTE**: Escrever o caso Vitest Browser com marcador próprio `SPECSFY: US-001 US-002 FR-001 FR-002 FR-003 NFR-001 NFR-002 AC-006`.
  - [x] **VERIFY**: Observar RED porque `/bible` ainda renderiza somente o placeholder.
  - [x] **VISUAL**: Não aplicável; a composição será revisada após o teste existir.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Selecionar mensagens por nome acessível em vez de classes.

#### Fase 2 — US-001 e US-002 (P1)

**Objetivo**: tornar `/bible` um leitor local de SQLite OpenLP com navegação, busca e retomada.
**Teste independente**: `npm --prefix apps/web run test:tdd` passa com unidade, integração fake e browser dos AC-001 a AC-006.

- [x] T007 [CODE] [US-001] Expor a listagem de arquivos nos adaptadores em `apps/web/src/lib/storage/types.ts`, `apps/web/src/lib/storage/local-storage.ts` e `apps/web/src/lib/storage/opfs-storage.ts` — Refs: US-001, FR-001, NFR-002, AC-001, AC-005, AC-006 — Depends: T001, T005, T006
  - [x] **PREP**: Confirmar RED dos testes de descoberta e a preservação das duas implementações de storage.
  - [x] **EXECUTE**: Implementar `listFiles(path)` para arquivos diretos, sem alterar escrita/leitura existentes.
  - [x] **VERIFY**: Executar typecheck e testes focais dos adaptadores; a suíte focal passou e o typecheck ficou bloqueado apenas pelos módulos RED de T008 ainda ausentes.
  - [x] **VISUAL**: Não aplicável; a tarefa altera somente infraestrutura local.
  - [x] **EVIDENCE**: Registrar arquivos, comando e IDs.
  - [x] **IMPROVE**: Ordenar nomes no adaptador para resultados determinísticos.

  <!-- specsfy:evidence {"task":"T007","refs":["US-001","FR-001","NFR-002","AC-001","AC-005","AC-006"],"files":["apps/web/src/lib/storage/types.ts","apps/web/src/lib/storage/local-storage.ts","apps/web/src/lib/storage/opfs-storage.ts"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/lib/storage/workspace.test.ts","exit":0}]} -->

- [x] T008 [CODE] [US-001] Implementar catálogo, parser OpenLP, capítulos e busca em `apps/web/src/lib/features/bible/bible-reader.ts` — Refs: US-001, US-002, FR-001, FR-002, FR-003, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — Depends: T001, T002, T003, T004, T005, T006, T007
  - [x] **PREP**: Confirmar todos os REDs de domínio e o contrato do schema documentado em R-001.
  - [x] **EXECUTE**: Implementar runtime `sql.js`, queries parametrizadas, fechamento de databases e diagnósticos por arquivo.
  - [x] **VERIFY**: Executar os testes unitários de Bíblia e typecheck; a suíte focal passou e o typecheck ficou bloqueado apenas pelo módulo de preferência de T009 ainda ausente.
  - [x] **VISUAL**: Não aplicável; a tarefa é a camada de leitura sem markup.
  - [x] **EVIDENCE**: Registrar GREEN, asset WASM e IDs.
  - [x] **IMPROVE**: Fechar cada database após extrair o catálogo somente quando a API de capítulo usar uma abertura controlada, evitando vazamento de memória.

  <!-- specsfy:evidence {"task":"T008","refs":["US-001","US-002","FR-001","FR-002","FR-003","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006"],"files":["apps/web/src/lib/features/bible/bible-reader.ts","apps/web/static/sql-wasm.wasm"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- src/lib/features/bible/bible-reader.test.ts src/lib/storage/workspace.test.ts","exit":0}]} -->

- [x] T009 [CODE] [US-001] Criar preferência e tela responsiva em `apps/web/src/lib/features/bible/reader-preference.ts`, `apps/web/src/lib/features/bible/BibleReader.svelte` e `apps/web/src/routes/bible/+page.svelte` — Refs: US-001, US-002, FR-001, FR-002, FR-003, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — Depends: T003, T004, T006, T008
  - [x] **PREP**: Confirmar stack Svelte, `ProductPage` afetado, shell, states, labels, navegação e revisão visual definidos na seção 10.
  - [x] **EXECUTE**: Compor loading, vazio, erro parcial/total, selects, busca, leitura, navegação e retomada sem duplicar o shell.
  - [x] **VERIFY**: Exercitar testes browser, teclado, foco, busca, retorno e limites.
  - [x] **VISUAL**: Conferido em Vitest Browser/Chromium nos viewports 320px/1440px, com claro/escuro por tokens, bordas, espaçamentos, margens, padding, tipografia, foco, controles, leitura, safe area e ausência de overflow; texto longo usa quebra normal.
  - [x] **EVIDENCE**: Registrar arquivos, estados, viewports e resultado.
  - [x] **IMPROVE**: Manter a página como coordenadora, concentrar consultas no módulo de domínio e conectar retry também quando a criação do storage falhar.
  <!-- specsfy:evidence {"task":"T009","refs":["US-001","US-002","FR-001","FR-002","FR-003","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006"],"files":["apps/web/src/lib/features/bible/reader-preference.ts","apps/web/src/lib/features/bible/BibleReader.svelte","apps/web/src/routes/bible/+page.svelte"],"commands":[{"run":"npm --prefix apps/web run check-types","exit":0},{"run":"npm --prefix apps/web run test:tdd -- src/lib/features/bible/reader-preference.test.ts src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

#### Fase de interface

- [x] T010 [DOC] [US-001] Atualizar `INTERFACE.md` com `BibleReader`, controles e lista de versículos — Refs: US-001, US-002, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003, AC-004, AC-006 — Depends: T009
  - [x] **PREP**: Conferir blocos reais, API, estados, consumidores e revisão visual da tela.
  - [x] **EXECUTE**: Registrar origem própria, reuso, labels, teclado, estados e arquivos consumidores.
  - [x] **VERIFY**: Comparar o registro com a tela e o shell real.
  - [x] **VISUAL**: Registrar a conferência em 320px/1440px, claro/escuro, bordas, espaçamentos, margens, padding, tipografia, estados percorridos, ajustes e resultado visual.
  - [x] **EVIDENCE**: Registrar o diff documental e IDs.
  - [x] **IMPROVE**: Evitar criar um primitive paralelo enquanto os controles nativos atendem a leitura.
  <!-- specsfy:evidence {"task":"T010","refs":["US-001","US-002","FR-002","FR-003","NFR-001","AC-001","AC-002","AC-003","AC-004","AC-006"],"files":["INTERFACE.md"],"commands":[{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md","exit":0}]} -->

#### Fase final — Qualidade

- [x] T011 [DOC] [US-001] Atualizar `.specsfy/DATABASE.md`, `PROJECT.md` e reconstruir `docs/`/`.specsfy/PACKAGES.md` — Refs: US-001, US-002, FR-001, FR-002, FR-003, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — Depends: T007, T008, T009, T010
  - [x] **PREP**: Ler o documentator e o auxiliar de banco; conferir que a mudança é leitura de SQLite importado, sem migration.
  - [x] **EXECUTE**: Executar auxiliares e `$specsfy-documentator`, preservando conteúdo humano fora dos blocos gerenciados.
  - [x] **VERIFY**: Executar builders com `--check` e o monitor de contexto.
  - [x] **VISUAL**: Não aplicável; esta tarefa projeta documentação, sem alterar a tela.
  - [x] **EVIDENCE**: Registrar arquivos gerados e comandos aprovados.
  - [x] **IMPROVE**: Manter o mapa de dados explícito sobre leitura externa local e ausência de escrita no índice.

  <!-- specsfy:evidence {"task":"T011","refs":["US-001","US-002","FR-001","FR-002","FR-003","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006"],"files":[".specsfy/DATABASE.md","PROJECT.md","docs/README.md",".specsfy/PACKAGES.md"],"commands":[{"run":"node .agents/skills/specsfy-aux-database/scripts/update_database.mjs --project /home/claudio/Projects/openbible-worksplace","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]} -->

- [x] T012 [TEST] [US-001] Executar regressão, rastreabilidade e gates em `apps/web` e na spec — Refs: US-001, US-002, FR-001, FR-002, FR-003, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — Depends: T007, T008, T009, T010, T011
  - [x] **PREP**: Identificar Vitest, typecheck, lint, build, Prettier, validadores, rastreabilidade, documentator e monitor.
  - [x] **EXECUTE**: Executar `bun run --cwd apps/web test:tdd` (50/50), `check-types`, `lint` e `build` sem usar banco de desenvolvimento; validar AC-001 a AC-006.
  - [x] **VERIFY**: `validate_spec`, `validate_tasks`, `verify_evidence`, `verify_acceptance` e rastreabilidade isolada da fatia passaram; nenhum teste foi pulado e não há placeholder na rota `/bible`. A varredura da raiz também foi conferida e reporta somente marcadores históricos de `0002` fora desta spec.
  - [x] **VISUAL**: Repassado com Vitest Browser/Chromium em 320x900 e 1440x900, incluindo claro/escuro por tokens, bordas, espaçamentos, margens, padding, tipografia, loading, vazio, erro parcial, leitura, texto longo, foco, controles, limites e ausência de overflow; nenhum ajuste adicional foi necessário.
  - [x] **EVIDENCE**: Regressão em 14 arquivos e 50 testes, typecheck e build passaram; lint passou com warnings `prefer-const` nos primitives locais e componentes existentes, Prettier direcionado passou, documentator `--check` e monitor retornaram sucesso.
  - [x] **IMPROVE**: Mantida a melhoria segura de usar Bun nos checks e rastreabilidade isolada da feature; os marcadores históricos não foram removidos nem alterados.

<!-- specsfy:evidence {"task":"T012","refs":["US-001","US-002","FR-001","FR-002","FR-003","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006"],"files":["apps/web/src/lib/features/bible/bible-reader.test.ts","apps/web/src/lib/features/bible/reader-preference.test.ts","apps/web/src/routes/bible-reader.svelte.spec.ts","apps/web/src/lib/features/bible/bible-reader.ts","apps/web/src/lib/features/bible/reader-preference.ts","apps/web/src/lib/features/bible/BibleReader.svelte","apps/web/src/routes/bible/+page.svelte","docs/README.md",".specsfy/PACKAGES.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bun run --cwd apps/web lint","exit":0},{"run":"bun run --cwd apps/web build","exit":0},{"run":"bunx prettier --check apps/web/src/lib/features/bible/bible-reader.ts apps/web/src/lib/features/bible/bible-reader.test.ts apps/web/src/lib/features/bible/reader-preference.ts apps/web/src/lib/features/bible/reader-preference.test.ts apps/web/src/lib/features/bible/BibleReader.svelte apps/web/src/lib/storage/types.ts apps/web/src/lib/storage/local-storage.ts apps/web/src/lib/storage/opfs-storage.ts apps/web/src/routes/bible/+page.svelte apps/web/src/routes/bible-reader.svelte.spec.ts INTERFACE.md PROJECT.md .specsfy/DATABASE.md specs/in-progress/0003-leitor-biblia-sqlite/spec.md","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0},{"run":"node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md --allow-draft","exit":0},{"run":"node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md --allow-draft","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/verify_acceptance.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md .","exit":0},{"run":"node .agents/skills/specsfy-07-implement/scripts/verify_evidence.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md .","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0003-leitor-biblia-sqlite/spec.md /tmp/opencode/reader-trace-tests --full-chain","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]}
-->

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003/T004/T005/T006 → T007 → T008 → T009 → T010/T011 → T012.
- Tarefas paralelas: T001, T002, T003, T004 e T005 podem materializar testes unitários independentes; T006 depende do contrato visual, mas não compartilha produção.
- Estratégia de MVP: primeiro abrir um SQLite OpenLP e renderizar um capítulo; depois adicionar navegação, busca, retomada e estados de falha antes de fechar documentação e regressão.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Workspace configurado pela spec 0001 e com `WorkspaceStorage` funcional.
- Browser com OPFS ou File System Access API conforme o backend selecionado.
- `sql.js` 1.14.2, `@types/sql.js` 1.4.11 e asset `sql-wasm.wasm` disponíveis no build.
- SQLite importado segue as tabelas e colunas mínimas OpenLP observadas em R-001.

#### Riscos

- Banco grande pode pressionar memória WASM → fechar instâncias quando não forem necessárias e limitar busca a 50 resultados.
- Schema divergente pode gerar falso suporte → validar tabelas/colunas antes de incluir a versão e exibir diagnóstico.
- APIs de storage podem falhar → preservar estados recuperáveis e não tratar ausência de catálogo como sucesso.
- Tipografia de texto longo pode causar overflow → coluna fluida, quebra normal e inspeção mobile.

#### Suposições

- A pasta `bibles/` contém arquivos diretos, sem subpastas, conforme o importador atual.
- O nome do arquivo é um identificador estável suficiente para esta sessão; metadado de título é opcional.
- A leitura inicial pode usar a primeira versão/livro/capítulo ordenados quando não houver preferência válida.
- Os SQLite importados são imutáveis durante a sessão do leitor; mudanças externas exigem recarregar o catálogo.

### 17. Decisões

- **DEC-001**: usar `sql.js` no browser — é a menor dependência já compatível com consultas SQLite locais e evita servidor ou upload de conteúdo.
- **DEC-002**: manter a fonte de leitura nos arquivos importados e não no `.openbible/index.sqlite` — respeita Files over app e evita criar schema auxiliar antes de haver necessidade.
- **DEC-003**: aceitar apenas o schema OpenLP `book`/`verse` com validação explícita — reduz consultas ambíguas e torna incompatibilidade recuperável.
- **DEC-004**: combinar selects nativos e controles compactos na própria página — preserva acessibilidade e reduz dependências, enquanto acompanha a densidade útil observada na referência.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários AC-001 a AC-006 passam.
- [x] Todos os requisitos FR-001 a FR-003 e NFR-001 a NFR-002 possuem evidência atual.
- [x] Arquivos OpenLP válidos são lidos em `bibles/` sem alterar os SQLite.
- [x] Catálogo, capítulo, navegação, busca, retomada, vazio e erro são testados.
- [x] Interface foi revisada em 320px/1440px e claro/escuro.
- [x] `INTERFACE.md`, `PROJECT.md`, `.specsfy/DATABASE.md`, `docs/` e `.specsfy/PACKAGES.md` representam o estado entregue.
- [x] Todas as tarefas da seção 14 estão concluídas.
- [x] Testes TDD/browser, typecheck, lint, build e Prettier disponíveis passam, salvo bloqueio preexistente documentado.
