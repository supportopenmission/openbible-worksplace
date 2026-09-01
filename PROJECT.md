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
- leitor da Bíblia;
- notas simples;
- importação de bancos SQLite compatíveis com o padrão do OpenLP por arrastar e soltar;
- acesso a bancos SQLite por URL de distribuição, como uma URL do Cloudflare R2;
- índices, destaques e dados auxiliares mantidos em SQLite local.
- app shell instalável como PWA standalone, com cache das rotas locais já carregadas para uso sem rede.
- tema claro/escuro persistido localmente e navegação por Sidebar no desktop ou barra inferior no mobile.
- interfaces orientadas pelo guideline `https://vercel.com/design.md`, com Geist local, superfícies contidas e estados de interação explícitos.

## Limites

O MVP não terá autenticação, colaboração entre pessoas ou uma conta centralizada.
Sermões e notas terão Markdown com YAML frontmatter como fonte primária; SQLite
local será auxiliar para índices e destaques. Retenção, backup e sincronização
entre dispositivos ainda não foram definidos.

## Contexto técnico

Stack observada: Turborepo com SvelteKit, Svelte, TypeScript, Vite, Vitest,
Playwright, Tailwind CSS e primitives locais de shadcn-svelte, usando Bun 1.4.0
como gerenciador declarado. A aplicação será executável localmente via
`localhost` ou hospedada na Cloudflare como PWA para mobile, com adapter oficial
do SvelteKit. O app shell usa manifesto, service worker versionado, safe area e
tokens claros/escuros em `apps/web/src/app.css`; conteúdo de domínio continua
dependente do armazenamento local já configurado. Em etapa posterior, será
empacotada para desktop com Tauri.
Detalhes verificáveis ficam em `.specsfy/STACK.md` e `.specsfy/DATABASE.md`.

O código mantém a importação local de bancos SQLite e o leitor bíblico em `/bible`.
O workspace vive em pasta local (File System Access API) ou OPFS, com
`.openbible/config.json`, `.openbible/preferences.json` e um `index.sqlite` válido
sem schema de domínio. A aplicação web contém as rotas `/`, `/bible`, `/sermons`,
`/study` e `/config`. Tema, tela inicial e posição do leitor são gravados no
workspace e cacheados no `localStorage` só para o primeiro paint.
