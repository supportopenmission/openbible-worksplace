# Especificação integrada: Melhorar experiência do PWA

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0010 |
| Slug | 0010-melhorar-experiencia-do-pwa |
| Status | Complete |
| Effort | 5 |
| Effort updated at | 2026-09-03 |
| Effort rationale | Fatia média: toca manifesto, shell, CSS, worker e lembrete local em 7 rotas; sem backend, sem migração de dados. Perfil standard. |
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

O PWA usa `favicon.png` antigo em vez do `logo-minimal.png`, o header mobile duplica a navegação que já existe na barra inferior, o safe-area e as cores de tema não fluem sob notch e barra do sistema, o status do offline e do push é incerto e o app não exibe versão.

#### Resultado desejado

PWA instalável em `standalone` com cara de app nativo: ícone certo, sem header global no mobile (cada página mostra seu título), tela fluida com safe-area e tema claro/escuro, offline verificado para rotas locais e lembrete local diário de estudo às 9h editável, com versão `0.4.0` visível.

#### Métricas de sucesso

- PWA instalado abre em `standalone` sem barra do navegador em Android e iOS.
- Nenhum header global visível no mobile em 360px; cada rota exibe um `h1` próprio.
- Rotas locais já carregadas abrem offline após o primeiro acesso.
- Lembrete local dispara no horário configurado quando permitido.
- Versão `0.4.0` visível na sidebar e em `/config`.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001**: Manifesto e metas PWA atuais → `display: standalone` já declarado, mas `theme-color` é estático (`#ffffff`), favicon aponta para `icon-192.png` e não há `apple-touch-icon`. Impacto: ajustar `app.html` e manifesto sem trocar `start_url`/`scope`.
- **R-002**: Shell mobile atual → `AppFrame.svelte` tem `desktop-header` e `mobile-header` (este último oculto salvo com contexto de notas). Impacto: remover `mobile-header` e confiar no título de cada página + barra inferior.
- **R-003**: Worker atual → `service-worker.ts` faz precache de `build`+`files`+`prerendered`, `networkFirst` para navegação e `cacheFirst` para assets, sem `push` nem `notificationclick`. Impacto: manter offline, adicionar só `notificationclick` para focar o app; lembrete usa Notification API local, sem VAPID.
- **R-004**: Lembrete sem backend → Notification API + agendamento local atende o lembrete diário das 9h sem servidor; iOS limita notificação com app fechado. Impacto: documentar limite e persistir horário localmente.

#### Fontes e contexto consultados

- `apps/web/static/manifest.webmanifest`, `apps/web/src/app.html`, `apps/web/src/service-worker.ts`, `apps/web/src/lib/pwa/service-worker-registration.ts`.
- `apps/web/src/lib/features/workspace/AppFrame.svelte`, `apps/web/src/lib/features/navigation/AppSidebar.svelte`, `apps/web/src/app.css`.
- `specs/backlog/0010-melhorar-experiencia-do-pwa.md`, `specs/inbox/2026-09-03-194051-melhorar-experiencia-do-pwa.md`, `specs/inbox/2026-08-31-234532-pwa-tema-navegacao-responsiva.md`.
- `.specsfy/USER-PROFILE.md` (nível intermediário, Vitest, PWA Cloudflare, sem login).

#### Documentação consultada

- Nenhuma fonte externa nova; sistema atual e conversa são suficientes.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo.

#### Dúvidas respondidas

- **Q**: Push nesta fatia sem backend/VAPID? → **A**: só lembrete local diário de estudo às 9h, sem push remoto (conversa atual, 2026-09-03).
- **Q**: Onde exibir a versão? → **A**: rodapé da sidebar desktop e em Configurações (conversa atual).
- **Q**: Como fica o título no mobile? → **A**: reusa o título/PageHeader existente de cada página (conversa atual).
- **Q**: Escopo do favicon? → **A**: regenerar favicon + ícones 192/512 + apple-touch a partir do `logo-minimal.png` (conversa atual).
- **Q**: Safe-area e cores? → **A**: tema dinâmico fluido com `theme-color` claro/escuro e fundo estendido (conversa atual).
- **Q**: Lembrete configurável? → **A**: padrão 9h, editável em Configurações (conversa atual).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Regenerar `favicon.png`, `icon-192.png`, `icon-512.png` e `apple-touch-icon.png` a partir de `logo-minimal.png` com `maskable` correto.
- Manifesto `standalone` com `start_url`, `scope`, ícones e cores coerentes.
- Metas PWA em `app.html`: `viewport-fit=cover`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`, `theme-color` claro/escuro.
- Remover header global no mobile; cada rota exibe seu título próprio.
- Safe-area com `env()` e fundo do tema estendido sob notch e barra inferior.
- Verificação do offline do worker para rotas locais já carregadas.
- Lembrete local diário de estudo (padrão 9h, editável em `/config`, permissão opcional).
- Versão `0.4.0` em `package.json`, sidebar e `/config`.

#### Fora de escopo

- Push remoto com VAPID/backend ou sincronização remota.
- Mudança em Markdown/YAML, SQLite auxiliar, Tauri ou autenticação.
- Redesenho de rotas ou novo design system.

#### Atores

- **Pessoa usuária do PWA**: instala, navega no mobile, usa offline e recebe lembrete local; sem login.
- **Mantenedor**: confere versão visível para diagnóstico.

### 4. Princípios e restrições do projeto

- **PR-001**: Manter SvelteKit + Svelte + shadcn-svelte local; não introduzir React.
- **PR-002**: Markdown com YAML é fonte de sermões/notas; SQLite é só auxiliar.
- **PR-003**: Sem conta no MVP; lembrete e versão são locais.
- **PR-004**: Interface segue `https://vercel.com/design.md` sem importar a marca Vercel; Geist Sans/Mono.
- **PR-005**: Shell offline cobre app shell e rotas locais já carregadas, sem prometer sincronização.

### 5. Histórias de usuário

#### US-001 — Shell PWA com cara de app nativo (P1)

Como pessoa usuária do PWA, quero ícone certo, abertura standalone e tela fluida com versão visível, para usar o OpenBible como app nativo.

**Por que P1**: é a base instalável de toda a experiência mobile.
**Teste independente**: instalar o PWA, abrir, conferir ícone, standalone, safe-area e versão `0.4.0`.
**Requisitos**: FR-001, FR-004, FR-005

#### US-002 — Navegação mobile sem header global (P1)

