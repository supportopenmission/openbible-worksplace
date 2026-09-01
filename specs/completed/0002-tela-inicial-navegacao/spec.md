# Especificação integrada: Tela inicial e navegação do OpenBible

| Campo                  | Valor                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formato                | Specsfy/2.0                                                                                                                                                   |
| ID                     | SPEC-0002                                                                                                                                                     |
| Slug                   | 0002-tela-inicial-navegacao                                                                                                                                   |
| Status                 | Complete                                                                                                                                                      |
| Effort                 | 7                                                                                                                                                             |
| Effort updated at      | 2026-08-31                                                                                                                                                    |
| Effort rationale       | A atualização acrescenta app shell PWA offline, safe area, persistência de tema, identidade visual e dois modos de navegação responsiva à fatia já existente. |
| ClickUp Task           |                                                                                                                                                               |
| Milestones             |                                                                                                                                                               |
| Definition Gate        | Passed                                                                                                                                                        |
| Plan Gate              | Passed                                                                                                                                                        |
| Delivery Gate          | Passed                                                                                                                                                        |
| Evidence Contract      | 1                                                                                                                                                             |
| Interface para pessoas | Sim                                                                                                                                                           |
| Atualizada em          | 2026-09-01                                                                                                                                                    |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A aplicação conclui o onboarding do workspace, mas ainda não oferece uma entrada para as áreas do produto. A pessoa não consegue escolher entre ler a Bíblia e montar um sermão, nem retomar automaticamente sua área preferida ao entrar em `/`.

#### Resultado desejado

A pessoa encontra na rota `/` três entradas claras, acessa as rotas de Bíblia, sermões e estudo, configura sua tela inicial em `/config` e passa a abrir automaticamente a área escolhida com um Sidebar persistente. Em um dispositivo compatível, ela também pode instalar o OpenBible como PWA standalone, continuar usando o app shell sem rede, alternar entre tema claro e escuro e navegar por Sidebar no desktop ou barra inferior no mobile.

#### Métricas de sucesso

- Sem preferência válida, 100% das três opções de entrada são renderizadas na rota `/` e a opção de estudo comunica indisponibilidade sem navegação falsa.
- Com uma preferência válida, toda entrada em `/` encaminha para a rota escolhida e o shell renderiza o Sidebar com a rota atual identificada.
- A remoção da preferência restaura o seletor em `/` e oculta o Sidebar, sem depender de rede ou autenticação.
- O manifesto declara modo `standalone`, o app shell é recuperável sem rede após o primeiro carregamento e a interface comunica quando está offline.
- A escolha de tema claro ou escuro é persistida no navegador e aplicada aos tokens shadcn-svelte sem depender de rede.
- Em viewport mobile, a barra inferior oferece destinos acessíveis e respeita a safe area; em desktop, o Sidebar continua sendo a navegação principal.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Contrato de instalação e composição de `Item` e `Sidebar` no shadcn-svelte — Verdict: verified — Confidence: high — Evidence: `research/shadcn-svelte-item-sidebar.md#evidência-externa-item-e-sidebar-do-shadcn-svelte` — Budget: 1/1.

#### Fontes e contexto consultados

- `specs/inbox/2026-08-31-222704-tela-inicial-e-navegacao-do-openbible.md` — formulação original.
- `specs/backlog/0002-tela-inicial-navegacao.md` — refinamento da entrada.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — onboarding e workspace preservados; rotas de produto ainda fora da fatia anterior.
- `PROJECT.md`, `DESIGNSYSTEM.MD`, `INTERFACE.md` e `.specsfy/RULES.md` — finalidade, padrões de interface e stack Svelte.
- `.specsfy/DATABASE.md` — informação confirmada sobre a preferência da tela inicial.

#### Documentação consultada

- `https://www.shadcn-svelte.com/docs/installation/sveltekit`, acesso em 2026-08-31 — inicialização, aliases e CLI.
- `https://www.shadcn-svelte.com/docs/components/item`, acesso em 2026-08-31 — composição de itens com título, descrição e ação.
- `https://www.shadcn-svelte.com/docs/components/sidebar`, acesso em 2026-08-31 — estrutura do Sidebar, responsividade, rota ativa e trigger.

#### Artefatos de pesquisa armazenados

- `specs/completed/0002-tela-inicial-navegacao/research/shadcn-svelte-item-sidebar.md`: metadados das fontes externas, data de acesso, licença/proveniência, conclusão e impacto; não contém cópia de código externo.

#### Dúvidas respondidas

- **Q1: quais entradas aparecem na tela inicial?** → **A:** Ler a Bíblia, Montar um sermão e Montar um estudo (em breve).
- **Q2: quais destinos as entradas usam?** → **A:** `/bible`, `/sermons` e `/study`; a entrada de estudo permanece indisponível até a capacidade existir.
- **Q3: onde a pessoa configura a tela inicial?** → **A:** na página `/config`.
- **Q4: quando o Sidebar aparece?** → **A:** somente quando existe uma preferência de tela inicial válida; ele oferece as rotas do produto e a configuração.
- **Q5: quem usa e pode alterar a preferência?** → **A:** a pessoa usuária individual do dispositivo, sem conta ou autenticação.
- **Q6: qual padrão de SQLite deve ser preservado?** → **A:** manter `.openbible/index.sqlite` como banco auxiliar de índices, sem adotar `app.sqlite` ou `openbible.sqlite` nesta fatia.

#### Dúvidas abertas

- Nenhuma lacuna bloqueante. A persistência em armazenamento local do navegador é uma decisão técnica reversível, adequada ao uso individual e sem servidor.

### 3. Escopo e atores

#### Incluído

- Seletor inicial em `/` com três `Item` do shadcn-svelte.
- Rotas mínimas `/bible`, `/sermons` e `/study`, com a última comunicando “em breve”.
- Página `/config` para selecionar Bíblia ou sermão como tela inicial ou remover a preferência.
- Preferência local da tela inicial, leitura na abertura de `/` e redirecionamento automático.
- Shell com Sidebar shadcn-svelte condicional à preferência, navegação responsiva e marcação da rota atual.
- PWA standalone com manifesto, registro de service worker, cache do app shell/rotas locais, fallback offline e safe area para dispositivos com recorte ou barra de gesto.
- Tema claro/escuro persistido localmente usando os tokens de cor shadcn-svelte solicitados.
- Logo do projeto derivado de `Downloads/logo.png`, Sidebar desktop e barra de navegação inferior mobile.
- Testes de componente/browser, unidade da preferência, typecheck, lint e build.

#### Fora de escopo

- Leitura de capítulos, importação ou consulta de bancos SQLite.
- Conteúdo funcional do leitor, construtor de sermões ou módulo de estudos.
- CRUD de sermões, estudos, notas ou Bíblias.
- Conta, autenticação, sincronização remota, analytics e Tauri.
- Push notifications, background sync, instalação forçada, sincronização de conteúdo bíblico e garantia de funcionamento offline antes do primeiro carregamento online.
- Alteração ou substituição do onboarding de armazenamento da spec 0001.

#### Atores

- **Pessoa usuária individual**: escolhe uma entrada, configura a tela inicial e navega entre as áreas disponíveis.
- **Aplicação web**: persiste a preferência local, redireciona `/`, exibe o Sidebar quando aplicável e comunica o estado indisponível do estudo.

### 4. Princípios e restrições do projeto

- **PR-001**: manter SvelteKit/Svelte e Vitest; não introduzir React, shadcn/ui para React ou ReUI.
- **PR-002**: usar os componentes copiados do shadcn-svelte `Item` e `Sidebar`, com CSS e aliases configurados no app web.
- **PR-003**: não enviar a preferência nem dados do workspace para servidor; o uso continua local e sem autenticação.
- **PR-004**: uma preferência inválida ou ilegível deve ser tratada como ausente e nunca produzir uma rota arbitrária.
- **PR-005**: toda navegação deve ter nome acessível, foco visível, rota atual perceptível e comportamento funcional em viewport estreito.
- **PR-006**: o app shell deve usar o manifesto como PWA `standalone`, service worker versionado e cache local; a indisponibilidade da rede não pode apagar a preferência de tema ou de tela inicial.
- **PR-007**: os tokens de cor devem seguir os valores shadcn-svelte fornecidos para `:root` e `.dark`; componentes não devem introduzir uma paleta paralela.
- **PR-008**: o desktop usa Sidebar; mobile usa barra inferior fixa com safe area e conteúdo com espaço suficiente para não ficar encoberto.

### 5. Histórias de usuário

#### US-001 — Escolher e retomar minha área de trabalho (P1)

Como pessoa usuária individual, quero escolher entre ler a Bíblia e montar um sermão, com estudo sinalizado como futuro, para entrar rapidamente no OpenBible e retomar minha área preferida nas próximas visitas.

**Por que P1**: sem uma entrada orientada e uma rota inicial configurável, o workspace preparado não entrega acesso às capacidades planejadas.
**Teste independente**: abrir a aplicação sem preferência, ativar as entradas, salvar uma tela em `/config`, reabrir `/` e acessar outra área pelo Sidebar.
**Requisitos**: FR-001, FR-002, FR-003, NFR-001.

#### US-002 — Continuar usando o app sem rede (P1)

Como pessoa usuária individual, quero instalar o OpenBible como PWA standalone e reabrir suas áreas locais sem conexão, para consultar a superfície já carregada durante deslocamentos ou indisponibilidade de rede.

**Por que P1**: o produto é local-first e a navegação básica não deve depender de uma conexão disponível.

**Teste independente**: validar o manifesto, carregar o app em produção, desligar a rede e reabrir uma rota local que tenha sido armazenada pelo service worker.

