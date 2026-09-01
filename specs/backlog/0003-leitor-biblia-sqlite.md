# Backlog: Leitor da Bíblia com SQLite importado

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0003 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Leitura bíblica |
| Funcionalidade | Leitor local de Bíblias importadas |
| Tipo | Funcionalidade |
| Prioridade | P1 |
| Milestones | |
| Criado em | 2026-09-01 |
| Spec promovida | `specs/draft/0003-leitor-biblia-sqlite/spec.md` |

## Ideia original

Implementar a funcionalidade do leitor de Bíblia inspirada em https://openbible-prod.vercel.app/ para consumir os SQLite importados.

## Problema percebido

A rota /bible não consulta os arquivos SQLite importados e a pessoa não consegue ler a Bíblia no OpenBible.

## Pessoa afetada ou beneficiada

Pessoa usuária individual, sem conta, usando o workspace local.

## Resultado ou valor esperado

Selecionar uma versão, livro e capítulo e ler os versículos importados com navegação local.

## Contexto

A spec 0001 já importa arquivos SQLite para bibles/ e a spec 0002 reserva a rota /bible; o leitor deve preservar essa arquitetura e não depender de rede.

## Referências relacionadas

- `specs/inbox/2026-09-01-013835-leitor-da-biblia-com-sqlite-importado.md` — origem da ideia.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — dependência: importação e armazenamento local dos SQLite em `bibles/`.
- `specs/completed/0002-tela-inicial-navegacao/spec.md` — dependência: rota `/bible`, shell, tema e navegação responsiva.
- `PROJECT.md` — finalidade, uso individual e limites do MVP.
- `DESIGNSYSTEM.MD` e `INTERFACE.md` — guideline visual e componentes Svelte existentes.
- `https://openbible-prod.vercel.app/` — referência visual observada, sem cópia de código.

## Comportamento esperado

- Ao abrir `/bible`, a aplicação lê os arquivos `.sqlite` da pasta `bibles/` do workspace configurado.
- Cada arquivo compatível com o schema OpenLP aparece como uma versão selecionável pelo nome do arquivo.
- A pessoa seleciona versão, livro e capítulo e vê os versículos em uma coluna de leitura centralizada.
- Os controles permitem avançar e voltar capítulos, respeitando o primeiro e o último capítulo disponíveis.
- A busca textual retorna referências e trechos da versão selecionada sem enviar o conteúdo para a rede.
- A última versão, livro e capítulo válidos ficam no `localStorage` para retomar a leitura.

## Regras de negócio

- Somente arquivos SQLite com tabelas `book` e `verse` compatíveis com o schema OpenLP são apresentados como versões disponíveis.
- A consulta usa `book.id` relacionado a `verse.book_id`, com `chapter`, `verse` e `text` ordenados numericamente.
- Arquivo incompatível não bloqueia outras versões; o erro fica visível na tela.
- O leitor é somente leitura nesta fatia; não altera os SQLite importados nem o `.openbible/index.sqlite`.

## Critérios de aceitação

- Dado um SQLite OpenLP importado, quando a pessoa abre `/bible`, então a versão, os livros e o primeiro capítulo ficam disponíveis.
- Dado um livro selecionado, quando a pessoa escolhe um capítulo, então seus versículos aparecem com número e texto na ordem do banco.
- Dado que há capítulos anterior ou posterior, quando a pessoa usa os controles, então a leitura muda sem recarregar a página; nos limites, o controle fica desabilitado.
- Dado um termo de busca, quando a pessoa confirma a pesquisa, então recebe referências e trechos correspondentes apenas da versão atual.
- Dado que não há SQLite compatível, quando a pessoa abre o leitor, então recebe orientação para importar uma Bíblia e uma ação de recuperação.
- Dado que a leitura foi retomada anteriormente, quando a pessoa abre o leitor novamente, então a última seleção válida é restaurada.

## Qualidades e operação

- Segurança: consultas SQL usam parâmetros para texto de busca; nomes de arquivo não viram SQL e nenhum conteúdo é enviado a servidor.
- Privacidade: bytes permanecem no armazenamento local escolhido pela pessoa.
- Desempenho e volume: abrir o SQLite ocorre no cliente; a busca limita o resultado a 50 itens e o carregamento do capítulo consulta somente o capítulo atual.
- Auditoria e observabilidade: estados de carregamento, vazio e erro são comunicados na interface; não há telemetria nesta fatia.

## Dependências

- Nenhuma registrada.

## Situações de erro

- Workspace não configurado ou inacessível → orientar a concluir/reabrir o onboarding, sem quebrar a rota.
- Pasta `bibles/` vazia → informar que é preciso importar um SQLite compatível.
- SQLite válido, mas schema incompatível → ignorar apenas esse arquivo e listar o motivo.
- Falha ao abrir ou consultar um arquivo → exibir erro recuperável e preservar as outras versões.
- Seleção salva inválida → usar a primeira versão, livro e capítulo disponíveis.

## Escopo

- Dentro: descoberta de arquivos em `bibles/`, abertura no navegador com SQLite WASM, schema OpenLP, seletor de versão/livro/capítulo, leitura de versículos, navegação, busca textual, persistência da seleção e estados responsivos/acessíveis.
- Fora: importação ou download de novos arquivos, comparação de versões, destaques, notas, edição, áudio, planos de leitura e sincronização.

## Dúvidas, decisões e riscos

- Decisão registrada na spec: `sql.js` é o menor runtime WASM compatível com a execução SQLite no browser e o binário WASM será servido como asset local.
- Risco: bancos muito grandes podem consumir memória do browser; mitigação: manter apenas as versões abertas da sessão e consultar o capítulo atual.
- Risco: schemas antigos ou personalizados podem divergir do OpenLP; mitigação: validar tabelas/colunas e mostrar erro por arquivo.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Spec criada em `specs/draft/0003-leitor-biblia-sqlite/spec.md`; o backlog deixa de ser a fonte normativa.
