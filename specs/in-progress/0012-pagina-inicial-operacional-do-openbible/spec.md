# Especificação integrada: Página inicial operacional do OpenBible

| Campo                  | Valor                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formato                | Specsfy/2.0                                                                                                                                                                      |
| ID                     | SPEC-0012                                                                                                                                                                        |
| Slug                   | 0012-pagina-inicial-operacional-do-openbible                                                                                                                                     |
| Status                 | Implementing |
| Effort                 | 5                                                                                                                                                                                |
| Effort updated at      | 2026-09-04                                                                                                                                                                       |
| Effort rationale       | Home com continuidade (leitura, notas, destaques), mudança de shell e remoção de preferência com migração; sem módulo novo, com testes Vitest e revisão visual. Perfil standard. |
| ClickUp Task           |                                                                                                                                                                                  |
| Milestones             |                                                                                                                                                                                  |
| Definition Gate        | Passed                                                                                                                                                                           |
| Plan Gate              | Passed                                                                                                                                                                           |
| Delivery Gate          | In Progress                                                                                                                                                                      |
| Evidence Contract      | 1                                                                                                                                                                                |
| Interface para pessoas | Sim                                                                                                                                                                              |
| Atualizada em          | 2026-09-05                                                                                                                                                                       |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A rota `/` do OpenBible atua apenas como seletor (`InitialScreenPicker`) com redirecionamento automático por `initialRoute`. Após configurar o workspace, a pessoa não retoma de onde parou: última leitura, notas recentes e destaques exigem navegação manual por `/bible`, `/notes` e `/highlights`.

#### Resultado desejado

A rota `/` passa a ser a home operacional: sem redirecionamento automático, exibe Continuar leitura, ações rápidas por tarefa e recentes reais, dentro do shell persistente com Início primeiro. Sem workspace, mantém o onboarding. A preferência `initialRoute` deixa de existir.

#### Métricas de sucesso

- Abrir `/` com workspace pronto exibe a home sem navegar para outra rota em 100% das visitas com ou sem `initialRoute` legada.
- Continuar leitura leva à passagem salva (`readerSelection` ou último destaque) com um gesto a partir da home.
- Recentes de notas e destaques abrem o destino correto com um gesto.
- Nenhum erro de storage impede a exibição do shell; seções falhas mostram retry localizado.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001**: Comportamento atual da `/` → verificado em `apps/web/src/routes/+page.svelte`: onboarding quando sem workspace, redirect via `preferredHomeRoute()` quando há `initialRoute`, senão seletor com `InitialScreenPicker`. Impacto: remover redirect e seletor da `/`.
- **R-002**: Preferência `initialRoute` → verificado em `apps/web/src/lib/navigation/home-preference.ts` e `.specsfy/DATABASE.md`: valores `bible` ou `sermons`, cache em `localStorage`, fonte em `.openbible/preferences.json`. Impacto: remover leitura, escrita e UI em `/config`.
- **R-003**: Fontes de continuidade → `readerSelection` em `.openbible/preferences.json`, notas em `notes/*.md`, destaques em `reader_highlight` via `listAllReaderHighlights`. Impacto: home consome essas três fontes sem criar schema novo.

#### Fontes e contexto consultados

- `apps/web/src/routes/+page.svelte`
- `apps/web/src/lib/features/navigation/InitialScreenPicker.svelte`
- `apps/web/src/lib/navigation/home-preference.ts`
- `apps/web/src/lib/features/workspace/workspace-state.svelte`
- `apps/web/src/lib/features/workspace/AppFrame.svelte`
- `apps/web/src/lib/features/navigation/AppSidebar.svelte`
- `specs/inbox/2026-09-04-022722-repensar-a-pagina-inicial.md`
- `specs/backlog/0012-repensar-a-pagina-inicial-como-entrada-operacional.md`
- `specs/backlog/0002-tela-inicial-navegacao.md` e `specs/completed/0002-tela-inicial-navegacao/spec.md`
- `PROJECT.md`, `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`

#### Documentação consultada

- Nenhuma fonte externa consultada; decisões derivam do código e dos contextos locais acima.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo.

#### Dúvidas respondidas

- **Q**: Qual o papel da `/` com workspace pronto? → **A**: Home operacional sem redirecionamento automático.
- **Q**: Quais blocos? → **A**: Continuar leitura, ações rápidas (Ler, Nova nota, Novo sermão) e recentes reais.
- **Q**: Comportamento sem workspace? → **A**: Mantém onboarding; home só após workspace pronto.
- **Q**: Destino da preferência? → **A**: Remover `initialRoute`, redirect e seção em `/config`; valor legado tratado como ausente.
- **Q**: Navegação? → **A**: Shell persistente com Início (`/`) primeiro.
- **Q**: Composição e estados? → **A**: `PageHeader` + Continuar + ações + recentes; skeleton, vazio orientado, erro com retry.
- **Q**: Recentes de Sermões/Estudos placeholder? → **A**: Somente dados reais (notas, destaques, leitura); sermões/estudos como atalhos.
- **Q**: Origem do Continuar? → **A**: `readerSelection` com fallback para último destaque.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Nova home operacional em `/` sem redirect, com Continuar leitura, ações rápidas e recentes reais.
- Shell persistente após workspace pronto com Início (`/`) como primeiro item no desktop e no mobile.
- Remoção de `initialRoute`: redirect em `/`, seção Tela inicial em `/config`, utilitários de leitura/escrita e migração de valor legado como ausente.
- `/config` responsiva: container desktop mais amplo com navegação vertical lateral; no mobile, a navegação permanece como índice e subpáginas; a seção Sobre apresenta logo, badge de versão e informações do projeto com link do repositório.
- Estados loading (skeleton), vazio orientado e erro com retry por seção.
- Responsivo, teclado completo, claro/escuro e `prefers-reduced-motion`.
- Testes Vitest e atualização de `INTERFACE.md` e contextos afetados.

#### Fora de escopo

- Construtor de sermões, conteúdo funcional de estudos, biblioteca de textos além do deep-link de Continuar.
- Autenticação, colaboração, sincronização, backup e dados remotos.
- Mudança no leitor além de receber o destino do Continuar.
- Novo schema de banco; `index.sqlite` permanece auxiliar sem migração.

#### Atores

- **Pessoa usuária individual**: usa a home para retomar leitura e alcançar notas, destaques, Bíblia e sermões. Sem conta, sem permissões por papel; dados locais.

### 4. Princípios e restrições do projeto

- **PR-001**: Manter SvelteKit e Svelte com shadcn-svelte como base; não introduzir React ou nova biblioteca de UI.
- **PR-002**: Aplicar `DESIGNSYSTEM.MD` e o guideline de qualidade (Geist, superfícies contínuas, hierarquia tipográfica, foco visível, contenção visual).
- **PR-003**: Markdown com YAML frontmatter como fonte de notas e sermões; SQLite local apenas para índices, destaques e dados auxiliares.
- **PR-004**: Preferências em `.openbible/preferences.json`; `localStorage` apenas como cache de primeiro paint.
- **PR-005**: PWA standalone com rotas locais utilizáveis sem rede após carregadas; sem promessa de sincronização.
- **PR-006**: Vitest para testes unitários e de componentes; sem uso do banco de desenvolvimento em testes.

### 5. Histórias de usuário

#### US-001 — Continuar a leitura a partir da home (P1)

Como pessoa usuária individual, quero retomar minha última passagem a partir da `/`, para continuar o estudo sem navegar manualmente.

**Por que P1**: É o valor central da home operacional e elimina o beco do seletor.
**Teste independente**: Com `readerSelection` salva, abrir `/` e ativar Continuar leva a `/bible` na passagem; sem seleção e com destaque, leva ao último destaque; sem ambos, mostra CTA Abrir a Bíblia.
**Requisitos**: FR-001, FR-002

#### US-002 — Agir e rever o recente pela home (P1)

Como pessoa usuária individual, quero ações rápidas e listas recentes reais na `/`, para criar nota, abrir a Bíblia ou rever notas e destaques.

**Por que P1**: Transforma a entrada em ponto de trabalho diário em vez de passagem.
**Teste independente**: Ativar cada ação navega ao destino; itens recentes abrem nota ou destaque; sem dados cada seção mostra vazio orientado.
**Requisitos**: FR-003, FR-004

#### US-003 — Entrar sempre pela home com navegação estável (P1)

Como pessoa usuária individual, quero que `/` sempre abra a home dentro do shell com Início, sem redirect por preferência, para ter uma entrada previsível.

**Por que P1**: Remove a imprevisibilidade do redirect e ancora a navegação.
**Teste independente**: Com e sem `initialRoute` legada, `/` renderiza a home; shell mostra Início primeiro; `/config` não oferece Tela inicial; onboarding precede a home sem workspace.
**Requisitos**: FR-005, FR-006

### 6. Cenários BDD de aceite

#### AC-001 — Home sem redirect com ações visíveis

**Cobre**: US-003, FR-005, FR-003, NFR-002

```gherkin
@US-003 @FR-005 @FR-003 @NFR-002 @AC-001
Feature: Entrada operacional da home

  Scenario: Abrir a home com workspace pronto e preferência legada
    Given workspace pronto e valor legado de tela inicial ainda gravado
    When a pessoa abre "/"
    Then vê a home operacional sem navegar para outra rota
    And vê as ações Ler a Bíblia, Nova nota e Novo sermão
```