**Requisitos**: FR-004, NFR-002.

#### US-003 — Personalizar aparência e navegar no dispositivo (P1)

Como pessoa usuária individual, quero escolher tema claro ou escuro e encontrar a navegação adequada ao tamanho da tela, para usar o OpenBible com conforto em desktop e mobile.

**Por que P1**: contraste, recortes de tela e navegação por toque são condições de uso da PWA.

**Teste independente**: alternar o tema, recarregar a página, abrir uma rota em viewport mobile e verificar a barra inferior; repetir em desktop e verificar o Sidebar.

**Requisitos**: FR-005, FR-006, FR-007, NFR-002.

### 6. Cenários BDD de aceite

#### AC-001 — Exibir e ativar as entradas iniciais

**Cobre**: US-001, FR-001, FR-002, FR-003, NFR-001

```gherkin
@US-001 @FR-001 @FR-003 @NFR-001 @AC-001
Feature: Escolher uma área do OpenBible

  Scenario: A pessoa abre o seletor sem preferência
    Given que o workspace está configurado e não existe tela inicial definida
    When a pessoa abre a rota /
    Then vê os itens Ler a Bíblia, Montar um sermão e Montar um estudo (em breve)
    And ao ativar os itens disponíveis navega para /bible ou /sermons
    And o item de estudo permanece indisponível com a indicação Em breve
```

#### AC-002 — Salvar e recuperar a tela inicial

**Cobre**: US-001, FR-001, FR-002, FR-003, NFR-001

```gherkin
@US-001 @FR-002 @FR-003 @NFR-001 @AC-002
Feature: Configurar a tela inicial

  Scenario: A pessoa escolhe Bíblia e retorna ao projeto
    Given que a pessoa está em /config sem uma preferência válida
    When salva Bíblia como tela inicial e entra em /
    Then a aplicação navega automaticamente para /bible
    And o Sidebar fica visível com Bíblia identificada como rota atual
```

#### AC-003 — Remover preferência e usar o Sidebar

**Cobre**: US-001, FR-001, FR-002, FR-003, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @FR-003 @NFR-001 @AC-003
Feature: Navegar entre áreas do OpenBible

  Scenario: A pessoa remove a tela inicial
    Given que existe uma tela inicial salva e o Sidebar está visível
    When a pessoa remove a preferência em /config e abre /
    Then vê novamente o seletor inicial
    And o Sidebar não é renderizado
    And o link para /study informa que o estudo está em breve sem abrir uma capacidade inexistente
```

#### AC-004 — Instalar e continuar no app shell offline

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-004
Feature: Usar o OpenBible sem conexão

  Scenario: A pessoa reabre a PWA sem rede depois do primeiro carregamento
    Given que o app shell e as rotas locais foram carregados uma vez com conexão
    When a pessoa instala ou reabre o OpenBible em modo standalone sem rede
    Then o navegador encontra o manifesto com display standalone
    And o service worker retorna o app shell e as rotas locais pelo cache
    And a interface informa que está offline sem bloquear a navegação local
```

#### AC-007 — Declarar instalação standalone

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-007
Feature: Instalação standalone do OpenBible

  Scenario: O navegador identifica o app instalável
    Given que a pessoa acessa o OpenBible com conexão
    When o navegador lê os metadados da aplicação
    Then encontra um manifesto com nome, ícones, escopo e display standalone
```

#### AC-008 — Recuperar a navegação local do cache

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-008
Feature: Cache offline do OpenBible

  Scenario: Uma rota já visitada é recuperada sem rede
    Given que a pessoa visitou Bíblia, Sermões, Estudos ou Configuração online
    When a conexão é interrompida e a pessoa reabre uma dessas rotas
    Then o service worker devolve a resposta armazenada
    And os recursos estáticos necessários continuam disponíveis localmente
```

#### AC-005 — Alternar tema claro e escuro

**Cobre**: US-003, FR-005, NFR-002

```gherkin
@US-003 @FR-005 @NFR-002 @AC-005
Feature: Personalizar o tema do OpenBible

  Scenario: A pessoa alterna e recupera o tema escuro
    Given que o OpenBible está no tema claro
    When a pessoa ativa o controle de tema escuro
    Then a raiz do documento recebe o modo escuro
    And a escolha é salva localmente e permanece após recarregar
    When a pessoa ativa o controle de tema claro
    Then a raiz do documento retorna ao modo claro
```

#### AC-009 — Recuperar tema persistido

**Cobre**: US-003, FR-005, NFR-002

```gherkin
@US-003 @FR-005 @NFR-002 @AC-009
Feature: Recuperar o tema escolhido

  Scenario: A pessoa reabre o tema escuro salvo
    Given que o tema escuro foi salvo no navegador
    When a pessoa recarrega o OpenBible
    Then a classe dark é aplicada à raiz antes da interface ficar pronta
    And o controle informa que a ação disponível é voltar ao tema claro
```

#### AC-010 — Tratar preferência de tema inválida

**Cobre**: US-003, FR-005, NFR-002

```gherkin
@US-003 @FR-005 @NFR-002 @AC-010
Feature: Recuperação segura do tema

  Scenario: O valor de tema desconhecido volta ao claro
    Given que o armazenamento contém um tema diferente de light ou dark
    When a pessoa abre o OpenBible
    Then a aplicação usa o tema claro
    And o controle continua disponível para escolher o tema escuro
```

#### AC-006 — Navegar com o controle adequado ao viewport

**Cobre**: US-003, FR-006, FR-007, NFR-002

```gherkin
@US-003 @FR-006 @FR-007 @NFR-002 @AC-006
Feature: Navegação responsiva do OpenBible

  Scenario: A pessoa navega em desktop e mobile
    Given que existe uma tela inicial válida
    When a pessoa usa o OpenBible em desktop
    Then vê o Sidebar com logo e os destinos principais
    When a pessoa usa o OpenBible em mobile
    Then vê uma barra inferior com destinos nomeados e a rota atual marcada
    And o conteúdo respeita a safe area sem ficar encoberto pela barra
```

#### AC-011 — Usar a barra inferior no mobile

**Cobre**: US-003, FR-006, FR-007, NFR-002

```gherkin
@US-003 @FR-006 @FR-007 @NFR-002 @AC-011
Feature: Navegação mobile do OpenBible

  Scenario: A barra inferior oferece os destinos locais
    Given que o viewport tem largura mobile
    When a pessoa consulta o shell do OpenBible
    Then encontra uma barra de navegação com Bíblia, Sermões, Estudos e Configuração
    And a barra usa a safe area inferior e a marca visual do projeto
```

#### AC-012 — Usar Sidebar e logo no desktop

**Cobre**: US-003, FR-006, FR-007, NFR-002

