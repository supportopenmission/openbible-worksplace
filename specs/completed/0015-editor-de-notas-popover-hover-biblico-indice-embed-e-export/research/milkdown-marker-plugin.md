# Notas de pesquisa: marks `==`/`++` e `<br />` literais

Origem: Milkdown Example: Marker Plugin, https://milkdown.dev/docs/plugin/example-marker-plugin
Acesso em 2026-09-05. Licença do site não copiada; abaixo vão apenas
constatações próprias e decisões derivadas para a SPEC-0015.

## Receita oficial

A documentação demonstra mark customizado com quatro peças: plugin remark que
transforma `==texto==` em nó `mark` mdast, `$markSchema` com `parseMarkdown` e
`toMarkdown`, `$inputRule` para digitação e tooltip opcional. Nada além de
dependências já presentes (`@milkdown/kit`) é necessário.

## Roundtrip verificado nas fontes locais

- Nós mdast customizados (`mark`) FAZEM o stringify lançar
  `Cannot handle unknown node` com o setup padrão (comprovado por execução).
- Saída: o mesmo plugin `$remark` registra
  `this.data('toMarkdownExtensions', [{handlers}])`, mecanismo padrão do
  `remark-stringify` (comprovado em `remark-stringify/lib/index.js`).
- Os plugins `$remark` do usuário entram via `remarkPluginsCtx` no mesmo
  processador usado para parse e stringify (`core/src/internal-plugin/schema.ts`).
- Portanto um único plugin cobre as duas direções sem alterar
  `remarkStringifyOptionsCtx` e sem risco de ordem de inicialização.

## Decisões derivadas

- Destaque usa mark `highlight` com roundtrip de `==texto==` e da variante
  com cor `=={cor}texto==` já convencionada no projeto.
- Sublinhado usa mark `underline` com roundtrip de `++texto++`, com guardas de
  fronteira para não converter `C++` (abertura precedida de início/espaço/
  pontuação de abertura e fechamento seguido de fim/espaço/pontuação de
  fechamento).
- O popover passa a aplicar as marks do schema em vez de inserir marcadores
  como texto; arquivos existentes com `==`/`++` literais passam a renderizar
  sem migração e salvam as mesmas convenções.

## `<br />` literais

- O serializador padrão (`mdast-util-to-markdown`) grava hard breaks como
  `\\\n`; portanto tags `<br />` nas notas vêm de legado, colagem ou HTML
  digitado, não do Milkdown atual.
- O renderer de preview escapa HTML, então essas tags aparecem como texto
  literal no app e no PDF. Impacto: a saída de exportação deve saneá-las para
  quebras reais antes de renderizar.
