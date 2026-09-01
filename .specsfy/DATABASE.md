# Banco de dados

Mapa de persistência do sistema. A leitura bíblica usa arquivos SQLite importados
como fontes locais somente leitura; o índice do workspace permanece auxiliar.

## Fontes de dados

<!-- specsfy:database:start -->
| Fonte | Tecnologia/forma | Evidência |
| --- | --- | --- |
| A confirmar | Nenhuma estrutura reconhecida | A confirmar |

## Estruturas detectadas

| Estrutura | Tipo | Campos | Relações | Fonte |
| --- | --- | --- | --- | --- |
| A confirmar | A confirmar | A confirmar | A confirmar | A confirmar |
<!-- specsfy:database:end -->

## Estruturas de leitura bíblica

| Fonte             | Estrutura                    | Campos mínimos                                          | Relação e uso                                                                          |
| ----------------- | ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `bibles/*.sqlite` | `book`                       | `id`, `name`; `abbreviation` e `testament_id` opcionais | Um arquivo contém muitos livros; validada antes de entrar no catálogo                  |
| `bibles/*.sqlite` | `verse`                      | `book_id`, `chapter`, `verse`, `text`                   | `verse.book_id` referencia `book.id`; consultas de capítulo e busca são parametrizadas |
| `bibles/*.sqlite` | `metadata` (opcional)        | `key`, `value`                                          | `key = 'name'` fornece o nome da versão; o nome do arquivo é o fallback                |
| Pasta/OPFS        | `.openbible/preferences.json` | `theme`, `initialRoute`, `readerSelection`             | Fonte File Over Apps das preferências; `localStorage` é cache para o primeiro paint   |
| Pasta/OPFS        | `.openbible/index.sqlite`     | SQLite válido, sem tabelas de domínio                  | Artefato reservado; arquivo vazio de 0 bytes é reparado na preparação                 |
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
- O `.openbible/index.sqlite` é um SQLite válido sem schema de domínio. Um
  arquivo de 0 bytes legado é reparado na preparação. O leitor não o abre; usa
  `sql.js` nos SQLite importados em `bibles/` e fecha cada instância após a consulta.
- A validação funcional do leitor exige as tabelas `book` e `verse` e as colunas
  mínimas listadas acima; arquivos incompatíveis são diagnosticados sem remover
  fontes válidas nem modificar qualquer SQLite.
- Tema, tela inicial e última leitura ficam em `.openbible/preferences.json`.
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

<!-- specsfy:conversation-data:start -->

## Informações a guardar confirmadas

| Informação                         | Para que serve                                                                                           | O que guardar                                                                                                                                                            | Formato sugerido                                                                                                          | Ligações                                                                                                             | Quem usa                                                                      | Quando muda ou sai                                                                                                                                                                                                                     | Fontes                                                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuração do espaço de trabalho | Permitir que o OpenBible reencontre o armazenamento escolhido e abra o projeto sem repetir o onboarding. | Tipo de armazenamento usado, referência ao local escolhido quando aplicável, versão da configuração e situação da importação de Bíblias: pendente, concluída ou parcial. | Registro local persistente com valores de configuração e situação; os detalhes de conexão não são enviados para servidor. | A configuração identifica um único espaço de trabalho e se relaciona aos arquivos SQLite existentes na pasta bibles. | Somente a pessoa usuária individual do dispositivo pode consultar ou alterar. | É criada ao concluir o onboarding, permanece entre visitas, muda quando o armazenamento ou o estado da importação muda e pode ser substituída ao reconfigurar o espaço de trabalho; não há política de remoção definida nesta feature. | specs/inbox/2026-08-31-201217-onboarding-de-configuracao-e-armazenamento.md; specs/backlog/0001-onboarding-configuracao-armazenamento.md; conversa atual, resposta à Pergunta 2 e à Pergunta 4 |
| Tela inicial preferida             | Abrir automaticamente a área escolhida quando a pessoa entrar na rota /.                                 | A tela inicial escolhida entre Bíblia, sermão ou nenhuma preferência; estudo permanece em breve e não é valor válido nesta fatia.                                        | Escolha entre opções disponíveis de telas do produto, com ausência de escolha representando o seletor inicial.            | A preferência aponta para uma rota de entrada do produto e controla a exibição do Sidebar.                           | Somente a pessoa usuária individual do dispositivo consulta e altera.         | É criada quando a pessoa salva uma tela inicial, muda quando escolhe outra e deixa de valer quando a preferência é removida; enquanto não existir, / mostra as opções de entrada e o Sidebar não aparece.                              | specs/inbox/2026-08-31-222704-tela-inicial-e-navegacao-do-openbible.md; specs/backlog/0002-tela-inicial-navegacao.md; conversa atual                                                           |

<!-- specsfy:conversation-data:end -->