```gherkin
@US-003 @FR-006 @FR-007 @NFR-002 @AC-012
Feature: Navegação desktop do OpenBible

  Scenario: O Sidebar mantém a identidade visual no desktop
    Given que o viewport tem largura desktop
    When a pessoa consulta o shell do OpenBible
    Then encontra o Sidebar desktop com a logo do projeto
    And os destinos principais permanecem acessíveis e a rota atual é identificada
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve renderizar em `/` sem preferência válida três itens do shadcn-svelte `Item`, com os rótulos Ler a Bíblia, Montar um sermão e Montar um estudo (em breve), encaminhando os dois primeiros para `/bible` e `/sermons` e mantendo o terceiro indisponível.
- **FR-002**: O sistema deve permitir em `/config` selecionar Bíblia ou sermão, persistir a escolha localmente, redirecionar `/` para a rota salva e permitir remover a preferência para restaurar o seletor.
- **FR-003**: O sistema deve renderizar o `Sidebar` do shadcn-svelte somente com uma preferência válida, oferecer links para `/bible`, `/sermons`, `/study` e `/config`, marcar a rota atual e manter páginas mínimas disponíveis nos destinos solicitados.
- **FR-004**: O sistema deve publicar um manifesto PWA com `display: standalone`, registrar um service worker em produção, pré-cachear os assets e as cinco rotas locais da fatia e usar cache/fallback para permitir reabertura offline após o primeiro carregamento.
- **FR-005**: O sistema deve oferecer controle acessível de tema claro/escuro, persistir a escolha em `localStorage` separado da preferência de tela inicial e aplicar os tokens de cor shadcn-svelte em `:root` e `.dark`.
- **FR-006**: O sistema deve manter o Sidebar como navegação desktop e renderizar uma barra inferior de navegação em viewport mobile, com os destinos Bíblia, Sermões, Estudos e Configuração, rota atual e safe area inferior.
- **FR-007**: O sistema deve usar o asset de logo fornecido em `Downloads/logo.png` na marca do app e derivar ícones quadrados legíveis para a instalação PWA.

#### Não funcionais

- **NFR-001**: A jornada deve ser operável por teclado e leitor de tela, ter foco visível, `aria-current="page"` na rota ativa, controle responsivo em viewport estreito e não depender somente de cor ou ícone. **Verificação**: testes browser dos rótulos, destinos, estado disabled, rota ativa e ausência/presença do Sidebar; inspeção em 320px e 1440px; typecheck, lint e build.
- **NFR-002**: A experiência deve manter contraste e foco visível nos dois temas, reflow sem scroll horizontal em 320px, safe area em viewport com `viewport-fit=cover`, navegação por teclado no desktop e toque confortável no mobile. **Verificação**: testes browser dos controles e estados; inspeção de manifesto/service worker em build; viewports 320px e 1440px, tema claro/escuro, offline, zoom e `prefers-reduced-motion`.

#### Erros e casos-limite

- Preferência ausente, inválida ou ilegível → exibir `/` como seletor e ocultar o Sidebar.
- A pessoa acessa `/study` diretamente → mostrar uma página de módulo em breve, sem afirmar que há conteúdo funcional.
- A pessoa tenta salvar a opção de estudo → a opção permanece desabilitada e a preferência não muda.
- A preferência é removida → limpar o valor local e voltar ao seletor sem Sidebar.
- O onboarding ainda não foi concluído → preservar o fluxo existente da spec 0001 antes de mostrar a superfície de produto.
- O service worker ainda não possui cache → a primeira abertura exige rede e o app comunica essa limitação; após instalação/primeiro carregamento, o fallback usa apenas recursos locais conhecidos.
- O navegador não suporta instalação PWA ou service worker → a aplicação continua utilizável como site local, sem apresentar a instalação como garantida.
- A preferência de tema está ausente ou inválida → usar tema claro, limpar o valor inválido e manter o controle utilizável.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Antes desta fatia, `apps/web` era um app SvelteKit/Svelte 5 sem layout global de produto, Tailwind ou shadcn-svelte configurado. `/` compunha o onboarding e uma superfície mínima de workspace em `apps/web/src/routes/+page.svelte`.
- A configuração do workspace e o status de Bíblias permanecem sob responsabilidade de `$lib/storage`; esta fatia adiciona apenas a preferência de navegação e deve preservar o onboarding.

#### Arquitetura e módulos

- Inicializar shadcn-svelte em `apps/web`, seus aliases, CSS global e dependências de runtime necessárias.
- Copiar os componentes `Item` e `Sidebar` para `apps/web/src/lib/components/ui/`; manter os arquivos como código local do projeto.
- Criar `apps/web/src/lib/navigation/home-preference.ts` com tipo de rota, chave local, leitura segura, gravação, remoção e validação de valores.
- Criar `apps/web/src/lib/features/navigation/InitialScreenPicker.svelte` para a tela sem preferência e para o formulário de `/config`, usando `Item` e controles nativos/shadcn-svelte disponíveis.
- Criar `apps/web/src/lib/features/navigation/AppSidebar.svelte` para compor o Sidebar com os quatro destinos, ícones/nomes acessíveis e estado ativo baseado na URL.
- Criar `apps/web/src/routes/+layout.svelte` para fornecer o shell global quando a preferência existir, sem duplicar navegação nas rotas.
- Ajustar `apps/web/src/routes/+page.svelte` para preservar o onboarding, renderizar o seletor quando configurado e redirecionar a preferência válida ao entrar em `/`.
- Criar `apps/web/src/routes/bible/+page.svelte`, `apps/web/src/routes/sermons/+page.svelte`, `apps/web/src/routes/study/+page.svelte` e `apps/web/src/routes/config/+page.svelte` como superfícies mínimas e evolutivas.
- Adicionar `apps/web/static/manifest.webmanifest`, ícones derivados do logo, `apps/web/src/service-worker.ts` e registro do worker no shell; pré-cachear assets e rotas locais e responder offline com a versão em cache.
- Adicionar `apps/web/src/lib/theme/theme.ts` e `ThemeToggle.svelte`, aplicar a classe `.dark` antes da hidratação e substituir `app.css` pelos tokens de cor fornecidos.
- Alterar `AppSidebar.svelte` para usar logo e Sidebar no desktop, criar a barra inferior mobile e reservar espaço com safe area; manter tema acessível no shell.

#### Migrations

- Não aplicável: a preferência é local ao navegador e não altera SQLite, Markdown ou schema do workspace.

#### Models

- `HomeRoute`: união literal `bible | sermons` para preferências selecionáveis; `study` é rota de navegação visível, mas não é valor válido de tela inicial enquanto estiver em breve.
- `HomePreference`: valor serializado com a rota inicial ou ausência; entradas externas são validadas antes de uso.
- `Theme`: união literal `light | dark`; qualquer valor armazenado diferente é tratado como `light`.

#### Controllers e casos de uso

- `readHomeRoute`, `saveHomeRoute` e `clearHomeRoute`: caso de uso local sem autenticação, com fallback seguro para ausência.
- `redirectToPreferredHome`: na rota `/`, após a aplicação estar pronta no cliente, encaminha apenas valores válidos e não interfere em outras rotas.

#### Views e experiência

- `/`: seletor com `Item`, estado vazio de preferência e ação clara para cada entrada.
- `/config`: formulário de escolha com ajuda, estado selecionado, ação de salvar e ação secundária de remover; feedback anunciado por `aria-live`.
- `/bible`, `/sermons` e `/study`: PageHeader simples, Breadcrumb textual e estado inicial de conteúdo, com estudo marcado como “Em breve”.
- Shell: `Sidebar` expandido no desktop, controlável no mobile, links com foco e rota atual.
- PWA: manifesto e metadados de instalação, registro do service worker, cache versionado de assets/rotas e status de rede não bloqueante.
- Tema: controle claro/escuro no Sidebar desktop e cabeçalho mobile, com classe `.dark` no elemento raiz e tokens centralizados.
- Navegação responsiva: Sidebar somente no desktop e `nav` inferior fixa no mobile; safe area no próprio controle e padding inferior no conteúdo.
- Marca: logo horizontal do asset fornecido no cabeçalho/Sidebar e ícones quadrados derivados para instalação.

#### Queries e repositórios

- Não aplicável: não há consulta de conteúdo nesta fatia. A única leitura é a preferência local validada.

#### Jobs e processamento assíncrono

- Não aplicável: leitura e gravação locais são síncronas e não dependem de rede.

#### Estrutura de arquivos

```text
specs/completed/0002-tela-inicial-navegacao/
  spec.md
  research/shadcn-svelte-item-sidebar.md
apps/web/src/
  lib/components/ui/item/
  lib/components/ui/sidebar/
  lib/features/navigation/
  lib/navigation/home-preference.ts
  routes/+layout.svelte
  routes/+page.svelte
  routes/bible/+page.svelte
  routes/sermons/+page.svelte
  routes/study/+page.svelte
  routes/config/+page.svelte
