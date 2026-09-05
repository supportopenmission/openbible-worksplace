# Evidência: portabilidade Markdown

| Campo | Valor |
| --- | --- |
| Coletada em | 2026-09-05 |
| Finalidade | Comparar a degradação de diretivas, blockquotes, comentários HTML, frontmatter e iframe nos destinos exigidos pelo OpenBible. |
| Licenças | As páginas permanecem sob as licenças/termos de seus respectivos autores; este arquivo contém somente links e conclusões para auditoria. |

## CommonMark e GitHub Flavored Markdown

- Origem: https://spec.commonmark.org/0.31.2/
- Origem: https://github.github.com/gfm/
- Versões observadas: CommonMark 0.31.2 e GFM 0.29-gfm.
- Evidência: blockquotes, links, fenced code e blocos/comentários HTML possuem gramática definida. A extensão `tagfilter` do GFM bloqueia tags como `iframe`, portanto um vídeo embutido não pode ser a representação portátil exclusiva.
- Impacto: verso usa blockquote visível; vídeo usa link Markdown visível; comentários HTML podem carregar metadados invisíveis sem substituir o conteúdo humano.

## GitHub

- Origem: https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files
- Origem: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
- Versão/data observada: documentação consultada em 2026-09-05.
- Evidência: GitHub oculta comentários HTML na visualização renderizada e informa que parte do HTML embutido, inclusive vídeo do YouTube, não é apresentada.
- Impacto: JSON em comentário pode permanecer no source sem poluir o preview; iframe não entra no perfil canônico.

## Obsidian

- Origem: https://obsidian.md/help/callouts
- Origem: https://obsidian.md/help/embeds
- Origem: https://obsidian.md/help/properties
- Origem: https://obsidian.md/help/syntax
- Versão/data observada: documentação consultada em 2026-09-05.
- Evidência: callout é uma extensão sobre blockquote com `[!tipo]`; propriedades usam YAML no início do arquivo; links, imagens, quotes e code blocks seguem sintaxe Markdown documentada.
- Impacto: callout pode ser oferecido em exportação derivada, mas o arquivo canônico usa blockquote comum; YAML permanece restrito a propriedades pequenas e portáteis.

## Jekyll e GitHub Pages

- Origem: https://jekyllrb.com/docs/configuration/markdown/
- Origem: https://jekyllrb.com/docs/pages/
- Versão/data observada: documentação consultada em 2026-09-05.
- Evidência: Jekyll usa Kramdown e, por padrão, o processador GFM; páginas `.md` com frontmatter são convertidas durante o build.
- Impacto: o perfil canônico limita-se a construções GFM/CommonMark e frontmatter simples; widgets dependentes de plugin ficam fora da promessa básica.

## remark-directive

- Origem: https://github.com/remarkjs/remark-directive
- Versão observada: documentação do pacote 4.0.0; o projeto OpenBible usa 4.0.0.
- Licença: MIT.
- Evidência: a própria documentação classifica diretivas como extensão adequada quando o produtor controla as ferramentas e alerta que elas não funcionam na maioria dos destinos; diretivas não tratadas podem não emitir conteúdo.
- Impacto: `:::verse` e `:::video` continuam aceitos como legado de importação, mas deixam de ser a forma canônica após salvamento explícito.

## Veredito consolidado

- Não existe sintaxe capaz de entregar widgets visualmente idênticos em todos os renderizadores citados.
- Existe um contrato de portabilidade de conteúdo: cada bloco mantém representação humana usando Markdown padrão e metadados opcionais que o OpenBible pode enriquecer.
- Perder ou ignorar os metadados nunca pode tornar verso, referência ou URL ilegível.
