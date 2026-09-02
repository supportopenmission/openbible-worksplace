# Edra, drag handle e teclado TipTap — 2026-09-02

## Escopo

Pesquisa informativa para a revisão do editor de notas solicitada em 2026-09-02:
seleção/reordenação de blocos, barra flutuante dentro da viewport e confirmação do
slash command por `Enter`.

## Fontes primárias

- Edra, repositório oficial MIT: https://github.com/Tsuzat/Edra
- Edra, demonstração oficial: https://edra.tsuzat.com/
- TipTap, Drag Handle: https://tiptap.dev/docs/editor/extensions/functionality/drag-handle
- Svelte 5, documentação oficial consultada via `@sveltejs/mcp`: `basic-markup`,
  `bind`, `lifecycle-hooks`, `svelte-window` e `testing`.

## Evidência observada

- O Edra apresenta uma alça flutuante de 28 px à esquerda do bloco sob o cursor,
  com `draggable="true"`, e documenta seleção/reordenação no padrão Notion.
- A extensão oficial de drag handle do TipTap atual posiciona a alça por referência
  virtual e seleciona o nó apontado. O projeto, porém, usa TipTap 2 via Tipex 0.2.0;
  instalar a extensão atual criaria incompatibilidade de major.
- O Svelte recomenda `tick()` para medir um elemento após a atualização do DOM.
  Eventos `keydown` declarativos são delegados; capturar o atalho dentro do plugin
  ProseMirror evita que o `Enter` padrão altere o documento antes do comando.

## Decisão informada

Manter TipTap 2/Tipex 0.2.0 e implementar uma extensão local pequena:

1. plugin ProseMirror que encontra o bloco de topo sob o ponteiro;
2. alça de 28 px com botão semanticamente nomeado;
3. clique seleciona o nó; drag usa o mecanismo nativo do ProseMirror;
4. `Alt+ArrowUp/ArrowDown` oferece reordenação equivalente por teclado;
5. plugin de teclado do slash menu consome setas, `Enter` e `Escape` antes do
   keymap padrão;
6. barra flutuante é medida depois do render e recebe coordenadas absolutas
   limitadas à viewport.

Não copiar código do Edra nem adicionar sua stack: a referência orienta o padrão de
interação, preservando o design system e as versões atuais do OpenBible.