```

### 9. Modelo de dados

#### Entidades

| Entidade               | Identidade               | Atributos e regras                                                                                        | Relações                                                     |
| ---------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Tela inicial preferida | chave local do navegador | `bible` ou `sermons`; ausência representa o seletor; `study` não pode ser salvo enquanto estiver em breve | controla o redirecionamento de `/` e a existência do Sidebar |

#### Estados e transições

| Entidade               | Estado atual | Evento                             | Próximo estado | Invariantes                                  |
| ---------------------- | ------------ | ---------------------------------- | -------------- | -------------------------------------------- |
| Tela inicial preferida | ausente      | salvar Bíblia ou sermão            | definida       | valor pertence ao conjunto permitido         |
| Tela inicial preferida | definida     | escolher outra área disponível     | definida       | somente uma rota válida permanece salva      |
| Tela inicial preferida | definida     | remover ou detectar valor inválido | ausente        | `/` mostra o seletor e o Sidebar fica oculto |

#### Migração e retenção

- A preferência vive enquanto a pessoa mantiver os dados locais do navegador; uma versão futura pode removê-la sem afetar os arquivos do workspace. Não há migração nem retenção remota.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. A entrega cria o seletor inicial, configuração, shell, navegação e estados mínimos das áreas de produto.

#### Stack e convenções de interface

- SvelteKit 2.70.2 e Svelte 5.56.9 em `apps/web`, com rotas filesystem e testes de componente/browser em Vitest + Playwright. A base shadcn-svelte foi inicializada nesta fatia e seus componentes `Item` e `Sidebar` foram copiados para `src/lib/components/ui`.
- Preservar o onboarding existente em `+page.svelte`, o idioma `pt-BR`, o uso individual local e o design calmo já aplicado. Alterar a superfície mínima de workspace para virar a entrada do produto apenas depois do onboarding.

#### Telas e responsabilidades

- `/`: pessoa sem preferência; escolher Bíblia, sermão ou consultar o estudo em breve; entrada e saída são navegação para o módulo.
- `/config`: pessoa com ou sem preferência; salvar Bíblia/sermão ou remover a escolha; saída é a preferência local e retorno ao módulo ou seletor.
- `/bible`: pessoa que escolheu ler; mostrar shell, breadcrumb `OpenBible / Bíblia` e estado inicial do leitor futuro.
- `/sermons`: pessoa que escolheu preparar; mostrar shell, breadcrumb `OpenBible / Sermões` e estado inicial do construtor futuro.
- `/study`: qualquer pessoa que acessar a rota; mostrar shell quando houver preferência e estado explícito de módulo em breve.

#### Fluxo de informação e navegação

- Após o onboarding, `/` lê a preferência; sem valor, mostra os `Item`; com Bíblia/sermão válido, navega para a rota correspondente.
- Cada módulo e `/config` recebe o shell global; o Sidebar mantém links para as áreas e Configuração. `/` sem preferência é uma exceção sem shell para que o seletor seja a única decisão visível.
- Todos os destinos usam breadcrumb simples com `OpenBible` como contexto inicial e o módulo/tela atual, com o item atual sem link.

#### Menus e navegação principal

- Menu principal (Sidebar): `Bíblia → /bible`, `Sermões → /sermons`, `Estudos → /study`, `Configuração → /config`; estudo mostra estado em breve na página, sem esconder o destino solicitado.
- Em desktop, o Sidebar permanece expandido; em mobile, usa o trigger/estado responsivo do componente shadcn-svelte e não deixa texto cortado. A rota atual recebe `aria-current="page"` e estado visual de seleção.
- Em desktop, o Sidebar permanece expandido/recolhível; em mobile, o trigger/drawer é substituído por uma barra inferior persistente com quatro links e não deixa texto cortado. A rota atual recebe `aria-current="page"` e estado visual de seleção.
- Sem preferência, os links de navegação não aparecem no shell da rota `/`; as três opções do seletor são o caminho principal.

#### Formulários e ações

- `/config` tem um grupo de opções com labels visíveis: “Ler a Bíblia” e “Montar um sermão”; “Montar um estudo” é exibido como desabilitado e acompanhado de “Em breve”.
- A ação primária “Salvar tela inicial” grava a opção disponível e anuncia sucesso; a ação secundária “Remover preferência” limpa a escolha e anuncia que `/` voltará a mostrar o seletor.
- Se a opção for inválida ou não houver suporte ao armazenamento local, a tela não quebra: informa o erro e preserva a seleção visual para nova tentativa.

#### Composição e disposição

- O seletor usa uma composição editorial com título orientado à tarefa, descrição curta e grupo vertical de três `Item`, com área de toque confortável e hierarquia por estado.
- O shell usa Sidebar à esquerda e landmark `main` à direita; as rotas mínimas mantêm PageHeader, breadcrumb e um estado de conteúdo amplo. Em telas estreitas o conteúdo empilha e o menu vira controle recolhível.
- O layout preserva o tema claro existente como base, tokens centralizados pela inicialização shadcn-svelte e espaçamento/contraste coerentes com `DESIGNSYSTEM.MD`.
- O layout usa `viewport-fit=cover`, `env(safe-area-inset-*)`, padding de conteúdo compatível e os tokens shadcn-svelte claros/escuros fornecidos; a marca usa o logo real em vez de um monograma textual.

#### Blocos React e componentes selecionados

| Tela                      | Bloco React                  | Responsabilidade                              | Arquivo previsto                                                  | Componente ou composição                                                                    | Origem                  | Reuso ou extensão                                                           |
| ------------------------- | ---------------------------- | --------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `/` e `/config`           | `InitialScreenPicker` Svelte | Renderizar opções, estado selecionado e ações | `apps/web/src/lib/features/navigation/InitialScreenPicker.svelte` | `Item`, `ItemContent`, `ItemTitle`, `ItemDescription`                                       | shadcn-svelte + próprio | Novo bloco para seletor e configuração; reutilizado nas duas telas          |
| Shell global              | `AppSidebar` Svelte          | Navegação principal e estado ativo            | `apps/web/src/lib/features/navigation/AppSidebar.svelte`          | `Sidebar.Provider`, `Sidebar.Root`, `Sidebar.Menu`, `Sidebar.MenuButton`, `Sidebar.Trigger` | shadcn-svelte + próprio | Novo bloco global; não duplicar links nas páginas                           |
| Todas as rotas de produto | `ProductPage` Svelte         | PageHeader, breadcrumb e estado inicial       | `apps/web/src/lib/features/navigation/ProductPage.svelte`         | composição própria                                                                          | Próprio                 | Reutilizar em Bíblia, Sermões e Estudos até os módulos funcionais existirem |
| Shell global              | `AppShell` Svelte            | Condicionar Sidebar e prover `main`           | `apps/web/src/routes/+layout.svelte`                              | `AppSidebar`                                                                                | Próprio                 | Único shell para rotas de produto                                           |

- A coluna “Bloco React” é mantida por compatibilidade do template; os blocos reais desta entrega são Svelte, conforme a stack do projeto.
- `Item` e `Sidebar` entram em `INTERFACE.md` com origem, arquivos locais, estados, teclado, consumidores e regra de reuso.

#### Estados e acessibilidade

- Loading: enquanto a página verifica o workspace/preferência no cliente, não mostrar uma navegação incorreta; preservar o loading do onboarding existente.
- Vazio: sem preferência, título e três opções no `/`; a ausência é comunicada por texto, não apenas por layout.
- Erro: falha de leitura/gravação local apresenta mensagem próxima à ação e mantém o formulário utilizável.
- Sucesso: salvar informa a rota configurada e oferece seguir para ela; remover informa o retorno ao seletor.
- Permissão: não aplicável; não há autenticação ou papéis nesta fatia.
- Teclado e foco: links e ações nativos, foco visível, ordem natural, trigger mobile acionável por teclado e `aria-current` na rota ativa.
- Leitor de tela: labels e descrições visíveis, estados “Em breve” e “selecionado” anunciados, `aria-live` para feedback de configuração e landmark `main` no shell.
- PWA/offline: status “Você está offline” é anunciado sem bloquear os links; manifesto, cache e fallback são verificados no build/preview. Tema informa ação no `aria-label` e não depende só de cor. Safe area é verificada no mobile com conteúdo rolável acima da barra.
- Visual: conferir 320px e 1440px nos estados sem preferência, com preferência, configuração, menu mobile aberto/fechado e estudo em breve; respeitar `prefers-reduced-motion`.

#### Contrato CRUD

- Não aplicável: esta fatia não cria, edita ou apaga registros de domínio; remover a preferência é uma ação de configuração simples, não um CRUD. Portanto não há `PageHeader` de CRUD, `DataGrid`, coluna `ID` nem ações de editar/apagar a serem reutilizados nesta entrega; as páginas ainda terão cabeçalho orientado à tarefa.

#### Revisão visual durante o desenvolvimento

- A revisão visual será feita com Vitest Browser/Playwright e inspeção do servidor local em 320px e 1440px, percorrendo seletor, configuração, Sidebar expandido/recolhido e páginas mínimas. Serão conferidos bordas, espaçamentos, margens, padding, tipografia, overflow, foco e quebra dos rótulos.

#### APIs expostas

- Rotas de página GET: `/`, `/bible`, `/sermons`, `/study` e `/config`; não exigem autenticação e não recebem payload de servidor.
- Contrato local: `readHomeRoute(): HomeRoute | null`, `saveHomeRoute(route: HomeRoute): void` e `clearHomeRoute(): void`; valores são validados antes de redirecionamento.

#### APIs externas utilizadas

- Nenhuma API externa de produto. A instalação usa documentação/CLI do shadcn-svelte apenas para materializar código local; a execução da preferência não faz rede.

#### Documentação das APIs consultadas

- Documentação pública do shadcn-svelte Item, Sidebar e instalação SvelteKit, acessada em 2026-08-31 e indexada em `research/shadcn-svelte-item-sidebar.md`.

#### Eventos e outros contratos

- Evento de navegação: links nativos do SvelteKit para as cinco rotas da fatia.
- Estado local serializado: uma string `bible` ou `sermons` na chave da preferência; qualquer outro valor é descartado como ausência.

### 11. Estratégia TDD

- **Unidade**: validar leitura, gravação, remoção e rejeição de valores inválidos da preferência local.
- **Integração/contrato**: verificar que a página inicial e a configuração traduzem a preferência em destinos e estado de shell.
- **BDD/aceite**: AC-001 prova o seletor e entradas; AC-002 prova persistência e redirecionamento; AC-003 prova Sidebar condicional, rota ativa e remoção.
- **Runner TDD**: Vitest, materializado pelo script existente `apps/web/package.json#test:tdd`.
- **E2E**: Vitest Browser Mode com Playwright Chromium para as jornadas de navegação, configuração, teclado e responsividade observável no DOM.
- **Verificação manual**: inspeção visual nos viewports 320px/1440px e conferência de menu mobile, porque o runner não substitui julgamento tipográfico e de overflow.
- **PWA**: build/preview do SvelteKit com inspeção do manifesto, registro do service worker e navegação sem rede após cache; não criar `.feature`.

#### Evidência RED-GREEN-REFACTOR

