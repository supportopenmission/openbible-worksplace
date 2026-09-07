# Milkdown Kit — evidência local

Origem: `https://registry.npmjs.org/@milkdown/2Fkit/latest` e `https://github.com/Milkdown/milkdown` (README).
Acesso em: 2026-09-04.
Licença: MIT.
Versão observada: `@milkdown/kit 7.22.1`.

## O que foi consultado

- README do repositório: editor WYSIWYG dirigível por plugins, inspirado em Typora,
  construído sobre ProseMirror e remark.
- Metadados npm de `@milkdown/kit 7.22.1`: pacote ESM com `preset/commonmark`,
  `preset/gfm`, `plugin/slash`, `plugin/block`, `plugin/listener`, `plugin/clipboard`,
  `plugin/history`, `transformer` e componentes de blocos.

## Impacto na spec

- Viabiliza trocar Tipex/TipTap por `@milkdown/kit` com CommonMark + GFM como base,
  slash via `plugin/slash` e nó custom para o fence `:::verse` via transformer/schema ProseMirror.
- Mantém SvelteKit/Svelte 5: Milkdown é agnóstico ao framework e monta sobre um host DOM;
  o componente Svelte só gerencia ciclo de vida, leitura/escrita Markdown e abertura do `VerseSelector`.
- Não altera persistência: `note-markdown.ts`, `note-editor-service.ts` e `note_verse_ref`
  continuam; só muda a camada de edição/parse entre Markdown e visão.

## Âncoras citadas pela spec

- `## O que foi consultado`
- `## Impacto na spec`