Como pessoa usuária no mobile, quero navegar só pela barra inferior com o título da própria página, para uma leitura de app sem duplicação.

**Por que P1**: remove a duplicação header + barra e dá identidade por tela.
**Teste independente**: navegar nas 7 rotas em 360px e conferir ausência de header global e presença de `h1` por página.
**Requisitos**: FR-002

#### US-003 — Offline verificado e lembrete diário local (P1)

Como pessoa usuária, quero abrir rotas já carregadas sem rede e receber um lembrete diário de estudo, para manter o hábito mesmo offline.

**Por que P1**: fecha o valor PWA: funciona sem rede e chama de volta sem backend.
**Teste independente**: carregar rotas online, ficar offline e reabrir; configurar lembrete e observar disparo.
**Requisitos**: FR-003, FR-006

### 6. Cenários BDD de aceite

#### AC-001 — Abertura standalone instalada

**Cobre**: US-001, FR-001, FR-003, FR-005, NFR-001

```gherkin
@US-001 @FR-001 @FR-003 @FR-005 @NFR-001 @AC-001
Feature: Abertura standalone do PWA

  Scenario: Abrir o PWA instalado como app nativo
    Given o PWA está instalado a partir do manifesto
    When a pessoa abre o app instalado
    Then ele abre em display standalone sem barra do navegador
    And start_url e scope mantêm a navegação dentro do app
    And o shell versionado 0.4.0 abre as rotas locais já carregadas mesmo sem rede
```

#### AC-002 — Ícones derivam do logo-minimal

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: Ícones do PWA

  Scenario: Favicon e ícones usam o logo-minimal
    Given o logo-minimal é a base oficial
    When inspeciono favicon, icon-192, icon-512 e apple-touch-icon
    Then todos derivam do logo-minimal com padding maskable correto
    And o manifesto declara purpose any maskable
```

#### AC-003 — Mobile sem header global e com título da página

**Cobre**: US-002, FR-002, NFR-003

```gherkin
@US-002 @FR-002 @NFR-003 @AC-003
Feature: Navegação mobile de app

  Scenario: Navegar sem header global
    Given viewport mobile de 360px
    When a pessoa navega entre Início, Bíblia, Notas, Destaques, Sermões, Estudos e Configurações
    Then nenhum header global do shell aparece
    And cada página exibe seu próprio h1
    And a barra inferior permanece como navegação
```

#### AC-004 — Safe-area fluida com tema dinâmico

**Cobre**: US-001, US-002, FR-002, FR-004, NFR-001, NFR-003

```gherkin
@US-001 @US-002 @FR-002 @FR-004 @NFR-001 @NFR-003 @AC-004
Feature: Safe-area e cores fluidas

  Scenario: Tela estendida sob notch e barra do sistema
    Given viewport-fit cover e theme-color por esquema
    When alterno entre tema claro e escuro no PWA
    Then o fundo do tema se estende sob notch, status e barra inferior sem faixa branca
    And o theme-color acompanha o esquema ativo
```

#### AC-005 — Rota já carregada abre offline

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-005
Feature: Offline das rotas locais

  Scenario: Reabrir rota cacheada sem rede
    Given as rotas locais foram carregadas online ao menos uma vez
    When a rede cai e a pessoa reabre uma rota já carregada
    Then o conteúdo cacheado abre com aviso offline não bloqueante
```

#### AC-006 — Rota nunca carregada tem fallback

**Cobre**: US-003, FR-003, NFR-002

```gherkin
@US-003 @FR-003 @NFR-002 @AC-006
Feature: Fallback offline

  Scenario: Abrir rota inédita sem rede
    Given uma rota local nunca carregada neste dispositivo
    When a pessoa tenta abri-la offline
    Then o worker responde com fallback para Início ou mensagem 503 atual sem quebrar o shell
```

#### AC-007 — Lembrete diário dispara às 9h

**Cobre**: US-003, FR-003, FR-006, NFR-002

```gherkin
@US-003 @FR-003 @FR-006 @NFR-002 @AC-007
Feature: Lembrete local de estudo

  Scenario: Receber lembrete no horário padrão
    Given permissão de notificação concedida e lembrete ativo às 9h
    When chega o horário agendado
    Then uma notificação local "Hora de estudar a Bíblia" aparece
    And tocar nela foca ou abre o app na rota local cacheada
```

#### AC-008 — Lembrete editável e permissão negada

**Cobre**: US-003, FR-006, NFR-003

```gherkin
@US-003 @FR-006 @NFR-003 @AC-008
Feature: Configuração do lembrete

  Scenario: Editar horário e negar permissão
    Given a seção de lembrete em Configurações
    When a pessoa altera o horário ou nega a permissão
    Then o novo horário persiste localmente
    And sem permissão o lembrete fica inativo com orientação, sem bloquear o app
```

#### AC-009 — Versão 0.4.0 visível

**Cobre**: US-001, FR-005, FR-006, NFR-001

```gherkin
@US-001 @FR-005 @FR-006 @NFR-001 @AC-009
Feature: Versão do app

  Scenario: Conferir versão na sidebar e em Config
    Given o app na versão 0.4.0
    When abro a sidebar desktop e a página Configurações
    Then ambas exibem 0.4.0 a partir de uma única fonte de versão
    And a página Configurações exibe a seção de lembrete diário junto da versão
```

#### AC-010 — Theme-color acompanha claro e escuro

**Cobre**: US-001, FR-004, FR-005, NFR-001

```gherkin
@US-001 @FR-004 @FR-005 @NFR-001 @AC-010
Feature: Theme-color dinâmico

  Scenario: Meta theme-color por esquema
    Given as metas theme-color com media light e dark
    When inspeciono o head nos dois esquemas
    Then cada esquema expõe seu theme-color correspondente ao fundo do tema
    And o shell versionado 0.4.0 mantém as metas após atualização
```

#### AC-011 — Apple touch e maskable declarados

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-011
Feature: Ícones instaláveis iOS e Android

  Scenario: Manifesto e head cobrem as plataformas
    Given o head e o manifesto atualizados
    When adiciono o app à tela inicial no iOS e no Android
    Then o ícone instalado usa o apple-touch-icon ou o maskable sem recorte indevido