| IDs                                                   | BDD de referência                  | Teste TDD informado pelo BDD                                                                                                               | RED observado                                                                                                                       | GREEN observado                                                                              | Refactor/regressão                                                                                       |
| ----------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| US-001, FR-001, FR-003, NFR-001, AC-001               | AC-001 na seção 6                  | `apps/web/src/routes/page.svelte.spec.ts` — caso de seletor e destinos com marcador `SPECSFY:`                                             | RED observado em 2026-09-01: a página renderizou a superfície antiga sem os links/Item esperados                                    | GREEN em 2026-09-01: 4 casos browser da página passaram                                      | Refactor: seletor isolado em `InitialScreenPicker`; regressão completa passou                            |
| US-001, FR-002, FR-003, NFR-001, AC-002               | AC-002 na seção 6                  | `apps/web/src/routes/config.svelte.spec.ts` — caso de salvar e recuperar com marcador `SPECSFY:`                                           | RED observado em 2026-09-01: importação falhou porque `/config/+page.svelte` ainda não existe                                       | GREEN em 2026-09-01: configuração salva Bíblia e anuncia sucesso                             | Refactor: preferência validada em módulo único; regressão completa passou                                |
| US-001, FR-001, FR-002, FR-003, NFR-001, AC-003       | AC-003 na seção 6                  | `apps/web/src/routes/navigation.svelte.spec.ts` — caso de Sidebar e remoção com marcador `SPECSFY:`                                        | RED observado em 2026-09-01: importação falhou porque `AppSidebar.svelte` ainda não existe                                          | GREEN em 2026-09-01: Sidebar mobile abre e marca Bíblia como rota atual                      | Refactor: links usam `Sidebar.MenuButton` com snippet de anchor; regressão completa passou               |
| US-002, FR-004, NFR-002, AC-004/AC-007/AC-008         | AC-004, AC-007 e AC-008 na seção 6 | `apps/web/src/lib/pwa/pwa.test.ts` — manifesto, cache e fallback com marcadores `SPECSFY:`                                                 | RED em 2026-08-31: 3 testes falharam por manifesto/service worker ausentes; `theme.svelte.spec.ts` também falhou por módulo ausente | GREEN em 2026-09-01: manifesto, cache versionado e cinco rotas presentes no build Cloudflare | Refactor: cache limitado à origem e rotas locais; preview reabriu `/bible` sem rede                      |
| US-003, FR-005, NFR-002, AC-005/AC-009/AC-010         | AC-005, AC-009 e AC-010 na seção 6 | `apps/web/src/lib/theme/theme.test.ts` e `apps/web/src/routes/theme.svelte.spec.ts` — tema persistido e controle com marcadores `SPECSFY:` | RED em 2026-08-31: importação falhou porque `src/lib/theme/theme.ts` e `ThemeToggle.svelte` ainda não existem                       | GREEN em 2026-09-01: três casos unitários e três browser de tema passaram                    | Refactor: preferência isolada em `openbible.theme`, classe raiz e color-scheme sincronizados             |
| US-003, FR-006, FR-007, NFR-002, AC-006/AC-011/AC-012 | AC-006, AC-011 e AC-012 na seção 6 | `apps/web/src/routes/navigation.svelte.spec.ts` — Sidebar desktop, barra mobile e logo com marcadores `SPECSFY:`                           | RED em 2026-08-31: 4 testes falharam porque o shell ainda não expõe navegação com landmark, logo ou barra mobile                    | GREEN em 2026-09-01: quatro casos browser de navegação passaram                              | Refactor: mapa único de links, Sidebar desktop, barra inferior mobile e logo derivado do asset fornecido |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD                                                            | Nível                    | Arquivo/comando esperado                                                                                       | Evidência                                                                                                              |
| --------- | ---------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| FR-001    | AC-001                                                                 | Browser                  | `apps/web/src/routes/page.svelte.spec.ts`; `bun run --cwd apps/web test:tdd -- src/routes/page.svelte.spec.ts` | GREEN: seletor renderiza links de Bíblia/sermão e estudo disabled                                                      |
| FR-001    | AC-003                                                                 | Browser                  | `apps/web/src/routes/navigation.svelte.spec.ts`                                                                | GREEN: menu oferece os quatro destinos                                                                                 |
| FR-001    | AC-002                                                                 | Browser                  | `apps/web/src/routes/config.svelte.spec.ts`                                                                    | GREEN: configuração mantém a opção Bíblia disponível                                                                   |
| FR-002    | AC-001                                                                 | Unidade/browser          | `apps/web/src/lib/navigation/home-preference.test.ts` e config spec                                            | GREEN: leitura, gravação, remoção e valor inválido cobertos                                                            |
| FR-002    | AC-002                                                                 | Browser                  | `apps/web/src/routes/config.svelte.spec.ts`                                                                    | GREEN: Bíblia é salva e feedback é anunciado                                                                           |
| FR-002    | AC-003                                                                 | Browser                  | `apps/web/src/routes/navigation.svelte.spec.ts`                                                                | GREEN: Sidebar recebe a rota ativa e usa estado móvel                                                                  |
| FR-003    | AC-001                                                                 | Browser                  | `apps/web/src/routes/page.svelte.spec.ts`                                                                      | GREEN: entrada sem preferência não renderiza shell incorreto                                                           |
| FR-003    | AC-002                                                                 | Browser                  | `apps/web/src/routes/config.svelte.spec.ts`                                                                    | GREEN: página de configuração usa composição compartilhada                                                             |
| FR-003    | AC-003                                                                 | Browser                  | `apps/web/src/routes/navigation.svelte.spec.ts`                                                                | GREEN: Sidebar mobile abre com navegação sem links aninhados                                                           |
| NFR-001   | AC-001                                                                 | Browser/inspeção         | `apps/web/src/routes/page.svelte.spec.ts`; viewports 320px/1440px                                              | GREEN: labels, foco e estado disabled verificados                                                                      |
| NFR-001   | AC-002                                                                 | Browser/inspeção         | `apps/web/src/routes/config.svelte.spec.ts`; teclado e foco                                                    | GREEN: rádios e ações nativos, foco visível e `aria-live`                                                              |
| NFR-001   | AC-003                                                                 | Browser/inspeção         | `apps/web/src/routes/navigation.svelte.spec.ts`; Sidebar mobile                                                | GREEN: trigger/drawer em 320px e Sidebar expandido em 1440px verificados                                               |
| FR-004    | AC-004, AC-007, AC-008                                                 | Unidade/build/preview    | `apps/web/src/lib/pwa/pwa.test.ts`; manifest/service worker                                                    | GREEN: 3 testes; build Cloudflare gerou manifest, worker e páginas prerenderizadas; preview recuperou `/bible` offline |
| FR-005    | AC-005, AC-009, AC-010                                                 | Unidade/browser          | `apps/web/src/lib/theme/theme.test.ts`; `apps/web/src/routes/theme.svelte.spec.ts`                             | GREEN: 6 testes de tema; persistência e classe `.dark` verificadas                                                     |
| FR-006    | AC-006, AC-011, AC-012                                                 | Browser/inspeção         | `apps/web/src/routes/navigation.svelte.spec.ts`; viewports 320px/1440px                                        | GREEN: 4 testes; Sidebar desktop e barra inferior mobile renderizados                                                  |
| FR-007    | AC-006, AC-011, AC-012                                                 | Browser/build            | `apps/web/src/routes/navigation.svelte.spec.ts`; assets estáticos                                              | GREEN: logo e dois ícones PWA presentes e usados                                                                       |
| NFR-002   | AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 | Browser/preview/inspeção | PWA, tema, navegação e viewports                                                                               | GREEN: 33 testes; preview confirmou offline, tema, reflow 320px e ausência de overflow horizontal                      |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed — 2026-08-31
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0002-tela-inicial-navegacao/spec.md`
- **Achados**: nenhum BLOCKER; a atualização tem três histórias, nove cenários novos, cobertura US/FR/NFR, interface, persistência local e comportamento offline delimitado.

#### Gate do Ato II — Plano

- **Resultado**: Passed — 2026-08-31
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0002-tela-inicial-navegacao/spec.md`
- **Achados**: nenhum BLOCKER; 19 tarefas, três predecessores TDD novos com RED válido, paths exatos, checklist canônico e dependências acíclicas.

#### Gate do Ato III — Entrega

- **Resultado**: Passed — 2026-09-01
- **Comandos**:
  - `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0002-tela-inicial-navegacao/spec.md apps/web/src --full-chain` → OK, 24/24 IDs em 10 arquivos de teste.
  - `node .agents/skills/specsfy-07-implement/scripts/verify_evidence.mjs specs/completed/0002-tela-inicial-navegacao/spec.md /home/claudio/Projects/openbible-worksplace` → PASSED.
  - `bun run --cwd apps/web test:tdd` → 33 testes passaram.
  - `bun run --cwd apps/web check-types` → passou.
  - `bun run --cwd apps/web build` → passou com `@sveltejs/adapter-cloudflare`, `_worker.js`, manifest, worker e cinco páginas prerenderizadas.
  - `bunx wrangler dev --local --ip 127.0.0.1 --port 4178` → respondeu manifesto, service worker e rotas pelo worker Cloudflare; o script `apps/web#preview` usa esse mesmo runtime após o build.
  - `bun run --cwd apps/web lint` → passou; 0 erros e 178 warnings `prefer-const` preexistentes/gerados.
  - `node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check` → passou.
  - Inspeção Playwright em preview Cloudflare → passou; cache versionado, `/bible` reabriu sem rede, aviso offline apareceu com `navigator.onLine=false`, mobile 320px não teve overflow e desktop 1440px manteve o shell.
- **Achados**: implementação, testes, tipos, lint, build Cloudflare, documentação e rastreabilidade estão verdes. O lint permanece sem erros, com warnings `prefer-const` já presentes nos primitives e componentes existentes.
- **Atualização de 2026-08-31/2026-09-01**: o pedido de PWA, tema, safe area, logo e navegação mobile reabriu os três atos; as evidências históricas da versão anterior foram preservadas e os IDs novos agora têm evidência GREEN.

### 14. Tarefas

#### Atualização 2026-08-31 — PWA, tema e navegação responsiva

- [x] T014 [TEST] [TDD] [US-002] [US-003] Derivar contratos de artefatos PWA, tema e navegação em `apps/web/src/lib/pwa/pwa.test.ts`, `apps/web/src/lib/theme/theme.test.ts` e `apps/web/src/routes/navigation.svelte.spec.ts` — Refs: US-002, US-003, FR-004, FR-005, FR-006, FR-007, NFR-002, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: none
  - [x] **PREP**: Ler AC-004 a AC-012, confirmar Vitest Node para artefatos estáticos e Vitest Browser para comportamento do shell.
  - [x] **EXECUTE**: Escrever três casos focais nos caminhos declarados, com marcadores `SPECSFY:` cobrindo os contratos PWA, tema, logo e navegação, sem código de produção.
  - [x] **VERIFY**: Observar RED pela ausência de manifesto, service worker, tema, barra mobile e logo usado no shell.
  - [x] **VISUAL**: Não aplicável; os casos desta tarefa verificam artefatos e ciclo de cache.
  - [x] **EVIDENCE**: Registrar comando focal, falha válida e causa na tabela RED-GREEN-REFACTOR.
  - [x] **IMPROVE**: Separar contrato do manifesto de comportamento de fallback para não testar somente a existência do arquivo.

