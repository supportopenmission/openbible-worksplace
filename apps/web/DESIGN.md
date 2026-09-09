---
name: OpenBible
description: Mesa de estudo local-first para leitura bíblica e elaboração de sermões.
colors:
  ink: "oklch(0.205 0 0)"
  paper: "oklch(1 0 0)"
  ink-on-dark: "oklch(0.985 0 0)"
  coal: "oklch(0.145 0 0)"
  mist: "oklch(0.97 0 0)"
  fog-text: "oklch(0.556 0 0)"
  hairline: "oklch(0.922 0 0)"
  focus-ring: "oklch(0.708 0 0)"
  signal-red: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-on-dark}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.coal}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-secondary:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.coal}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.coal}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
---

# Design System: OpenBible

## Overview

**Creative North Star: "Mesa de Estudo"**

OpenBible é uma mesa de estudo contida para trabalho solo e recorrente: ler, destacar, anotar e elaborar sermões sem fricção de conta. A filosofia é tipográfica e operacional — hierarquia, alinhamento e espaço antes de cor ou efeito. Densidade suficiente para uso diário, com respiro entre grupos e leitura clara em 320px e 1440px.

Direção explícita desta versão: gradientes leves monocromáticos para gerar profundidade minimalista, aplicados de forma contida (Camadas suaves). Isso é exceção pontual à regra anti-gradiente de `DESIGNSYSTEM.MD`, válida só para hero/boot, headers e camadas elevadas — nunca como identidade colorida.

**Key Characteristics:**
- Monocromático funcional com um único sinal destrutivo.
- Tipografia Geist como identidade; Mono só para referência, versão e código.
- Superfícies contínuas, bordas hairline, raio refinado e contido.
- Estados semânticos explícitos por texto + indicação visual, nunca só cor.

## Colors

Paleta monocromática quente-neutra em OKLCH, com tema claro/escuro por tokens invertidos; o vermelho existe só para destruição e erro.

### Primary
- **Tinta de Estudo** (`oklch(0.205 0 0)`): ação primária, texto forte e navegação ativa no claro; vira `oklch(0.922 0 0)` no escuro.
- **Papel** (`oklch(1 0 0)`): fundo da app no claro; vira `oklch(0.145 0 0)` no escuro.

### Neutral
- **Névoa** (`oklch(0.97 0 0)`): fundos muted/secondary/accent, hover de ghost, skeleton.
- **Texto Névoa** (`oklch(0.556 0 0)`): texto secundário e placeholders no claro.
- **Filete** (`oklch(0.922 0 0)`): bordas, inputs e divisórias no claro; `10–15%` branco no escuro.
- **Anel de Foco** (`oklch(0.708 0 0)`): outline de `:focus-visible` (2px + offset 2px) e ring de 3px em controles.
- **Vermelho Sinal** (`oklch(0.577 0.245 27.325)`): só destrutivo e `aria-invalid`; fundos a `10–20%` de opacidade.

### Named Rules
**The One Signal Rule.** Só o vermelho sinaliza perigo/erro. O preto monocromático nunca comunica erro sozinho.
**The Restrained Gradient Rule.** Gradiente só monocromático, sutil, em hero/boot/headers e overlays elevados. Nunca em texto, botões ou como marca colorida.

## Typography

**Display Font:** Geist (com ui-sans-serif, system-ui fallback)
**Body Font:** Geist (com ui-sans-serif, system-ui fallback)
**Label/Mono Font:** Geist Mono (com ui-monospace, Menlo fallback)

**Character:** Tipografia operacional e silenciosa. Hierarquia por peso e tamanho, sem caixa alta ornamental. Mono reservado para referência bíblica (`{livro} {cap}[.vers] · {versão}`), caminhos e identificadores.

### Hierarchy
- **Display** (600, 1.5rem, 1.25): títulos de página e `PageHeader`; onde a tarefa começa.
- **Title** (600, 1rem, 1.4): títulos de card, seção e diálogos.
- **Body** (400, 0.875rem, 1.5): texto corrido, versículos e listas; `max 65–75ch` em leitura longa.
- **Label** (500, 0.75rem, 1.4): labels, badges, tooltips e metadados.
- **Mono** (400, 0.8rem, 1.5): referências, versão, `workspaceId` e código.

### Named Rules
**The Task-First Title Rule.** Todo título responde à tarefa da tela antes de nomear o módulo.

## Layout

Modelo shell + conteúdo: Sidebar persistente no desktop (`collapsible="icon"`), barra inferior de 5 abas no mobile, header desktop fixo com scroll interno. Mobile elimina barra superior persistente para maximizar a viewport de leitura.

Containers: conteúdo em coluna única de leitura; `/config` usa container amplo com índice lateral no desktop e índice + subpáginas no mobile. Ritmo de espaçamento 8/16/24px; grade de formulários em 2 colunas no largo e 1 coluna no mobile. Breakpoint prático em 768px (`max-width: 767px` para safe-area e shell mobile); toque mínimo 44px no mobile; `input` a 16px em `pointer: coarse` para evitar zoom iOS. Safe-area via `env()` no shell mobile. Respeita `prefers-reduced-motion`.

## Elevation & Depth

Sistema em camadas suaves: flat por padrão com layering tonal, sombras só como resposta a estado/elevacão, mais gradiente monocromático leve em superfícies elevadas.