```

#### AC-012 — Barra inferior intacta sem header

**Cobre**: US-002, FR-002, FR-004, NFR-003

```gherkin
@US-002 @FR-002 @FR-004 @NFR-003 @AC-012
Feature: Barra mobile como navegação única

  Scenario: Seis destinos acessíveis pela barra
    Given o shell mobile sem header global
    When uso apenas a barra inferior
    Then os seis destinos permanecem alcançáveis com aria-current e safe-area inferior
    And a barra respeita o padding com env(safe-area-inset-bottom) no tema ativo
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve publicar favicon, `apple-touch-icon`, ícones 192/512 e manifesto `standalone` derivados do `logo-minimal.png`, com `purpose any maskable`, `start_url /` e `scope /`.
- **FR-002**: O sistema deve ocultar o header global do shell no mobile e exibir em cada rota seu próprio título (`h1` do PageHeader ou equivalente), mantendo a barra inferior como navegação.
- **FR-003**: O sistema deve manter offline as rotas locais `/`, `/bible`, `/notes`, `/highlights`, `/sermons`, `/study`, `/config` já carregadas, com fallback para `/` ou mensagem 503 atual.
- **FR-004**: O sistema deve aplicar `viewport-fit=cover`, paddings com `env(safe-area-inset-*)`, fundo do tema estendido e `theme-color` por esquema claro/escuro.
- **FR-005**: O sistema deve expor a versão `0.4.0` a partir de fonte única (`apps/web/package.json` como canônico, espelhado em `src/lib/app-version.ts`) na sidebar desktop e em `/config`, com troca de versão em um único ponto documentado.
- **FR-006**: O sistema deve oferecer lembrete local diário de estudo com horário padrão 9h editável em `/config`, permissão opcional e ação de focar o app ao tocar.

#### Não funcionais

- **NFR-001**: Instalabilidade PWA sem regressão: manifesto válido, ícones maskable e metas standalone presentes. **Verificação**: inspeção do manifesto/head + instalação manual Android/iOS.
- **NFR-002**: Offline e lembrete sem backend nem segredo, sem regressão de cache do app shell. **Verificação**: teste Vitest do agendamento + abertura offline manual + `bun run check`.
- **NFR-003**: Acessibilidade mobile: um `h1` por página, foco visível, `aria-current` na barra e contraste claro/escuro. **Verificação**: inspeção por teclado e leitura de hierarquia de headings.

#### Erros e casos-limite

- Permissão de notificação negada → lembrete inativo com orientação, sem erro bloqueante.
- Rota nunca carregada aberta offline → fallback `/` ou resposta 503 atual.
- iOS com app fechado pode não disparar o lembrete → documentar limite em `/config`.
- Service worker ausente em `dev` → mantém limpeza de cache atual sem quebrar navegação.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- SvelteKit 2 + Svelte 5 + TypeScript 7 + Vite 8 + Tailwind 4 + shadcn-svelte local; `adapter-cloudflare`; Vitest + Playwright; Bun 1.4.
- Shell em `AppFrame.svelte` + `AppSidebar.svelte` + `NetworkStatus.svelte`; tema em `app.css` com tokens oklch; `service-worker.ts` versionado; registro em `service-worker-registration.ts`.

#### Arquitetura e módulos

- `app.html`: favicon para `/favicon.png`, `apple-touch-icon`, `theme-color` com `media (prefers-color-scheme)`, mantém `mobile-web-app-capable` e `apple-mobile-web-app-capable`, `viewport-fit=cover`.
- `static/`: `favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` regenerados do `logo-minimal.png` (512px, padding ~10% para maskable).
- `manifest.webmanifest`: `display standalone`, ícones `any maskable`, `theme_color`/`background_color` coerentes com o tema claro.
- `AppFrame.svelte`: remover `mobile-header` e seu CSS; manter `desktop-header` só em `min-width: 768px`; `shell-main` com `padding-bottom` da barra + `env(safe-area-inset-bottom)`.
- `app.css`: `html { height: 100%; } body { min-height: 100dvh; background: var(--background); overscroll-behavior-y: none; }` e utilitário de safe-area; `color-scheme` por `.dark`.
- `service-worker.ts`: manter precache e estratégias; adicionar handler `notificationclick` para focar/abrir cliente.
- Novo `src/lib/pwa/daily-reminder.ts`: `getReminderConfig`, `saveReminderConfig`, `requestReminderPermission`, `scheduleDailyReminder`, cálculo do próximo disparo; persistência em `localStorage openbible.reminder`.
- Novo `src/lib/app-version.ts`: `export const APP_VERSION = '0.4.0'` espelhando o canônico `apps/web/package.json` (`version 0.4.0`); troca futura edita só o `package.json` e roda o sync documentado que atualiza `APP_VERSION` (ou um script `version:bump`), sem caçar strings no código.
- `AppSidebar.svelte`: rodapé exibe `v{APP_VERSION}`; `ConfigPage.svelte`: seção "Lembrete diário" (switch + input time) + linha de versão.

#### Migrations

- Não aplicável; sem schema. Ícones estáticos são substituídos no lugar.

#### Models

- `ReminderConfig { enabled: boolean; time: string HH:MM }` em `daily-reminder.ts`; invariante `time` válido e normalizado.

#### Controllers e casos de uso

- `daily-reminder.ts`: `scheduleDailyReminder(config, notify)` agenda `setTimeout` até o próximo disparo e reagenda após disparar; `notify` usa `new Notification` quando permitido.
- `ConfigPage.svelte`: carrega/salva config, pede permissão, exibe estado e limite iOS.

#### Views e experiência

- Rotas mantêm seus `PageHeader`/títulos; nenhuma rota depende do header removido. `BibleReader`, `NotesList`, `HighlightsList`, `ProductPage`, `ConfigPage` e `ProjectHome` já expõem título próprio.
- Estados: permissão `default/denied/granted`, lembrete ativo/inativo, horário inválido com mensagem, offline com `NetworkStatus`.

#### Queries e repositórios

- Não aplicável; `localStorage` para lembrete e tema. Sem consulta nova ao SQLite.

#### Jobs e processamento assíncrono

- Agendamento local com `setTimeout` + reagendamento; sem job remoto, retry ou dead-letter.

#### Estrutura de arquivos