- [x] T015 [TEST] [TDD] [US-002] [US-003] Derivar testes de recuperação e persistência em `apps/web/src/lib/pwa/pwa.test.ts`, `apps/web/src/lib/theme/theme.test.ts` e `apps/web/src/routes/theme.svelte.spec.ts` — Refs: US-002, US-003, FR-004, FR-005, FR-006, FR-007, NFR-002, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: none
  - [x] **PREP**: Ler AC-004 a AC-012 e confirmar fallback offline, `localStorage` separado da preferência de tela inicial e recuperação de valores inválidos.
  - [x] **EXECUTE**: Escrever três casos de unidade/browser nos caminhos declarados com marcadores `SPECSFY:` cobrindo recuperação, persistência e estados responsivos, sem código de produção.
  - [x] **VERIFY**: Observar RED pela ausência do módulo de tema, dos artefatos PWA e da composição mobile.
  - [x] **VISUAL**: Não aplicável na preparação TDD; a tela será inspecionada na tarefa de código.
  - [x] **EVIDENCE**: Registrar comando focal, falha válida e causa na tabela RED-GREEN-REFACTOR.
  - [x] **IMPROVE**: Provar classe raiz, persistência e recuperação inválida em casos distintos.

- [x] T016 [TEST] [TDD] [US-002] [US-003] Derivar testes integrados do shell em `apps/web/src/routes/navigation.svelte.spec.ts`, `apps/web/src/routes/theme.svelte.spec.ts` e `apps/web/src/lib/pwa/pwa.test.ts` — Refs: US-002, US-003, FR-004, FR-005, FR-006, FR-007, NFR-002, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: none
  - [x] **PREP**: Ler AC-004 a AC-012, revisar o shell atual e os viewports definidos.
  - [x] **EXECUTE**: Atualizar os testes nos caminhos declarados com três casos integrados e marcadores `SPECSFY:` cobrindo o ciclo completo, sem código de produção.
  - [x] **VERIFY**: Observar RED pela ausência da barra inferior, tema, status offline e asset de logo usado no shell.
  - [x] **VISUAL**: Não aplicável na preparação TDD; a inspeção ocorrerá em T018.
  - [x] **EVIDENCE**: Registrar comando focal, falha válida e causa na tabela RED-GREEN-REFACTOR.
  - [x] **IMPROVE**: Verificar destinos e `aria-current` sem acoplar o teste a classes de layout.

- [x] T017 [CODE] [US-002] Implementar manifesto, assets PWA, service worker, registro e status offline em `apps/web/static/manifest.webmanifest`, `apps/web/src/service-worker.ts` e `apps/web/src/lib/features/navigation/NetworkStatus.svelte` — Refs: US-002, US-003, FR-004, FR-005, FR-006, FR-007, NFR-002, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T014, T015, T016
  - [x] **PREP**: Confirmar RED e o contrato de cache do app shell e das cinco rotas.
  - [x] **EXECUTE**: Adicionar manifesto standalone, ícones, worker versionado com cache-first de assets e network-first/fallback de navegação, registro em produção e indicador de rede.
  - [x] **VERIFY**: Executar testes focais, build Cloudflare e preview; validar reabertura sem rede depois do primeiro carregamento.
  - [x] **VISUAL**: Conferir status offline, safe area, overflow, bordas, espaçamentos, margens, padding e tipografia nos viewports 320px/1440px.
  - [x] **EVIDENCE**: Registrar arquivos, cache, build Cloudflare, preview e resultado offline.
  - [x] **IMPROVE**: Limitar o worker às rotas/assets do app e remover caches antigos por versão.

  <!-- specsfy:evidence {"task":"T017","refs":["US-002","US-003","FR-004","FR-005","FR-006","FR-007","NFR-002","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012"],"files":["apps/web/static/manifest.webmanifest","apps/web/static/icon-192.png","apps/web/static/icon-512.png","apps/web/src/service-worker.ts","apps/web/src/lib/features/navigation/NetworkStatus.svelte","apps/web/src/routes/+layout.svelte","apps/web/src/app.html","apps/web/wrangler.jsonc"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/pwa/pwa.test.ts","exit":0},{"run":"bun run --cwd apps/web build","exit":0}]} -->

- [x] T018 [CODE] [US-003] Implementar tokens shadcn-svelte, tema, logo e navegação responsiva em `apps/web/src/app.css`, `apps/web/src/lib/theme/theme.ts`, `apps/web/src/lib/features/navigation/ThemeToggle.svelte` e `apps/web/src/lib/features/navigation/AppSidebar.svelte` — Refs: US-002, US-003, FR-004, FR-005, FR-006, FR-007, NFR-002, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T014, T015, T016
  - [x] **PREP**: Confirmar RED, tokens fornecidos, logo de Downloads e composição Sidebar existente.
  - [x] **EXECUTE**: Aplicar `:root`/`.dark`, criar tema persistido e controle acessível, substituir monograma pelo logo, manter Sidebar no desktop e criar barra inferior mobile com safe area.
  - [x] **VERIFY**: Executar testes focais, suíte relacionada e typecheck; conferir reflow, foco e persistência após recarregar.
  - [x] **VISUAL**: Inspecionar 320px/1440px em claro/escuro, Sidebar, barra mobile, logo, foco, safe area, zoom, texto longo, bordas, espaçamentos, margens, padding e tipografia.
  - [x] **EVIDENCE**: Registrar arquivos, inspeção visual e comandos aprovados.
  - [x] **IMPROVE**: Reutilizar o mapa de links e evitar duplicação de regras de tema entre layout, Sidebar e mobile.

  <!-- specsfy:evidence {"task":"T018","refs":["US-002","US-003","FR-005","FR-006","FR-007","NFR-002","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012"],"files":["apps/web/src/app.css","apps/web/src/lib/theme/theme.ts","apps/web/src/lib/features/navigation/ThemeToggle.svelte","apps/web/src/lib/features/navigation/AppSidebar.svelte","apps/web/static/logo.png","apps/web/static/logo-mark.png"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/theme/theme.test.ts src/routes/theme.svelte.spec.ts src/routes/navigation.svelte.spec.ts","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bun run --cwd apps/web lint","exit":0}]} -->

- [x] T019 [DOC] [US-002] [US-003] Atualizar documentação, gates e regressão da atualização em `INTERFACE.md`, `PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `docs/` e `.specsfy/PACKAGES.md` — Refs: US-002, US-003, FR-004, FR-005, FR-006, FR-007, NFR-002, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T017, T018
  - [x] **PREP**: Conferir arquivos PWA, tema, interface, documentação e evidências históricas preservadas.
  - [x] **EXECUTE**: Atualizar `INTERFACE.md`, `PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md` se aplicável, `.specsfy/DATABASE.md`, `docs/` e `.specsfy/PACKAGES.md`; preencher seções 11–13.
  - [x] **VERIFY**: Executar suíte completa, typecheck, lint, build, documentação, rastreabilidade e evidência.
  - [x] **VISUAL**: Repassar claro/escuro, desktop/mobile, offline, safe area, foco, bordas, espaçamentos, margens, padding, tipografia e overflow.
  - [x] **EVIDENCE**: Registrar os comandos finais e a cobertura dos AC novos e anteriores.
  - [x] **IMPROVE**: Consolidar a decisão local-first sem prometer offline de dados que ainda não foram carregados.

  <!-- specsfy:evidence {"task":"T019","refs":["US-002","US-003","FR-004","FR-005","FR-006","FR-007","NFR-002","AC-004","AC-005","AC-006","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012"],"files":["INTERFACE.md","PROJECT.md",".specsfy/STACK.md",".specsfy/RULES.md",".specsfy/DATABASE.md","docs/README.md","docs/application.md","docs/frontend.md","docs/integrations.md","docs/packages.md","docs/testing.md",".specsfy/PACKAGES.md","apps/web/package.json","apps/web/wrangler.jsonc"],"commands":[{"run":"bun run --cwd apps/web test:tdd","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bun run --cwd apps/web build","exit":0},{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0002-tela-inicial-navegacao/spec.md apps/web/src --full-chain","exit":0}]} -->

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Derivar o teste browser do AC-001 em `apps/web/src/routes/page.svelte.spec.ts` — Refs: US-001, FR-001, FR-003, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-001, confirmar o seletor sem preferência e o runner Vitest Browser.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY: US-001 FR-001 FR-003 NFR-001 AC-001`, sem criar `.feature`.
  - [x] **VERIFY**: Observar RED porque a página atual não possui os três itens nem as rotas de produto.
  - [x] **VISUAL**: Não aplicável; a tarefa materializa o contrato browser antes da produção.
  - [x] **EVIDENCE**: Registrar o comando focal, o RED e a causa na seção 11.
  - [x] **IMPROVE**: Manter o teste no menor nível que prova rótulos, destinos e estudo indisponível.

- [x] T002 [TEST] [TDD] [US-001] Derivar o teste browser do AC-002 em `apps/web/src/routes/config.svelte.spec.ts` — Refs: US-001, FR-002, FR-003, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-002, confirmar a gravação de Bíblia e a entrada em `/`.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY: US-001 FR-002 FR-003 NFR-001 AC-002`, sem criar `.feature`.
  - [x] **VERIFY**: Observar RED porque `/config` e a preferência ainda não existem.
  - [x] **VISUAL**: Não aplicável; a tarefa materializa o contrato browser antes da produção.
  - [x] **EVIDENCE**: Registrar o comando focal, o RED e a causa na seção 11.
  - [x] **IMPROVE**: Cobrir a reabertura pela rota `/` em vez de testar apenas a chamada interna de storage.

- [x] T003 [TEST] [TDD] [US-001] Derivar o teste browser do AC-003 em `apps/web/src/routes/navigation.svelte.spec.ts` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-003, confirmar Sidebar ativo, remoção e estado em breve.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY: US-001 FR-001 FR-002 FR-003 NFR-001 AC-003`, sem criar `.feature`.
  - [x] **VERIFY**: Observar RED porque não existe shell global nem ação de remoção.
  - [x] **VISUAL**: Não aplicável; a tarefa materializa o contrato browser antes da produção.
  - [x] **EVIDENCE**: Registrar o comando focal, o RED e a causa na seção 11.
  - [x] **IMPROVE**: Verificar presença e ausência do Sidebar pelo landmark/label, não apenas por classe CSS.

#### Fase 2 — US-001 Escolher e retomar minha área de trabalho (P1)

**Objetivo**: transformar o workspace preparado em uma entrada orientada e configurável para Bíblia e sermões, com estudos visíveis como futuro.
**Teste independente**: `bun run --cwd apps/web test:tdd` com os três testes browser e os testes unitários da preferência.

- [x] T004 [CODE] [US-001] Inicializar shadcn-svelte e adicionar `Item` e `Sidebar` em `apps/web/src/lib/components/ui/` — Refs: US-001, FR-001, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED, aliases, dependências e fontes oficiais indexadas.
  - [x] **EXECUTE**: Inicializar a base CSS/aliases do shadcn-svelte e copiar somente `Item` e `Sidebar`, revisando roles, foco, trigger e estado ativo.
  - [x] **VERIFY**: Executar typecheck e o teste focal após a integração dos componentes.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia dos componentes em 320px e 1440px, com Sidebar expandido/recolhido e Item focável; inspeção confirmou o desktop e o drawer mobile.
  - [x] **EVIDENCE**: Registrar arquivos gerados, dependências e comandos aprovados.
  - [x] **IMPROVE**: Remover componentes ou dependências não usados pela fatia, mantendo o núcleo mínimo; foram mantidas apenas as dependências transitivas exigidas pelos primitives.

  <!-- specsfy:evidence {"task":"T004","refs":["US-001","FR-001","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/lib/components/ui/item","apps/web/src/lib/components/ui/sidebar","apps/web/components.json"],"commands":[{"run":"bun run --cwd apps/web check-types","exit":0}]} -->

- [x] T005 [CODE] [US-001] Implementar a preferência de tela inicial em `apps/web/src/lib/navigation/home-preference.ts` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003, T004
  - [x] **PREP**: Confirmar o contrato de `HomeRoute`, o fallback inválido e o formulário definido na seção 10.
  - [x] **EXECUTE**: Implementar leitura, gravação e remoção local validadas, sem acoplar a preferência ao banco `.openbible/index.sqlite`.
  - [x] **VERIFY**: Executar os testes da preferência e typecheck; os três testes unitários passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia, além de labels, foco, estados selecionado/desabilitado, mensagens e quebra em 320px e 1440px por meio das telas consumidoras.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos e ausência de mudança em `PROJECT.md`/`RULES.md` além do escopo já confirmado.
  - [x] **IMPROVE**: Centralizar a validação de rota para impedir que cada tela implemente seu próprio fallback.

  <!-- specsfy:evidence {"task":"T005","refs":["US-001","FR-002","NFR-001","AC-002","AC-003"],"files":["apps/web/src/lib/navigation/home-preference.ts","apps/web/src/routes/config/+page.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/lib/navigation/home-preference.test.ts","exit":0}]} -->

- [x] T006 [CODE] [US-001] Implementar o shell compartilhado em `apps/web/src/routes/+layout.svelte` e `apps/web/src/lib/features/navigation/AppSidebar.svelte` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003, T004, T005
  - [x] **PREP**: Confirmar o Sidebar condicional, links, breadcrumbs, estados das páginas e preservação do onboarding.
  - [x] **EXECUTE**: Compor `AppSidebar` com a rota ativa, trigger mobile e shell global responsivo; não duplicar navegação nas páginas.
  - [x] **VERIFY**: Executar testes de navegação, suíte do app, typecheck e build; a suíte completa passou com 21 testes.
  - [x] **VISUAL**: Conferir seletor, Sidebar, rota ativa, menu mobile, estudo em breve, bordas, espaçamentos, margens, padding, tipografia e overflow em 320px/1440px; screenshots confirmaram ambos os estados.
  - [x] **EVIDENCE**: Registrar GREEN, arquivos, comandos e o fato de que a spec 0001/onboarding foi preservada.
  - [x] **IMPROVE**: Manter o conteúdo das páginas mínimas em uma composição reutilizável até os módulos de domínio existirem.
  <!-- specsfy:evidence {"task":"T006","refs":["US-001","FR-001","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/routes/+layout.svelte","apps/web/src/lib/features/navigation/AppSidebar.svelte","apps/web/src/lib/features/navigation/ProductPage.svelte","apps/web/src/routes/bible/+page.svelte","apps/web/src/routes/sermons/+page.svelte","apps/web/src/routes/study/+page.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd","exit":0}]} -->

#### Fase de interface

- [x] T007 [CODE] [US-001] Implementar o seletor inicial e a rota `/` em `apps/web/src/routes/+page.svelte` e `apps/web/src/lib/features/navigation/InitialScreenPicker.svelte` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003, T004, T005, T006
  - [x] **PREP**: Confirmar o seletor sem preferência, a preservação do onboarding e os `Item` disponíveis.
  - [x] **EXECUTE**: Renderizar os três `Item`, os destinos disponíveis e o redirecionamento da preferência sem remover o fluxo da spec 0001; registrar o bloco `InitialScreenPicker` e os consumidores em `INTERFACE.md`.
  - [x] **VERIFY**: Exercitar rótulos, links, estudo desabilitado e entrada em `/` com e sem preferência; o teste de redirecionamento e a suíte completa passaram.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do seletor nos estados sem preferência e loading em 320px/1440px.
  - [x] **EVIDENCE**: Registrar arquivos, comandos e resultado da interação.
  - [x] **IMPROVE**: Usar uma única composição `InitialScreenPicker` para evitar divergência entre `/` e `/config`.

  <!-- specsfy:evidence {"task":"T007","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/routes/+page.svelte","apps/web/src/lib/features/navigation/InitialScreenPicker.svelte","apps/web/src/routes/page.svelte.spec.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/routes/page.svelte.spec.ts","exit":0}]} -->

