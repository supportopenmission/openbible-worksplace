# Projeto

## História e motivação

O projeto parte do starter `with-svelte` do Turborepo e está sendo configurado
para apoiar a elaboração de estudos bíblicos e sermões. O monorepo concentra a
aplicação SvelteKit em `apps/web`, que já tem onboarding, entrada configurável e
navegação mínima entre os módulos.

## Finalidade

O sistema servirá para ler a Bíblia, organizar estudos estruturados, elaborar
sermões em um construtor dedicado e manter notas simples.

## Pessoas e contexto de uso

A pessoa usuária trabalha individualmente nos próprios estudos, sermões e notas.
O MVP não exige conta ou login.

## Capacidades principais

As capacidades principais planejadas são:

- biblioteca de estudos e sermões;
- construtor estruturado de sermões, inspirado em Sermonary e Logos Sermon Builder;
- múltiplos workspaces no modelo de vaults: vários registros escopados por `workspaceId`, exatamente um workspace ativo por janela, seletor no shell desktop e mobile, SQLite `app.sqlite` no Tauri, IndexedDB por origem no PWA e catálogo local de reencontro;
- leitor da Bíblia, com seleção de versículos, destaques persistidos, consulta workspace-wide em sheet e em `/highlights`, ícone de nota no versículo, cópia e criação de nota ao lado da leitura;
- notas simples;
- importação de bancos SQLite compatíveis com o padrão do OpenLP por arrastar e soltar;
- acesso a bancos SQLite por URL de distribuição, como uma URL do Cloudflare R2;
- índices, destaques e dados auxiliares mantidos no backend operacional local:
  SQLite `app.sqlite` no Tauri e IndexedDB versionado no PWA.
- sincronização entre dispositivos disponível somente por opt-in explícito por
  workspace e dispositivo; o uso local continua válido sem relay obrigatório.
- notas exportáveis em Markdown e PDF; ambos são artefatos derivados do snapshot
  e não substituem o registro primário.
- app shell instalável como PWA standalone, com cache das rotas locais já carregadas para uso sem rede.
- tema claro/escuro persistido localmente e navegação por Sidebar no desktop ou barra inferior no mobile.
- interfaces orientadas pelo guideline `https://vercel.com/design.md`, com Geist local, superfícies contidas e estados de interação explícitos.

## Limites

O MVP não terá autenticação, colaboração entre pessoas ou uma conta centralizada.
O registro operacional de workspaces usa SQLite no desktop Tauri e IndexedDB no
PWA, com `workspaceId` como escopo. A fonte legada de pasta/manifesto é mantida
para migração e recovery. As notas são persistidas no backend operacional
(SQLite `app.sqlite` no Tauri ou IndexedDB no PWA); Markdown com YAML
frontmatter é exportação portátil e recuperação legada, e PDF é exportação,
não o banco de origem. A sincronização
entre dispositivos é opt-in, mantém notas e estado operacional nos backends
locais e pode usar um endpoint WebSocket seguro configurado pela pessoa, sem
exigir relay obrigatório.
Assistência de IA é opcional e controlada: no desktop, o perfil usa o cofre
seguro do sistema via Tauri; no PWA, a fronteira depende de gateway confiável e
token de sessão em memória. O agente lê somente o contexto selecionado do
workspace ativo e devolve proposta revisável, sem ferramentas autônomas ou
escrita autoral automática.

## Contexto técnico

Stack observada: Turborepo com SvelteKit, Svelte, TypeScript, Vite, Vitest,
Playwright, Tailwind CSS e primitives locais de shadcn-svelte (incluindo
Drawer e Select), usando Bun 1.4.0
como gerenciador declarado. A aplicação será executável localmente via
`localhost` ou hospedada na Cloudflare como PWA para mobile, com adapter oficial
do SvelteKit. O app shell usa manifesto, service worker versionado, safe area e
tokens claros/escuros em `apps/web/src/app.css`; conteúdo de domínio continua
dependente do armazenamento local já configurado. A versão nativa para macOS é
empacotada em `apps/desktop` com Tauri 2, backend Rust e SQLite via `rusqlite`,
usando o target universal da Apple. O registro de workspaces vive em
`app.sqlite`, assim como as notas e o estado operacional de sincronização no
Tauri; no PWA, essa persistência equivalente vive no IndexedDB versionado. A
pasta escolhida permanece como fonte legada/autoral durante a migração e
recovery.
Detalhes verificáveis ficam em `.specsfy/STACK.md` e `.specsfy/DATABASE.md`.

O código mantém a importação local de bancos SQLite e o leitor bíblico em `/bible`.
A partir do capítulo aberto a pessoa seleciona um intervalo contínuo de versículos,
aplica destaques no backend operacional (SQLite no Tauri ou IndexedDB no PWA),
consulta a projeção em `/highlights`, copia a referência ou o texto e cria uma nota
com fence `:::verse` sem sair da rota. O workspace legado pode ser reencontrado por
File System Access API ou OPFS, com `.openbible/config.json`,
`.openbible/preferences.json` e um `index.sqlite` auxiliar (`note_verse_ref` e
`reader_highlight`); essa fonte é preservada para migração/recovery enquanto o
registro operacional usa o banco do runtime.
A aplicação web contém as rotas `/`, `/bible`, `/notes`, `/highlights`, `/sermons`,
`/study` e `/config`. A rota `/` é a home operacional com Continuar leitura,
ações rápidas e recentes, sem redirecionamento por preferência. Notas usam editor
Milkdown com blocos ricos portáteis e exportação derivada. Tema e última leitura
são gravados no workspace e cacheados no `localStorage` só para o primeiro paint.
Cada janela trabalha sobre exatamente um workspace ativo (barreira de autosave e
token de geração na troca); o catálogo de vaults é local ao dispositivo e não
sincronizável, enquanto o manifesto `.openbible/config.json` viaja com a raiz.