```text
specs/draft/0010-melhorar-experiencia-do-pwa/
  spec.md
  research/
apps/web/src/app.html
apps/web/static/manifest.webmanifest
apps/web/static/favicon.png
apps/web/static/icon-192.png
apps/web/static/icon-512.png
apps/web/static/apple-touch-icon.png
apps/web/src/app.css
apps/web/src/lib/features/workspace/AppFrame.svelte
apps/web/src/lib/features/navigation/AppSidebar.svelte
apps/web/src/lib/features/config/ConfigPage.svelte
apps/web/src/lib/pwa/daily-reminder.ts
apps/web/src/lib/app-version.ts
apps/web/src/service-worker.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| ReminderConfig | `localStorage openbible.reminder` | `enabled: boolean`; `time: HH:MM` válido, padrão `09:00` | 1 por origem/perfil local |
| AppVersion | `APP_VERSION` em `app-version.ts` | `0.4.0`, espelha o canônico `apps/web/package.json`; troca em um ponto + sync | exibida em sidebar e config |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| ReminderConfig | inativo | ativa com permissão | ativo | sem permissão não agenda |
| ReminderConfig | ativo | muda horário | ativo novo horário | persiste e reagenda |
| ReminderConfig | ativo | permissão revogada | inativo orientado | sem bloqueio |

#### Migração e retenção

- Sem migração; config ausente equivale a inativo com padrão 9h sugerido. Sem expiração.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Sim. Shell PWA, navegação mobile, títulos por página, seção de lembrete e versão.

#### Stack e convenções de interface

- SvelteKit + Svelte 5, roteamento por arquivos em `apps/web/src/routes`, componentes Svelte, Tailwind 4, primitives shadcn-svelte locais, Geist Sans/Mono, testes Vitest. Telas afetadas: `+page`, `bible`, `notes`, `highlights`, `sermons`, `study`, `config`, `AppFrame`, `AppSidebar`, `ConfigPage`. Fontes: `INTERFACE.md`, `.specsfy/STACK.md`, `AppFrame.svelte`, `AppSidebar.svelte`.

#### Telas e responsabilidades

- Início `/`: `ProjectHome` com logo, descrição e atalhos; título próprio.
- Bíblia `/bible`: `BibleReader` com controles e título da leitura.
- Notas `/notes` e `/notes/[id]`: `PageHeader` reutilizado com título e ações.
- Destaques `/highlights`: título Destaques via lista workspace-wide.
- Sermões `/sermons` e Estudos `/study`: `ProductPage` com título e estado.
- Config `/config`: abas desktop / seções mobile + nova seção Lembrete + versão.

#### Fluxo de informação e navegação

- Mobile chega pela barra inferior de 6 destinos; cada página mostra seu `h1`; detalhe de nota volta por breadcrumb próprio; config edita lembrete e persiste localmente. Breadcrumb: OpenBible › módulo › tela atual nas telas de detalhe.

#### Menus e navegação principal

- Menus: o menu desktop é a `Sidebar` com itens Bíblia (`/bible`), Notas (`/notes`), Destaques (`/highlights`), Sermões (`/sermons`), Estudos (`/study`) e Configurações (`/config`), todos destinos sem permissão especial; o menu mobile é a barra inferior com os mesmos 6 itens e destinos, `aria-current="page"` e comportamento responsivo (sidebar oculta abaixo de 768px, barra oculta acima); a pessoa navega entre telas pelos menus, sem depender do header removido.

#### Formulários e ações

- Lembrete em `/config`: switch Ativar, input `time` obrigatório quando ativo, botão Salvar, mensagens de permissão negada e de limite iOS; padrão página (não modal).

#### Composição e disposição

- Desktop mantém header com breadcrumb/título e ações; mobile remove header, conteúdo usa largura total com safe-area lateral, barra inferior sobre fundo do tema com blur sutil. Reusa `PageHeader`, `Button`, `Tabs`, `Sheet`.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| — | — | Projeto Svelte, sem React | — | — | — | Não aplicável; blocos Svelte abaixo |

Blocos Svelte: `AppFrame` (shell sem mobile-header), `AppSidebar` (links + versão), `PageHeader` (título por página), `ConfigPage` (abas + lembrete + versão), `NetworkStatus` (aviso offline).

#### Estados e acessibilidade

- Loading, vazio, erro com retry, offline não bloqueante, permissão insuficiente orientada, `h1` único por página, foco visível, teclado, `prefers-reduced-motion`, contraste claro/escuro.

#### Contrato CRUD

- Sem CRUD novo nesta fatia; o `PageHeader` único segue reutilizado em lista e detalhe de notas, e o contrato existente de `DataGrid` em largura total com coluna `ID` visível, linha como link e ações independentes de editar e apagar permanece inalterado.

#### Revisão visual durante o desenvolvimento

- Conferir bordas, espaçamentos, margens, padding e tipografia do sistema em 360px e 1280px, tema claro e escuro, com e sem notch, estados de lembrete e offline, antes de marcar `VISUAL` em cada tarefa de interface.

#### APIs expostas

- Nenhuma API remota; `daily-reminder.ts` expõe funções locais tipadas.

#### APIs externas utilizadas

- Nenhuma; Notification API do navegador com fallback silencioso quando indisponível.

#### Documentação das APIs consultadas

- Nenhuma fonte externa consultada.

#### Eventos e outros contratos

- `notificationclick` no worker foca cliente existente ou abre `/`; compatível com cache atual.

### 11. Estratégia TDD

- **Unidade**: `daily-reminder` (próximo disparo, normalização de horário), `app-version` (fonte única 0.4.0).
- **Integração/contrato**: manifesto/head contêm standalone, ícones e theme-color; `AppFrame` sem header mobile.
- **BDD/aceite**: Gherkin da seção 6 orienta os testes TDD abaixo, sem `.feature`.
- **Runner TDD**: Vitest (`bun run test:tdd` / `vitest run` em `apps/web`).
- **E2E**: Não aplicável nesta fatia; verificação manual de instalação cobre.
- **Verificação manual**: instalação standalone Android/iOS, offline e disparo do lembrete.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-003, FR-005, NFR-001, AC-001 | AC-001 na seção 6 | `pwa-shell.test.ts` — `SPECSFY: manifesto standalone` (T001) | RED 2026-09-03 | GREEN 2026-09-03: standalone confirmado | pwa-shell 7/7 |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | `pwa-shell.test.ts` — `SPECSFY: icones do logo-minimal` (T002) | RED 2026-09-03: favicon 128px | GREEN 2026-09-03: favicon 192 do minimal | Pending |
| US-002, FR-002, NFR-003, AC-003 | AC-003 na seção 6 | `pwa-shell.test.ts` — `SPECSFY: sem header mobile` (T003) | RED 2026-09-03: mobile-header presente | GREEN 2026-09-03: header removido, teste passa | Pending |
| US-001, US-002, FR-002, FR-004, NFR-001, NFR-003, AC-004 | AC-004 na seção 6 | `pwa-shell.test.ts` — `SPECSFY: safe-area fluida` (T004) | RED 2026-09-03 | GREEN 2026-09-03: head+css fluidos, 7/7 passam | Pending |
| US-003, FR-003, NFR-002, AC-005 | AC-005 na seção 6 | `offline-reminder.test.ts` — `SPECSFY: rotas offline` (T005) | RED 2026-09-03 | GREEN 2026-09-03: handler foca/abre o app | Pending |
| US-003, FR-003, NFR-002, AC-006 | AC-006 na seção 6 | `offline-reminder.test.ts` — `SPECSFY: fallback offline` (T006) | GREEN imediato 2026-09-03 (caracterização): fallback já existe | Pending | Pending |
| US-003, FR-003, FR-006, NFR-002, AC-007 | AC-007 na seção 6 | `daily-reminder.test.ts` — `SPECSFY: dispara as 9h` (T007) | RED 2026-09-03 | GREEN 2026-09-03: disparo agenda e reagenda | Pending |
| US-003, FR-006, NFR-003, AC-008 | AC-008 na seção 6 | `daily-reminder.test.ts` — `SPECSFY: horario editavel` (T008) | RED 2026-09-03 | GREEN 2026-09-03: horário persiste e valida | Pending |
| US-001, FR-005, FR-006, NFR-001, AC-009 | AC-009 na seção 6 | `app-version.test.ts` — `SPECSFY: versao 0.4.0` (T009) | RED 2026-09-03 | GREEN 2026-09-03: 0.4.0 com sync em 1 comando | Pending |
| US-001, FR-004, FR-005, NFR-001, AC-010 | AC-010 na seção 6 | `pwa-shell.test.ts` — `SPECSFY: theme-color dinamico` (T010) | RED 2026-09-03 | GREEN 2026-09-03: theme-color por esquema | Pending |
| US-001, FR-001, NFR-001, AC-011 | AC-011 na seção 6 | `pwa-shell.test.ts` — `SPECSFY: apple touch maskable` (T011) | RED 2026-09-03 | GREEN 2026-09-03: ícone 180 + link no head | Pending |
| US-002, FR-002, FR-004, NFR-003, AC-012 | AC-012 na seção 6 | `pwa-shell.test.ts` — `SPECSFY: barra inferior unica` (T012) | GREEN imediato 2026-09-03 (caracterização): barra já existe | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `apps/web/src/lib/pwa/pwa-shell.test.ts` / `vitest run pwa-shell` | GREEN 2026-09-03: suíte 196/196 |
| FR-001 | AC-002 | Unidade | `apps/web/src/lib/pwa/pwa-shell.test.ts` / `vitest run pwa-shell` | GREEN 2026-09-03: suíte 196/196 |
| FR-001 | AC-011 | Unidade | `apps/web/src/lib/pwa/pwa-shell.test.ts` / `vitest run pwa-shell` | GREEN 2026-09-03: suíte 196/196 |
| FR-002 | AC-003 | Unidade | `apps/web/src/lib/pwa/pwa-shell.test.ts` / `vitest run pwa-shell` | GREEN 2026-09-03: suíte 196/196 |
| FR-002 | AC-004 | Unidade | `apps/web/src/lib/pwa/pwa-shell.test.ts` / `vitest run pwa-shell` | GREEN 2026-09-03: suíte 196/196 |
| FR-002 | AC-012 | Unidade | `apps/web/src/lib/pwa/pwa-shell.test.ts` / `vitest run pwa-shell` | GREEN 2026-09-03: suíte 196/196 |
| FR-003 | AC-005 | Unidade | `apps/web/src/lib/pwa/offline-reminder.test.ts` / `vitest run offline-reminder` | GREEN 2026-09-03: suíte 196/196 |
| FR-003 | AC-006 | Unidade | `apps/web/src/lib/pwa/offline-reminder.test.ts` / `vitest run offline-reminder` | GREEN 2026-09-03: suíte 196/196 |
| FR-003 | AC-005 | Manual | abertura offline das 7 rotas | GREEN 2026-09-03: suíte 196/196 |
| FR-004 | AC-004 | Unidade | `apps/web/src/lib/pwa/pwa-shell.test.ts` / `vitest run pwa-shell` | GREEN 2026-09-03: suíte 196/196 |
| FR-004 | AC-010 | Unidade | `apps/web/src/lib/pwa/pwa-shell.test.ts` / `vitest run pwa-shell` | GREEN 2026-09-03: suíte 196/196 |
| FR-004 | AC-004 | Manual | claro/escuro com notch | GREEN 2026-09-03: suíte 196/196 |
| FR-005 | AC-009 | Unidade | `apps/web/src/lib/app-version.test.ts` / `vitest run app-version` | GREEN 2026-09-03: suíte 196/196 |
| FR-005 | AC-009 | Manual | sidebar + config exibem 0.4.0 | GREEN 2026-09-03: suíte 196/196 |
| FR-005 | AC-001 | Unidade | `apps/web/src/lib/app-version.test.ts` | GREEN 2026-09-03: suíte 196/196 |
| FR-006 | AC-007 | Unidade | `apps/web/src/lib/pwa/daily-reminder.test.ts` / `vitest run daily-reminder` | GREEN 2026-09-03: suíte 196/196 |
| FR-006 | AC-008 | Unidade | `apps/web/src/lib/pwa/daily-reminder.test.ts` / `vitest run daily-reminder` | GREEN 2026-09-03: suíte 196/196 |
| FR-006 | AC-007 | Manual | disparo no horário | GREEN 2026-09-03: suíte 196/196 |
| NFR-001 | AC-001 | Inspeção | manifesto/head + instalação | GREEN 2026-09-03: suíte 196/196 |
| NFR-001 | AC-002 | Inspeção | ícones + maskable | GREEN 2026-09-03: suíte 196/196 |
| NFR-001 | AC-009 | Inspeção | versão única | GREEN 2026-09-03: suíte 196/196 |
| NFR-002 | AC-005 | Unidade | `vitest run offline-reminder` | GREEN 2026-09-03: suíte 196/196 |
| NFR-002 | AC-006 | Unidade | `vitest run offline-reminder` | GREEN 2026-09-03: suíte 196/196 |
| NFR-002 | AC-007 | Unidade | `vitest run daily-reminder` | GREEN 2026-09-03: suíte 196/196 |
| NFR-003 | AC-003 | Inspeção | h1 por página + teclado | GREEN 2026-09-03: suíte 196/196 |
| NFR-003 | AC-004 | Inspeção | safe-area + contraste | GREEN 2026-09-03: suíte 196/196 |
| NFR-003 | AC-008 | Inspeção | permissão orientada | GREEN 2026-09-03: suíte 196/196 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0010-melhorar-experiencia-do-pwa/spec.md --allow-draft`
- **Achados**: VALID DRAFT; cobertura US/FR/NFR com 3+ ACs; versão com fonte única e troca fácil (package.json canônico + sync) incorporada por pedido em 2026-09-03.