#### AC-002 — Onboarding precede a home sem workspace

**Cobre**: US-003, FR-005, NFR-002, NFR-003

```gherkin
@US-003 @FR-005 @NFR-002 @NFR-003 @AC-002
Feature: Entrada operacional da home

  Scenario: Primeiro acesso sem workspace
    Given workspace ausente ou não configurado
    When a pessoa abre "/"
    Then passa pelo onboarding antes de ver qualquer bloco da home
    And nenhum dado local é exposto antes da configuração
```

#### AC-003 — Shell persistente com Início primeiro

**Cobre**: US-003, FR-005, FR-006, NFR-001

```gherkin
@US-003 @FR-005 @FR-006 @NFR-001 @AC-003
Feature: Navegação estável da home

  Scenario: Navegar com shell persistente
    Given workspace pronto em viewport desktop e em viewport mobile
    When a pessoa observa a navegação na home
    Then o shell está visível com Início como primeiro item seguido das áreas do produto
    And a rota atual é identificada por semântica e foco sem depender só de cor
```

#### AC-004 — Continuar via seleção salva

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-004
Feature: Continuar leitura da home

  Scenario: Retomar a seleção salva
    Given seleção de leitura salva em preferences com versão, livro, capítulo e intervalo
    When a pessoa ativa Continuar leitura na home
    Then abre "/bible" exatamente nessa passagem
```

#### AC-005 — Continuar via último destaque quando sem seleção

**Cobre**: US-001, FR-001, FR-002, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @NFR-002 @AC-005
Feature: Continuar leitura da home

  Scenario: Fallback para destaque
    Given nenhuma seleção salva e ao menos um destaque no workspace
    When a pessoa observa ou ativa Continuar leitura
    Then vê o último destaque como destino
    And ao ativar abre "/bible" nesse intervalo
```

#### AC-006 — Continuar vazio com CTA

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-006
Feature: Continuar leitura da home

  Scenario: Sem seleção nem destaque
    Given workspace pronto sem seleção e sem destaques
    When a pessoa vê Continuar leitura
    Then recebe estado vazio com orientação e ação Abrir a Bíblia
    And a ação é alcançável por teclado com nome acessível
```

#### AC-007 — Ações rápidas navegam

**Cobre**: US-002, FR-003, NFR-001

```gherkin
@US-002 @FR-003 @NFR-001 @AC-007
Feature: Ações rápidas da home

  Scenario: Atalhos por tarefa
    Given home operacional exibida
    When a pessoa ativa Ler a Bíblia, Nova nota ou Novo sermão
    Then navega para "/bible", "/notes" com criação e "/sermons" respectivamente
    And cada ação tem nome acessível e foco visível
```

#### AC-008 — Recentes reais com destino

**Cobre**: US-002, FR-003, FR-004, NFR-002

```gherkin
@US-002 @FR-003 @FR-004 @NFR-002 @AC-008
Feature: Recentes reais da home

  Scenario: Listas com dados
    Given notas e destaques existentes no workspace
    When a pessoa vê Recentes na home
    Then vê notas recentes e destaques recentes limitados com referência e data
    And cada item abre a nota ou o destaque correspondente
```

#### AC-009 — Recentes vazios e sem Bíblia

**Cobre**: US-002, FR-004, FR-002, NFR-001

```gherkin
@US-002 @FR-004 @FR-002 @NFR-001 @AC-009
Feature: Recentes reais da home

  Scenario: Workspace sem conteúdo exibível
    Given workspace pronto sem notas, sem destaques e sem Bíblia importada
    When a pessoa vê Recentes e Continuar
    Then cada seção mostra vazio com motivo, orientação e ação para começar
    And nenhuma seção simula sermão ou estudo pronto
```

#### AC-010 — Config sem Tela inicial

**Cobre**: US-003, FR-006, NFR-003

```gherkin
@US-003 @FR-006 @NFR-003 @AC-010
Feature: Remoção da preferência de tela inicial

  Scenario: Abrir configuração após a mudança
    Given workspace pronto
    When a pessoa abre "/config"
    Then não encontra seção, aba ou controle de Tela inicial
    And nenhum valor de tela inicial é gravado localmente
    And as demais seções são navegáveis pela navegação vertical lateral no desktop
    And a seção Sobre mostra o logo, a versão em badge e as informações do projeto com link para o repositório no GitHub
    And não mostra um rodapé redundante com a versão do aplicativo
```

#### AC-011 — Valor legado tratado como ausente

**Cobre**: US-003, FR-006, FR-005, NFR-003

```gherkin
@US-003 @FR-006 @FR-005 @NFR-003 @AC-011
Feature: Remoção da preferência de tela inicial

  Scenario: Migração silenciosa
    Given valor antigo de tela inicial ainda presente no armazenamento
    When a pessoa abre "/" ou "/config"
    Then nenhum redirect acontece e a home é exibida
    And o valor legado é ignorado ou limpo sem erro visível