### Shadow Vocabulary
- **Overlay velado** (`bg-black/45`, sem blur): overlay de Dialog/Sheet.
- **Elevacão de diálogo** (`shadow-lg` + `rounded-lg` + `border hairline`): Dialog central (`max-w-lg`, `p-6`) e Sheet lateral/inferior.
- **Elevacão de menu** (`shadow-md` + `ring-1 ring-foreground/10`): menus e popovers (ex. `SelectionActionPopover`, context-menu).
- **Elevacão ativa de aba** (`shadow-sm` na variante default): tab ativa; variante `line` usa indicador de 2px sem sombra.

### Named Rules
**The Flat-By-Default Rule.** Superfícies em repouso são planas. Sombra e gradiente aparecem só em hover, foco, seleção ou camada elevada.

## Shapes

Linguagem de forma suavemente arredondada e contida: base `--radius: 0.625rem (10px)`; `sm (6px)`, `md (8px)`, `lg (10px)`, `xl (14px)`. Botões e inputs em `rounded-lg (10px)`; toolbar em `xl (14px)`; tamanhos compactos usam `min(var(--radius-md),10/12px)`; menus e tooltips em `md/lg`; diálogos em `lg`. Badge de contagem de notas usa pílula (`999px`, Mono `0.6875rem`) como exceção funcional — contagem, nunca decoração. Bordas hairline (`1px Filete`) com `bg-clip-padding`; sem clipping decorativo ou silhuetas próprias. Foco sempre visível em anel.

## Components

Caráter geral: refinado e contido — bordas suaves 8–10px, transições curtas (`transition-all`, 200ms em overlays), foco com ring e estados `disabled` a `50%`.

### Buttons
- **Shape:** suavemente arredondado (`rounded-lg`, 10px).
- **Primary:** Tinta sobre Papel-invertido + `h-8 px-2.5 text-sm font-medium`; hover a `80%`.
- **Hover / Focus:** `focus-visible` com `border-ring + ring-3 ring-ring/50`; active desce 1px (exceto popup).
- **Secondary / Ghost / Tertiary (if applicable):** Secondary em Névoa; Outline em Papel com Filete; Ghost transparente com hover Névoa; Destructive em Vermelho a 10% com texto Vermelho; Link sublinhado com offset 4px.
- Tamanhos `xs (24px)`, `sm (28px)`, default/lg (`32/36px`), icon correspondentes.

### Chips (if used)
- **Style:** Badge monocromático discreto; referência bíblica em Mono com indicador de estilo Q6.
- **State:** selecionado por fundo Névoa + texto Tinta; nunca só por cor.

### Cards / Containers
- **Corner Style:** `lg (10px)`.
- **Background:** Papel com Filete; Névoa para skeleton e trilhos.
- **Shadow Strategy:** flat em repouso; `shadow-lg/md` só em Dialog/Sheet/menu (ver Elevation).
- **Border:** `1px Filete`.
- **Internal Padding:** `16–24px` (`gap-4`, `p-6` em diálogos).

### Inputs / Fields
- **Style:** `h-8 rounded-lg border-input bg-transparent px-2.5 text-sm` (16px em touch); placeholder em Texto Névoa.
- **Focus:** `border-ring + ring-3 ring-ring/50`.
- **Error / Disabled:** `aria-invalid` com borda Vermelha + ring Vermelho a 20%; disabled a `50%` sem eventos.

### Navigation
- Sidebar desktop com `aria-current="page"`, tooltips no modo ícone e `Sidebar.Rail`; barra mobile em 5 colunas com `data-safe-area="bottom"`; Drawer “Mais” para contexto, workspace, tema e versão. Tabs com variantes `default` (pílula Névoa + `shadow-sm` ativa) e `line` (indicador 2px).

### Signature Component
**BibleReader popover + sheet:** paleta Q6 monocromática nomeada; copiar referência/texto e criar nota com rótulos visíveis (`Ref`, `Texto`, `Nota`) além do ícone, alvos 40px e raio 10px; ancorado ao versículo, `position: fixed` com folga de viewport. Estado ativo usa fundo tonal + contorno, nunca só cor.

## Do's and Don'ts

### Do:
- **Do** usar Geist para texto e Geist Mono só para referência, versão, paths e código.
- **Do** manter ação primária, secundária e destrutiva distintas por posição, hierarquia e semântica.
- **Do** dar foco visível em todo controle (`2px Anel + offset`, ou `ring-3` em primitives).
- **Do** testar claro/escuro, 320px/1440px, teclado, zoom e conteúdo longo em cada tela.
- **Do** aplicar gradiente só monocromático e sutil em hero/boot/header/elevados.

### Don't:
- **Don't** usar gradientes coloridos, glows, glassmorphism, sombras decorativas ou pills ornamentais.
- **Don't** comunicar estado só por cor, ícone ou posição — combine texto e semântica.
- **Don't** importar wordmark, logo ou identidade da Vercel; o guideline é só referência de qualidade.
- **Don't** introduzir React, Tailwind novo ou ReUI por suposição; a stack é SvelteKit + shadcn-svelte local.
- **Don't** transformar Markdown/PDF em fonte primária — são derivados do backend operacional.