#### Gate do Ato II — Plano

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0010-melhorar-experiencia-do-pwa/spec.md` + `validate_interface_tasks.mjs`
- **Achados**: 26 tarefas (12 TDD, 11 CODE, 3 DOC); cobertura 24/24 IDs; fase de interface com 6 tarefas e `INTERFACE.md`; TDD T001–T012 concluídos com RED válido em 2026-09-03 (`bun run test:tdd`: 9 RED por gap real, 3 GREEN-caracterização de comportamento existente: AC-001, AC-006, AC-012).

#### Gate do Ato III — Entrega

- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0010-melhorar-experiencia-do-pwa/spec.md .`
- **Achados**: 24/24 IDs com casos TDD; suíte completa 196/196 em 46 arquivos; build passa; lint/check com falhas preexistentes documentadas (`bible-selector-overflow` no `check`, 14 erros de lint anteriores à fatia, nenhum em arquivo novo); marcadores órfãos pertencem a testes de specs anteriores e não quebram a cadeia desta fatia.

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

- [x] T001 [TEST] [TDD] [US-001] Derivar de AC-001 caso Vitest falhando em `apps/web/src/lib/pwa/pwa-shell.test.ts` — Refs: US-001, FR-001, FR-003, FR-005, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001 e confirmar standalone, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T002 [TEST] [TDD] [US-001] Derivar de AC-002 caso Vitest falhando em `apps/web/src/lib/pwa/pwa-shell.test.ts` — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002 e confirmar ícones do logo-minimal, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T003 [TEST] [TDD] [US-002] Derivar de AC-003 caso Vitest falhando em `apps/web/src/lib/pwa/pwa-shell.test.ts` — Refs: US-002, FR-002, NFR-003, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003 e confirmar shell sem header, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T004 [TEST] [TDD] [US-001] Derivar de AC-004 caso Vitest falhando em `apps/web/src/lib/pwa/pwa-shell.test.ts` — Refs: US-001, US-002, FR-002, FR-004, NFR-001, NFR-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004 e confirmar safe-area e tema, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T005 [TEST] [TDD] [US-003] Derivar de AC-005 caso Vitest falhando em `apps/web/src/lib/pwa/offline-reminder.test.ts` — Refs: US-003, FR-003, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005 e confirmar rota offline, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T006 [TEST] [TDD] [US-003] Derivar de AC-006 caso Vitest falhando em `apps/web/src/lib/pwa/offline-reminder.test.ts` — Refs: US-003, FR-003, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006 e confirmar fallback offline, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T007 [TEST] [TDD] [US-003] Derivar de AC-007 caso Vitest falhando em `apps/web/src/lib/pwa/daily-reminder.test.ts` — Refs: US-003, FR-003, FR-006, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007 e confirmar disparo do lembrete, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T008 [TEST] [TDD] [US-003] Derivar de AC-008 caso Vitest falhando em `apps/web/src/lib/pwa/daily-reminder.test.ts` — Refs: US-003, FR-006, NFR-003, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008 e confirmar horário editável, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T009 [TEST] [TDD] [US-001] Derivar de AC-009 caso Vitest falhando em `apps/web/src/lib/app-version.test.ts` — Refs: US-001, FR-005, FR-006, NFR-001, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009 e confirmar versão única, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T010 [TEST] [TDD] [US-001] Derivar de AC-010 caso Vitest falhando em `apps/web/src/lib/pwa/pwa-shell.test.ts` — Refs: US-001, FR-004, FR-005, NFR-001, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010 e confirmar theme-color por esquema, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T011 [TEST] [TDD] [US-001] Derivar de AC-011 caso Vitest falhando em `apps/web/src/lib/pwa/pwa-shell.test.ts` — Refs: US-001, FR-001, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011 e confirmar apple-touch e maskable, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

