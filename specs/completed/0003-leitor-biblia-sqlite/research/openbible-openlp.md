# Evidência do leitor e do formato OpenLP

## Referência visual do OpenBible

- Origem: `https://openbible-prod.vercel.app/`
- Acesso: 2026-09-01, renderização em Chromium via Playwright.
- Observações próprias: a tela observada mantém o texto em uma área de leitura centralizada, usa controles compactos no topo para livro/capítulo/versão, oferece navegação de capítulo anterior e próximo e reserva uma barra de navegação inferior em telas estreitas.
- Uso nesta feature: adaptar a hierarquia e os estados para Svelte, sem copiar código, marca, tokens ou identidade da referência.

## Estrutura OpenLP

- Fontes: `https://openlp.org/blog/2007/10/20/reworking-the-bibles.html` e `https://manual.openlp.org/bibles.html`.
- Acesso: 2026-09-01.
- O formato documentado usa as tabelas `testament`, `book` e `verse`.
- O leitor consulta `book.id`, `book.name`, `verse.book_id`, `verse.chapter`, `verse.verse` e `verse.text`; `book.abbreviation` é opcional porque bancos OpenLP compatíveis, como `bibles_ACF.sqlite`, não a expõem.
- Quando presente, `metadata.key = 'name'` fornece o nome da versão; o nome do arquivo é usado como fallback.
- A documentação também confirma que os SQLite são arquivos locais de Bíblias OpenLP e que os versículos são relacionados ao livro por `book_id`.
- Uso nesta feature: validar tabelas e colunas antes de exibir um arquivo, manter consultas parametrizadas e tratar divergências como erro isolado por versão.

## Limites da evidência

Esta pesquisa registra observações e contratos externos, não copia implementação de terceiros. Compatibilidade com schemas que não exponham as tabelas e colunas OpenLP documentadas permanece fora desta fatia.
