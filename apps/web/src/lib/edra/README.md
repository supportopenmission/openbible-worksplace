# Núcleo do Edra no OpenBible

Migração gradual do editor de notas: Milkdown (motor clássico, padrão) ↔
Edra (motor novo, opt-in em Configurações → Aparência → Editor de notas).

## Regra de proveniência

Os arquivos vendorados do Edra são **byte-idênticos ao Edra 3.1.3**
(MIT, https://github.com/Tsuzat/Edra, pasta `src/lib/edra`). Não recebem
cabeçalhos nem edições: qualquer divergência é uma adaptação listada
abaixo, com o motivo. Isso permite diff direto contra o upstream.

- `tiptap/` — núcleo reativo TipTap v3 + Svelte 5 (`Editor`, `useEditor`,
  componentes, hooks, renderers, extensões próprias do Edra).
- `shadcn/` — variante com Toolbar, BubbleMenu, DragHandle, slash,
  TOC e views (código, mídia, Mermaid); `editor.css` + `onedark.css`.
- `commands/`, `extensions.ts`, `strings.ts`, `types.ts`, `utils.ts`.
- `index.ts` (neste diretório) — barrel próprio do OpenBible.
- Não vendorado: `headless/` (seguimos o exemplo `shadcn` do site),
  `docs/` e o `Callout` com sintaxe `$callout` (ver decisão abaixo).

## Adaptações OpenBible (únicas divergências)

1. `shadcn/openbible-editor.ts` (NOVO, fork de `shadcn/editor.ts`):
   monta o editor com `getDefaultExtensions()` filtrado (fora `highlight`
   e `placeholder` do Edra) + `openBibleHighlight` (`==`/`=={cor}==`),
   `Placeholder` em PT-BR, Callout NATIVO do Edra (`$callout` + emoji),
   os nós `verseFence`, `videoFence` e o resto da montagem original
   (Mermaid `:::mermaid`, mídia, tabelas, slash, TOC).
2. `tiptap/extensions/slash/index.ts`: item `Versículo` adicionado
   (dispara o evento `openbible:insert-verse`, ouvido pelo editor para
   abrir o seletor).
3. `shadcn/components/tools/Colors.svelte`: só destaque, com a paleta
   nomeada do OpenBible (`=={cor}==`, roundtrip garantido); cor de texto
   removida porque o TipTap não a serializa em Markdown (sumiria ao salvar).
4. `shadcn/components/Toolbar.svelte`: removido `<Export/>` (o app já tem
   exportação própria com expansão de versículos e PDF).
5. `shadcn/editor.svelte`: sem `mermaid.initialize` estático nem
   `mode-watcher` (a view do Mermaid carrega a lib sob demanda).
6. `shadcn/components/Mermaid.svelte`: `import('mermaid')` dinâmico para
   não pesar o bundle de quem nunca usa diagrama.
7. `shadcn/toc-state.ts` (NOVO) + `shadcn/toc.svelte`: estado do índice
   extraído para módulo TS porque o toolchain não resolve imports nomeados
   do `<script module>` do Svelte.
8. `shadcn/editor.ts`: import de `setTocItems` ajustado para `./toc-state.js`
   (mesmo motivo do item 7).
9. `shadcn/components/menu/{BubbleMenu,TableCol,TableRow}.svelte`: guardas
   `isDestroyed` nos `shouldShow` (updates pós-destroy quebravam o
   ProseMirror ao trocar/remontar o editor).
10. `shadcn/components/tools/Export.svelte` e `shadcn/components/Callout.svelte`:
    import de `buttonVariants` ajustado para `../index.js` (o `button.svelte`
    local não o exporta).
11. `tiptap/extensions/Callout.ts`: `eslint-disable` de `no-explicit-any`
    (tipos do original; o próprio Edra usa esse disable pontual).
12. `tiptap/extensions/mermaid/index.ts`: `eslint-disable` de `no-unused-vars`
    nos parâmetros `_helpers`/`_ctx` (assinaturas exigidas pelo gerente).
13. `extensions.ts` e demais arquivos seguem byte-idênticos.
14. `normalizeSavedMarkdown` aplicado no save do motor Edra: o
    `renderMarkdown` upstream do Mermaid termina com `\n\n`, o que
    acumularia linhas em branco a cada save.

## Contrato de persistência

Nenhuma mudança de schema: o corpo continua Markdown canônico em
`workspace_notes.body` (SQLite `app.sqlite` no Tauri, IndexedDB no PWA),
via `editor.getMarkdown()`. O bloco de versículo segue somente-leitura
(o fence sobrevive byte-idêntico); upload de mídia sem backend usa o
fallback base64 do Edra (evite em notas grandes — prefira link).
Limites conhecidos desta fase: cor/tamanho de fonte e alinhamento valem
na sessão (o Markdown não os representa); IA (`UseAI`) desligada.

## Decisão de formato: callout nativo `$callout` + export como quote

O motor Edra usa o Callout nativo (`$callout<emoji>…$`, com seletor de
emoji e view rica) — é o padrão do engine e o pedido explícito do produto.
Na exportação (`note-export.ts`, `expandCalloutFences`), o fence vira
blockquote `> …` para leitura fora do app. No motor clássico o fence
aparece como texto (sem perda).