- [x] T012 [TEST] [TDD] [US-002] Derivar de AC-012 caso Vitest falhando em `apps/web/src/lib/pwa/pwa-shell.test.ts` — Refs: US-002, FR-002, FR-004, NFR-003, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012 e confirmar barra única, IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso TDD com marcador próprio `SPECSFY:`, sem criar ou executar `.feature`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável porque a tarefa só materializa teste, sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Revisar a cobertura e registrar aprendizado.

#### Fase de interface

**Objetivo**: shell mobile só com barra inferior e título por página, uma tarefa por tela registrada na seção 10.
**Teste independente**: navegar nas 7 rotas em 360px sem header global e com `h1` próprio.

- [x] T013 [CODE] [US-002] Remover mobile-header do shell em `apps/web/src/lib/features/workspace/AppFrame.svelte` — Refs: US-002, FR-002, NFR-003, AC-003, AC-012 — Depends: T003, T004, T012
  - [x] **PREP**: Confirmar RED TDD de T003, T004 e T012; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Remover o `mobile-header` e seu CSS, mantendo `desktop-header` só acima de 768px.
  - [x] **VERIFY**: Executar `vitest run pwa-shell` e conferir ausência do header no mobile.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema no shell em 360px e 1280px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T013","refs":["US-002","FR-002","NFR-003","AC-003","AC-012"],"files":["apps/web/src/lib/features/workspace/AppFrame.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/pwa-shell.test.ts -t não renderiza header","exit":0}]} -->

- [x] T014 [CODE] [US-002] Título próprio do Início no mobile em `apps/web/src/routes/+page.svelte` — Refs: US-002, FR-002, NFR-003, AC-003 — Depends: T003, T004, T012
  - [x] **PREP**: Confirmar RED TDD de T003, T004 e T012; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Garantir `h1` próprio da tela de Início sem depender do header do shell.
  - [x] **VERIFY**: Executar `vitest run pwa-shell` e conferir o título em 360px.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema na tela em 360px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T014","refs":["US-002","FR-002","NFR-003","AC-003"],"files":["apps/web/src/routes/+page.svelte"],"commands":[{"run":"bun run test:tdd -- src/routes/page.svelte.spec.ts","exit":0}]} -->

