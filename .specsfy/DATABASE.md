# Banco de dados

Mapa de persistência do sistema. A leitura bíblica usa arquivos SQLite importados
como fontes locais somente leitura; o índice do workspace permanece auxiliar.

## Fontes de dados

<!-- specsfy:database:start -->
| Fonte | Tecnologia/forma | Evidência |
| --- | --- | --- |
| Workspace local | Markdown + YAML (`notes/<noteId>.md`, `trash/`) | `apps/web/src/lib/features/notes/notes-repository.ts` |
| Workspace local | SQLite auxiliar (`.openbible/index.sqlite`) | `apps/web/src/lib/features/notes/note-verse-index.ts`, `apps/web/src/lib/features/bible/reader-highlights-repository.ts` |
| Workspace local | SQLite somente leitura (`bibles/*.sqlite`) | `apps/web/src/lib/features/bible/bible-reader.ts` |
| Navegador | IndexedDB (`openbible-workspace`) | `apps/web/src/lib/features/workspace/` |
| Navegador | `localStorage` (cache de primeiro paint) | `.openbible/preferences.json` espelhado |

## Estruturas detectadas

| Estrutura | Tipo | Campos | Relações | Fonte |
| --- | --- | --- | --- | --- |
| `note_verse_ref` | Tabela SQLite auxiliar | `id`, `note_path`, `block_index`, `version_id`, `book_id`, `book_name`, `chapter`, `verse_start`, `verse_end` | N..1 nota (`note_path`); espelha fences `:::verse`; índices em `(note_path)` e `(version_id, book_id, chapter)` | `note-verse-index.ts` |
| `reader_highlight` | Tabela SQLite auxiliar | `id`, `version_id`, `book_id`, `chapter`, `verse_start`, `verse_end`, `style_id` | Identidade natural = intervalo exato (`UNIQUE` em versão+livro+capítulo+início+fim); N anotações sobreponíveis por capítulo; não aponta para nota | `reader-highlights-repository.ts` |
| `book` | Tabela SQLite OpenLP | `id`, `name`, `abbreviation`, `testament_id` | 1 arquivo `bibles/*.sqlite` contém N livros | `bible-reader.ts` |
| `verse` | Tabela SQLite OpenLP | `book_id`, `chapter`, `verse`, `text` | `verse.book_id` → `book.id` | `bible-reader.ts` |
<!-- specsfy:database:end -->

## Estruturas de leitura bíblica

| Fonte             | Estrutura                    | Campos mínimos                                          | Relação e uso                                                                          |
| ----------------- | ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `bibles/*.sqlite` | `book`                       | `id`, `name`; `abbreviation` e `testament_id` opcionais | Um arquivo contém muitos livros; validada antes de entrar no catálogo                  |
| `bibles/*.sqlite` | `verse`                      | `book_id`, `chapter`, `verse`, `text`                   | `verse.book_id` referencia `book.id`; consultas de capítulo e busca são parametrizadas |
| `bibles/*.sqlite` | `metadata` (opcional)        | `key`, `value`                                          | `key = 'name'` fornece o nome da versão; o nome do arquivo é o fallback                |
| Pasta/OPFS        | `.openbible/preferences.json` | `theme`, `readerSelection` | Fonte File Over Apps das preferências; `localStorage` é cache para o primeiro paint (`initialRoute` removida em SPEC-0012) |
| Pasta/OPFS        | `.openbible/index.sqlite`     | `note_verse_ref`, `reader_highlight` e índices auxiliares | Espelha fences `:::verse` e guarda destaques do leitor; **não** substitui o Markdown nem o SQLite bíblico |
| Pasta/OPFS        | `notes/<noteId>.md`           | frontmatter YAML + corpo Markdown                      | Fonte File Over Apps das notas; H1 sincronizado com `title`; fences `:::verse` com snapshot no corpo                               |
| Pasta/OPFS        | `trash/<noteId>.md`           | mesmo formato de `notes/`                              | Lixeira; arquivo original preservado até remoção manual futura                                                                      |
| IndexedDB         | `openbible-workspace`         | handle da pasta                                        | Só no modo `local`; permissão `readwrite` é revalidada a cada visita                  |

## Decisões, ownership e retenção

### Informações confirmadas do produto

- Sermões e estudos estruturados terão Markdown com YAML frontmatter como fonte
  primária.
- Notas simples também usarão Markdown com YAML frontmatter.
- SQLite local manterá índices, destaques e dados auxiliares, sem substituir os
  arquivos Markdown.
- Bancos SQLite bíblicos poderão ser importados por arrastar e soltar quando
  seguirem o padrão do OpenLP, ou acessados por uma URL de distribuição como
  Cloudflare R2.