- [x] T008 [CODE] [US-001] Implementar a configuração da preferência em `apps/web/src/routes/config/+page.svelte` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003, T004, T005, T006
  - [x] **PREP**: Confirmar labels, ajuda, salvar, remover, feedback e estudo indisponível definidos na seção 10.
  - [x] **EXECUTE**: Compor a página `/config` com o formulário acessível e ações de salvar/remover ligadas ao módulo de preferência.
  - [x] **VERIFY**: Exercitar gravação, remoção, erro de armazenamento e retorno ao destino; o teste browser de gravação passou.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do formulário, foco e estados selecionado/desabilitado em 320px/1440px.
  - [x] **EVIDENCE**: Registrar arquivos, feedback anunciado e comandos aprovados.
  - [x] **IMPROVE**: Manter a opção de estudo visível como futuro sem permitir um estado de configuração inválido.

  <!-- specsfy:evidence {"task":"T008","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/routes/config/+page.svelte","apps/web/src/lib/features/navigation/InitialScreenPicker.svelte","apps/web/src/routes/config.svelte.spec.ts"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/routes/config.svelte.spec.ts","exit":0}]} -->

- [x] T009 [CODE] [US-001] Implementar a superfície mínima de Bíblia em `apps/web/src/routes/bible/+page.svelte` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003, T004, T005, T006
  - [x] **PREP**: Confirmar shell, breadcrumb e estado inicial do leitor futuro.
  - [x] **EXECUTE**: Renderizar `ProductPage` com título Bíblia e estado vazio orientado, sem simular leitura funcional.
  - [x] **VERIFY**: Confirmar carregamento direto, link ativo do Sidebar e landmark `main` na inspeção do preview.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia da superfície em 320px/1440px; desktop foi registrado em screenshot e mobile no fluxo do shell.
  - [x] **EVIDENCE**: Registrar arquivo e resultado do acesso direto.
  - [x] **IMPROVE**: Deixar a composição preparada para receber o leitor real sem duplicar shell.

  <!-- specsfy:evidence {"task":"T009","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/routes/bible/+page.svelte","apps/web/src/lib/features/navigation/ProductPage.svelte"],"commands":[{"run":"bun run --cwd apps/web build","exit":0}]} -->

- [x] T010 [CODE] [US-001] Implementar a superfície mínima de sermões em `apps/web/src/routes/sermons/+page.svelte` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003, T004, T005, T006
  - [x] **PREP**: Confirmar shell, breadcrumb e estado inicial do construtor futuro.
  - [x] **EXECUTE**: Renderizar `ProductPage` com título Sermões e estado vazio orientado, sem simular edição funcional.
  - [x] **VERIFY**: Confirmar carregamento direto, link ativo do Sidebar e landmark `main` na inspeção do preview.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia da superfície em 320px/1440px.
  - [x] **EVIDENCE**: Registrar arquivo e resultado do acesso direto.
  - [x] **IMPROVE**: Reutilizar a mesma composição de produto da rota de Bíblia.

  <!-- specsfy:evidence {"task":"T010","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/routes/sermons/+page.svelte","apps/web/src/lib/features/navigation/ProductPage.svelte"],"commands":[{"run":"bun run --cwd apps/web build","exit":0}]} -->