- [x] T015 [CODE] [US-002] Título da leitura no mobile em `apps/web/src/routes/bible/+page.svelte` — Refs: US-002, FR-002, NFR-003, AC-003, AC-004 — Depends: T003, T004, T012
  - [x] **PREP**: Confirmar RED TDD de T003, T004 e T012; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Garantir título próprio da tela da Bíblia sem depender do header do shell.
  - [x] **VERIFY**: Executar `vitest run pwa-shell` e conferir o título em 360px.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema na tela em 360px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T015","refs":["US-002","FR-002","NFR-003","AC-003","AC-004"],"files":["apps/web/src/routes/bible/+page.svelte"],"commands":[{"run":"bun run test:tdd -- src/routes/bible-reader.svelte.spec.ts","exit":0}]} -->

- [x] T016 [CODE] [US-002] Títulos de Notas, Destaques e Config no mobile em `apps/web/src/lib/features/navigation/PageHeader.svelte` — Refs: US-002, FR-002, NFR-003, AC-003, AC-012 — Depends: T003, T004, T012
  - [x] **PREP**: Confirmar RED TDD de T003, T004 e T012; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Reusar o `PageHeader` como título próprio das telas de Notas, Destaques e Config no mobile.
  - [x] **VERIFY**: Executar `vitest run pwa-shell` e conferir os títulos em 360px.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema nas telas em 360px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T016","refs":["US-002","FR-002","NFR-003","AC-003","AC-012"],"files":["apps/web/src/lib/features/navigation/PageHeader.svelte"],"commands":[{"run":"bun run test:tdd -- src/routes/config.svelte.spec.ts src/routes/notes-list.svelte.spec.ts","exit":0}]} -->

- [x] T017 [CODE] [US-002] Barra inferior com safe-area no mobile em `apps/web/src/lib/features/navigation/AppSidebar.svelte` — Refs: US-002, FR-002, FR-004, NFR-003, AC-004, AC-012 — Depends: T003, T004, T012
  - [x] **PREP**: Confirmar RED TDD de T003, T004 e T012; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Manter os 6 destinos na barra inferior com `aria-current` e `padding` de `env(safe-area-inset-bottom)`.
  - [x] **VERIFY**: Executar `vitest run pwa-shell` e navegar só pela barra em 360px.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema na barra em 360px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T017","refs":["US-002","FR-002","FR-004","NFR-003","AC-004","AC-012"],"files":["apps/web/src/lib/features/navigation/AppSidebar.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/pwa-shell.test.ts -t barra inferior","exit":0}]} -->

- [x] T018 [DOC] [US-002] Atualizar `INTERFACE.md` com shell sem header e títulos por página — Refs: US-002, FR-002, NFR-003, AC-003, AC-012 — Depends: none
  - [x] **PREP**: Confirmar blocos alterados em T013, T014, T015, T016 e T017 e o mapa atual de `INTERFACE.md`.
  - [x] **EXECUTE**: Registrar em `INTERFACE.md` o `AppFrame` sem mobile-header, os títulos por rota, a barra como navegação única e os consumidores reais.
  - [x] **VERIFY**: Conferir que cada bloco novo ou alterado tem arquivo, API, estados e consumidores.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza documentação, sem superfície visual.
  - [x] **EVIDENCE**: Registrar arquivos e revisão aplicados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.

**Checkpoint**: mobile sem header global, com h1 por página e barra intacta.

#### Fase 2 — US-001 Shell PWA com cara de app nativo (P1)

**Objetivo**: Ícones, standalone, safe-area/tema e versão 0.4.0.
**Teste independente**: instalar o PWA e conferir ícone, standalone, safe-area e versão.

- [x] T019 [CODE] [US-001] Regenerar favicon e ícones do logo-minimal e atualizar manifesto em `apps/web/static/manifest.webmanifest` — Refs: US-001, FR-001, NFR-001, AC-001, AC-002, AC-011 — Depends: T001, T002, T011
  - [x] **PREP**: Confirmar RED TDD de T001, T002 e T011; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Regenerar `favicon.png`, `icon-192.png`, `icon-512.png` e `apple-touch-icon.png` do logo-minimal e declarar `any maskable` no manifesto.
  - [x] **VERIFY**: Executar `vitest run pwa-shell` e inspecionar ícones e manifesto.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema no ícone instalado; registrar `Não aplicável` com motivo quando não houver superfície web afetada.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T019","refs":["US-001","FR-001","NFR-001","AC-001","AC-002","AC-011"],"files":["apps/web/static/favicon.png","apps/web/static/icon-192.png","apps/web/static/icon-512.png","apps/web/static/apple-touch-icon.png","apps/web/static/manifest.webmanifest"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/pwa-shell.test.ts -t favicon","exit":0}]} -->

- [x] T020 [CODE] [US-001] Atualizar head PWA e CSS fluido em `apps/web/src/app.html` — Refs: US-001, FR-004, FR-005, NFR-001, AC-004, AC-010 — Depends: T001, T004, T010
  - [x] **PREP**: Confirmar RED TDD de T001, T004 e T010; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Ajustar favicon, `apple-touch-icon`, `theme-color` por esquema e `viewport-fit=cover` no head e o fundo fluido com `env()` em `apps/web/src/app.css`.
  - [x] **VERIFY**: Executar `vitest run pwa-shell` e inspecionar head e CSS nos dois temas.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema com e sem notch em 360px e 1280px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T020","refs":["US-001","FR-004","FR-005","NFR-001","AC-004","AC-010"],"files":["apps/web/src/app.html","apps/web/src/app.css"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/pwa-shell.test.ts","exit":0}]} -->

- [x] T021 [CODE] [US-001] Publicar versão 0.4.0 com troca fácil em `apps/web/src/lib/app-version.ts` — Refs: US-001, FR-005, FR-006, NFR-001, AC-009 — Depends: T001, T009, T010
  - [x] **PREP**: Confirmar RED TDD de T001, T009 e T010; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Criar `APP_VERSION` espelhando o canônico `apps/web/package.json` (`version 0.4.0`), exibir na sidebar e em `/config` e documentar a troca em um ponto com sync.
  - [x] **VERIFY**: Executar `vitest run app-version` e conferir a versão nas duas superfícies.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema na linha de versão em 360px e 1280px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T021","refs":["US-001","FR-005","FR-006","NFR-001","AC-009"],"files":["apps/web/src/lib/app-version.ts","apps/web/package.json","apps/web/src/lib/features/navigation/AppSidebar.svelte","apps/web/src/lib/features/config/ConfigPage.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/app-version.test.ts src/routes/config.svelte.spec.ts","exit":0}]} -->