- O `.openbible/index.sqlite` é um SQLite válido. Um arquivo de 0 bytes legado é
  reparado na preparação. A tabela auxiliar `note_verse_ref` é criada
  idempotentemente na primeira operação de notas (`CREATE TABLE IF NOT EXISTS`).
  O índice espelha fences `:::verse` do Markdown e é reindexado após cada save;
  refs são removidas ao mover a nota para `trash/`. A tabela auxiliar
  `reader_highlight` é criada idempotentemente na primeira operação de destaque
  do leitor; a identidade é o intervalo exato (`UNIQUE` em `version_id`,
  `book_id`, `chapter`, `verse_start`, `verse_end`) e o `style_id` segue a
  paleta Q6. Remover um destaque é `DELETE` só dessa identidade. A listagem
  workspace-wide usa `SELECT` sem filtro de capítulo ou versão (`ORDER BY
  version_id, book_id, chapter, verse_start, verse_end`) via
  `listAllReaderHighlights` / `readAllReaderHighlights`; sheet do leitor e página
  `/highlights` mostram o mesmo conjunto. O leitor bíblico
  **não** abre `index.sqlite` para texto; usa `sql.js` nos SQLite importados em
  `bibles/` (somente leitura, nunca alterados por notas ou destaques) e fecha
  cada instância após a consulta.
- A validação funcional do leitor exige as tabelas `book` e `verse` e as colunas
  mínimas listadas acima; arquivos incompatíveis são diagnosticados sem remover
  fontes válidas nem modificar qualquer SQLite.
- Tema e última leitura ficam em `.openbible/preferences.json`.
  A preferência de tela inicial (`initialRoute`) foi removida em SPEC-0012: a
  rota `/` é sempre a home operacional e valores legados são tratados como
  ausentes.
  O `localStorage` (`openbible.theme`, `openbible.initial-route`,
  `openbible.reader-selection`) é cache de primeiro paint e não substitui o arquivo.
- No modo pasta local, o handle fica no IndexedDB e a permissão `readwrite` é
  consultada de novo após o reload; se voltar a `prompt`, a UI pede acesso sem
  fingir que o workspace sumiu. No OPFS e no origin, `navigator.storage.persist()`
  tenta reduzir eviction.
- O cache offline do app shell é gerenciado pelo Cache Storage do service worker;
  ele não é fonte de dados de domínio nem substitui o SQLite local.
- Retenção, backup, exportação e sincronização ainda precisam de decisão
  específica.
- A SPEC-0013 troca somente o motor visual das notas por Milkdown. O arquivo
  `notes/<noteId>.md` mantém o mesmo YAML e fence `:::verse`; a reindexação após
  autosave continua escrevendo `note_verse_ref` sem migration ou mudança de
  schema.

<!-- specsfy:conversation-data:start -->

## Informações a guardar confirmadas

| Informação                         | Para que serve                                                                                           | O que guardar                                                                                                                                                            | Formato sugerido                                                                                                          | Ligações                                                                                                             | Quem usa                                                                      | Quando muda ou sai                                                                                                                                                                                                                     | Fontes                                                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuração do espaço de trabalho | Permitir que o OpenBible reencontre o armazenamento escolhido e abra o projeto sem repetir o onboarding. | Tipo de armazenamento usado, referência ao local escolhido quando aplicável, versão da configuração e situação da importação de Bíblias: pendente, concluída ou parcial. | Registro local persistente com valores de configuração e situação; os detalhes de conexão não são enviados para servidor. | A configuração identifica um único espaço de trabalho e se relaciona aos arquivos SQLite existentes na pasta bibles. | Somente a pessoa usuária individual do dispositivo pode consultar ou alterar. | É criada ao concluir o onboarding, permanece entre visitas, muda quando o armazenamento ou o estado da importação muda e pode ser substituída ao reconfigurar o espaço de trabalho; não há política de remoção definida nesta feature. | specs/inbox/2026-08-31-201217-onboarding-de-configuracao-e-armazenamento.md; specs/backlog/0001-onboarding-configuracao-armazenamento.md; conversa atual, resposta à Pergunta 2 e à Pergunta 4 |
| Tela inicial preferida             | Abrir automaticamente a área escolhida quando a pessoa entrar na rota /.                                 | A tela inicial escolhida entre Bíblia, sermão ou nenhuma preferência; estudo permanece em breve e não é valor válido nesta fatia.                                        | Escolha entre opções disponíveis de telas do produto, com ausência de escolha representando o seletor inicial.            | A preferência aponta para uma rota de entrada do produto e controla a exibição do Sidebar.                           | Somente a pessoa usuária individual do dispositivo consulta e altera.         | É criada quando a pessoa salva uma tela inicial, muda quando escolhe outra e deixa de valer quando a preferência é removida; enquanto não existir, / mostra as opções de entrada e o Sidebar não aparece.                              | specs/inbox/2026-08-31-222704-tela-inicial-e-navegacao-do-openbible.md; specs/backlog/0002-tela-inicial-navegacao.md; conversa atual                                                           |

<!-- specsfy:conversation-data:end -->
