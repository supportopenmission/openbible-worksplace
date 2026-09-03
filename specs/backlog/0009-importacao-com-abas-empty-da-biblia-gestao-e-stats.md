# Backlog: Importação com abas, empty da Bíblia, gestão e stats

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0009 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Leitor da Bíblia |
| Funcionalidade | Experiência de importação, gestão e stats |
| Tipo | história |
| Prioridade | Alta |
| Milestones | |
| Criado em | 2026-09-03 |
| Spec promovida | specs/defined/0009-importacao-com-abas-empty-da-biblia-gestao-e-stats/spec.md |

## Ideia original

Tabs no onboarding para escolher importação local vs R2; empty shadcn na /bible vazia com botões de importação; aba nas configurações para gerenciar/excluir Bíblias instaladas; aba de stats de arquivos, notas, sermões e Bíblias.

## Problema percebido

Método de importação sem escolha explícita; estado vazio da Bíblia pouco orientado; sem gestão/exclusão de versões; sem visão de uso do workspace.

## Pessoa afetada ou beneficiada

Pessoa usuária individual do OpenBible

## Resultado ou valor esperado

Escolher método de importação por abas, ver empty orientado com ações, gerenciar/excluir versões e ver stats do workspace.

## Contexto

OnboardingModal, BibleReader vazio, ConfigPage com Tabs; RemoteBibleImport e importação local existentes; deleteFile existe nos adaptadores; sem componente Empty instalado.

## Referências relacionadas

- `specs/completed/0008-importar-biblias-por-url-do-bucket-r2/spec.md` — RemoteBibleImport reutilizado no onboarding e na Bíblia vazia (spec relacionada).
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — etapa de import local com dropzone (spec relacionada).
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` — catálogo OpenLP e estado vazio atual (spec relacionada).
- `apps/web/src/lib/features/onboarding/OnboardingModal.svelte` — etapa import a receber abas (documentação relacionada).
- `apps/web/src/lib/features/bible/BibleReader.svelte` — estado `empty` a converter para Empty (documentação relacionada).
- `apps/web/src/lib/features/config/ConfigPage.svelte` — Tabs `Armazenamento`/`Tela inicial` a estender (documentação relacionada).
- `apps/web/src/lib/storage/local-storage.ts`, `opfs-storage.ts` — `deleteFile` já implementado nos dois adaptadores (documentação relacionada).

## Comportamento esperado

- Onboarding mostra abas `Arquivos locais` e `Bucket R2`; cada aba preserva seu estado e ambas instalam em `bibles/`.
- `/bible` sem versões exibe Empty (ícone, título, descrição) com botões: importar arquivos (`/?import=bible`), mostrar importação R2 e abrir `/config`.
- `/config` ganha abas `Bíblias` (lista instaladas com nome, tamanho e livros; inválidas com diagnóstico; excluir com confirmação) e `Estatísticas` (contagens de Bíblias, notas ativas/lixeira, sermões e bytes estimados).
- Excluir a última versão devolve o leitor ao vazio e o status a `pending`; cancelar preserva o arquivo.

## Regras de negócio

- Exclusão exige confirmação explícita com nome do arquivo e aviso de irreversibilidade; sem sobrescrita em nenhum fluxo.
- Stats calculados 100% no cliente, sem rede; bytes = soma de `bibles/` + notas ativas.
- Tabs com navegação por teclado (`role=tablist`) e painéis associados; mobile empilha seções.
- Reutilizar primitives Tabs, Button, AlertDialog e o novo Empty do registry shadcn-svelte; nada de React.

## Critérios de aceitação

- Given etapa import, When alternar abas, Then cada método funciona isolado com estado preservado.
- Given `/bible` vazia, When abrir, Then Empty com botões navegam/alternam corretamente.
- Given aba Bíblias, When excluir com confirmação, Then arquivo sai, lista e status atualizam.
- Given exclusão cancelada ou última versão removida, Then arquivo preservado ou estado vazio coerente.
- Given aba Estatísticas, When abrir, Then contagens conferem com o storage.

## Qualidades e operação

- Segurança: exclusão confirmada e irreversível avisada; somente `bibles/` pode ser removido pela gestão.
- Privacidade: nenhum dado sai do dispositivo; stats locais.
- Desempenho e volume: stats sem carregar todos os bytes em memória de uma vez quando evitável; lista de Bíblias pagina mentalmente em dezenas de versões.
- Auditoria e observabilidade: resultado de exclusão anunciado em `aria-live`; erros recuperáveis com retry.
- Acessibilidade: Tabs, Dialog de confirmação, Empty e stats operáveis por teclado; 320px/1440px sem overflow; `prefers-reduced-motion`.

## Dependências

- Componente `empty` do registry shadcn-svelte (instalar via CLI ou vendorar seguindo o padrão local).
- `deleteFile` dos adaptadores local/OPFS; `loadBibleCatalog` para lista e diagnósticos.

## Situações de erro

- Exclusão com falha de permissão/quota → erro recuperável, arquivo mantido na lista.
- Stats com workspace indisponível → estado vazio com orientação.
- Empty com storage indisponível → botões levam a `/` e `/config` sem quebrar.

## Escopo

- Dentro: abas no onboarding; Empty + botões na Bíblia vazia; aba Bíblias com excluir; aba Estatísticas; testes Vitest.
- Fora: edição de versões, re-download automático, lixeira para Bíblias, exportação de stats, paginação server-side.

## Dúvidas, decisões e riscos

- Decisão: Tabs shadcn-svelte já instalado; Empty via `bunx shadcn-svelte add empty`, fallback vendor manual.
- Decisão: sem lixeira para Bíblias nesta fatia; exclusão é direta com confirmação.
- Risco: CLI shadcn sem rede → vendorar seguindo `button/` como modelo.
- Risco: stats lendo bytes de todas as Bíblias → usar tamanhos do catálogo quando disponível.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

- Promover para `$specsfy-03-specify` como SPEC-0009.
