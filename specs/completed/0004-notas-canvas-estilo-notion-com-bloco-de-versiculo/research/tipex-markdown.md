# Pesquisa: Tipex, TipTap Markdown e canvas full-bleed

**Origem:** https://tipex.pages.dev/, https://www.npmjs.com/package/@friendofsvelte/tipex, https://tiptap.dev/docs/editor/markdown  
**Versão consultada:** Tipex 0.2.0 (2026-07-12), TipTap Markdown docs (acesso 2026-09-01)  
**Licença:** MIT (Tipex)

## Canvas full-bleed

- Prop `focal={false}` ou `!focal` desativa o anel de foco azul (`TipexProps.focal`, default `true`).
- Prop `controlComponent={null}` oculta toolbar padrão; `controlComponent` snippet substitui controles.
- Snippets `head` e `foot` permitem botão de inserir versículo sem card em volta do ProseMirror.
- Evitar `class="border ..."` no exemplo oficial; usar apenas tipografia/spacing do canvas.
- Estilos importados: `@friendofsvelte/tipex/styles/index.css`; tokens `--color-tipex-*`, `--spacing-tipex-*`.

## Extensões e slash menu

- `extensions` substitui `defaultExtensions`; para estender: `[...defaultExtensions, VerseNode, SlashCommands]`.
- Slash menu **não** vem pronto no Tipex; implementar com `@tiptap/suggestion` + `@tiptap/extension-placeholder` ou extensão custom que intercepta `/`.
- `bind:tipex={editor}` expõe API TipTap (`commands`, `chain`, eventos).

## Markdown (@tiptap/markdown)

- Extensão bidirecional: `contentType: 'markdown'`, `parseMarkdown`, `renderMarkdown`, `markdownTokenizer`.
- Custom blocks: `createBlockMarkdownSpec` + tokenizer MarkedJS para fences não-CommonMark.
- **Risco de versão:** Tipex 0.2.0 depende de `@tiptap/core` ^2.1.13; confirmar compatibilidade do pacote `@tiptap/markdown` com TipTap 2 antes da implementação. Se incompatível, serializar fence `:::verse` manualmente na camada File Over Apps e usar HTML internamente no Tipex.

## Fence `:::verse` proposto

```markdown
:::verse{versionId="nvi.sqlite" bookId="43" book="João" chapter="3" verseStart="16" verseEnd="18"}
16 Porque Deus amou o mundo...
17 Porque Deus não enviou...
18 Quem crê nele...
:::
```

- Atributos estáveis: `versionId`, `bookId`, `book`, `chapter`, `verseStart`, `verseEnd`.
- Corpo: snapshot linha por versículo (`<n> texto`).
- Fechamento: linha `:::` sozinha.

## Título H1 ↔ YAML

- Template atual (`workspace.ts`): `title: ""` e corpo `# Nova nota`.
- Sync na camada de persistência: ao salvar, texto do primeiro H1 → `title`; ao carregar, `title` não vazio preenche H1 se divergente.