```

#### AC-012 — Estados, teclado, temas e responsivo

**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @FR-004 @FR-005 @FR-006 @NFR-001 @NFR-002 @NFR-003 @AC-012
Feature: Qualidade transversal da home

  Scenario: Carregar, falhar e navegar por teclado nos dois temas
    Given home em carregamento e depois com falha parcial em uma seção
    When a pessoa usa teclado em tema claro e escuro, em 360px e em 1280px, com movimento reduzido
    Then cada seção mostra skeleton e depois conteúdo ou erro com retry localizado sem quebrar as demais
    And foco, ordem, nomes acessíveis, contraste e reflow permanecem corretos sem overflow
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve resolver Continuar leitura a partir de `readerSelection` em `.openbible/preferences.json` e, na ausência, usar o último destaque de `reader_highlight`.
- **FR-002**: O sistema deve exibir Continuar vazio com CTA Abrir a Bíblia quando não houver seleção nem destaque, e abrir `/bible` na passagem resolvida quando houver.
- **FR-003**: O sistema deve oferecer ações rápidas Ler a Bíblia (`/bible`), Nova nota (`/notes` com criação) e Novo sermão (`/sermons`) a partir da home.
- **FR-004**: O sistema deve listar recentes reais limitados de notas e destaques com referência e atualização, com navegação ao destino e vazio orientado sem simular módulos futuros.
- **FR-005**: O sistema deve exibir `/` como home operacional sem redirect, com onboarding quando sem workspace e shell persistente com Início primeiro após workspace pronto.
- **FR-006**: O sistema deve remover a preferência `initialRoute`: nenhum redirect, nenhuma UI em `/config`, nenhum salvamento novo, e valor legado tratado como ausente; `/config` deve manter navegação lateral vertical no desktop e uma seção Sobre com logo, badge de versão, informações do projeto e link para o repositório, sem rodapé redundante de versão.

#### Não funcionais

- **NFR-001**: Acessibilidade e responsivo: teclado completo, foco visível, nomes acessíveis, `aria-live` em feedback, contraste, reflow 320px a 1440px, zoom sem overflow e respeito a `prefers-reduced-motion`. **Verificação**: inspeção manual por teclado e zoom nos dois temas mais testes de componente para foco e semântica.
- **NFR-002**: Desempenho de entrada: render da home sem bloqueio remoto, skeleton imediato, listas limitadas e Continuar resolvido a partir de leitura local. **Verificação**: testes Vitest de carregamento e inspeção de que nenhuma chamada remota bloqueia a rota.
- **NFR-003**: Privacidade local: nenhum conteúdo de leitura, nota ou destaque sai do dispositivo por causa da home; preferência removida não deixa resíduo funcional. **Verificação**: inspeção de código das fontes consumidas e teste de que valor legado não altera navegação.

#### Erros e casos-limite

- Storage indisponível ou workspace em erro → home mostra erro recuperável com retry, shell preservado.
- `readerSelection` ilegível → tratar como ausente e aplicar fallback de destaque ou CTA.
- Falha ao listar notas ou destaques → apenas a seção falha, com retry; demais seções intactas.
- Sem Bíblia importada → Continuar e destaques caem em vazio orientado com ação Importar.
- `initialRoute` legada presente ou inválida → ignorar ou limpar, exibir home, nunca redirecionar.
- Sermões e estudos placeholder → apenas atalhos; recentes não inventam itens.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Monorepo Turborepo com SvelteKit 2.70.2, Svelte 5.56.9, TypeScript, Vite, Vitest, Playwright, Tailwind 4.3.3 e shadcn-svelte local estilo Nova em `apps/web`.
- Rota `/` em `apps/web/src/routes/+page.svelte` com onboarding, redirect por preferência e seletor `InitialScreenPicker`.
- Shell em `apps/web/src/lib/features/workspace/AppFrame.svelte` com `AppSidebar`, barra mobile, `ThemeToggle` e `NetworkStatus`.
- Preferência em `apps/web/src/lib/navigation/home-preference.ts` com cache `localStorage`.
- Continuidade em `.openbible/preferences.json` (`readerSelection`), `notes/*.md` e `reader_highlight` via `listAllReaderHighlights`.

#### Arquitetura e módulos

- Nova composição `HomePage` em `apps/web/src/lib/features/home/HomePage.svelte` coordena Continuar, ações e recentes; `/` em `+page.svelte` vira coordenadora fina que preserva onboarding e delega a home após workspace pronto.
- Novos blocos `ContinueReadingCard`, `QuickActions` e `RecentLists` sob `apps/web/src/lib/features/home/`; dados via adaptadores `home-continuation.ts` (seleção mais último destaque) e reuso de repositórios de notas e destaques existentes.
- `AppSidebar` e barra mobile ganham item Início (`/`) primeiro; visibilidade passa a depender de workspace pronto, não de preferência.
- Remoção de `InitialScreenPicker` da `/`, da seção Tela inicial em `ConfigPage` e dos usos de `home-preference.ts`; substitui leitura por ausência permanente com limpeza tolerante do legado. `ConfigPage` mantém navegação desktop vertical e About com marca, versão e informações do projeto.
- Sem mudança de adapter Cloudflare, PWA ou service worker além do consumo das rotas já cacheadas.

#### Migrations

- Não aplicável a banco; `index.sqlite` sem alteração de schema.
- Migração de preferência: tratar `openbible.initial-route` e `preferences.initialRoute` como ausentes; limpeza best-effort sem falhar a rota.

#### Models

- Sem model novo; reuso de tipos `readerSelection`, resumo de nota e linha de `reader_highlight` com ordenação por atualização e referência.

#### Controllers e casos de uso

- `resolveHomeContinuation(storage)`: entrada storage pronto; saída passagem resolvida ou vazio com motivo; sem autorização além do acesso local.
- `loadHomeRecents(storage, limit)`: entrada storage e limite; saída notas e destaques limitados; falha isolada por seção.
- Arquivos em `apps/web/src/lib/features/home/home-continuation.ts` e `home-recents.ts`.

#### Views e experiência

- `HomePage` com `PageHeader`, `ContinueReadingCard`, `QuickActions` e `RecentLists` em `apps/web/src/lib/features/home/`; estados skeleton, vazio, erro com retry e sucesso por seção.
- `/` mantém `OnboardingModal` quando sem workspace; após pronto renderiza shell mais home.
- Acessibilidade por teclado, `aria-live`, foco visível e `prefers-reduced-motion` desde o primeiro commit visual.

#### Queries e repositórios

- Reuso de leitura de `preferences.json`, listagem de notas Markdown e `listAllReaderHighlights` com limite aplicado em memória e ordenação por atualização e referência.
- Sem paginação na home; limites fixos pequenos por seção para entrada rápida.

#### Jobs e processamento assíncrono

- Não aplicável; sem jobs, filas ou consumers.

#### Estrutura de arquivos

```text
specs/in-progress/0012-pagina-inicial-operacional-do-openbible/
  spec.md
  research/
apps/web/src/routes/+page.svelte
apps/web/src/lib/features/home/HomePage.svelte
apps/web/src/lib/features/home/ContinueReadingCard.svelte
apps/web/src/lib/features/home/QuickActions.svelte
apps/web/src/lib/features/home/RecentLists.svelte
apps/web/src/lib/features/home/home-continuation.ts
apps/web/src/lib/features/home/home-recents.ts
apps/web/src/lib/features/navigation/AppSidebar.svelte
apps/web/src/lib/features/config/ConfigPage.svelte
```

### 9. Modelo de dados

#### Entidades

| Entidade               | Identidade                                         | Atributos e regras                                                      | Relações                                                          |
| ---------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Preferência de leitura | `readerSelection` em `.openbible/preferences.json` | Versão, livro, capítulo, início e fim; ilegível equivale a ausente      | 1 workspace tem 0 ou 1 seleção corrente                           |
| Nota recente           | Caminho em `notes/`                                | Título, atualização e identificador; somente ativas, sem lixeira        | N notas por workspace, ordenadas por atualização                  |
| Destaque recente       | Intervalo exato em `reader_highlight`              | Versão, livro, capítulo, início, fim e estilo; identidade é o intervalo | N destaques por workspace, ordenados por referência e atualização |

#### Estados e transições

| Entidade           | Estado atual | Evento                               | Próximo estado                    | Invariantes                       |
| ------------------ | ------------ | ------------------------------------ | --------------------------------- | --------------------------------- |
| Home               | Carregando   | Resolver continuidade e recentes     | Pronta, parcial ou erro por seção | Falha de seção não derruba a home |
| Continuar          | Ausente      | Seleção salva ou destaque encontrado | Resolvido ou vazio com CTA        | Ilegível equivale a ausente       |
| Preferência legada | Presente     | Abertura de `/` ou `/config`         | Ignorada ou limpa                 | Nunca redireciona                 |

#### Migração e retenção

- Sem migração de schema; preferência legada ignorada com limpeza tolerante; retenção de notas e destaques inalterada.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A entrega é a nova `/` com Continuar, ações e recentes, mais shell persistente e `/config` sem Tela inicial.

#### Stack e convenções de interface

- SvelteKit e Svelte 5 com componentes `.svelte`; roteamento em `apps/web/src/routes/`; shadcn-svelte local (`Item`, `Sidebar`, `Button`, `Skeleton`, `Empty`) sem introduzir React; Tailwind com tokens em `app.css`; Geist Sans para interface e Geist Mono para referências e identificadores; testes Vitest de componente e Playwright quando aplicável. Telas afetadas: `/`, `/config`, shell global. Fontes: `INTERFACE.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md` e código citado na seção 8.

#### Telas e responsabilidades

- `/` home operacional: retomar leitura, disparar ações por tarefa e rever recentes; entrada workspace pronto, saída navegação ao destino.
- `/config` sem Tela inicial: mantém Armazenamento, Bíblias, Estatísticas e Lembrete; sem controle de redirect.
- Shell global: navegação persistente com Início primeiro após workspace pronto.

#### Fluxo de informação e navegação

- Pessoa abre `/` → sem workspace passa pelo onboarding → com workspace vê shell mais home → Continuar abre `/bible` na passagem → ações abrem `/bible`, `/notes` e `/sermons` → recentes abrem nota ou destaque → retorno volta à home sem perder posição. Sem `Breadcrumb` dedicado na home porque o shell global ancora Início como contexto atual.

#### Menus e navegação principal

- Menu principal após workspace pronto: Sidebar no desktop com os itens Início (`/`), Bíblia (`/bible`), Notas (`/notes`), Destaques (`/highlights`), Sermões (`/sermons`), Estudos (`/study`) e Configuração (`/config`); barra inferior no mobile só com Início, Notas, Bíblia, Sermões e Configuração (Destaques sai da barra e segue acessível pela home e pela rota `/highlights`); cada item leva à rota destino correspondente e a tela atual usa `aria-current`; Início é o primeiro item; menu recolhível no desktop sem cortar rótulos e barra com áreas de toque e `safe-area` no mobile.

#### Formulários e ações

- Sem formulário novo; ações são links e botões nomeados na página com padrão de página, sem modal ou drawer. Erro de seção oferece retry próximo ao conteúdo.

#### Composição e disposição

- `PageHeader` com título orientado à tarefa e ação primária Continuar; seção Continuar em destaque contido; grade de ações rápidas; listas recentes em uma coluna no mobile e em colunas contidas no desktop até 1120px; superfícies transparentes até interação; sem gradientes, glows ou cards decorativos.

#### Blocos React e componentes selecionados

| Tela | Bloco React         | Responsabilidade                           | Arquivo previsto                                          | Componente ou composição   | Origem             | Reuso ou extensão                                           |
| ---- | ------------------- | ------------------------------------------ | --------------------------------------------------------- | -------------------------- | ------------------ | ----------------------------------------------------------- |
| /    | HomePage            | Coordenar Continuar, ações e recentes      | apps/web/src/lib/features/home/HomePage.svelte            | Próprio com PageHeader     | Próprio            | Novo, motivo: entrada operacional inexistente               |
| /    | ContinueReadingCard | Exibir e abrir a passagem resolvida ou CTA | apps/web/src/lib/features/home/ContinueReadingCard.svelte | Próprio com Button         | Próprio            | Novo, motivo: contrato próprio de continuidade              |
| /    | QuickActions        | Atalhos Ler, Nova nota e Novo sermão       | apps/web/src/lib/features/home/QuickActions.svelte        | Próprio com Item           | shadcn-svelte Item | Estende padrão de escolha sem duplicar seletor              |
| /    | RecentLists         | Listar notas e destaques com destino       | apps/web/src/lib/features/home/RecentLists.svelte         | Próprio com HighlightsList | Próprio            | Reusa HighlightsList, motivo: mesmo conjunto workspace-wide |

- Projeto Svelte: a tabela acima usa Bloco Svelte; shadcn-svelte fornece primitives e nenhuma composição ReUI é aplicável. Registrar blocos novos em `INTERFACE.md` com API, estados e consumidores.

#### Estados e acessibilidade

- Loading com skeleton próximo do conteúdo; vazio com motivo, orientação e ação; erro por seção com causa e retry; sucesso com navegação preservada; teclado completo com foco visível e ordem coerente; `aria-live` em feedback; contraste nos dois temas; reflow 320px a 1440px sem overflow; respeito a `prefers-reduced-motion`.

#### Contrato CRUD

- Sem CRUD nesta home: a tela reutiliza o `PageHeader` único do produto, não cria `DataGrid`, não exibe coluna `ID` e não oferece ações de editar e apagar; criação e edição permanecem delegadas a `/notes` e `/sermons`, e a home apenas navega para esses destinos.

#### Revisão visual durante o desenvolvimento

- Revisão visual durante a implementação confere bordas, espaçamentos, margens, padding, tipografia Geist, alinhamento, overflow, foco e quebra de texto em 360px e 1280px, nos temas claro e escuro, nos estados skeleton, vazio, erro e sucesso. Registra procedimento, viewports, estados, achados e ajustes na tarefa.

#### APIs expostas

- Nenhuma API remota nova; navegação por rotas locais `/`, `/bible`, `/notes`, `/highlights`, `/sermons`, `/study` e `/config`.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Nenhuma fonte externa; contratos derivam do armazenamento local existente.

#### Eventos e outros contratos

- Evento `openbible:home-route-changed` deixa de ser emitido pela `/`; consumidores passam a não depender de preferência. Sem outro contrato novo.

### 11. Estratégia TDD

- **Unidade**: resolução de Continuar com seleção, fallback de destaque e vazio; limite e ordenação de recentes; tratamento de preferência legada como ausente.
- **Integração/contrato**: `/` sem redirect com e sem legado; onboarding antes da home; shell com Início; `/config` sem Tela inicial.
- **BDD/aceite**: Gherkin da seção 6 orienta o desenho dos testes TDD sem arquivos `.feature`.
- **Runner TDD**: Vitest com `npm --prefix apps/web run test:tdd`; specs Svelte e TypeScript seguem práticas do Svelte.
- **E2E**: Não aplicável nesta fatia além de verificação manual das jornadas de Continuar e shell.
- **Verificação manual**: Teclado, zoom, temas e viewports 360px e 1280px, inevitável por natureza visual.

#### Evidência RED-GREEN-REFACTOR

| IDs                                                                                                       | BDD de referência | Teste TDD informado pelo BDD                                  | RED observado                                                                                                          | GREEN observado                                                                                                                                                                                                      | Refactor/regressão                                     |
| --------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| US-003, FR-005, FR-003, NFR-002, AC-001                                                                   | AC-001 na seção 6 | home-page.spec.ts com marcador próprio `SPECSFY:`             | RED em 2026-09-04: `HomePage.svelte` ausente                                                                           | GREEN em 2026-09-04 via TDD focal (1 teste); `/` renderiza a home sem navegar                                                                                                                                        | Sem refactor                                           |
| US-003, FR-005, NFR-002, NFR-003, AC-002                                                                  | AC-002 na seção 6 | home-entry.spec.ts com marcador próprio `SPECSFY:`            | RED em 2026-09-04: redirect automático presente                                                                        | GREEN em 2026-09-04 via TDD focal (1 teste); onboarding preservado sem redirect                                                                                                                                      | Sem refactor                                           |
| US-003, FR-005, FR-006, NFR-001, AC-003                                                                   | AC-003 na seção 6 | app-sidebar.spec.ts com marcador próprio `SPECSFY:`           | RED em 2026-09-04 via `npm --prefix apps/web run test:tdd -- app-sidebar.spec.ts`: `AppSidebar.svelte` sem item Início | GREEN em 2026-09-04 via `npm --prefix apps/web run test:tdd -- app-sidebar.spec.ts sidebar.test.ts` (2 arquivos, 2 testes)                                                                                           | Sem refactor; item segue padrão existente              |
| US-001, FR-001, NFR-002, AC-004                                                                           | AC-004 na seção 6 | home-continuation.spec.ts com marcador próprio `SPECSFY:`     | RED em 2026-09-04: `home-continuation.ts` ausente                                                                      | GREEN em 2026-09-04 via `npm --prefix apps/web run test:tdd -- home-continuation.spec.ts continue-reading-card.spec.ts` (2 arquivos, 3 testes); visual por inspeção de tokens e sem erros de tipo em `features/home` | Sem refactor                                           |
| US-001, FR-001, FR-002, NFR-002, AC-005                                                                   | AC-005 na seção 6 | home-continuation.spec.ts com marcador próprio `SPECSFY:`     | RED em 2026-09-04: fallback de destaque ausente                                                                        | GREEN em 2026-09-04 no mesmo comando de AC-004; fallback com `try/catch` para vazio                                                                                                                                  | Sem refactor                                           |
| US-001, FR-002, NFR-001, AC-006                                                                           | AC-006 na seção 6 | continue-reading-card.spec.ts com marcador próprio `SPECSFY:` | RED em 2026-09-04: `ContinueReadingCard.svelte` ausente                                                                | GREEN em 2026-09-04 no mesmo comando de AC-004; card com `Empty`, CTA nomeado e foco visível herdado                                                                                                                 | Sem refactor                                           |
| US-002, FR-003, NFR-001, AC-007                                                                           | AC-007 na seção 6 | quick-actions.spec.ts com marcador próprio `SPECSFY:`         | RED em 2026-09-04: `QuickActions.svelte` ausente                                                                       | GREEN em 2026-09-04 via TDD focal (1 teste); ações com nomes acessíveis e foco visível                                                                                                                               | Sem refactor                                           |
| US-002, FR-003, FR-004, NFR-002, AC-008                                                                   | AC-008 na seção 6 | home-recents.spec.ts com marcador próprio `SPECSFY:`          | RED em 2026-09-04: `home-recents.ts` ausente                                                                           | GREEN em 2026-09-04 via TDD focal (1 teste); limites fixos e falha isolada por seção                                                                                                                                 | Sem refactor                                           |
| US-002, FR-004, FR-002, NFR-001, AC-009                                                                   | AC-009 na seção 6 | recent-lists.spec.ts com marcador próprio `SPECSFY:`          | RED em 2026-09-04: `RecentLists.svelte` ausente                                                                        | GREEN em 2026-09-04 via TDD focal (1 teste); vazio orientado sem simular módulos                                                                                                                                     | Sem refactor                                           |
| US-003, FR-006, NFR-003, AC-010                                                                           | AC-010 na seção 6 | config-page.spec.ts com marcador próprio `SPECSFY:`           | RED em 2026-09-04: aba Tela inicial presente                                                                           | GREEN em 2026-09-04 via TDD focal (1 teste); aba, seção mobile e seletor removidos                                                                                                                                   | Removido `InitialScreenPicker.svelte` sem uso restante |
| US-003, FR-006, FR-005, NFR-003, AC-011                                                                   | AC-011 na seção 6 | home-preference.spec.ts com marcador próprio `SPECSFY:`       | RED em 2026-09-04: legado `bible` ainda redireciona                                                                    | GREEN em 2026-09-04 via TDD focal (1 teste) mais `home-preference.test.ts` e `preferences.test.ts` (8 testes); leitura sempre nula com limpeza tolerante                                                             | Teste antigo atualizado para o novo contrato           |
| US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-012 | AC-012 na seção 6 | home-states.spec.ts com marcador próprio `SPECSFY:`           | RED em 2026-09-04: `HomePage.svelte` sem skeleton e retry                                                              | GREEN em 2026-09-04 via TDD focal (1 teste); skeleton, erro com retry por seção, `aria-live`, foco visível e `prefers-reduced-motion`; corrigido `aria-labelledby` órfão no card                                     | 12 arquivos e 15 testes verdes no escopo da home       |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível      | Arquivo/comando esperado                                                                                                             | Evidência |
| --------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| FR-005    | AC-001      | Componente | apps/web/src/lib/features/home/home-page.spec.ts / `npm --prefix apps/web run test:tdd -- home-page.spec.ts`                         | Pending   |
| FR-005    | AC-002      | Componente | apps/web/src/lib/features/home/home-entry.spec.ts / `npm --prefix apps/web run test:tdd -- home-entry.spec.ts`                       | Pending   |
| FR-005    | AC-003      | Componente | apps/web/src/lib/features/navigation/app-sidebar.spec.ts / `npm --prefix apps/web run test:tdd -- app-sidebar.spec.ts`               | Pending   |
| FR-001    | AC-004      | Unidade    | apps/web/src/lib/features/home/home-continuation.spec.ts / `npm --prefix apps/web run test:tdd -- home-continuation.spec.ts`         | Pending   |
| FR-001    | AC-005      | Unidade    | apps/web/src/lib/features/home/home-continuation.spec.ts / `npm --prefix apps/web run test:tdd -- home-continuation.spec.ts`         | Pending   |
| FR-002    | AC-006      | Componente | apps/web/src/lib/features/home/continue-reading-card.spec.ts / `npm --prefix apps/web run test:tdd -- continue-reading-card.spec.ts` | Pending   |
| FR-003    | AC-007      | Componente | apps/web/src/lib/features/home/quick-actions.spec.ts / `npm --prefix apps/web run test:tdd -- quick-actions.spec.ts`                 | Pending   |
| FR-004    | AC-008      | Unidade    | apps/web/src/lib/features/home/home-recents.spec.ts / `npm --prefix apps/web run test:tdd -- home-recents.spec.ts`                   | Pending   |
| FR-004    | AC-009      | Componente | apps/web/src/lib/features/home/recent-lists.spec.ts / `npm --prefix apps/web run test:tdd -- recent-lists.spec.ts`                   | Pending   |
| FR-006    | AC-010      | Componente | apps/web/src/lib/features/config/config-page.spec.ts / `npm --prefix apps/web run test:tdd -- config-page.spec.ts`                   | Pending   |
| FR-006    | AC-011      | Unidade    | apps/web/src/lib/navigation/home-preference.spec.ts / `npm --prefix apps/web run test:tdd -- home-preference.spec.ts`                | Pending   |
| FR-001    | AC-012      | Componente | apps/web/src/lib/features/home/home-states.spec.ts / `npm --prefix apps/web run test:tdd -- home-states.spec.ts`                     | Pending   |
| NFR-001   | AC-003      | Componente | apps/web/src/lib/features/navigation/app-sidebar.spec.ts / `npm --prefix apps/web run test:tdd -- app-sidebar.spec.ts`               | Pending   |
| NFR-001   | AC-006      | Componente | apps/web/src/lib/features/home/continue-reading-card.spec.ts / `npm --prefix apps/web run test:tdd -- continue-reading-card.spec.ts` | Pending   |
| NFR-001   | AC-007      | Componente | apps/web/src/lib/features/home/quick-actions.spec.ts / `npm --prefix apps/web run test:tdd -- quick-actions.spec.ts`                 | Pending   |
| NFR-002   | AC-001      | Componente | apps/web/src/lib/features/home/home-page.spec.ts / `npm --prefix apps/web run test:tdd -- home-page.spec.ts`                         | Pending   |
| NFR-002   | AC-004      | Unidade    | apps/web/src/lib/features/home/home-continuation.spec.ts / `npm --prefix apps/web run test:tdd -- home-continuation.spec.ts`         | Pending   |
| NFR-003   | AC-002      | Componente | apps/web/src/lib/features/home/home-entry.spec.ts / `npm --prefix apps/web run test:tdd -- home-entry.spec.ts`                       | Pending   |
| NFR-003   | AC-010      | Componente | apps/web/src/lib/features/config/config-page.spec.ts / `npm --prefix apps/web run test:tdd -- config-page.spec.ts`                   | Pending   |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md`
- **Achados**: READY. Formato Specsfy/2.0 válido; 3 US, 6 FR, 3 NFR, 12 AC com cobertura mínima atendida para cada ID; interface Sim com stack Svelte observada, menus mapeados e contrato CRUD declarado como não aplicável; sem research externo; sem BLOCKER. WARNING: matriz TDD da seção 11 com 3 casos iniciais; cobertura total por entidade será expandida em `$specsfy-06-tdd-bdd` antes do Plan Gate.

#### Reabertura do Ato I — navegação desktop de configuração

- **Resultado**: Passed
- **Data**: 2026-09-05
- **Motivo**: o feedback acrescentou comportamento observável para container desktop mais amplo, sidebar vertical de `/config` e preservação do índice mobile.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md` e `node .agents/skills/specsfy-04-validate/scripts/review_findings.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md --root /home/claudio/Projects/openbible-worksplace`
- **Impacto**: Definition Gate restaurado; Plan e Delivery gates permanecem `Pending` até a validação do plano e a conclusão da entrega. As evidências históricas acima permanecem preservadas.

#### Gate do Ato II — Plano

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0012-pagina-inicial-operacional-do-openbible/spec.md`
- **Achados**: 21 tarefas (13 TDD, 6 CODE, 2 DOC); 12 predecessores TDD concluídos com RED em 2026-09-04; rastreabilidade 24/24 IDs; interface com 3 tarefas para 3 telas; runner Vitest via `test:tdd`; sem BLOCKER.

#### Revalidação do Ato II — navegação desktop de configuração

- **Resultado**: Passed
- **Data**: 2026-09-05
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md` e `node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md`
- **Achados**: Plano reconciliado com 24 tarefas (15 TDD, 7 CODE e 2 DOC/TEST), 24/24 IDs cobertos, 24/24 tarefas concluídas e interface OK; T022 materializa o teste da nova composição e T023 possui três predecessores TDD rastreáveis.

#### Gate do Ato III — Entrega

- **Resultado**: In Progress
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md .`
- **Achados**: 21/21 tarefas concluídas; rastreabilidade 24/24 IDs da spec; suite 227/229 (2 falhas pré-existentes em `notes-editor.svelte.spec.ts`, idênticas no baseline sem esta mudança); `check` e `lint` limpos no escopo da fatia (`features/home`, `navigation`, `ConfigPage`, `AppSidebar`, `+page`), com erros pré-existentes fora do escopo (`bible-selector`, props de rotas, `notes-editor`); `build` passa; documentator `--check` passa. Delivery permanece `In Progress` pelas falhas pré-existentes fora do escopo.

#### Revalidação do Ato III — navegação desktop de configuração

- **Resultado**: In Progress
- **Data**: 2026-09-05
- **Comandos aprovados**: teste focal de `/config` `5/5`; suíte unitária `90/90` arquivos e `355/355` testes; build; documentator e monitor de contexto (`CURRENT`).
- **Pendências**: `bun run check` e `bun run lint` globais continuam com falhas preexistentes fora do escopo direto; a inspeção visual pelo navegador integrado não foi possível porque não havia sessão disponível. O Delivery Gate permanece `In Progress`.

#### Reabertura do Ato I — identidade da seção Sobre

- **Resultado**: Passed
- **Data**: 2026-09-05
- **Motivo**: o novo feedback altera a interface observável da configuração: remove o rodapé redundante de versão e pede logo, badge de versão e informações do projeto com link do repositório no GitHub.
- **Impacto**: Definition Gate restaurado após a atualização do AC-010/FR-006; Plan e Delivery foram revalidados pela implementação e permanecem em acompanhamento até a regressão final.

#### Revalidação do Ato I — identidade da seção Sobre

- **Resultado**: Passed
- **Data**: 2026-09-05
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md`
- **Achados**: Specsfy/2.0 válido; AC-010 e FR-006 cobrem ausência do footer, logo, badge e informações/link do projeto; sem blocker.

#### Revalidação do Ato II — identidade da seção Sobre

- **Resultado**: Passed
- **Data**: 2026-09-05
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md` e `node .agents/skills/specsfy-05-tasks/scripts/validate_interface_tasks.mjs specs/in-progress/0012-pagina-inicial-operacional-do-openbible/spec.md`
- **Achados**: Plano reconciliado com 27 tarefas, incluindo T025/T026/T027; predecessores TDD e cobertura da interface confirmados.

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

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-003] Derivar do AC-001 caso Vitest falhando da home sem redirect com ações em apps/web/src/lib/features/home/home-page.spec.ts — Refs: US-003, FR-005, FR-003, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Confirmar regra de home sem redirect, arquivos de home ainda ausentes e comando `npm --prefix apps/web run test:tdd -- home-page.spec.ts`.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que monta workspace pronto com legado e espera home sem navegação, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido pela ausência do módulo home.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste, sem superfície renderizada.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar se o caso distingue redirect de render e registrar aprendizado.

- [x] T002 [TEST] [TDD] [US-003] Derivar do AC-002 caso Vitest falhando do onboarding antes da home em apps/web/src/lib/features/home/home-entry.spec.ts — Refs: US-003, FR-005, NFR-002, NFR-003, AC-002 — Depends: none
  - [x] **PREP**: Confirmar regra de onboarding precedente, rota `/` atual e comando focal de page.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que com workspace ausente espera onboarding e nenhum bloco da home, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar isolamento do estado sem workspace e registrar aprendizado.

- [x] T003 [TEST] [TDD] [US-003] Derivar do AC-003 caso Vitest falhando do shell com Início primeiro em apps/web/src/lib/features/navigation/app-sidebar.spec.ts — Refs: US-003, FR-005, FR-006, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Confirmar itens esperados do menu, `aria-current` e comando focal da sidebar.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que com workspace pronto espera Início primeiro e rota atual identificada, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar cobertura desktop e mobile e registrar aprendizado.

- [x] T004 [TEST] [TDD] [US-001] Derivar do AC-004 caso Vitest falhando de Continuar via seleção em apps/web/src/lib/features/home/home-continuation.spec.ts — Refs: US-001, FR-001, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Confirmar formato de `readerSelection`, adaptador previsto e comando focal de continuation.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que com seleção salva espera a passagem exata, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar distinção entre seleção e fallback e registrar aprendizado.

- [x] T005 [TEST] [TDD] [US-001] Derivar do AC-005 caso Vitest falhando de Continuar via último destaque em apps/web/src/lib/features/home/home-continuation.spec.ts — Refs: US-001, FR-001, FR-002, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Confirmar regra de fallback, ordenação de destaques e caso distinto do T004 no mesmo arquivo.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que sem seleção e com destaques espera o último destaque como destino, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar ordenação do fallback e registrar aprendizado.

- [x] T006 [TEST] [TDD] [US-001] Derivar do AC-006 caso Vitest falhando de Continuar vazio com CTA em apps/web/src/lib/features/home/continue-reading-card.spec.ts — Refs: US-001, FR-002, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Confirmar texto de orientação, nome acessível da ação e comando focal do card.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que sem seleção nem destaque espera vazio com Abrir a Bíblia focável, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar semântica do CTA e registrar aprendizado.

- [x] T007 [TEST] [TDD] [US-002] Derivar do AC-007 caso Vitest falhando das ações rápidas em apps/web/src/lib/features/home/quick-actions.spec.ts — Refs: US-002, FR-003, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Confirmar destinos Ler, Nova nota e Novo sermão, nomes acessíveis e comando focal.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que espera as três ações com navegação correta, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar foco visível das ações e registrar aprendizado.

- [x] T008 [TEST] [TDD] [US-002] Derivar do AC-008 caso Vitest falhando de recentes reais em apps/web/src/lib/features/home/home-recents.spec.ts — Refs: US-002, FR-003, FR-004, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Confirmar limites por seção, ordenação e repositórios de notas e destaques.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que com dados espera listas limitadas com destino, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar limites e ordenação e registrar aprendizado.

- [x] T009 [TEST] [TDD] [US-002] Derivar do AC-009 caso Vitest falhando de recentes vazios em apps/web/src/lib/features/home/recent-lists.spec.ts — Refs: US-002, FR-004, FR-002, NFR-001, AC-009 — Depends: none
  - [x] **PREP**: Confirmar mensagens de vazio por seção e ausência de itens simulados.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que sem conteúdo espera vazio orientado em cada seção, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar clareza das orientações e registrar aprendizado.

- [x] T010 [TEST] [TDD] [US-003] Derivar do AC-010 caso Vitest falhando de config sem Tela inicial em apps/web/src/lib/features/config/config-page.spec.ts — Refs: US-003, FR-006, NFR-003, AC-010 — Depends: none
  - [x] **PREP**: Confirmar abas restantes da ConfigPage e ausência esperada de qualquer controle de tela inicial.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que espera nenhuma seção de Tela inicial nem salvamento, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido contra a UI atual.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar acoplamento com a ConfigPage atual e registrar aprendizado.

- [x] T011 [TEST] [TDD] [US-003] Derivar do AC-011 caso Vitest falhando de legado tratado como ausente em apps/web/src/lib/navigation/home-preference.spec.ts — Refs: US-003, FR-006, FR-005, NFR-003, AC-011 — Depends: none
  - [x] **PREP**: Confirmar chaves legadas em `localStorage` e `preferences.json` e comportamento de ignorar ou limpar.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que com valor legado espera home sem redirect, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar limpeza tolerante e registrar aprendizado.

- [x] T012 [TEST] [TDD] [US-001] Derivar do AC-012 caso Vitest falhando de estados, teclado e temas em apps/web/src/lib/features/home/home-states.spec.ts — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-012 — Depends: none
  - [x] **PREP**: Confirmar skeleton, erro com retry por seção, ordem de foco e viewports 360px e 1280px.
  - [x] **EXECUTE**: Escrever um caso com marcador próprio `SPECSFY:` que espera skeleton, erro localizado sem derrubar a home e navegação por teclado, sem `.feature`.
  - [x] **VERIFY**: Executar o focal e observar RED válido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste.
  - [x] **EVIDENCE**: Registrar comando, saída RED e IDs na seção 11.
  - [x] **IMPROVE**: Revisar isolamento de falha por seção e registrar aprendizado.

#### Fase 2 — US-001 Continuar a leitura a partir da home (P1)

**Objetivo**: Retomar a passagem salva ou o último destaque com um gesto.
**Teste independente**: Continuar abre `/bible` na passagem; sem dados mostra CTA.

- [x] T013 [CODE] [US-001] Implementar continuidade em apps/web/src/lib/features/home/home-continuation.ts e ContinueReadingCard.svelte — Refs: US-001, FR-001, FR-002, NFR-002, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: Confirmar RED de T004, T005 e T006, tipos de `readerSelection` e `reader_highlight`, e baseline de `docs/` via documentator.
  - [x] **EXECUTE**: Criar o adaptador de resolução com fallback e o card com CTA, sem alterar o leitor além do destino.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- home-continuation.spec.ts continue-reading-card.spec.ts` e `npm --prefix apps/web run check`.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do card e da referência em 360px e 1280px nos dois temas.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e IDs nas seções 11–13.
  - [x] **IMPROVE**: Extrair formatação de referência se duplicada ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T013","refs":["US-001","FR-001","FR-002","NFR-002","AC-004","AC-005","AC-006"],"files":["apps/web/src/lib/features/home/home-continuation.ts","apps/web/src/lib/features/home/ContinueReadingCard.svelte"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- home-continuation.spec.ts","exit":0}]} -->

**Checkpoint**: Continuar resolvido isoladamente demonstra o valor da retomada.

#### Fase 3 — US-002 Agir e rever o recente pela home (P1)

**Objetivo**: Ações por tarefa e recentes reais com destino.
**Teste independente**: Ações navegam; recentes abrem destino; vazio orienta.

- [x] T014 [CODE] [US-002] Implementar ações e recentes em apps/web/src/lib/features/home/QuickActions.svelte, home-recents.ts e RecentLists.svelte — Refs: US-002, FR-003, FR-004, NFR-001, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: Confirmar RED de T007, T008 e T009, reuso de `Item` e `HighlightsList`, e baseline de `docs/` via documentator.
  - [x] **EXECUTE**: Criar ações com destinos, carregador limitado de recentes e listas com vazio orientado, sem simular sermões ou estudos.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- quick-actions.spec.ts home-recents.spec.ts recent-lists.spec.ts` e `npm --prefix apps/web run check`.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia da grade de ações e das listas em 360px e 1280px nos dois temas.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e IDs nas seções 11–13.
  - [x] **IMPROVE**: Unificar célula de item recente se divergir ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T014","refs":["US-002","FR-003","FR-004","NFR-001","AC-007","AC-008","AC-009"],"files":["apps/web/src/lib/features/home/QuickActions.svelte","apps/web/src/lib/features/home/home-recents.ts","apps/web/src/lib/features/home/RecentLists.svelte"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- quick-actions.spec.ts","exit":0}]} -->

**Checkpoint**: Ações e recentes demonstram o trabalho diário a partir da home.

#### Fase 4 — US-003 Entrar sempre pela home com navegação estável (P1)

**Objetivo**: Home sem redirect com shell persistente e preferência removida.
**Teste independente**: `/` sempre home; shell com Início; `/config` sem Tela inicial.

- [x] T015 [CODE] [US-003] Reescrever a home em apps/web/src/routes/+page.svelte com HomePage.svelte e shell persistente em AppSidebar.svelte — Refs: US-003, FR-005, NFR-001, NFR-002, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED de T001, T002 e T003, onboarding preservado e itens de menu com Início primeiro.
  - [x] **EXECUTE**: Tornar `/` coordenadora fina que delega à HomePage após workspace pronto e ligar visibilidade do shell ao workspace, sem redirect.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- home-page.spec.ts page.spec.ts app-sidebar.spec.ts` e `npm --prefix apps/web run check`.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do shell, do `PageHeader` e do `aria-current` em 360px e 1280px nos dois temas.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e IDs nas seções 11–13.
  - [x] **IMPROVE**: Remover ramos mortos do seletor antigo ou justificar nenhuma.

  <!-- specsfy:evidence {"task":"T015","refs":["US-003","FR-005","NFR-001","NFR-002","AC-001","AC-002","AC-003"],"files":["apps/web/src/routes/+page.svelte","apps/web/src/lib/features/home/HomePage.svelte","apps/web/src/lib/features/navigation/AppSidebar.svelte"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- home-page.spec.ts","exit":0}]} -->

- [x] T016 [CODE] [US-003] Remover preferência em apps/web/src/lib/navigation/home-preference.ts e na ConfigPage.svelte — Refs: US-003, FR-006, NFR-003, AC-010, AC-011 — Depends: T015, T010, T011
  - [x] **PREP**: Confirmar RED de T010 e T011, usos restantes de `home-preference` e evento `openbible:home-route-changed`.
  - [x] **EXECUTE**: Remover leitura, escrita, UI de Tela inicial e emissão do evento, com limpeza tolerante do legado.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- config-page.spec.ts home-preference.spec.ts` e `npm --prefix apps/web run check`.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia da `/config` sem aba ou seção residual em 360px e 1280px nos dois temas.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e IDs nas seções 11–13.
  - [x] **IMPROVE**: Remover importações órfãs ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T016","refs":["US-003","FR-006","NFR-003","AC-010","AC-011"],"files":["apps/web/src/lib/navigation/home-preference.ts","apps/web/src/lib/features/config/ConfigPage.svelte"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- config-page.spec.ts","exit":0}]} -->

**Checkpoint**: Entrada previsível demonstra a estabilidade da navegação.

#### Fase de interface

- [x] T017 [CODE] [US-001] Implementar estados e acessibilidade da home em apps/web/src/lib/features/home/HomePage.svelte — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, AC-012 — Depends: T013, T014, T015
  - [x] **PREP**: Confirmar composição da seção 10, primitivos `Skeleton`, `Empty` e `Button`, e RED de T012.
  - [x] **EXECUTE**: Compor `PageHeader`, Continuar, ações e recentes com skeleton, vazio, erro com retry, teclado e `prefers-reduced-motion`.
  - [x] **VERIFY**: Exercitar navegação, retry por seção, feedback com `aria-live` e teclado nos dois temas e viewports.
  - [x] **VISUAL**: Conferir PageHeader reutilizado, composição sem DataGrid, bordas, espaçamentos, margens, padding e tipografia nos estados skeleton, vazio, erro e sucesso.
  - [x] **EVIDENCE**: Registrar arquivos, comando e resultado da interação nas seções 11–13.
  - [x] **IMPROVE**: Ajustar densidade entre breakpoints ou justificar nenhuma.

  <!-- specsfy:evidence {"task":"T017","refs":["US-001","US-002","US-003","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","NFR-001","NFR-002","AC-012"],"files":["apps/web/src/lib/features/home/HomePage.svelte"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- home-states.spec.ts","exit":0}]} -->

- [x] T018 [DOC] Registrar blocos da home em INTERFACE.md — Refs: US-001, US-002, US-003, FR-001, FR-003, FR-004, FR-005, NFR-001, AC-001, AC-003, AC-007, AC-008, AC-012 — Depends: T017
  - [x] **PREP**: Confirmar arquivos criados em `features/home`, primitivos reusados e consumidores reais.
  - [x] **EXECUTE**: Registrar `HomePage`, `ContinueReadingCard`, `QuickActions` e `RecentLists` com arquivo, origem, API, estados, consumidores e regra de reuso.
  - [x] **VERIFY**: Conferir que cada bloco novo da seção 10 está mapeado sem duplicar o seletor antigo.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só atualiza documentação de interface.
  - [x] **EVIDENCE**: Registrar arquivos e IDs na seção 13.
  - [x] **IMPROVE**: Padronizar descrições de reuso ou justificar nenhuma.

- [x] T021 [CODE] [US-003] Implementar itens de menu Início no shell em apps/web/src/lib/features/navigation/AppSidebar.svelte — Refs: US-003, FR-005, NFR-001, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED de T003, ordem dos itens com Início primeiro e comportamento da barra mobile.
  - [x] **EXECUTE**: Adicionar o item Início com `aria-current`, ligar a visibilidade ao workspace pronto e preservar tooltips e `safe-area`.
  - [x] **VERIFY**: Executar `npm --prefix apps/web run test:tdd -- app-sidebar.spec.ts` e navegar por teclado nos dois shells.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia dos itens de menu em 360px e 1280px nos dois temas.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e IDs nas seções 11–13.
  - [x] **IMPROVE**: Ajustar rótulos ou ordem de foco ou justificar nenhuma.

  <!-- specsfy:evidence {"task":"T021","refs":["US-003","FR-005","NFR-001","AC-003"],"files":["apps/web/src/lib/features/navigation/AppSidebar.svelte"],"commands":[{"run":"npm --prefix apps/web run test:tdd -- app-sidebar.spec.ts","exit":0}]} -->

- [x] T022 [TEST] [TDD] [US-003] Derivar teste em `apps/web/src/lib/features/config/config-page.spec.ts` da composição desktop da configuração com container amplo, navegação lateral vertical e regiões acessíveis — Refs: US-003, FR-006, NFR-003, AC-010 — Depends: T021
  - [x] **PREP**: Confirmar o feedback de composição desktop, o índice mobile e os IDs AC-010/FR-006.
  - [x] **EXECUTE**: Registrar marcadores estruturais em `apps/web/src/lib/features/config/config-page.spec.ts` para a navegação lateral e o limite de largura desktop.
  - [x] **VERIFY**: O teste focal foi executado inicialmente em RED e passou após a implementação.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só materializa teste estrutural de interface.
  - [x] **EVIDENCE**: Registrar o teste focal e os IDs cobertos na seção 13.
  - [x] **IMPROVE**: Validar o contrato sem acoplar o teste ao markup interno das tabs antigas.

- [x] T023 [CODE] [US-003] Reorganizar a configuração desktop em `apps/web/src/lib/features/config/ConfigPage.svelte` com sidebar vertical e container amplo sem alterar o índice mobile — Refs: US-003, FR-006, NFR-002, NFR-003, AC-010 — Depends: T003, T010, T022
  - [x] **PREP**: Confirmar RED de T003, T010 e T022, componentes de configuração e comportamento mobile existente.
  - [x] **EXECUTE**: Substituir as tabs horizontais por tablist vertical com roving tabindex, painel associado e estilos responsivos.
  - [x] **VERIFY**: Build e teste focal de configuração passaram; o mobile preserva índice, retorno e foco na subpágina.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sidebar e do conteúdo em desktop/mobile.
  - [x] **EVIDENCE**: Registrar o teste focal e o build no comentário de evidência da tarefa.
  - [x] **IMPROVE**: Reaproveitar a mesma lista de seções para desktop e mobile, evitando divergência de navegação.

<!-- specsfy:evidence {"task":"T023","refs":["US-003","FR-006","NFR-002","NFR-003","AC-010"],"files":["apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/lib/features/config/config-page.spec.ts","apps/web/src/routes/config.svelte.spec.ts"],"commands":[{"run":"bun run test:unit -- src/lib/features/config/config-page.spec.ts","exit":0},{"run":"bun run test:tdd -- src/routes/config.svelte.spec.ts","exit":0},{"run":"bun run build","exit":0}]} -->

- [x] T024 [TEST] Executar regressão final em `apps/web/src/routes/config.svelte.spec.ts` da configuração e atualizar documentação/contexto — Refs: US-003, FR-006, NFR-003, AC-010 — Depends: T023
  - [x] **PREP**: Identificar testes de configuração, suíte completa, build, documentator e monitor.
  - [x] **EXECUTE**: Executar os testes focais e a regressão completa, reconstruir a documentação e verificar o contexto.
  - [x] **VERIFY**: Configuração 5/5, suíte completa 90/90 arquivos e 355/355 testes, build, documentator e monitor passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia; registrar `Não aplicável` para screenshot interativo porque o navegador integrado ficou indisponível.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais na seção 13.
  - [x] **IMPROVE**: Atualizar a regressão desktop para o contrato semântico `aria-selected` da navegação vertical.

- [x] T025 [TEST] [TDD] [US-003] Derivar teste da seção Sobre com logo, badge de versão, informações do projeto e ausência do rodapé redundante em `apps/web/src/lib/features/config/config-page.spec.ts` e `apps/web/src/routes/config.svelte.spec.ts` — Refs: US-003, FR-006, NFR-003, AC-010 — Depends: T024
  - [x] **PREP**: Confirmar o novo comportamento de About, o repositório GitHub oficial e os IDs AC-010/FR-006.
  - [x] **EXECUTE**: Escrever testes estruturais para logo, badge, informações/link do projeto e remoção do `config-footer`, sem criar `.feature`.
  - [x] **VERIFY**: Executar os focais; os contratos passaram após a implementação e o gap estrutural ficou coberto sem regressão.
  - [x] **VISUAL**: Não aplicável: a tarefa só materializa o contrato de interface; a inspeção visual fica registrada em T026.
  - [x] **EVIDENCE**: Registrar comandos, resultado e IDs na seção 13.
  - [x] **IMPROVE**: Preferir nomes acessíveis e seletores sem acoplamento a classes geradas pelo Svelte.

<!-- specsfy:evidence {"task":"T025","refs":["US-003","FR-006","NFR-003","AC-010"],"files":["apps/web/src/lib/features/config/config-page.spec.ts","apps/web/src/routes/config.svelte.spec.ts"],"commands":[{"run":"node .agents/skills/specsfy-setup/scripts/check_database_safety.mjs --project . --command \"bun run test:unit -- src/lib/features/config/config-page.spec.ts src/routes/config.svelte.spec.ts\"","exit":0},{"run":"bun run test:unit -- src/lib/features/config/config-page.spec.ts","exit":0},{"run":"bun run test:tdd -- src/routes/config.svelte.spec.ts","exit":0}]} -->

- [x] T026 [CODE] [US-003] Atualizar About e a rota `/config` com marca, badge de versão, informações do projeto, link do GitHub e sem rodapé redundante em `apps/web/src/lib/features/config/ConfigPage.svelte`, `apps/web/src/routes/config/+page.svelte` e `INTERFACE.md` — Refs: US-003, FR-006, NFR-001, NFR-003, AC-010 — Depends: T010, T022, T025
  - [x] **PREP**: Confirmar RED de T010, T022 e T025, tokens de tema, assets de logo e URL oficial do repositório.
  - [x] **EXECUTE**: Renderizar logo acessível, badge `APP_VERSION`, bloco de informações do projeto com link externo, remover o footer e atualizar a descrição da rota e o mapa de interface.
  - [x] **VERIFY**: Testes focais, regressão de rota e build passaram; o link, a ausência do footer e a navegação vertical foram conferidos por DOM/CSS.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, mobile/desktop, conteúdo longo e zoom, sem overflow; navegador Vitest Browser disponível para a rota, sem screenshot externo.
  - [x] **EVIDENCE**: Registrar arquivos, comandos, resultados e IDs nas seções 11–13.
  - [x] **IMPROVE**: Reusar tokens existentes e o asset oficial de logo sem introduzir uma superfície decorativa adicional.

<!-- specsfy:evidence {"task":"T026","refs":["US-003","FR-006","NFR-001","NFR-003","AC-010"],"files":["apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/routes/config/+page.svelte","apps/web/src/lib/features/config/config-page.spec.ts","apps/web/src/routes/config.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run test:unit -- src/lib/features/config/config-page.spec.ts","exit":0},{"run":"bun run test:tdd -- src/routes/config.svelte.spec.ts","exit":0},{"run":"bun run build","exit":0},{"run":"bunx eslint src/lib/features/config/ConfigPage.svelte src/lib/features/config/config-page.spec.ts src/routes/config/+page.svelte src/routes/config.svelte.spec.ts","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0}]} -->

- [x] T027 [TEST] Executar a regressão final de `/config`, documentação e monitor após o ajuste de About em `apps/web/src/routes/config.svelte.spec.ts` e `apps/web/src/lib/features/config/` — Refs: US-003, FR-006, NFR-001, NFR-003, AC-010, AC-012 — Depends: T026
  - [x] **PREP**: Identificar testes de configuração, build, documentator e monitor necessários.
  - [x] **EXECUTE**: Executar focais, suíte unitária relacionada, build, reconstrução/verificação da documentação e monitor.
  - [x] **VERIFY**: Suíte 90/90 arquivos e 358/358 testes, rota `/config` 6/6, build, documentator e monitor passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia em claro/escuro, desktop/mobile, foco, zoom, conteúdo longo e reduced motion por DOM/CSS e Vitest Browser; sem screenshot conectado adicional.
  - [x] **EVIDENCE**: Registrar contagens e comandos no fechamento da seção 13.
  - [x] **IMPROVE**: Manter o About como fonte única da identidade e versão do app.

<!-- specsfy:evidence {"task":"T027","refs":["US-003","FR-006","NFR-001","NFR-003","AC-010","AC-012"],"files":["apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/routes/config/+page.svelte","apps/web/src/lib/features/config/config-page.spec.ts","apps/web/src/routes/config.svelte.spec.ts","INTERFACE.md"],"commands":[{"run":"bun run test:unit","exit":0},{"run":"bun run test:tdd -- src/routes/config.svelte.spec.ts","exit":0},{"run":"bun run build","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check","exit":0},{"run":"node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check","exit":0}]} -->

#### Fase final — Qualidade

- [x] T019 [DOC] Revisar DATABASE.md e PROJECT.md para a remoção da tela inicial — Refs: US-003, FR-006, NFR-003, AC-010, AC-011 — Depends: T016
  - [x] **PREP**: Confirmar campos de `preferences.json` documentados e trecho da entrada em PROJECT.md.
  - [x] **EXECUTE**: Atualizar `.specsfy/DATABASE.md` sem `initialRoute` e ajustar `PROJECT.md` para a home operacional; se sem impacto material, registrar justificativa em vez de conteúdo artificial.
  - [x] **VERIFY**: Executar o monitor de contexto e confirmar ausência de PENDING indevido.
  - [x] **VISUAL**: Registrar `Não aplicável` porque a tarefa só atualiza contexto.
  - [x] **EVIDENCE**: Registrar arquivos e resultado do monitor na seção 13.
  - [x] **IMPROVE**: Registrar reconciliação de contexto ou justificar nenhuma.

- [x] T020 [TEST] Executar regressão e rastreabilidade da home com Vitest em apps/web/src/lib/features/home/home-states.spec.ts — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T013, T014, T015, T016, T017, T018, T019, T021
  - [x] **PREP**: Identificar suites Vitest da home, checks de tipos e gates da spec.
  - [x] **EXECUTE**: Executar `npm --prefix apps/web run test:tdd`, `npm --prefix apps/web run check` e rastreabilidade de IDs.
  - [x] **VERIFY**: Confirmar ausência de gaps entre FR, NFR, AC e tarefas.
  - [x] **VISUAL**: Repassar a conferência visual final da home ou registrar `Não aplicável` com motivo concreto se só regressão lógica.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais nas seções 11–13.
  - [x] **IMPROVE**: Registrar retrospectiva do processo.

### 15. Ordem de execução

- Caminho crítico: T001–T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020, com T021 após T003 e antes de T020.
- Tarefas paralelas: T001, T002, T003, T004, T006, T007, T008, T009, T010, T011 e T012 em paralelo por arquivos distintos; T004 e T005 compartilham `home-continuation.spec.ts` e executam em sequência; T013 e T014 em paralelo após seus REDs.
- Estratégia de MVP: US-001 mais US-003 primeiro entregam retomada com entrada estável; US-002 completa o valor diário.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Workspace e onboarding existentes; fontes `readerSelection`, notas Markdown e `reader_highlight`.
- Shell `AppSidebar` e barra mobile para item Início.
- Primitives shadcn-svelte e tokens em `app.css`.

#### Riscos

- Remoção de `InitialScreenPicker` da `/` quebra testes e docs que citam o seletor → mitigar com regressão e atualização de `INTERFACE.md`.
- Valor legado de `initialRoute` em usuários atuais → mitigar tratando como ausente com limpeza tolerante.
- Recentes com volume alto → mitigar com limites fixos pequenos e sem paginação na home.

#### Suposições

- Limites pequenos de recentes são suficientes para a entrada; paginação permanece nas rotas de origem.
- `readerSelection` permanece em `preferences.json` com cache em `localStorage`.
- `HighlightsList` pode ser reusada na home sem mudar o sheet do leitor.

### 17. Decisões

- **DEC-001**: `/` como home operacional sem redirect — elimina imprevisibilidade e ancora continuidade; alternativa seletor enriquecido manteria beco; trade-off exige remover preferência.
- **DEC-002**: Blocos Continuar mais ações mais recentes reais — cobre retomada e trabalho diário; alternativa dashboard com KPIs adiaria valor; trade-off mantém home contida.
- **DEC-003**: Onboarding antes da home sem workspace — preserva configuração; alternativa home vazia confundiria primeiro acesso.
- **DEC-004**: Remover `initialRoute` e seção em `/config` — simplifica modelo mental; alternativa manter opcional preservaria redirect indesejado.
- **DEC-005**: Shell persistente com Início primeiro — estabiliza navegação; alternativa home fora do shell fragmentaria chrome.
- **DEC-006**: Continuar via `readerSelection` com fallback destaque — usa fontes existentes; alternativa só seleção deixaria vazio frequente.
- **DEC-007**: Recentes só com dados reais — evita simular módulos; alternativa seções Em breve ocuparia espaço sem valor.
- **DEC-008**: Composição Svelte nova sob `features/home` com reuso de `HighlightsList` — respeita stack e `INTERFACE.md`; alternativa reutilizar `InitialScreenPicker` manteria papel de seletor.
- **DEC-009**: Barra mobile sem Destaques, card minimal de destaques e carrossel nos recentes — feedback direto da pessoa durante a implementação; Destaques segue na sidebar desktop, na home e em `/highlights`; card único em linha compacta com `layout="rail"` e snap no mobile. Alternativa manter grade e barra antigas preservaria telas menos densas no mobile.
- **DEC-010**: Vazios minimalistas em linha nos recentes — feedback direto da pessoa; painel `Empty` trocado por frase curta com ação (`Crie a primeira nota`, `Ler a Bíblia`); `HighlightsList` ganha `emptyVariant="inline"` sem alterar o painel da página `/highlights`. Alternativa ocultar as seções esconderia os atalhos `Ver todas`.
- **DEC-011**: Guarda contra boot duplicado, splash de loading e carga única na home — feedback direto da pessoa (`workspace` recarregava várias vezes); `WorkspaceState.boot` deduplica chamadas concorrentes e ignora reboot com status `ready`; `AppFrame` exibe `WorkspaceBootSplash` (logo, barras em pulso, `aria-busy`, `prefers-reduced-motion`); `HomePage` carrega uma vez por storage e aguarda o storage em vez de dupla passagem. Alternativa manter o texto estático de boot preservaria o flash de recarregamento.
- **DEC-012**: Escolha OPFS vs pasta no PWA desktop — pedido direto da pessoa; `resolveStorageKind` (preferência salva vence o padrão por hostname), `shouldOfferStorageChoice` (PWA standalone + File System Access + sem escolha), onboarding com as duas opções na etapa de armazenamento e troca com confirmação em `/config`; storages não migram entre si. Alternativa manter OPFS forçado no PWA limitaria quem quer pasta local.
- **DEC-013**: Usar container desktop amplo com sidebar vertical e manter índice/subpágina no mobile — porque seis ou mais seções de configuração ficam mais escaneáveis e não comprimem o conteúdo; alternativa tabs horizontais mantinha navegação extensa e pouco espaço útil.
- **DEC-014**: Concentrar identidade, versão e informações do projeto na seção Sobre e remover o footer global redundante — porque a versão precisa ter contexto e um único ponto de manutenção; alternativa repetir `OpenBible v{APP_VERSION}` no rodapé duplicaria informação e ocuparia espaço útil.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes e checks estáticos disponíveis passam.