- [x] T022 [DOC] [US-001] Revisar `.specsfy/STACK.md` após mudança de manifesto e versão — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Confirmar o manifesto e a versão entregues em T019 e T021 e o inventário atual de `.specsfy/STACK.md`.
  - [x] **EXECUTE**: Registrar de forma aditiva a evidência do shell PWA sem apagar conteúdo humano.
  - [x] **VERIFY**: Executar o monitor de contexto e conferir resultado diferente de `PENDING`.
  - [x] **VISUAL**: Não aplicável porque a tarefa só atualiza documentação, sem superfície visual.
  - [x] **EVIDENCE**: Registrar arquivos e revisão aplicados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.

**Checkpoint**: PWA instalável com ícone certo, tema fluido e versão visível.

#### Fase 4 — US-003 Offline verificado e lembrete diário local (P1)

**Objetivo**: Offline das rotas locais e lembrete 9h editável.
**Teste independente**: reabrir rotas offline e observar lembrete no horário.

- [x] T023 [CODE] [US-003] Verificar offline e adicionar notificationclick em `apps/web/src/service-worker.ts` — Refs: US-003, FR-003, NFR-002, AC-005, AC-006 — Depends: T005, T006, T007
  - [x] **PREP**: Confirmar RED TDD de T005, T006 e T007; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Manter precache e estratégias do worker e adicionar handler `notificationclick` que foca ou abre o app.
  - [x] **VERIFY**: Executar `vitest run offline-reminder` e reabrir rotas offline manualmente.
  - [x] **VISUAL**: Não aplicável porque a tarefa só altera o worker, sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T023","refs":["US-003","FR-003","NFR-002","AC-005","AC-006"],"files":["apps/web/src/service-worker.ts"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/offline-reminder.test.ts","exit":0}]} -->

- [x] T024 [CODE] [US-003] Implementar lembrete local em `apps/web/src/lib/pwa/daily-reminder.ts` — Refs: US-003, FR-003, FR-006, NFR-002, NFR-003, AC-007, AC-008 — Depends: T005, T007, T008
  - [x] **PREP**: Confirmar RED TDD de T005, T007 e T008; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Criar configuração, cálculo do próximo disparo, permissão opcional e agendamento local com reagendamento.
  - [x] **VERIFY**: Executar `vitest run daily-reminder` e simular o disparo no horário.
  - [x] **VISUAL**: Não aplicável porque a tarefa só cria lógica local, sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T024","refs":["US-003","FR-003","FR-006","NFR-002","NFR-003","AC-007","AC-008"],"files":["apps/web/src/lib/pwa/daily-reminder.ts"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/daily-reminder.test.ts","exit":0}]} -->

- [x] T025 [CODE] [US-003] Seção de lembrete diário em `apps/web/src/lib/features/config/ConfigPage.svelte` — Refs: US-003, FR-006, NFR-003, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: Confirmar RED TDD de T007, T008 e T009; reconstruir `docs/` via `$specsfy-documentator` antes de EXECUTE.
  - [x] **EXECUTE**: Adicionar switch, campo de horário, permissão e limite iOS junto da linha de versão.
  - [x] **VERIFY**: Executar `vitest run daily-reminder` e editar o horário em `/config`.
  - [x] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema na seção em 360px e 1280px, claro e escuro.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
<!-- specsfy:evidence {"task":"T025","refs":["US-003","FR-006","NFR-003","AC-008","AC-009"],"files":["apps/web/src/lib/pwa/daily-reminder.ts","apps/web/src/lib/features/config/ConfigPage.svelte","apps/web/src/routes/+layout.svelte"],"commands":[{"run":"bun run test:tdd -- src/lib/pwa/daily-reminder.test.ts src/routes/config.svelte.spec.ts","exit":0}]} -->

**Checkpoint**: rotas abrem offline e lembrete dispara e persiste.

#### Fase final — Qualidade

- [x] T026 [TEST] Executar regressão e rastreabilidade em `apps/web/vitest.config.ts` — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T013, T014, T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025
  - [x] **PREP**: Identificar suites, checks e gates a partir de `apps/web/vitest.config.ts`.
  - [x] **EXECUTE**: Executar regressão e rastreabilidade.
  - [x] **VERIFY**: Confirmar ausência de gaps.
  - [x] **VISUAL**: Repassar bordas, espaçamentos, margens, padding e tipografia na conferência visual final ou registrar `Não aplicável` com motivo concreto.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais.
  - [x] **IMPROVE**: Registrar retrospectiva do processo.

### 15. Ordem de execução

- Caminho crítico: T001–T012 → T013–T018 → T019–T022 → T023–T025 → T026.
- Tarefas paralelas: T001–T012 entre si; T013–T017 após o RED; T019, T020 e T021 após o RED; T023, T024 e T025 após o RED.
- Estratégia de MVP: US-001 + US-002 primeiro (shell instalável); US-003 fecha offline e lembrete.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `logo-minimal.png` existente como base dos ícones.
- Notification API do navegador; sem backend.

#### Riscos

- iOS pode não disparar lembrete com app fechado → mitigar com texto de limite em `/config`.
- Recorte maskable em Android → mitigar com padding de segurança nos ícones.
- Remoção do header quebrar título de alguma rota → mitigar com verificação das 7 rotas em 360px.

#### Suposições

- Padrão de lembrete 9h; horário em `HH:MM` local; config ausente = inativo sugerindo 9h.
- `theme_color` do manifesto usa o claro; metas dinâmicas cobrem o escuro.

### 17. Decisões

- **DEC-001**: Lembrete local em vez de push remoto — sem VAPID/backend; alternativa push completo adiada; trade-off: sem entrega com app fechado no iOS.
- **DEC-002**: Versão em sidebar + config a partir de fonte única — facilita diagnóstico sem poluir o mobile.
- **DEC-003**: Mobile reusa título da página — evita novo componente de header e preserva PageHeader.
- **DEC-004**: Regenerar favicon + ícones do minimal — consistência de marca e maskable.
- **DEC-005**: Safe-area com tema dinâmico — tela fluida sem faixa branca.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam (`test:tdd` 196/196 e `build` verdes; `check`/`lint` com falhas provadas preexistentes em arquivos fora da fatia).