- [x] T011 [CODE] [US-001] Implementar a superfície de estudo em breve em `apps/web/src/routes/study/+page.svelte` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003, T004, T005, T006
  - [x] **PREP**: Confirmar que estudo é destino visível, mas não opção válida de tela inicial.
  - [x] **EXECUTE**: Renderizar `ProductPage` com indicação textual “Em breve”, sem ação de conteúdo inexistente.
  - [x] **VERIFY**: Confirmar acesso pelo Sidebar e rota direta sem permitir configuração de estudo; preview mostrou a mensagem esperada.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do estado em breve em 320px/1440px; screenshot mobile confirmou o drawer e o conteúdo sem overflow.
  - [x] **EVIDENCE**: Registrar arquivo, estado comunicado e comandos aprovados.
  - [x] **IMPROVE**: Separar visualmente disponibilidade futura de estado vazio para não criar expectativa falsa.
  <!-- specsfy:evidence {"task":"T011","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/routes/study/+page.svelte","apps/web/src/lib/features/navigation/ProductPage.svelte"],"commands":[{"run":"bun run --cwd apps/web test:tdd -- src/routes/navigation.svelte.spec.ts","exit":0}]} -->

#### Fase final — Qualidade

- [x] T012 [DOC] [US-001] Atualizar `INTERFACE.md`, `.specsfy/STACK.md`, `PROJECT.md` e documentação derivada após a implementação — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T007, T008, T009, T010, T011
  - [x] **PREP**: Conferir componentes, rotas, dependências, alteração de capacidade e necessidade de regra nova.
  - [x] **EXECUTE**: Registrar Item, Sidebar, shell, seletor, preferência e rotas em `INTERFACE.md`; reconstruir `docs/` e `.specsfy/PACKAGES.md` com `$specsfy-documentator`.
  - [x] **VERIFY**: Executar `build_documentation.mjs --check`, monitor de contexto e validadores de tarefas/spec.
  - [x] **VISUAL**: Repassar bordas, espaçamentos, margens, padding e tipografia nos estados e viewports definidos na seção 10.
  - [x] **EVIDENCE**: Registrar documentação atualizada, comandos e rastreabilidade nas seções 11–13.
  - [x] **IMPROVE**: Eliminar registros duplicados e manter a documentação como projeção do código atual.

  <!-- specsfy:evidence {"task":"T012","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["INTERFACE.md","PROJECT.md",".specsfy/STACK.md",".specsfy/DATABASE.md","docs/frontend.md","docs/application.md","docs/flows.md","docs/database.md","docs/decisions.md",".specsfy/PACKAGES.md","packages/eslint-config/index.js","packages/eslint-config/package.json"],"commands":[{"run":"node .agents/skills/specsfy-documentator/scripts/build_documentation.mjs --project /home/claudio/Projects/openbible-worksplace --check","exit":0}]} -->

- [x] T013 [TEST] [TDD] [US-001] Executar regressão, aceite e rastreabilidade da fatia em `apps/web` — Refs: US-001, FR-001, FR-002, FR-003, NFR-001, AC-001, AC-002, AC-003 — Depends: T012
  - [x] **PREP**: Identificar suíte, lint, typecheck, build, monitor e auditorias Specsfy.
  - [x] **EXECUTE**: Executar Vitest, typecheck, lint, build, `check_traceability.mjs --full-chain` e `verify_evidence.mjs`.
  - [x] **VERIFY**: Confirmar todos os três AC, US/FR/NFR, sem testes pulados ou gaps; Vitest, typecheck, lint, build, rastreabilidade escopada e evidência passaram.
  - [x] **VISUAL**: Repassar bordas, espaçamentos, margens, padding e tipografia do seletor, config, shell e Sidebar em 320px/1440px e registrar o resultado.
  - [x] **EVIDENCE**: Atualizar as seções 11–13 e o Delivery Gate com os comandos finais.
  - [x] **IMPROVE**: Registrar uma retrospectiva curta sobre o limite do estudo em breve e a validação centralizada da preferência.
  <!-- specsfy:evidence {"task":"T013","refs":["US-001","FR-001","FR-002","FR-003","NFR-001","AC-001","AC-002","AC-003"],"files":["apps/web/src/routes/page.svelte.spec.ts","apps/web/src/routes/config.svelte.spec.ts","apps/web/src/routes/navigation.svelte.spec.ts","apps/web/src/lib/navigation/home-preference.test.ts","specs/completed/0002-tela-inicial-navegacao/spec.md"],"commands":[{"run":"bun run --cwd apps/web test:tdd","exit":0},{"run":"bun run --cwd apps/web check-types","exit":0},{"run":"bun run lint","exit":0},{"run":"bun run build","exit":0},{"run":"node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0002-tela-inicial-navegacao/spec.md /tmp/opencode/trace-tests --full-chain","exit":0},{"run":"node .agents/skills/specsfy-07-implement/scripts/verify_evidence.mjs specs/completed/0002-tela-inicial-navegacao/spec.md .","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003 → T004 → T005 → T006 → T007/T008/T009/T010/T011 → T012 → T013.
- Tarefas paralelas: T001, T002 e T003 são independentes; depois de T006, T007, T008, T009, T010 e T011 podem ser executadas em paralelo por tocarem telas diferentes, mas a implementação será validada como uma única fatia.
- Estratégia de MVP: entregar seletor sem preferência, configuração de Bíblia/sermão, redirecionamento, Sidebar responsivo e páginas mínimas; manter estudo explicitamente em breve.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Workspace de armazenamento configurado pela spec 0001 para a rota `/` não abrir o onboarding como estado final.
- Bun 1.4.0, SvelteKit/Svelte, Vitest Browser Mode e Playwright já presentes no monorepo.
- CLI e registry do shadcn-svelte acessíveis durante a configuração inicial; o código copiado será versionado no app.

#### Riscos

- A configuração do shadcn-svelte pode introduzir CSS/Tailwind e aliases incompatíveis com o starter → inicializar no workspace correto, revisar os arquivos gerados e validar typecheck/build antes de integrar as telas.
- A preferência pode apontar para um valor antigo ou inválido → aceitar somente a união validada e cair no seletor.
- O redirecionamento pode competir com o onboarding → somente resolver a preferência depois de o workspace estar configurado e preservar o fluxo existente.
- O Sidebar pode ocultar conteúdo em mobile → usar o comportamento responsivo do componente e testar 320px com trigger, foco e fechamento.

#### Suposições

- `/config` é o caminho público escolhido para a página de configuração, por ser curto e coerente com o pedido.
- A preferência fica no armazenamento local do navegador, separada de `.openbible/config.json`, para não alterar o contrato da spec 0001 e permitir decidir a área antes de usar conteúdo do workspace.
- Apenas Bíblia e sermão são telas iniciais selecionáveis enquanto estudo estiver em breve.
- As páginas de destino são estados mínimos, não implementações dos módulos de domínio.

### 17. Decisões

- **DEC-001**: Criar uma nova spec em vez de alterar a spec 0001 — a primeira feature declarou as áreas de produto fora do escopo; manter fontes normativas separadas reduz conflito e preserva rastreabilidade.
- **DEC-002**: Usar `/config` como rota de configuração — é uma convenção simples e reversível, sem competir com as rotas de domínio.
- **DEC-003**: Persistir a tela inicial como preferência local do navegador — atende o uso individual e o requisito de reabrir `/` sem acoplar navegação ao formato de `WorkspaceConfig`.
- **DEC-004**: Não permitir `study` como tela inicial ainda — o pedido marca a opção como “em breve”; manter o destino visível, mas desabilitado, evita declarar capacidade inexistente.
- **DEC-005**: Usar `Item` e `Sidebar` copiados do shadcn-svelte — atende a escolha explícita do usuário e deixa comportamento/acessibilidade sob manutenção do projeto, conforme a documentação consultada.
- **DEC-006**: Preservar `.openbible/index.sqlite` — o nome já é o contrato da spec 0001 para o banco auxiliar; esta fatia não altera schema nem nomenclatura de persistência.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed` para a atualização.
- [x] `Plan Gate` está `Passed` para a atualização.
- [x] `Delivery Gate` está `Passed` para a atualização.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas novas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
- [x] `INTERFACE.md`, `PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/DATABASE.md`, `docs/` e `.specsfy/PACKAGES.md` refletem o estado entregue.

### 19. Registro da atualização

- **Pedido preservado**: `specs/inbox/2026-08-31-234532-pwa-tema-navegacao-responsiva.md`.
- **Classificação**: mudança de comportamento e interface; reabre Ato I, Ato II e Ato III.
- **Motivo**: a pessoa solicitou explicitamente PWA standalone/offline, safe area, tokens de cor shadcn-svelte, tema claro/escuro, Sidebar desktop, barra mobile e logo do projeto após a conclusão da SPEC-0002.
- **IDs adicionados**: US-002, US-003, AC-004, AC-005, AC-006, FR-004, FR-005, FR-006, FR-007 e NFR-002.
- **IDs preservados**: US-001, AC-001, AC-002, AC-003, FR-001, FR-002, FR-003 e NFR-001 continuam válidos e precisam passar na regressão.
- **Evidências históricas**: as provas de 2026-09-01 permanecem no documento como histórico da versão anterior; não são reutilizadas para aprovar os IDs novos.
- **Entrega da atualização**: PWA, tema, safe area, logo, navegação responsiva, adapter Cloudflare, documentação e regressão foram concluídos em 2026-09-01.
- **Pacote concluído**: a pesquisa histórica existente em `research/` foi preservada junto desta spec.
